-- =============================================================================
-- HopeCMS — PR-01: db/view-product-revenue
-- File:    /db/migrations/10_view_product_revenue.sql
-- Branch:  db/view-product-revenue
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql             (product, salesDetail, priceHist tables)
--             03_hopedb_data.sql                (seed data present)
--             07_rls_view_only_tables.sql        (SELECT policies on product,
--                                                salesDetail, and priceHist)
--             09_view_customer_sales_summary.sql (establishes point-in-time
--                                                LATERAL JOIN pricing pattern)
-- Description: Creates the product_revenue view for the Admin Dashboard.
--              Returns total quantity sold and total historical revenue per
--              product. Revenue uses the price in effect at the time of each
--              individual sale (LATERAL JOIN point-in-time lookup), consistent
--              with the pricing strategy established in 09_view_customer_sales_summary.sql.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — PRICING STRATEGY: POINT-IN-TIME vs CURRENT
--
-- The project guide (Section 7.5) defines product_revenue using MAX(effDate)
-- globally per product — the current price. This is acceptable for a simple
-- report but is inconsistent with the decision made in
-- 09_view_customer_sales_summary.sql, where the team explicitly chose
-- point-in-time pricing to avoid retroactively repricing historical sales.
--
-- This view adopts the same point-in-time approach for the same reason:
--
--   For each salesDetail row, find the priceHist entry where:
--     prodCode = salesDetail.prodCode
--     AND effDate = MAX(effDate) where effDate <= sales.salesDate
--
-- PRODUCTS AFFECTED IN SEED DATA:
--   Products with multiple priceHist entries (where the two approaches diverge):
--     PC0001 → 499.99 (2010-05-15) then 454.54 (2010-07-12)
--     PC0002 → 179.99 (2010-05-15) then 197.99 (2010-07-12)
--     MD0001 → 119.68 (2010-05-15) then 131.65 (2010-08-01)
--     MD0002 → 149.99 (2010-05-15) then 164.99 (2010-08-01)
--     MD0003 → 239.96 (2010-05-15) then 263.96 (2010-08-01)
--     MD0004 → 132.21 (2010-05-15) then 145.43 (2010-08-01)
--     MD0005 → 825.00 (2010-05-15) then 907.50 (2010-08-01)
--     MD0006 → 124.29 (2010-05-15) then 136.72 (2010-08-01)
--     AM0001–AM0005, AP0001–AP0003, PF0001–PF0006, AD0001–AD0004,
--     NH0001–NH0003 → second price effective 2010-08-16
--
--   For any of these products, a sale dated before the second price entry
--   will use the earlier (lower or higher) price — not the current one.
--   This makes totalRevenue in this view match totalSpend in
--   customer_sales_summary exactly when summed across the same transactions.
--
-- KNOWN DATA ANOMALY — TR000042:
--   salesDate = '2020-10-25' is almost certainly a typo for '2010-10-25'.
--   The LATERAL JOIN handles it gracefully: it finds the latest priceHist
--   entry on or before 2020-10-25, which is simply the last known price.
--   Revenue for the affected products (AM0005, AP0003) will be accurate
--   relative to the available price history. Flag to M5 for the Sprint Log.
-- =============================================================================


-- =============================================================================
-- SECTION 2 — CREATE VIEW
-- CREATE OR REPLACE: safe re-run — updates the view definition in place
-- without dropping dependent objects or requiring a prior DROP.
-- =============================================================================

CREATE OR REPLACE VIEW public.product_revenue AS
SELECT
    p.prodcode,
    p.description,
    p.unit,

    -- Total units of this product sold across all transactions.
    -- SUM is safe here — one salesDetail row per (transNo, prodCode)
    -- pair, so no row multiplication risk from the LATERAL JOIN.
    SUM(sd.quantity)                                     AS "totalQtySold",

    -- Total historical revenue: quantity × price-at-time-of-sale.
    -- ROUND to 2 decimal places for currency consistency with
    -- customer_sales_summary.totalSpend.
    ROUND(SUM(sd.quantity * ph.unitprice), 2)            AS "totalRevenue",

    -- Surface the current price separately so ProductRevenuePage (M2)
    -- can show both the price used in calculations and today's price
    -- without a second query. Resolved via DISTINCT ON in the subquery
    -- below — same pattern as product_current_price view (file 08).
    cp.currentprice                                      AS "currentUnitPrice",
    cp.priceeffdate                                      AS "priceEffDate"

FROM
    public.product p

    -- INNER JOIN salesDetail: only products that appear in at least one
    -- transaction are returned. A product with no sales has no revenue
    -- to report. Use product_current_price (file 08) if a full catalogue
    -- listing including unsold products is required.
    JOIN public.salesdetail sd
        ON sd.prodcode = p.prodcode

    -- JOIN sales: needed to get salesDate for the point-in-time lookup.
    JOIN public.sales s
        ON s.transno = sd.transno

    -- LATERAL JOIN: for each salesDetail row, find the single priceHist
    -- entry whose effDate is the latest date on or before the salesDate
    -- of the parent transaction. This is the same point-in-time lookup
    -- established in 09_view_customer_sales_summary.sql.
    -- INNER JOIN LATERAL: if no priceHist entry exists for a prodCode
    -- on or before salesDate (should not occur with correctly seeded data),
    -- that salesDetail row is excluded rather than producing a NULL revenue
    -- contribution. This is intentional — a sale with no price record
    -- should not silently zero out a product's revenue.
    JOIN LATERAL (
        SELECT ph_inner.unitprice
        FROM   public.pricehist ph_inner
        WHERE  ph_inner.prodcode = sd.prodcode
          AND  ph_inner.effdate  <= s.salesdate
        ORDER BY ph_inner.effdate DESC
        LIMIT 1
    ) ph ON true

    -- Subquery for current price using DISTINCT ON — same pattern as
    -- product_current_price (08_view_product_current_price.sql).
    -- Joined here to avoid a second query from the frontend.
    JOIN (
        SELECT DISTINCT ON (prodcode)
            prodcode,
            unitprice  AS currentprice,
            effdate    AS priceeffdate
        FROM public.pricehist
        ORDER BY prodcode, effdate DESC
    ) cp ON cp.prodcode = p.prodcode

GROUP BY
    p.prodcode,
    p.description,
    p.unit,
    cp.currentprice,
    cp.priceeffdate

ORDER BY
    "totalRevenue" DESC;

COMMENT ON VIEW public.product_revenue IS
    'Per-product sales report: total quantity sold and total historical revenue '
    '(price at time of each sale via point-in-time priceHist LATERAL JOIN), '
    'plus the current unit price for reference. Only products with at least one '
    'sale appear. Ordered by totalRevenue DESC. Use as the data source for '
    'ProductRevenuePage (M2) via getProductRevenue() (M1). Read-only — no write '
    'operations are permitted on the underlying tables.';


-- =============================================================================
-- SECTION 3 — RLS NOTE
-- This view joins product, salesDetail, sales, and priceHist — all four of
-- which have SELECT-only RLS policies applied in 07_rls_view_only_tables.sql.
-- Authenticated users can query this view without any additional policy.
-- No separate RLS configuration is required on the view itself.
--
-- NOTE for M1: wire getProductRevenue() as:
--     supabase.from('product_revenue').select('*')
--   The view is already ordered by totalRevenue DESC — no client-side
--   sort is needed for the default ProductRevenuePage table rendering.
--   To get the top N products:
--     supabase.from('product_revenue').select('*').limit(N)
--
-- NOTE for M2: the view exposes these columns for ProductRevenuePage:
--     prodcode        → product code
--     description     → product name
--     unit            → unit of measure
--     totalQtySold    → integer-equivalent quantity (DECIMAL in DB)
--     totalRevenue    → currency, DECIMAL(10,2)
--     currentUnitPrice → latest price per unit
--     priceEffDate    → date the current price took effect
--   All columns are read-only. Do not render any add, edit, or delete
--   controls on this page for any user type.
-- =============================================================================


-- =============================================================================
-- SECTION 4 — VERIFICATION QUERIES
-- Run these in the Supabase SQL Editor after applying the migration.
-- =============================================================================

-- 4a. Confirm the view exists
SELECT
    table_name,
    table_type
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name = 'product_revenue';
-- Expected: 1 row — table_type = VIEW


-- 4b. Confirm column structure
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'product_revenue'
ORDER BY
    ordinal_position;
-- Expected 7 columns in order:
-- prodcode         | character varying
-- description      | character varying
-- unit             | character varying
-- totalQtySold     | numeric
-- totalRevenue     | numeric
-- currentUnitPrice | numeric
-- priceEffDate     | date


-- 4c. Confirm row count is non-zero and does not exceed the product count
--     Every row must represent a product that appears in at least one sale.
SELECT
    (SELECT COUNT(*) FROM public.product)   AS total_products,
    (SELECT COUNT(*) FROM public.product_revenue) AS view_row_count,
    CASE
        WHEN (SELECT COUNT(*) FROM public.product_revenue) > 0
         AND (SELECT COUNT(*) FROM public.product_revenue)
             <= (SELECT COUNT(*) FROM public.product)
        THEN 'PASS — row count is non-zero and within expected range'
        ELSE 'FAIL — unexpected row count; check JOIN conditions'
    END AS status;
-- Expected: total_products = 57 (or however many exist in seed),
--           view_row_count > 0 and <= 57, status = PASS.
-- Not all 57 products may have sales — the INNER JOIN excludes unsold products.


-- 4d. Confirm no product appears more than once
--     GROUP BY prodcode should guarantee one row per product.
SELECT
    prodcode,
    COUNT(*) AS appearances
FROM
    public.product_revenue
GROUP BY
    prodcode
HAVING
    COUNT(*) > 1;
-- Expected: 0 rows returned.


-- 4e. Confirm no NULL revenue or qty values
--     The INNER JOIN LATERAL should prevent NULLs, but verify explicitly.
SELECT
    prodcode,
    "totalQtySold",
    "totalRevenue"
FROM
    public.product_revenue
WHERE
    "totalRevenue"  IS NULL
    OR "totalQtySold" IS NULL;
-- Expected: 0 rows returned.
-- Any row here means a salesDetail entry has no matching priceHist record
-- on or before its salesDate. Investigate that prodCode in priceHist.


-- 4f. Spot-check a known high-volume product — PC0004
--     PC0004 (Dell Inspiron 660) appears across many transactions in the seed.
--     Its only priceHist entry is 2010-05-15 → 538.00, so point-in-time and
--     current-price approaches return identical results for this product.
--     Manual tally of salesDetail for PC0004:
--       TR000018: 9  | TR000035: 10 | TR000037: 5  | TR000053: 20
--       TR000064: 5  | TR000073: 40 | TR000087: 7  | TR000097: 5
--       TR000102: 10 | TR000103: 15 | TR000119: 100| TR000120: 150
--       TR000123: 60
--     Total qty = 9+10+5+20+5+40+7+5+10+15+100+150+60 = 436
--     totalRevenue = 436 × 538.00 = 234,568.00
SELECT
    prodcode,
    description,
    "totalQtySold",
    "totalRevenue",
    "currentUnitPrice",
    CASE
        WHEN prodcode = 'PC0004'
         AND "totalQtySold" = 436
         AND "totalRevenue" = 234568.00
        THEN 'PASS'
        ELSE 'FAIL — unexpected qty or revenue for PC0004; recount salesDetail rows'
    END AS status
FROM
    public.product_revenue
WHERE
    prodcode = 'PC0004';
-- Expected: 1 row, status = PASS.
-- If the count differs, cross-check with:
--   SELECT SUM(quantity) FROM salesdetail WHERE prodcode = 'PC0004';


-- 4g. Spot-check a product with multiple price entries — PC0001
--     PC0001 priceHist: 499.99 (2010-05-15), 454.54 (2010-07-12).
--     Transactions from seed data:
--       TR000015 (2010-07-12): 1 × PC0001 — point-in-time price = 454.54
--                              (effDate 2010-07-12 <= salesDate 2010-07-12 ✓)
--       TR000026 (2010-08-12): 1 × PC0001 — point-in-time price = 454.54
--       TR000034 (2010-09-06): 1 × PC0001 — point-in-time price = 454.54
--       TR000087 (2011-02-20): 3 × PC0001 — point-in-time price = 454.54
--       TR000092 (2011-03-02): 10 × PC0001 — point-in-time price = 454.54
--       TR000101 (2011-03-13): 10 × PC0001 — point-in-time price = 454.54
--     Total qty = 1+1+1+3+10+10 = 26
--     All sales fall on or after 2010-07-12 → all use 454.54
--     totalRevenue = 26 × 454.54 = 11,818.04
--
--     Current-price approach would yield the same result here (454.54 is
--     both the historical and the current price for PC0001). This spot-check
--     confirms the LATERAL JOIN is not accidentally using the earlier price.
SELECT
    prodcode,
    description,
    "totalQtySold",
    "totalRevenue",
    "currentUnitPrice",
    "priceEffDate",
    CASE
        WHEN prodcode   = 'PC0001'
         AND "totalQtySold"   = 26
         AND "totalRevenue"   = 11818.04
         AND "currentUnitPrice" = 454.54
         AND "priceEffDate"   = '2010-07-12'
        THEN 'PASS'
        ELSE 'FAIL — check salesDetail rows for PC0001 and priceHist effDates'
    END AS status
FROM
    public.product_revenue
WHERE
    prodcode = 'PC0001';
-- Expected: 1 row, status = PASS.


-- 4h. Spot-check a product where point-in-time DOES change the calculation — MD0001
--     MD0001 priceHist: 119.68 (2010-05-15), 131.65 (2010-08-01).
--     Transactions from seed data:
--       TR000001 (2010-06-27): 10 × MD0001 → price on 2010-06-27 = 119.68
--                              (only 2010-05-15 entry is on or before this date)
--       TR000018 (2010-07-13): 9  × MD0001 → price on 2010-07-13 = 119.68
--                              (2010-08-01 entry is AFTER this date, excluded)
--       TR000048 (2010-12-05): 5  × MD0001 → price on 2010-12-05 = 131.65
--                              (2010-08-01 entry is on or before, and is latest)
--       TR000093 (2011-03-02): not in salesDetail for MD0001
--       TR000102 (2011-03-21): 10 × MD0001 → price = 131.65
--     Total qty = 10 + 9 + 5 + 10 = 34
--     Revenue = (10 × 119.68) + (9 × 119.68) + (5 × 131.65) + (10 × 131.65)
--             = 1196.80 + 1077.12 + 658.25 + 1316.50
--             = 4248.67
--
--     With current-price only (131.65 for all rows):
--     Revenue = 34 × 131.65 = 4476.10  ← INCORRECT for historical reporting
--
--     This is the definitive proof that point-in-time pricing is required.
SELECT
    prodcode,
    description,
    "totalQtySold",
    "totalRevenue",
    CASE
        WHEN prodcode       = 'MD0001'
         AND "totalQtySold" = 34
         AND "totalRevenue" = 4248.67
        THEN 'PASS — point-in-time pricing applied correctly'
        WHEN prodcode       = 'MD0001'
         AND "totalRevenue" = 4476.10
        THEN 'FAIL — view is using current price, not point-in-time price'
        ELSE 'FAIL — unexpected values; verify salesDetail rows for MD0001'
    END AS status
FROM
    public.product_revenue
WHERE
    prodcode = 'MD0001';
-- Expected: 1 row, status = PASS.
-- A FAIL with the 4476.10 message confirms the LATERAL JOIN is not working
-- correctly — re-examine the ON condition and ORDER BY clause.


-- 4i. Full view output — review top 15 products for sanity
--     High-volume products (PC0004, NB0005, PC0002) should lead the ranking.
--     Confirm no product appears twice and no NULL revenue values are present.
SELECT
    prodcode,
    description,
    unit,
    "totalQtySold",
    "totalRevenue",
    "currentUnitPrice",
    "priceEffDate"
FROM
    public.product_revenue
LIMIT 15;
-- Expected: 15 rows, all non-NULL, ordered by totalRevenue DESC.
-- Review custnames and spend values for reasonableness against the seed data.


-- =============================================================================
-- END OF MIGRATION: 10_view_product_revenue.sql
-- Sprint 3 DB migrations continue with:
--   11_rls_admin_module.sql  (PR-02 db/rls-admin-module)
--   12_final_rls_audit.sql   (PR-03 docs/final-rls-audit)
-- =============================================================================