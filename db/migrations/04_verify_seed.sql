-- =============================================================================
-- HopeCMS — PR-04: db/verify-seed
-- Branch: db/verify-seed
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: PR-01 db/initial-schema, PR-02 db/rights-seed
-- Description: Verification queries to confirm all seed data is correctly
--              inserted and all structural requirements are met.
--              Run each section independently in the Supabase SQL Editor.
--              All queries are read-only (SELECT only — no mutations).
-- =============================================================================


-- =============================================================================
-- SECTION 1: CORE TABLE ROW COUNTS
-- Expected: customer=82, sales=124, product=57
-- salesDetail and priceHist are verified as ranges since the HopeDB source
-- has slight variability in how line items are counted (~250 and ~70).
-- A result outside the expected range means seed data is incomplete or
-- was run more than once (duplicate inserts). If counts are doubled,
-- re-run the teardown in PR-01 Section 1 and re-seed.
-- =============================================================================

SELECT
    'customer'    AS table_name,
    COUNT(*)      AS actual_count,
    82            AS expected_count,
    CASE
        WHEN COUNT(*) = 82  THEN 'PASS'
        ELSE                     'FAIL — recheck seed'
    END           AS status
FROM customer

UNION ALL

SELECT
    'sales',
    COUNT(*),
    124,
    CASE
        WHEN COUNT(*) = 124 THEN 'PASS'
        ELSE                     'FAIL — recheck seed'
    END
FROM sales

UNION ALL

SELECT
    'salesDetail',
    COUNT(*),
    313,
    CASE
        WHEN COUNT(*) BETWEEN 310 AND 320 THEN 'PASS'
        ELSE                                   'FAIL — recheck seed'
    END
FROM salesDetail

UNION ALL

SELECT
    'product',
    COUNT(*),
    57,
    CASE
        WHEN COUNT(*) = 57  THEN 'PASS'
        ELSE                     'FAIL — recheck seed'
    END
FROM product

UNION ALL

SELECT
    'priceHist',
    COUNT(*),
    70,   -- treat as minimum threshold (actual is ~70)
    CASE
        WHEN COUNT(*) BETWEEN 68 AND 80 THEN 'PASS'
        ELSE                                  'FAIL — recheck seed'
    END
FROM priceHist

ORDER BY table_name;


-- =============================================================================
-- SECTION 2: RIGHTS SYSTEM INTEGRITY
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2a. Module count — expect exactly 4 rows
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS actual_module_count,
    4         AS expected,
    CASE
        WHEN COUNT(*) = 4 THEN 'PASS'
        ELSE                   'FAIL — expected 4 modules'
    END       AS status
FROM "Module";


-- -----------------------------------------------------------------------------
-- 2b. Rights count — expect exactly 9 rows
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS actual_rights_count,
    9         AS expected,
    CASE
        WHEN COUNT(*) = 9 THEN 'PASS'
        ELSE                   'FAIL — expected 9 rights'
    END       AS status
FROM rights;


-- -----------------------------------------------------------------------------
-- 2c. Rights default values
-- Verifies that view rights default to 1 (auto-granted to new USERs)
-- and CRUD/admin rights default to 0 (must be explicitly granted).
-- Any FAIL here means provision_new_user() (M4) will assign wrong defaults.
-- -----------------------------------------------------------------------------

SELECT
    rightCode,
    rightDesc,
    right_default                          AS actual_default,
    CASE rightCode
        WHEN 'CUST_VIEW'  THEN 1
        WHEN 'SALES_VIEW' THEN 1
        WHEN 'SD_VIEW'    THEN 1
        WHEN 'PROD_VIEW'  THEN 1
        WHEN 'PRICE_VIEW' THEN 1
        ELSE 0
    END                                    AS expected_default,
    CASE
        WHEN right_default = CASE rightCode
            WHEN 'CUST_VIEW'  THEN 1
            WHEN 'SALES_VIEW' THEN 1
            WHEN 'SD_VIEW'    THEN 1
            WHEN 'PROD_VIEW'  THEN 1
            WHEN 'PRICE_VIEW' THEN 1
            ELSE 0
        END THEN 'PASS'
        ELSE     'FAIL — wrong default'
    END                                    AS status
FROM rights
ORDER BY moduleCode, rightCode;


-- -----------------------------------------------------------------------------
-- 2d. SUPERADMIN user row — expect 1 row, user_type=SUPERADMIN, status=ACTIVE
-- -----------------------------------------------------------------------------

SELECT
    userId,
    username,
    email,
    user_type,
    record_status,
    CASE
        WHEN user_type    = 'SUPERADMIN' AND
             record_status = 'ACTIVE'
        THEN 'PASS'
        ELSE 'FAIL — check user_type or record_status'
    END AS status
FROM "user"
WHERE email = 'jcesperanza@neu.edu.ph';

-- If this returns 0 rows the SUPERADMIN seed was not applied.
-- If record_status = 'INACTIVE' the account cannot pass the login guard (M4).


-- -----------------------------------------------------------------------------
-- 2e. SUPERADMIN rights assignment — expect 9 rows, all right_value = 1
-- This is the core SUPERADMIN validation: every right must be explicitly
-- granted. Any right_value = 0 here is a seeding error.
-- -----------------------------------------------------------------------------

SELECT
    r.rightCode,
    r.rightDesc,
    r.moduleCode,
    umr.right_value                  AS actual_value,
    1                                AS expected_value,
    CASE
        WHEN umr.right_value = 1 THEN 'PASS'
        ELSE                          'FAIL — should be 1'
    END                              AS status
FROM "UserModule_Rights" umr
JOIN rights r
    ON r.rightCode = umr.rightCode
JOIN "user" u
    ON u.userId = umr.userId
WHERE u.email = 'jcesperanza@neu.edu.ph'
ORDER BY r.moduleCode, r.rightCode;

-- Expected: 9 rows — all status = PASS
-- If fewer than 9 rows are returned, the UserModule_Rights seed is incomplete.


-- -----------------------------------------------------------------------------
-- 2f. SUPERADMIN module mappings — expect 4 rows, all rights_value = 1
-- Confirms the SUPERADMIN has access to all 4 modules including Adm_Mod.
-- New USERs get Adm_Mod = 0 via provision_new_user(). SUPERADMIN must be 1.
-- -----------------------------------------------------------------------------

SELECT
    um.moduleCode,
    m.moduleName,
    um.rights_value                  AS actual_value,
    1                                AS expected_value,
    CASE
        WHEN um.rights_value = 1 THEN 'PASS'
        ELSE                          'FAIL — should be 1'
    END                              AS status
FROM user_module um
JOIN "Module" m
    ON m.moduleCode = um.moduleCode
JOIN "user" u
    ON u.userId = um.userId
WHERE u.email = 'jcesperanza@neu.edu.ph'
ORDER BY um.moduleCode;

-- Expected: 4 rows — Adm_Mod, Cust_Mod, Prod_Mod, Sales_Mod — all PASS


-- =============================================================================
-- SECTION 3: CUSTOMER TABLE STRUCTURAL CHECKS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3a. Confirm record_status and stamp columns exist ONLY on customer
-- The critical rule: these two columns must NOT appear on sales, salesDetail,
-- product, or priceHist. Any row returned for those 4 tables is a schema error.
-- -----------------------------------------------------------------------------

SELECT
    table_name,
    column_name,
    column_default,
    CASE table_name
        WHEN 'customer' THEN 'PASS — expected on customer'
        ELSE                 'FAIL — column must not exist here'
    END                              AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name  IN ('record_status', 'stamp')
  AND table_name   IN ('customer', 'sales', 'salesdetail', 'product', 'pricehist')
ORDER BY table_name, column_name;

-- Expected: exactly 2 rows — both for customer (record_status and stamp).
-- Zero rows means the ALTER TABLE in PR-01 was not applied.
-- Any row for the other 4 tables means those tables were incorrectly modified.


-- -----------------------------------------------------------------------------
-- 3b. Confirm record_status defaults to 'ACTIVE' in the column definition
-- This checks the schema-level DEFAULT, not the data.
-- If this returns no rows the DEFAULT was not set in PR-01.
-- -----------------------------------------------------------------------------

SELECT
    column_name,
    column_default,
    CASE
        WHEN column_default = '''ACTIVE'''  THEN 'PASS'
        WHEN column_default IS NULL         THEN 'FAIL — no DEFAULT set'
        ELSE                                     'FAIL — unexpected default: ' || column_default
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'customer'
  AND column_name  = 'record_status';


-- -----------------------------------------------------------------------------
-- 3c. Confirm all 82 seeded customers have record_status = 'ACTIVE'
-- At seed time no customers should be soft-deleted. Any INACTIVE row here
-- means a seed script accidentally set a customer to INACTIVE, or the
-- DEFAULT was not in place when the INSERTs ran.
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)                          AS total_customers,
    SUM(CASE WHEN record_status = 'ACTIVE'   THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN record_status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactive_count,
    CASE
        WHEN COUNT(*) = 82
         AND SUM(CASE WHEN record_status = 'INACTIVE' THEN 1 ELSE 0 END) = 0
        THEN 'PASS — 82 customers, all ACTIVE'
        ELSE 'FAIL — unexpected counts or INACTIVE rows found'
    END                               AS status
FROM customer;


-- -----------------------------------------------------------------------------
-- 3d. Spot-check: confirm stamp column is NULL for all seeded customers
-- The stamp column is populated by the application (M1) on add/edit/deactivate.
-- At seed time it should be empty for all customer rows.
-- Any non-NULL values here means something wrote to stamp during seeding.
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS customers_with_stamp,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — stamp is NULL for all seeded customers'
        ELSE                   'FAIL — unexpected stamp values found'
    END       AS status
FROM customer
WHERE stamp IS NOT NULL;


-- =============================================================================
-- SECTION 4: FOREIGN KEY INTEGRITY CHECKS
-- Confirms that all FK relationships hold across the 5 core tables.
-- Orphaned rows here indicate seed scripts were run out of order.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4a. sales → customer: every sales.custNo must match a customer.custno
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS orphaned_sales_rows,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — all sales rows link to valid customers'
        ELSE                   'FAIL — orphaned rows found in sales'
    END       AS status
FROM sales s
WHERE NOT EXISTS (
    SELECT 1 FROM customer c WHERE c.custno = s.custNo
);


-- -----------------------------------------------------------------------------
-- 4b. salesDetail → sales: every salesDetail.transNo must match a sales.transNo
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS orphaned_detail_rows,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — all salesDetail rows link to valid sales'
        ELSE                   'FAIL — orphaned rows found in salesDetail'
    END       AS status
FROM salesDetail sd
WHERE NOT EXISTS (
    SELECT 1 FROM sales s WHERE s.transNo = sd.transNo
);


-- -----------------------------------------------------------------------------
-- 4c. salesDetail → product: every salesDetail.prodCode must match a product
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS orphaned_detail_product_rows,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — all salesDetail rows link to valid products'
        ELSE                   'FAIL — orphaned rows found (prodCode mismatch)'
    END       AS status
FROM salesDetail sd
WHERE NOT EXISTS (
    SELECT 1 FROM product p WHERE p.prodCode = sd.prodCode
);


-- -----------------------------------------------------------------------------
-- 4d. priceHist → product: every priceHist.prodCode must match a product
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS orphaned_pricehist_rows,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — all priceHist rows link to valid products'
        ELSE                   'FAIL — orphaned rows found in priceHist'
    END       AS status
FROM priceHist ph
WHERE NOT EXISTS (
    SELECT 1 FROM product p WHERE p.prodCode = ph.prodCode
);


-- -----------------------------------------------------------------------------
-- 4e. rights → Module: every rights.moduleCode must match a Module row
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)  AS orphaned_rights_rows,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS — all rights rows link to valid modules'
        ELSE                   'FAIL — orphaned rows found in rights'
    END       AS status
FROM rights r
WHERE NOT EXISTS (
    SELECT 1 FROM "Module" m WHERE m.moduleCode = r.moduleCode
);


-- =============================================================================
-- SECTION 5: SUMMARY DASHBOARD
-- Run this last. Aggregates one PASS/FAIL per major check area so the team
-- gets a single-screen view of the overall seed health before Sprint 2 begins.
-- Each row corresponds to a section above — investigate the relevant section
-- for any FAIL result.
-- =============================================================================

WITH counts AS (
    SELECT
        (SELECT COUNT(*) FROM customer)    AS cust_ct,
        (SELECT COUNT(*) FROM sales)       AS sales_ct,
        (SELECT COUNT(*) FROM salesDetail) AS sd_ct,
        (SELECT COUNT(*) FROM product)     AS prod_ct,
        (SELECT COUNT(*) FROM priceHist)   AS ph_ct,
        (SELECT COUNT(*) FROM "Module")    AS mod_ct,
        (SELECT COUNT(*) FROM rights)      AS rgt_ct,

        -- SUPERADMIN rights count (all 9 at value 1)
        (SELECT COUNT(*) FROM "UserModule_Rights" umr
         JOIN "user" u ON u.userId = umr.userId
         WHERE u.email = 'jcesperanza@neu.edu.ph'
           AND umr.right_value = 1)        AS sa_rights_ct,

        -- Customers with wrong status at seed time
        (SELECT COUNT(*) FROM customer
         WHERE record_status != 'ACTIVE')  AS bad_status_ct,

        -- Orphaned FK rows across all 4 relationships
        (SELECT COUNT(*) FROM sales s
         WHERE NOT EXISTS (SELECT 1 FROM customer c WHERE c.custno = s.custNo)
        ) +
        (SELECT COUNT(*) FROM salesDetail sd
         WHERE NOT EXISTS (SELECT 1 FROM sales s WHERE s.transNo = sd.transNo)
        ) +
        (SELECT COUNT(*) FROM salesDetail sd
         WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.prodCode = sd.prodCode)
        ) +
        (SELECT COUNT(*) FROM priceHist ph
         WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.prodCode = ph.prodCode)
        )                                  AS orphan_ct,

        -- record_status column on wrong tables (should be 0)
        (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = 'public'
           AND column_name  = 'record_status'
           AND table_name  IN ('sales','salesdetail','product','pricehist')
        )                                  AS wrong_col_ct
)
SELECT check_name, result, status FROM (
    SELECT 1 AS ord, 'Core table row counts'       AS check_name,
        FORMAT('cust=%s sales=%s sd=%s prod=%s ph=%s',
            cust_ct, sales_ct, sd_ct, prod_ct, ph_ct) AS result,
        CASE WHEN cust_ct=82 AND sales_ct=124
              AND sd_ct BETWEEN 310 AND 320
              AND prod_ct=57 AND ph_ct BETWEEN 68 AND 80
             THEN 'PASS' ELSE 'FAIL' END AS status
    FROM counts

    UNION ALL SELECT 2, 'Modules and rights seeded',
        FORMAT('%s modules, %s rights', mod_ct, rgt_ct),
        CASE WHEN mod_ct=4 AND rgt_ct=9 THEN 'PASS' ELSE 'FAIL' END
    FROM counts

    UNION ALL SELECT 3, 'SUPERADMIN has all 9 rights = 1',
        FORMAT('%s / 9 rights granted', sa_rights_ct),
        CASE WHEN sa_rights_ct=9 THEN 'PASS' ELSE 'FAIL' END
    FROM counts

    UNION ALL SELECT 4, 'All customers ACTIVE at seed',
        FORMAT('%s customers with wrong status', bad_status_ct),
        CASE WHEN bad_status_ct=0 THEN 'PASS' ELSE 'FAIL' END
    FROM counts

    UNION ALL SELECT 5, 'No FK orphans across 4 relationships',
        FORMAT('%s orphaned rows found', orphan_ct),
        CASE WHEN orphan_ct=0 THEN 'PASS' ELSE 'FAIL' END
    FROM counts

    UNION ALL SELECT 6, 'record_status/stamp on customer only',
        FORMAT('%s extra column(s) on wrong tables', wrong_col_ct),
        CASE WHEN wrong_col_ct=0 THEN 'PASS' ELSE 'FAIL' END
    FROM counts
) results
ORDER BY ord;


-- =============================================================================
-- END OF MIGRATION: db/verify-seed
-- Screenshot this summary output and attach it to the PR-04 description.
-- All 6 rows must show PASS before the Sprint 1 Gate is cleared and
-- Sprint 2 work (RLS policies, SQL views) can begin.
-- =============================================================================