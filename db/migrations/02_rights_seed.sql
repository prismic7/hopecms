-- =============================================================================
-- HopeCMS — PR-02: db/rights-seed
-- Branch: db/rights-seed
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: PR-01 db/initial-schema (customer, sales, salesDetail,
--             product, priceHist tables must already exist)
-- Description: Creates the 5 rights/auth tables, seeds 4 modules, 9 rights,
--              and the SUPERADMIN account with all rights set to 1.
-- Run in: Supabase SQL Editor after PR-01 has been applied.
-- =============================================================================


-- =============================================================================
-- SECTION 1: SAFETY TEARDOWN
-- Drop in reverse-dependency order. Safe on a fresh project.
-- =============================================================================

DROP TABLE IF EXISTS "UserModule_Rights" CASCADE;
DROP TABLE IF EXISTS user_module          CASCADE;
DROP TABLE IF EXISTS rights               CASCADE;
DROP TABLE IF EXISTS "Module"             CASCADE;
DROP TABLE IF EXISTS "user"               CASCADE;


-- =============================================================================
-- SECTION 2: TABLE DEFINITIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: "user"
-- Stores all app user accounts. Mirrors the Supabase Auth user after
-- provisioning. Every row here corresponds to a row in auth.users.
--
-- IMPORTANT — `user` is a reserved keyword in PostgreSQL. This table MUST
-- always be referenced with double quotes: FROM "user", JOIN "user", etc.
-- All application code (M1, M4) must follow this convention.
--
-- NOTE for M4 (Auth/Rights):
--   userId is a TEXT representation of the Supabase auth UUID
--   (session.user.id). The provision_new_user() trigger must cast
--   NEW.id::text when inserting here. The login guard queries this table
--   by userId to check record_status before granting access.
--
-- NOTE for M1 (API layer):
--   getUsers() for the Admin Module should SELECT all columns except stamp
--   for ADMIN callers. For USER callers this table is not queried directly.
-- -----------------------------------------------------------------------------

CREATE TABLE "user" (
    userId        TEXT         NOT NULL,
    username      VARCHAR(50),
    email         VARCHAR(100),
    user_type     VARCHAR(12)  NOT NULL DEFAULT 'USER'
                               CONSTRAINT ut_ck CHECK (user_type IN ('SUPERADMIN', 'ADMIN', 'USER')),
    record_status VARCHAR(10)  NOT NULL DEFAULT 'INACTIVE'
                               CONSTRAINT user_rs_ck CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp         VARCHAR(60),
    CONSTRAINT user_pk PRIMARY KEY (userId)
);

COMMENT ON TABLE "user" IS
    'App user accounts. userId matches auth.users.id (UUID as text). New rows are auto-provisioned by the provision_new_user() trigger (M4) as USER / INACTIVE.';

COMMENT ON COLUMN "user".record_status IS
    'INACTIVE by default. ADMIN or SUPERADMIN must set to ACTIVE before the user can log in. Login guard (M4) enforces this on every sign-in.';

COMMENT ON COLUMN "user".stamp IS
    'Audit trail. Populated by app on account activation, deactivation, and type changes. Not exposed to USER accounts.';


-- -----------------------------------------------------------------------------
-- TABLE: "Module"
-- Defines the four functional modules of the CMS.
-- Module is also a reserved word in some SQL contexts — keep double quotes.
-- -----------------------------------------------------------------------------

CREATE TABLE "Module" (
    moduleCode  VARCHAR(10)  NOT NULL,
    moduleName  VARCHAR(30),
    record_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
                               CONSTRAINT mod_rs_ck CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp       VARCHAR(60),
    CONSTRAINT module_pk PRIMARY KEY (moduleCode)
);


-- -----------------------------------------------------------------------------
-- TABLE: rights
-- Defines the 9 individual access rights, each belonging to one module.
-- right_default: the value automatically assigned to new USER accounts
-- by the provision_new_user() trigger (M4). 1 = granted, 0 = denied.
-- -----------------------------------------------------------------------------

CREATE TABLE rights (
    rightCode     VARCHAR(12)  NOT NULL,
    rightDesc     VARCHAR(40),
    right_default INTEGER      NOT NULL DEFAULT 0
                               CONSTRAINT rdef_ck CHECK (right_default IN (0, 1)),
    moduleCode    VARCHAR(10)  NOT NULL,
    record_status VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE'
                               CONSTRAINT rgt_rs_ck CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp         VARCHAR(60),
    CONSTRAINT rights_pk        PRIMARY KEY (rightCode),
    CONSTRAINT rights_module_fk FOREIGN KEY (moduleCode) REFERENCES "Module" (moduleCode)
);

COMMENT ON COLUMN rights.right_default IS
    'Auto-assigned to new USER accounts by provision_new_user() trigger. CUST_VIEW and all VIEW rights default to 1; all CRUD and ADM rights default to 0.';


-- -----------------------------------------------------------------------------
-- TABLE: user_module
-- Maps each user to a module. rights_value indicates whether the module
-- is enabled (1) or disabled (0) for that user.
--
-- NOTE for M4: provision_new_user() inserts 4 rows here on every new
-- auth.users INSERT — Cust_Mod=1, Sales_Mod=1, Prod_Mod=1, Adm_Mod=0.
-- -----------------------------------------------------------------------------

CREATE TABLE user_module (
    userId      TEXT         NOT NULL,
    moduleCode  VARCHAR(10)  NOT NULL,
    rights_value INTEGER     NOT NULL DEFAULT 0
                              CONSTRAINT um_rv_ck CHECK (rights_value IN (0, 1)),
    CONSTRAINT user_module_pk        PRIMARY KEY (userId, moduleCode),
    CONSTRAINT user_module_user_fk   FOREIGN KEY (userId)     REFERENCES "user"   (userId),
    CONSTRAINT user_module_mod_fk    FOREIGN KEY (moduleCode) REFERENCES "Module" (moduleCode)
);


-- -----------------------------------------------------------------------------
-- TABLE: "UserModule_Rights"
-- Maps each user to each individual right with a 1/0 value.
-- This is the table queried by UserRightsContext (M4) on every login
-- to build the rights map: { CUST_VIEW:1, CUST_ADD:0, ... }.
--
-- NOTE for M4: provision_new_user() inserts 9 rows here for every new user.
--   right_value mirrors rights.right_default for the given rightCode.
-- NOTE for M3 (Sprint 2 RLS): RLS policies on customer and other tables
--   will subquery this table to check the caller's right_value.
-- -----------------------------------------------------------------------------

CREATE TABLE "UserModule_Rights" (
    userId      TEXT         NOT NULL,
    rightCode   VARCHAR(12)  NOT NULL,
    right_value INTEGER      NOT NULL DEFAULT 0
                              CONSTRAINT umr_rv_ck CHECK (right_value IN (0, 1)),
    CONSTRAINT umr_pk        PRIMARY KEY (userId, rightCode),
    CONSTRAINT umr_user_fk   FOREIGN KEY (userId)    REFERENCES "user"  (userId),
    CONSTRAINT umr_right_fk  FOREIGN KEY (rightCode) REFERENCES rights  (rightCode)
);

COMMENT ON TABLE "UserModule_Rights" IS
    'Per-user per-right values. Queried by UserRightsContext (M4) on login. Sprint 2 RLS policies subquery this table to gate INSERT/UPDATE on customer.';


-- =============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- Enabled now as a safety baseline. Actual policies land in Sprint 3
-- (db/rls-admin-module) after the SUPERADMIN protection requirements
-- are fully defined. Until then, service_role key (M1's backend calls)
-- bypasses RLS; anon/authenticated roles are locked out by default.
-- =============================================================================

ALTER TABLE "user"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserModule_Rights" ENABLE ROW LEVEL SECURITY;

-- Temporary read-access policies so authenticated users can query
-- modules and rights during development (Sprint 1 / 2 login flows).
-- These will be replaced or tightened in Sprint 3 (db/rls-admin-module).
CREATE POLICY module_read_all ON "Module"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY rights_read_all ON rights
    FOR SELECT TO authenticated USING (true);

CREATE POLICY user_module_read_own ON user_module
    FOR SELECT TO authenticated
    USING (userId = auth.uid()::text);

CREATE POLICY umr_read_own ON "UserModule_Rights"
    FOR SELECT TO authenticated
    USING (userId = auth.uid()::text);

CREATE POLICY user_read_own ON "user"
    FOR SELECT TO authenticated
    USING (userId = auth.uid()::text);


-- =============================================================================
-- SECTION 4: SEED — MODULES (4 rows)
-- =============================================================================

INSERT INTO "Module" (moduleCode, moduleName, record_status, stamp) VALUES
    ('Cust_Mod',  'Customer Module', 'ACTIVE', 'SEEDED'),
    ('Sales_Mod', 'Sales Module',    'ACTIVE', 'SEEDED'),
    ('Prod_Mod',  'Product Module',  'ACTIVE', 'SEEDED'),
    ('Adm_Mod',   'Admin Module',    'ACTIVE', 'SEEDED');


-- =============================================================================
-- SECTION 5: SEED — RIGHTS (9 rows)
-- right_default reflects the value provision_new_user() assigns to
-- every new USER account automatically. Only view rights default to 1.
-- =============================================================================

INSERT INTO rights (rightCode, rightDesc, right_default, moduleCode, record_status, stamp) VALUES
    -- Customer Module
    ('CUST_VIEW',  'View Customers',        1, 'Cust_Mod',  'ACTIVE', 'SEEDED'),
    ('CUST_ADD',   'Add Customer',           0, 'Cust_Mod',  'ACTIVE', 'SEEDED'),
    ('CUST_EDIT',  'Edit Customer',          0, 'Cust_Mod',  'ACTIVE', 'SEEDED'),
    ('CUST_DEL',   'Soft Delete Customer',   0, 'Cust_Mod',  'ACTIVE', 'SEEDED'),
    -- Sales Module
    ('SALES_VIEW', 'View Sales',             1, 'Sales_Mod', 'ACTIVE', 'SEEDED'),
    ('SD_VIEW',    'View Sales Detail',      1, 'Sales_Mod', 'ACTIVE', 'SEEDED'),
    -- Product Module
    ('PROD_VIEW',  'View Products',          1, 'Prod_Mod',  'ACTIVE', 'SEEDED'),
    ('PRICE_VIEW', 'View Price History',     1, 'Prod_Mod',  'ACTIVE', 'SEEDED'),
    -- Admin Module
    ('ADM_USER',   'Admin Activate User',    0, 'Adm_Mod',   'ACTIVE', 'SEEDED');


-- =============================================================================
-- SECTION 6: SEED — SUPERADMIN ACCOUNT
-- =============================================================================
-- IMPORTANT — userId placeholder:
--   'user1' is a temporary stand-in. Before going to production, M4 must:
--     1. Create jcesperanza@neu.edu.ph via Supabase Dashboard → Authentication
--        → Users → Invite user (or Add user).
--     2. Copy the generated UUID from auth.users.
--     3. Run the UPDATE below to replace 'user1' with the real UUID.
--
--   UPDATE "user" SET userId = '<real-uuid-here>'
--   WHERE email = 'jcesperanza@neu.edu.ph';
--   UPDATE user_module        SET userId = '<real-uuid-here>' WHERE userId = 'user1';
--   UPDATE "UserModule_Rights" SET userId = '<real-uuid-here>' WHERE userId = 'user1';
--
--   Until that update is run, the login guard (M4) will not recognise the
--   auth session because auth.uid() will not match 'user1'.
-- =============================================================================

-- 6a. Insert SUPERADMIN user row
INSERT INTO "user" (userId, username, email, user_type, record_status, stamp) VALUES
    ('user1', 'jcesperanza', 'jcesperanza@neu.edu.ph', 'SUPERADMIN', 'ACTIVE', 'SEEDED');


-- 6b. Map SUPERADMIN to all 4 modules (all enabled)
INSERT INTO user_module (userId, moduleCode, rights_value) VALUES
    ('user1', 'Cust_Mod',  1),
    ('user1', 'Sales_Mod', 1),
    ('user1', 'Prod_Mod',  1),
    ('user1', 'Adm_Mod',   1);


-- 6c. Grant SUPERADMIN all 9 rights with right_value = 1
INSERT INTO "UserModule_Rights" (userId, rightCode, right_value) VALUES
    ('user1', 'CUST_VIEW',  1),
    ('user1', 'CUST_ADD',   1),
    ('user1', 'CUST_EDIT',  1),
    ('user1', 'CUST_DEL',   1),
    ('user1', 'SALES_VIEW', 1),
    ('user1', 'SD_VIEW',    1),
    ('user1', 'PROD_VIEW',  1),
    ('user1', 'PRICE_VIEW', 1),
    ('user1', 'ADM_USER',   1);


-- =============================================================================
-- SECTION 7: PROVISION_NEW_USER TRIGGER TEMPLATE
-- This trigger is M4's deliverable (PR-04: db/trigger-provision-user).
-- It is included here as a commented reference so M4 can see the exact
-- column names and values this schema expects. M4 must deploy this
-- separately in their own migration file — do NOT uncomment here.
--
-- CREATE OR REPLACE FUNCTION provision_new_user()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--     -- 1. Create user row: USER / INACTIVE
--     INSERT INTO public."user" (userId, username, email, user_type, record_status, stamp)
--     VALUES (
--         NEW.id::text,
--         COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
--         NEW.email,
--         'USER',
--         'INACTIVE',
--         'AUTO-PROVISIONED ' || NOW()::text
--     );
--
--     -- 2. Map to modules: Cust, Sales, Prod enabled; Adm disabled
--     INSERT INTO public.user_module (userId, moduleCode, rights_value) VALUES
--         (NEW.id::text, 'Cust_Mod',  1),
--         (NEW.id::text, 'Sales_Mod', 1),
--         (NEW.id::text, 'Prod_Mod',  1),
--         (NEW.id::text, 'Adm_Mod',   0);
--
--     -- 3. Grant view rights; deny all CRUD and admin rights
--     INSERT INTO public."UserModule_Rights" (userId, rightCode, right_value) VALUES
--         (NEW.id::text, 'CUST_VIEW',  1),
--         (NEW.id::text, 'CUST_ADD',   0),
--         (NEW.id::text, 'CUST_EDIT',  0),
--         (NEW.id::text, 'CUST_DEL',   0),
--         (NEW.id::text, 'SALES_VIEW', 1),
--         (NEW.id::text, 'SD_VIEW',    1),
--         (NEW.id::text, 'PROD_VIEW',  1),
--         (NEW.id::text, 'PRICE_VIEW', 1),
--         (NEW.id::text, 'ADM_USER',   0);
--
--     RETURN NEW;
-- END;
-- $$;
--
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION provision_new_user();
-- =============================================================================


-- =============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- Run these manually after applying this migration to confirm correctness.
-- =============================================================================

-- 8a. Confirm all 5 rights tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user', 'Module', 'rights', 'user_module', 'UserModule_Rights')
ORDER BY table_name;

-- 8b. Confirm module row counts (expect 4)
SELECT COUNT(*) AS module_count FROM "Module";

-- 8c. Confirm rights row counts (expect 9)
SELECT COUNT(*) AS rights_count FROM rights;

-- 8d. Confirm SUPERADMIN user row
SELECT userId, username, email, user_type, record_status
FROM "user"
WHERE user_type = 'SUPERADMIN';

-- 8e. Confirm SUPERADMIN has all 9 rights = 1
SELECT r.rightCode, r.rightDesc, umr.right_value
FROM "UserModule_Rights" umr
JOIN rights r ON r.rightCode = umr.rightCode
WHERE umr.userId = 'user1'
ORDER BY r.moduleCode, r.rightCode;
-- Expected: 9 rows, all right_value = 1.

-- 8f. Confirm SUPERADMIN module mappings (expect 4 rows, all rights_value = 1)
SELECT moduleCode, rights_value
FROM user_module
WHERE userId = 'user1'
ORDER BY moduleCode;

-- 8g. Confirm right_default values match provisioning intent
SELECT rightCode, rightDesc, right_default, moduleCode
FROM rights
ORDER BY moduleCode, rightCode;
-- CUST_VIEW, SALES_VIEW, SD_VIEW, PROD_VIEW, PRICE_VIEW → right_default = 1
-- CUST_ADD, CUST_EDIT, CUST_DEL, ADM_USER              → right_default = 0


-- =============================================================================
-- END OF MIGRATION: db/rights-seed
-- Next migrations (Sprint 2):
--   PR-01  db/rls-customer           — RLS policies for customer table
--   PR-02  db/rls-view-only-tables   — SELECT-only RLS for 4 view-only tables
--   PR-03  db/view-product-current-price
--   PR-04  db/view-customer-sales-summary
-- M4 dependency: provision_new_user() trigger (PR-04: db/trigger-provision-user)
--   must be deployed AFTER this migration is merged into dev.
-- =============================================================================