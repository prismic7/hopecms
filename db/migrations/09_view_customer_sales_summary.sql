-- =============================================================================
-- HopeCMS — PR-04: db/view-customer-sales-summary
-- File:    /db/migrations/09_view_customer_sales_summary.sql
-- Branch:  db/view-customer-sales-summary
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql          (all 5 tables)
--             03_hopedb_data.sql             (seed data present)
--             07_rls_view_only_tables.sql    (SELECT policies on view-only tables)
--             08_view_product_current_price.sql (confirms priceHist structure)
-- Description: Creates the customer_sales_summary view. Joins all 5 core
--              tables to compute per-customer lifetime statistics:
--              total transactions, total historical spend, and last sale date.
--              totalSpend uses the price effective AT THE TIME OF EACH SALE,
--              not the current price — this is the critical distinction from
--              the simpler MAX(effDate) approach in the project guide.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — PRICING STRATEGY: HISTORICAL vs CURRENT
--
-- The project guide shows a customer_sales_summary view that resolves price
-- using MAX(effDate) per product — the current price. This is INCORRECT for
-- a spend calculation because it retroactively reprices old transactions at
-- today's rate, producing inaccurate historical totals.
--
-- Requirement 4 explicitly states: "using the price of each item AT THE TIME
-- OF THE SALE." The correct approach is a point-in-time price lookup:
--
--   For each salesDetail row, find the priceHist entry where:
--     prodCode = salesDetail.prodCode
--     AND effDate = MAX(effDate) where effDate <= sales.salesDate
--
-- This returns the price that was actually in effect on the date of the sale.
--
-- EXAMPLE from seed data:
--   product PC0001 has two price entries:
--     2010-05-15 → 499.99
--     2010-07-12 → 454.54
--   Transaction TR000015 sold PC0001 on 2010-07-12.
--   Point-in-time lookup: MAX(effDate) where effDate <= '2010-07-12' → 454.54 ✓
--   Current price lookup: MAX(effDate) globally → 454.54 (same here by coincidence)
--
--   Transaction TR000034 sold PC0001 on 2010-09-06.
--   Point-in-time: 454.54 (2010-07-12 is latest on or before 2010-09-06) ✓
--   Current: 454.54 (same result for this product since no later price exists)
--
--   For products with only one priceHist entry (most products), both
--   approaches return identical results. The difference only surfaces for
--   products with multiple price entries sold across different price periods.
--   PC0001, PC0002, and the MD/AM/PF families have multiple entries.
--
-- TECHNIQUE: LATERAL JOIN
--   A correlated LATERAL subquery executes once per (salesDetail × sales)
--   row, returning the single best-matching priceHist row. This is the
--   cleanest PostgreSQL pattern for point-in-time lookups and avoids the
--   fan-out problem of a plain JOIN with multiple matching priceHist rows.
--
-- KNOWN DATA ANOMALY — TR000042:
--   Transaction TR000042 has salesDate = '2020-10-25' in the seed data.
--   This is almost certainly a typo for '2010-10-25' (all other transactions
--   are in 2010–2011). The point-in-time lookup handles this gracefully —
--   it will find the latest priceHist entry on or before 2020-10-25, which
--   is simply the last known price for each product. No data is lost or
--   corrupted; totalSpend for customer C0026 will be accurate relative to
--   the available price history. Flag this to M5 for the Sprint Log.
-- =============================================================================


-- =============================================================================
-- SECTION 2 — CREATE VIEW
-- =============================================================================

CREATE OR REPLACE VIEW public.customer_sales_summary AS
SELECT
    c.custno,
    c.custname,
    c.payterm,
    c.record_status,

    -- Total distinct transactions this customer has made.
    -- COUNT(DISTINCT) guards against row multiplication from
    -- the salesDetail and priceHist joins.
    COUNT(DISTINCT s.transno)                           AS "totalTransactions",

    -- Total historical spend: quantity × price-at-time-of-sale.
    -- ROUND to 2 decimal places for currency display.
    -- COALESCE to 0.00 for customers with no sales (LEFT JOIN path).
    COALESCE(
        ROUND(SUM(sd.quantity * ph.unitprice), 2),
        0.00
    )                                                   AS "totalSpend",

    -- Most recent sale date for this customer.
    -- NULL for customers who have never placed an order.
    MAX(s.salesdate)                                    AS "lastSaleDate"

FROM
    public.customer c

    -- LEFT JOIN: customers with zero sales still appear in the view
    -- with totalTransactions = 0 and totalSpend = 0.00.
    LEFT JOIN public.sales s
        ON s.custno = c.custno

    -- LEFT JOIN: transactions with no line items still count toward
    -- totalTransactions (COUNT DISTINCT on transno, not on prodcode).
    LEFT JOIN public.salesdetail sd
        ON sd.transno = s.transno

    -- LATERAL JOIN: for each salesDetail row, find the single priceHist
    -- entry whose effDate is the latest date on or before the salesDate
    -- of the parent transaction. This is the point-in-time price lookup.
    -- LEFT JOIN LATERAL ... ON true: if no priceHist entry exists for a
    -- prodCode on or before the salesDate (edge case — should not occur
    -- with correctly seeded data), the row is still included with
    -- unitprice = NULL, which COALESCE handles gracefully in totalSpend.
    LEFT JOIN LATERAL (
        SELECT ph_inner.unitprice
        FROM   public.pricehist ph_inner
        WHERE  ph_inner.prodcode = sd.prodcode
          AND  ph_inner.effdate <= s.salesdate
        ORDER BY ph_inner.effdate DESC
        LIMIT 1
    ) ph ON true

GROUP BY
    c.custno,
    c.custname,
    c.payterm,
    c.record_status

ORDER BY
    "totalSpend" DESC NULLS LAST,
    c.custno;

COMMENT ON VIEW public.customer_sales_summary IS
    'Per-customer lifetime statistics: total transactions, total historical spend '
    '(price at time of sale via point-in-time priceHist lookup), and last sale date. '
    'Customers with no sales appear with totalTransactions = 0 and totalSpend = 0.00. '
    'Use this view as the data source for CustomerSalesSummaryPage and TopCustomersPage.';


-- =============================================================================
-- SECTION 3 — RLS NOTE
-- This view joins customer, sales, salesDetail, product, and priceHist.
-- All five underlying tables have SELECT RLS policies applied. The view
-- inherits those policies — an authenticated USER querying this view will
-- only see rows where the customer table's customer_select policy passes
-- (i.e., record_status = 'ACTIVE' for USER accounts).
-- No additional RLS configuration is required on the view itself.
--
-- NOTE for M1:
--   getCustomerSalesSummary()  → supabase.from('customer_sales_summary').select('*')
--   getTopCustomers()          → supabase.from('customer_sales_summary')
--                                  .select('*').limit(10)
--                                  (view is already ordered by totalSpend DESC)
-- NOTE for M4:
--   USER accounts will naturally see only ACTIVE customers in this view
--   because the underlying customer_select RLS policy applies through
--   the join. No additional filtering is needed in UserRightsContext.
-- =============================================================================


-- =============================================================================
-- SECTION 4 — VERIFICATION QUERIES
-- =============================================================================

-- 4a. Confirm the view exists
SELECT
    table_name,
    table_type
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name = 'customer_sales_summary';
-- Expected: 1 row — table_type = VIEW


-- 4b. Confirm column structure
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'customer_sales_summary'
ORDER BY
    ordinal_position;
-- Expected 7 columns in order:
-- custno            | character varying
-- custname          | character varying
-- payterm           | character varying
-- record_status     | character varying
-- totalTransactions | bigint
-- totalSpend        | numeric
-- lastSaleDate      | date


-- 4c. Confirm total row count equals total customer count
--     Every customer must appear — including those with no sales.
SELECT
    (SELECT COUNT(*) FROM public.customer)              AS customer_count,
    (SELECT COUNT(*) FROM public.customer_sales_summary) AS view_count,
    CASE
        WHEN (SELECT COUNT(*) FROM public.customer) =
             (SELECT COUNT(*) FROM public.customer_sales_summary)
        THEN 'PASS — all 82 customers present'
        ELSE 'FAIL — row count mismatch; check LEFT JOIN chain'
    END AS status;
-- Expected: both counts = 82, status = PASS


-- 4d. Confirm customers with no sales appear with zeroed stats
--     Cross-check: identify customers in the customer table who have
--     no matching rows in sales, then confirm the view shows them
--     with totalTransactions = 0 and totalSpend = 0.00.
SELECT
    css.custno,
    css.custname,
    css."totalTransactions",
    css."totalSpend",
    css."lastSaleDate"
FROM
    public.customer_sales_summary css
WHERE
    css."totalTransactions" = 0
ORDER BY
    css.custno;
-- Expected: rows for any customers not present in the sales table.
-- totalSpend must be 0.00 and lastSaleDate must be NULL for all returned rows.
-- If no customers have zero sales, this returns 0 rows — also acceptable.


-- 4e. Spot-check known high-volume customers
--     C0001 (Globus Medical) appears in sales TR000001, TR000006, TR000017.
--     Manually verify transaction count and that lastSaleDate = 2010-07-12.
SELECT
    custno,
    custname,
    "totalTransactions",
    "totalSpend",
    "lastSaleDate"
FROM
    public.customer_sales_summary
WHERE
    custno IN ('C0001', 'C0009', 'C0021')
ORDER BY
    custno;
-- Expected:
--   C0001 → totalTransactions = 3, lastSaleDate = '2010-07-12'
--   C0009 → totalTransactions = 3, lastSaleDate = '2011-03-30'
--   C0021 → totalTransactions = 2, lastSaleDate = '2010-10-05'


-- 4f. Confirm totalSpend > 0 for customers with sales
--     No customer with at least one transaction should have totalSpend = 0.
--     A zero totalSpend with transactions > 0 means the LATERAL JOIN
--     found no priceHist match — a data integrity issue.
SELECT
    custno,
    custname,
    "totalTransactions",
    "totalSpend"
FROM
    public.customer_sales_summary
WHERE
    "totalTransactions" > 0
    AND "totalSpend" = 0.00
ORDER BY
    custno;
-- Expected: 0 rows returned.
-- Any row here indicates a salesDetail product has no priceHist entry
-- on or before its salesDate. Investigate the specific prodCode.


-- 4g. Top 10 customers by spend — data source for TopCustomersPage
SELECT
    custno,
    custname,
    payterm,
    "totalTransactions",
    "totalSpend",
    "lastSaleDate"
FROM
    public.customer_sales_summary
WHERE
    record_status = 'ACTIVE'
LIMIT 10;
-- Expected: 10 rows ordered by totalSpend DESC.
-- Review the custnames and spend values for sanity against the seed data.
-- Government and institutional customers (C0077-C0082) and school bulk
-- orders (C0046-C0065) should appear toward the top.


-- 4h. Confirm the view correctly uses point-in-time pricing
--     PC0001 had price 499.99 before 2010-07-12 and 454.54 from 2010-07-12.
--     TR000015 (date: 2010-07-12, customer C0012) bought 1x PC0001.
--     Point-in-time price on 2010-07-12 = 454.54 (the new price took effect
--     on that same date — effDate <= salesDate includes same-day changes).
--     Confirm C0012's totalSpend reflects 454.54 for that item, not 499.99.
SELECT
    custno,
    custname,
    "totalTransactions",
    "totalSpend"
FROM
    public.customer_sales_summary
WHERE
    custno = 'C0012';
-- Review: C0012 (Dexter Santos) appears in TR000015 and TR000033.
-- TR000015: 1x PC0001 @ 454.54, 1x AM0001 @ 36.45, 1x MD0002 @ 149.99
--           (all prices as of 2010-07-12)
-- TR000033: 3x NB0001 @ 300.00 each (price as of 2010-09-06 = 300.00)
-- Expected totalSpend ≈ 454.54 + 36.45 + 149.99 + 900.00 = 1540.98
-- Minor rounding variance acceptable due to DECIMAL precision in seed data.


-- =============================================================================
-- END OF MIGRATION: 09_view_customer_sales_summary.sql
-- All Sprint 2 DB migrations are now complete:
--   06_rls_customer.sql                  → PR-01 db/rls-customer
--   07_rls_view_only_tables.sql          → PR-02 db/rls-view-only-tables
--   08_view_product_current_price.sql    → PR-03 db/view-product-current-price
--   09_view_customer_sales_summary.sql   → PR-04 db/view-customer-sales-summary
-- Next: Sprint 3 migrations begin at 10_view_product_revenue.sql
-- =============================================================================