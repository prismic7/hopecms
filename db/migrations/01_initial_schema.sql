-- =============================================================================
-- HopeCMS — PR-01: db/initial-schema
-- Branch: db/initial-schema
-- Engineer: M3 (Backend / DB Engineer)
-- Description: Creates the 5 core HopeDB tables for Supabase (PostgreSQL).
--              Only the `customer` table is structurally modified with
--              `record_status` and `stamp` columns. All other tables are
--              created exactly as defined in HopeDB with no additions.
-- Run in: Supabase SQL Editor (project root)
-- =============================================================================


-- =============================================================================
-- SECTION 1: SAFETY TEARDOWN
-- Drop tables in reverse-dependency order to avoid FK constraint errors.
-- Safe to run on a fresh Supabase project — IF EXISTS prevents errors.
-- =============================================================================

DROP TABLE IF EXISTS salesDetail  CASCADE;
DROP TABLE IF EXISTS payment      CASCADE;
DROP TABLE IF EXISTS priceHist    CASCADE;
DROP TABLE IF EXISTS sales        CASCADE;
DROP TABLE IF EXISTS product      CASCADE;
DROP TABLE IF EXISTS customer     CASCADE;


-- =============================================================================
-- SECTION 2: TABLE DEFINITIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: customer
-- Primary managed entity of the CMS. Supports full CRUD (no hard deletes).
--
-- MODIFIED from base HopeDB:
--   + record_status  VARCHAR(10)  DEFAULT 'ACTIVE'
--       Controls soft-delete visibility. ACTIVE = visible to all roles;
--       INACTIVE = hidden from USER, visible to ADMIN / SUPERADMIN only.
--   + stamp  VARCHAR(60)
--       Audit trail string. Format managed in application layer (M1).
--       Hidden from USER accounts via RLS / UI gating (M4).
--
-- NOTE for M1 (API layer): Always pass userType into getCustomers() and filter
--   WHERE record_status = 'ACTIVE' when userType = 'USER'. RLS enforces this
--   at the DB level too (Sprint 2), but the app-side filter is the first guard.
-- NOTE for M4 (Auth/Rights): stamp column should be excluded from SELECT
--   queries made on behalf of USER accounts. Easiest via a Supabase view or
--   by omitting the column in the React query when user_type = 'USER'.
-- -----------------------------------------------------------------------------

CREATE TABLE customer (
    custno        VARCHAR(5)   NOT NULL,
    custname      VARCHAR(20),
    address       VARCHAR(50),
    payterm       VARCHAR(3)   CONSTRAINT pay_ck CHECK (payterm IN ('COD', '30D', '45D')),
    record_status VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE'
                               CONSTRAINT rs_ck CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp         VARCHAR(60),
    CONSTRAINT customer_pk PRIMARY KEY (custno)
);

COMMENT ON COLUMN customer.record_status IS
    'Soft-delete flag. ACTIVE = visible to all roles. INACTIVE = soft-deleted; hidden from USER, visible to ADMIN/SUPERADMIN only. NEVER use hard DELETE.';

COMMENT ON COLUMN customer.stamp IS
    'Audit trail string. Populated by the application on add/edit/deactivate/recover actions. Hidden from USER accounts.';


-- -----------------------------------------------------------------------------
-- TABLE: product
-- Read-only product catalogue. No structural changes from base HopeDB.
-- No record_status or stamp added here.
-- -----------------------------------------------------------------------------

CREATE TABLE product (
    prodCode    VARCHAR(6)  NOT NULL,
    description VARCHAR(30),
    unit        VARCHAR(3)  CONSTRAINT unit_ck CHECK (unit IN ('pc', 'ea', 'mtr', 'pkg', 'ltr')),
    CONSTRAINT product_pk PRIMARY KEY (prodCode)
);


-- -----------------------------------------------------------------------------
-- TABLE: sales
-- One sales transaction per customer visit. View-only for all roles.
-- FK to customer and employee (employee table lives outside this migration;
-- empNo FK is declared but the employee table must be present — see note).
--
-- NOTE for M3: If the employee table is not in Supabase scope, remove the
--   empNo FK constraint and treat empNo as a plain VARCHAR reference only.
--   The guide states employee is outside the 5 managed tables, so FK is
--   intentionally left as a soft reference below (no REFERENCES clause).
-- -----------------------------------------------------------------------------

CREATE TABLE sales (
    transNo   VARCHAR(8)  NOT NULL,
    salesDate DATE,
    custNo    VARCHAR(5),
    empNo     VARCHAR(5),
    CONSTRAINT sales_pk        PRIMARY KEY (transNo),
    CONSTRAINT sales_cust_fk   FOREIGN KEY (custNo) REFERENCES customer (custno)
);

COMMENT ON COLUMN sales.empNo IS
    'References employee table (not managed in this Supabase project). Stored as plain VARCHAR; no FK enforced.';


-- -----------------------------------------------------------------------------
-- TABLE: salesDetail
-- Line items per transaction. View-only for all roles.
-- -----------------------------------------------------------------------------

CREATE TABLE salesDetail (
    transNo   VARCHAR(8)     NOT NULL,
    prodCode  VARCHAR(6)     NOT NULL,
    quantity  DECIMAL(10, 2) CONSTRAINT quantity_ck CHECK (quantity >= 0.0),
    CONSTRAINT salesdetail_pk       PRIMARY KEY (transNo, prodCode),
    CONSTRAINT salesdetail_trans_fk FOREIGN KEY (transNo)  REFERENCES sales   (transNo),
    CONSTRAINT salesdetail_prod_fk  FOREIGN KEY (prodCode) REFERENCES product  (prodCode)
);


-- -----------------------------------------------------------------------------
-- TABLE: priceHist
-- Price history per product, keyed by effective date. View-only for all roles.
-- Current price = MAX(effDate) per prodCode (see product_current_price view
-- in Sprint 2 migration).
-- -----------------------------------------------------------------------------

CREATE TABLE priceHist (
    effDate   DATE           NOT NULL,
    prodCode  VARCHAR(6)     NOT NULL,
    unitPrice DECIMAL(10, 2) CONSTRAINT unitP_ck CHECK (unitPrice > 0),
    CONSTRAINT pricehist_pk      PRIMARY KEY (effDate, prodCode),
    CONSTRAINT pricehist_prod_fk FOREIGN KEY (prodCode) REFERENCES product (prodCode)
);


-- =============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- RLS is enabled here on all 5 tables as a safety net even before Sprint 2
-- policies are written. With RLS enabled and no policies in place, all access
-- is DENIED by default — preventing accidental public reads in development.
--
-- Sprint 2 (db/rls-customer and db/rls-view-only-tables) will add the actual
-- policies. This section only activates RLS; do not add policies here.
-- =============================================================================

ALTER TABLE customer    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesDetail ENABLE ROW LEVEL SECURITY;
ALTER TABLE priceHist   ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 4: VERIFICATION QUERIES
-- Run these manually in the Supabase SQL Editor after executing this file
-- to confirm the schema is correct before proceeding to seed data.
-- =============================================================================

-- 4a. Confirm all 5 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customer', 'product', 'sales', 'salesdetail', 'pricehist')
ORDER BY table_name;

-- 4b. Confirm record_status and stamp exist ONLY on customer
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('record_status', 'stamp')
ORDER BY table_name, column_name;
-- Expected: only customer rows returned. No rows for product, sales,
--           salesdetail, or pricehist.

-- 4c. Confirm RLS is active on all 5 tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customer', 'product', 'sales', 'salesdetail', 'pricehist')
ORDER BY tablename;
-- Expected: rowsecurity = true for all 5 rows.

-- 4d. Confirm primary keys
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema    = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema    = 'public'
  AND tc.table_name IN ('customer', 'product', 'sales', 'salesdetail', 'pricehist')
ORDER BY tc.table_name, kcu.ordinal_position;

-- 4e. Confirm foreign keys
SELECT
    tc.table_name        AS child_table,
    kcu.column_name      AS child_column,
    ccu.table_name       AS parent_table,
    ccu.column_name      AS parent_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema    = 'public'
ORDER BY child_table;


-- =============================================================================
-- END OF MIGRATION: db/initial-schema
-- Next migration: db/rights-seed  (PR-02)
-- After both PRs are merged into dev, M1 can initialize the Supabase JS client
-- and M4 can begin wiring the provision_new_user() trigger against the user
-- table created in PR-02.
-- =============================================================================