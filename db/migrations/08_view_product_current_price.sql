-- =============================================================================
-- HopeCMS — PR-03: db/view-product-current-price
-- File:    /db/migrations/08_view_product_current_price.sql
-- Branch:  db/view-product-current-price
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql  (product, priceHist tables)
--             03_hopedb_data.sql     (seed data present)
--             07_rls_view_only_tables.sql (SELECT policies on product
--                                         and priceHist already applied)
-- Description: Creates the product_current_price view. Returns each product
--              alongside its single most recent priceHist entry, resolved
--              using DISTINCT ON (prodCode) ordered by effDate DESC.
--              This view is the canonical source for current pricing used
--              by ProductCataloguePage (M2) and the customer_sales_summary
--              view (09_view_customer_sales_summary.sql).
-- =============================================================================


-- =============================================================================
-- SECTION 1 — TECHNIQUE RATIONALE: DISTINCT ON vs LATERAL JOIN vs subquery
--
-- Three common approaches exist for "latest row per group" in PostgreSQL:
--
--   A. Correlated subquery — WHERE effDate = (SELECT MAX(effDate) ...)
--      Simple and readable but executes the subquery once per product row.
--      Performance degrades linearly with product count.
--
--   B. LATERAL JOIN — JOIN LATERAL (SELECT ... ORDER BY effDate DESC LIMIT 1)
--      Efficient and explicit but more verbose. Better for complex per-row
--      lookups where multiple columns from the subquery are needed.
--
--   C. DISTINCT ON (prodCode) ORDER BY prodCode, effDate DESC
--      PostgreSQL-native. Single scan of priceHist sorted by (prodCode,
--      effDate DESC), keeping only the first row per prodCode group.
--      Cleanest syntax for this exact use case and performs well with an
--      index on (prodCode, effDate).
--
-- This migration uses DISTINCT ON (Option C). It is the most idiomatic
-- PostgreSQL solution for latest-row-per-group and produces the most
-- readable query plan in the Supabase Dashboard.
-- =============================================================================


-- =============================================================================
-- SECTION 2 — CREATE VIEW
-- Safe re-run: CREATE OR REPLACE updates the view definition without
-- dropping dependent objects or requiring a DROP first.
-- =============================================================================

CREATE OR REPLACE VIEW public.product_current_price AS
SELECT
    p.prodCode,
    p.description,
    p.unit,
    ph.unitPrice     AS currentPrice,
    ph.effDate       AS priceEffDate
FROM
    public.product p
    JOIN (
        -- DISTINCT ON keeps exactly one row per prodCode —
        -- the one with the latest effDate.
        SELECT DISTINCT ON (prodCode)
            prodCode,
            unitPrice,
            effDate
        FROM
            public.priceHist
        ORDER BY
            prodCode,      -- group boundary for DISTINCT ON
            effDate DESC   -- latest date first → DISTINCT ON picks this row
    ) ph ON ph.prodCode = p.prodCode
ORDER BY
    p.prodCode;

COMMENT ON VIEW public.product_current_price IS
    'Returns each product with its single most recent unit price from priceHist. '
    'Use this view as the canonical source for current pricing in ProductCataloguePage '
    'and customer_sales_summary. Do not query priceHist directly for current price.';


-- =============================================================================
-- SECTION 3 — RLS NOTE
-- Views in PostgreSQL run with the permissions of the querying user, not
-- the view owner. Because product and priceHist already have SELECT-only
-- RLS policies applied in 07_rls_view_only_tables.sql, authenticated users
-- can query this view without any additional policy. No separate RLS setup
-- is required on the view itself.
--
-- NOTE for M1: getProducts() and getCurrentPrice(prodCode) in your service
--   layer should query this view, not the raw priceHist table.
--   Example:
--     supabase.from('product_current_price').select('*')
--     supabase.from('product_current_price').select('*').eq('prodCode', code)
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
    AND table_name = 'product_current_price';
-- Expected: 1 row — table_type = VIEW


-- 4b. Confirm column structure
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'product_current_price'
ORDER BY
    ordinal_position;
-- Expected 5 columns in order:
-- prodCode     | character varying
-- description  | character varying
-- unit         | character varying
-- currentPrice | numeric
-- priceEffDate | date


-- 4c. Confirm row count matches product table
--     Every product must have exactly one row in this view.
--     A count mismatch means at least one product has no priceHist entry.
SELECT
    (SELECT COUNT(*) FROM public.product)               AS product_count,
    (SELECT COUNT(*) FROM public.product_current_price) AS view_count,
    CASE
        WHEN (SELECT COUNT(*) FROM public.product) =
             (SELECT COUNT(*) FROM public.product_current_price)
        THEN 'PASS — view row count matches product table'
        ELSE 'FAIL — row count mismatch; check for products missing priceHist entries'
    END AS status;
-- Expected: both counts = 57, status = PASS


-- 4d. Confirm no product appears more than once
--     DISTINCT ON should guarantee one row per prodCode.
--     Any count > 1 here indicates a logic error in the view definition.
SELECT
    prodCode,
    COUNT(*) AS appearances
FROM
    public.product_current_price
GROUP BY
    prodCode
HAVING
    COUNT(*) > 1;
-- Expected: 0 rows returned


-- 4e. Spot-check known price history products
--     PC0001 and PC0002 each have two priceHist entries (2010-05-15 and
--     2010-07-12). The view must return only the later date for each.
--     MD0001 has entries on 2010-05-15 and 2010-08-01 — must return 2010-08-01.
--     NB0005 has only one entry on 2011-02-01 — must return that date.
SELECT
    prodCode,
    description,
    currentPrice,
    priceEffDate,
    CASE
        WHEN prodCode = 'PC0001' AND priceEffDate = '2010-07-12' AND currentPrice = 454.54 THEN 'PASS'
        WHEN prodCode = 'PC0002' AND priceEffDate = '2010-07-12' AND currentPrice = 197.99 THEN 'PASS'
        WHEN prodCode = 'MD0001' AND priceEffDate = '2010-08-01' AND currentPrice = 131.65 THEN 'PASS'
        WHEN prodCode = 'NB0005' AND priceEffDate = '2011-02-01' AND currentPrice = 1184.72 THEN 'PASS'
        ELSE 'FAIL — unexpected price or date returned'
    END AS status
FROM
    public.product_current_price
WHERE
    prodCode IN ('PC0001', 'PC0002', 'MD0001', 'NB0005')
ORDER BY
    prodCode;
-- Expected: 4 rows — all status = PASS


-- 4f. Full view output — review manually for sanity
--     Scan for NULL prices (product exists but has no priceHist entry)
--     and for any suspiciously old effDate that might indicate the
--     DISTINCT ON is picking the wrong row.
SELECT
    prodCode,
    description,
    unit,
    currentPrice,
    priceEffDate
FROM
    public.product_current_price
ORDER BY
    prodCode;
-- Expected: 57 rows, no NULL currentPrice values, priceEffDate is the
-- latest available date per product.


-- =============================================================================
-- END OF MIGRATION: 08_view_product_current_price.sql
-- Next migration: 09_view_customer_sales_summary.sql  (PR-04)
-- =============================================================================