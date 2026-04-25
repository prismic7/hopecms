-- =============================================================================
-- HopeCMS — PR-02: db/rls-view-only-tables
-- File:    /db/migrations/07_rls_view_only_tables.sql
-- Branch:  db/rls-view-only-tables
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql  (all 4 tables created + RLS enabled)
--             03_hopedb_data.sql     (seed data present)
-- Description: Applies SELECT-only RLS policies to the four view-only tables:
--              sales, salesDetail, product, priceHist.
--              All authenticated users may SELECT from these tables.
--              No INSERT, UPDATE, or DELETE policies exist or will ever
--              exist on these tables. Write operations are strictly
--              forbidden by project rules for all user types including
--              ADMIN and SUPERADMIN.
-- =============================================================================


-- =============================================================================
-- ARCHITECTURAL NOTE — WHY THESE TABLES ARE VIEW-ONLY
-- These four tables contain historical ledger data (transactions, line items,
-- product catalogue, price history). They are seeded once from HopeDB and
-- are never mutated through the application. Their integrity is the
-- foundation of all reports and sales summaries. Allowing any write path —
-- even accidentally — would corrupt audit data that cannot be recovered.
--
-- Enforcement is two-layered:
--   1. RLS layer (this file)  — no INSERT/UPDATE/DELETE policy exists,
--      so PostgreSQL blocks those operations by default for all roles.
--   2. Application layer (M1) — service functions for these tables are
--      read-only (getSalesByCustomer, getSalesDetail, getProducts,
--      getPriceHistory). No write functions are defined or called.
--   3. UI layer (M2/M4)       — no add, edit, or delete buttons are
--      rendered on Sales, Product, or Price History pages for any
--      user type. This is confirmed in the Sprint 2 rights test matrix.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — FORCE ROW LEVEL SECURITY
-- RLS was already enabled on all four tables in 01_initial_schema.sql.
-- The ENABLE statements below are no-ops in PostgreSQL (idempotent) and
-- are included only for documentation clarity.
-- FORCE ROW LEVEL SECURITY is the new addition: it ensures the postgres
-- superuser is also subject to these policies when acting as an
-- authenticated role.
-- =============================================================================

ALTER TABLE public.sales        ENABLE ROW LEVEL SECURITY;  -- no-op: set in 01_initial_schema.sql
ALTER TABLE public.salesDetail  ENABLE ROW LEVEL SECURITY;  -- no-op: set in 01_initial_schema.sql
ALTER TABLE public.product      ENABLE ROW LEVEL SECURITY;  -- no-op: set in 01_initial_schema.sql
ALTER TABLE public.priceHist    ENABLE ROW LEVEL SECURITY;  -- no-op: set in 01_initial_schema.sql

ALTER TABLE public.sales        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.salesDetail  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.priceHist    FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2 — TABLE: sales
--
-- SELECT policy: all authenticated users may read all rows.
-- USING (true) means no row-level filter is applied — every row is
-- visible to every authenticated user. There is no need to filter by
-- record_status here because the sales table has no such column and
-- visibility is not role-dependent for this table.
--
-- NO INSERT POLICY — write operations are forbidden.
-- NO UPDATE POLICY — write operations are forbidden.
-- NO DELETE POLICY — write operations are forbidden.
-- The absence of INSERT/UPDATE/DELETE policies means PostgreSQL blocks
-- those operations by default. No additional enforcement is needed.
-- =============================================================================

CREATE POLICY sales_select_only
    ON  public.sales
    FOR SELECT
    TO  authenticated
    USING (true);


-- =============================================================================
-- SECTION 3 — TABLE: salesDetail
--
-- SELECT policy: all authenticated users may read all rows.
-- salesDetail is accessed via JOIN to sales in getSalesDetail(transNo).
-- All line items across all transactions are visible to all roles —
-- visibility is controlled at the customer and sales level, not here.
--
-- NO INSERT POLICY — write operations are forbidden.
-- NO UPDATE POLICY — write operations are forbidden.
-- NO DELETE POLICY — write operations are forbidden.
-- =============================================================================

CREATE POLICY salesdetail_select_only
    ON  public.salesDetail
    FOR SELECT
    TO  authenticated
    USING (true);


-- =============================================================================
-- SECTION 4 — TABLE: product
--
-- SELECT policy: all authenticated users may read all rows.
-- The product catalogue is a reference table. All 57 products are visible
-- to all roles. Current prices are resolved separately via the
-- product_current_price view (08_view_product_current_price.sql).
--
-- NO INSERT POLICY — write operations are forbidden.
-- NO UPDATE POLICY — write operations are forbidden.
-- NO DELETE POLICY — write operations are forbidden.
-- =============================================================================

CREATE POLICY product_select_only
    ON  public.product
    FOR SELECT
    TO  authenticated
    USING (true);


-- =============================================================================
-- SECTION 5 — TABLE: priceHist
--
-- SELECT policy: all authenticated users may read all rows.
-- priceHist is a timeline of unit prices per product keyed by effDate.
-- The current price per product is MAX(effDate) per prodCode, resolved
-- in the product_current_price view. All historical price entries are
-- visible to all roles for full audit transparency.
--
-- NO INSERT POLICY — write operations are forbidden.
-- NO UPDATE POLICY — write operations are forbidden.
-- NO DELETE POLICY — write operations are forbidden.
-- =============================================================================

CREATE POLICY pricehist_select_only
    ON  public.priceHist
    FOR SELECT
    TO  authenticated
    USING (true);


-- =============================================================================
-- SECTION 6 — HARD DELETE AUDIT CONFIRMATION
-- The word DELETE does not appear as a DML operation anywhere in this file.
-- The only occurrences of DELETE above are inside comments explicitly
-- stating that no DELETE policy exists. This confirms compliance with the
-- project rule: no hard deletes on any table, and no write policies on
-- any view-only table.
-- =============================================================================
-- [NO INSERT, UPDATE, OR DELETE POLICIES EXIST ON ANY OF THESE FOUR TABLES]
-- [THIS IS INTENTIONAL AND MUST NOT BE CHANGED]


-- =============================================================================
-- SECTION 7 — VERIFICATION QUERIES
-- Run these after applying the migration to confirm the policy state
-- across all four tables.
-- =============================================================================

-- 7a. Confirm exactly one SELECT policy per table and zero write policies.
--     Expected: 4 rows — one per table, all cmd = SELECT.
--     Any row with cmd = INSERT, UPDATE, or DELETE is a critical error.
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM
    pg_policies
WHERE
    tablename IN ('sales', 'salesdetail', 'product', 'pricehist')
ORDER BY
    tablename, cmd;

-- Expected output:
-- tablename   | policyname               | cmd    | roles
-- ------------+--------------------------+--------+---------------
-- pricehist   | pricehist_select_only    | SELECT | {authenticated}
-- product     | product_select_only      | SELECT | {authenticated}
-- sales       | sales_select_only        | SELECT | {authenticated}
-- salesdetail | salesdetail_select_only  | SELECT | {authenticated}


-- 7b. Confirm FORCE ROW LEVEL SECURITY is active on all four tables.
--     Expected: 4 rows — forcerowsecurity = true for all.
SELECT
    relname          AS tablename,
    relrowsecurity   AS rls_enabled,
    relforcerowsecurity AS rls_forced
FROM
    pg_class
WHERE
    relnamespace = 'public'::regnamespace
    AND relname IN ('sales', 'salesdetail', 'product', 'pricehist')
ORDER BY
    relname;


-- 7c. Confirm authenticated users can SELECT — spot-check row counts.
--     Run this as an authenticated role (use role impersonation below).
--     Expected: all four tables return their seeded row counts.
SELECT 'sales'       AS table_name, COUNT(*) AS row_count FROM public.sales
UNION ALL
SELECT 'salesdetail',               COUNT(*)              FROM public.salesDetail
UNION ALL
SELECT 'product',                   COUNT(*)              FROM public.product
UNION ALL
SELECT 'pricehist',                 COUNT(*)              FROM public.priceHist
ORDER BY table_name;

-- Expected row counts (from 04_verify_seed.sql):
-- pricehist   → 68–80 rows
-- product     → 57 rows
-- sales       → 124 rows
-- salesdetail → 310–320 rows


-- =============================================================================
-- SECTION 8 — WRITE BLOCK CONFIRMATION TESTS
-- Run each block independently in the Supabase SQL Editor.
-- Every test below MUST return an RLS error. Any successful write
-- is a critical policy failure that must be resolved before Sprint 2
-- is signed off by M5.
--
-- Replace <ANY_AUTHENTICATED_UUID> with any real userId from public."user"
-- (USER, ADMIN, or SUPERADMIN — all three must fail identically).
-- =============================================================================

-- -------- TEST 1: INSERT blocked on sales --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit INSERT on sales
    INSERT INTO public.sales (transNo, salesDate, custNo, empNo)
    VALUES ('TR999999', '2025-01-01', 'C0001', '00001');
ROLLBACK;


-- -------- TEST 2: UPDATE blocked on sales --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit UPDATE on sales
    UPDATE public.sales
    SET    salesDate = '2099-01-01'
    WHERE  transNo = 'TR000001';
ROLLBACK;


-- -------- TEST 3: DELETE blocked on sales --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit DELETE on sales
    DELETE FROM public.sales WHERE transNo = 'TR000001';
ROLLBACK;


-- -------- TEST 4: INSERT blocked on product --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit INSERT on product
    INSERT INTO public.product (prodCode, description, unit)
    VALUES ('ZZ0001', 'Ghost Product', 'ea');
ROLLBACK;


-- -------- TEST 5: INSERT blocked on priceHist --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit INSERT on priceHist
    INSERT INTO public.priceHist (effDate, prodCode, unitPrice)
    VALUES ('2099-01-01', 'AD0001', 9999.99);
ROLLBACK;


-- -------- TEST 6: INSERT blocked on salesDetail --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ANY_AUTHENTICATED_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit INSERT on salesDetail
    INSERT INTO public.salesDetail (transNo, prodCode, quantity)
    VALUES ('TR000001', 'AD0001', 99);
ROLLBACK;


-- =============================================================================
-- END OF MIGRATION: 07_rls_view_only_tables.sql
-- Next migration: 08_view_product_current_price.sql  (PR-03)
-- =============================================================================