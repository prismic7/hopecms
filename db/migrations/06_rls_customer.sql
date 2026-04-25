-- =============================================================================
-- HopeCMS — PR-01: db/rls-customer
-- File:    /db/migrations/06_rls_customer.sql
-- Branch:  db/rls-customer
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql   (customer table + RLS enabled)
--             02_rights_seed.sql      (user, UserModule_Rights tables)
--             05_trigger_provision_user.sql (auth flow confirmed)
-- Description: Enables FORCE ROW LEVEL SECURITY and defines all five
--              access policies on the customer table:
--                1. SELECT  — visibility by user_type
--                2. INSERT  — gated by CUST_ADD = 1
--                3. UPDATE  — general edit, gated by CUST_EDIT = 1
--                4. UPDATE  — soft delete, gated by CUST_DEL = 1
--                5. UPDATE  — recovery, gated by ADMIN / SUPERADMIN
--              No DELETE policy is created. Hard deletes are strictly
--              forbidden by project rules.
-- NOTE: ALTER TABLE customer ENABLE ROW LEVEL SECURITY was already
--       executed in 01_initial_schema.sql. The statement below is
--       included for completeness but is a no-op in PostgreSQL.
--       The only new statement is FORCE ROW LEVEL SECURITY.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — ENABLE AND FORCE ROW LEVEL SECURITY
-- FORCE ROW LEVEL SECURITY ensures even the Supabase postgres superuser
-- is subject to these policies when acting as an authenticated role.
-- The service_role key bypasses RLS by design — the app must always use
-- the anon key for user-facing operations so policies are enforced.
-- =============================================================================

ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;  -- no-op: already set in 01_initial_schema.sql
ALTER TABLE public.customer FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2 — HELPER FUNCTIONS
-- Two SECURITY DEFINER functions centralise repeated lookups so policy
-- expressions stay readable and consistent. They run with the privileges
-- of their DEFINER (postgres), meaning they can read public."user" and
-- public."UserModule_Rights" even when RLS on those tables would otherwise
-- block an authenticated caller.
--
-- NOTE for M4: Do not expose these functions to the frontend. They are
--   internal DB helpers used only inside policy USING and WITH CHECK clauses.
-- NOTE for M1: Your API service layer does not call these directly. They
--   fire automatically every time Supabase evaluates an RLS check on the
--   customer table.
-- =============================================================================

-- Returns the user_type ('USER', 'ADMIN', 'SUPERADMIN') for the currently
-- authenticated Supabase user. Maps auth.uid() → public."user".userid.
CREATE OR REPLACE FUNCTION public.get_my_user_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT user_type
    FROM   public."user"
    WHERE  "userid" = auth.uid()::text;
$$;

-- Returns the right_value (0 or 1) for a given rightcode for the currently
-- authenticated Supabase user. Returns 0 when the user has no row for that
-- right (safe default — deny rather than allow).
CREATE OR REPLACE FUNCTION public.get_my_right(p_right_code TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE("right_value", 0)
    FROM   public."UserModule_Rights"
    WHERE  "userid"    = auth.uid()::text
      AND  "rightcode" = p_right_code;
$$;


-- =============================================================================
-- SECTION 3 — POLICY 1: SELECT (Customer Visibility)
--
-- USER       → sees only ACTIVE customers (record_status = 'ACTIVE')
-- ADMIN      → sees all rows (ACTIVE + INACTIVE)
-- SUPERADMIN → sees all rows (ACTIVE + INACTIVE)
--
-- The two conditions are OR-ed: if either passes, the row is returned.
-- USER accounts have user_type = 'USER' so they never satisfy the
-- ADMIN/SUPERADMIN branch and fall through to the record_status check only.
--
-- NOTE for M1: getCustomers(userType) in your service layer should also
--   apply .eq('record_status', 'ACTIVE') when userType = 'USER' as a
--   defence-in-depth measure. RLS is the authoritative gate; the
--   application-side filter is a belt-and-suspenders check.
-- =============================================================================

CREATE POLICY customer_select
    ON  public.customer
    FOR SELECT
    TO  authenticated
    USING (
        record_status = 'ACTIVE'
        OR
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
    );


-- =============================================================================
-- SECTION 4 — POLICY 2: INSERT (Add Customer)
--
-- Requires CUST_ADD = 1 in UserModule_Rights.
-- Per the rights matrix:
--   SUPERADMIN → CUST_ADD = 1  ✓
--   ADMIN      → CUST_ADD = 1  ✓
--   USER       → CUST_ADD = 0  ✗  (blocked)
--
-- New rows automatically receive record_status = 'ACTIVE' via the DEFAULT
-- constraint added in 01_initial_schema.sql. The stamp column is set by
-- the application after insert via makeStamp() — not enforced here.
--
-- WITH CHECK (not USING) is the correct clause for INSERT: it validates
-- the proposed new row before committing.
-- =============================================================================

CREATE POLICY customer_insert
    ON  public.customer
    FOR INSERT
    TO  authenticated
    WITH CHECK (
        public.get_my_right('CUST_ADD') = 1
    );


-- =============================================================================
-- SECTION 5 — POLICY 3: UPDATE — General Field Edit
--
-- Requires CUST_EDIT = 1.
-- Per the rights matrix:
--   SUPERADMIN → CUST_EDIT = 1  ✓
--   ADMIN      → CUST_EDIT = 1  ✓
--   USER       → CUST_EDIT = 0  ✗  (blocked)
--
-- USING clause      → which rows the user can target for update
-- WITH CHECK clause → validates the new column values after the update
--
-- Soft-delete guard: WITH CHECK prevents this policy from being used to
-- set record_status = 'INACTIVE'. Only Policy 4 (which requires CUST_DEL = 1)
-- is permitted to transition a row to INACTIVE. This stops ADMIN
-- (CUST_EDIT = 1 but CUST_DEL = 0) from soft-deleting via the edit path.
--
-- NOTE for M1: updateCustomer() must never touch the record_status column.
--   softDeleteCustomer() and recoverCustomer() are separate service
--   functions that map to Policies 4 and 5 respectively.
-- =============================================================================

CREATE POLICY customer_update_edit
    ON  public.customer
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_right('CUST_EDIT') = 1
    )
    WITH CHECK (
        public.get_my_right('CUST_EDIT') = 1
        -- Prevent this policy from being the vehicle for a soft-delete.
        -- record_status must not become INACTIVE through the edit path.
        AND record_status <> 'INACTIVE'
    );


-- =============================================================================
-- SECTION 6 — POLICY 4: UPDATE — Soft Delete (INACTIVE)
--
-- Requires CUST_DEL = 1.
-- Per the rights matrix:
--   SUPERADMIN → CUST_DEL = 1  ✓  (only user type with this right)
--   ADMIN      → CUST_DEL = 0  ✗
--   USER       → CUST_DEL = 0  ✗
--
-- This is the ONLY policy that authorises setting record_status = 'INACTIVE'.
-- It does NOT hard-delete the row. The DELETE keyword does not appear
-- anywhere in this file.
--
-- WITH CHECK enforces that the new record_status is 'INACTIVE', so this
-- policy cannot be repurposed for recovery or any other transition.
--
-- NOTE for M1: softDeleteCustomer(custno, userid) must call:
--   .update({ record_status: 'INACTIVE', stamp: makeStamp(...) })
--   .eq('custno', custno)
--   RLS will reject any attempt by ADMIN or USER to call this path
--   because CUST_DEL = 0 for both.
-- =============================================================================

CREATE POLICY customer_update_softdelete
    ON  public.customer
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_right('CUST_DEL') = 1
    )
    WITH CHECK (
        public.get_my_right('CUST_DEL') = 1
        -- Confirm this policy is used exclusively for soft-deletion.
        AND record_status = 'INACTIVE'
    );


-- =============================================================================
-- SECTION 7 — POLICY 5: UPDATE — Recovery (ACTIVE)
--
-- Restores a soft-deleted customer to record_status = 'ACTIVE'.
-- Requires user_type IN ('ADMIN', 'SUPERADMIN').
-- USER accounts cannot recover customers.
--
-- WITH CHECK enforces that this policy can only set record_status = 'ACTIVE'.
-- It cannot be used to soft-delete. Combined with the guards on Policies 3
-- and 4, all three UPDATE policies have non-overlapping record_status
-- transition rules:
--
--   Policy 3 (edit)        → record_status must NOT be 'INACTIVE'
--   Policy 4 (softdelete)  → record_status MUST be  'INACTIVE'
--   Policy 5 (recover)     → record_status MUST be  'ACTIVE'
--
-- NOTE for M1: recoverCustomer(custno, userid) must call:
--   .update({ record_status: 'ACTIVE', stamp: makeStamp(...) })
--   .eq('custno', custno)
-- =============================================================================

CREATE POLICY customer_update_recover
    ON  public.customer
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
    )
    WITH CHECK (
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
        -- This policy is for recovery only. The new status must be ACTIVE.
        AND record_status = 'ACTIVE'
    );


-- =============================================================================
-- SECTION 8 — NO DELETE POLICY
-- Hard deletes are strictly forbidden per project rules.
-- No DELETE policy is created here.
-- The absence of a DELETE policy means PostgreSQL blocks all DELETE
-- statements on this table by default for all authenticated users.
-- =============================================================================
-- [INTENTIONALLY BLANK — DO NOT ADD A DELETE POLICY]


-- =============================================================================
-- SECTION 9 — POLICY SUMMARY VERIFICATION QUERY
-- Run this after applying the migration to confirm exactly five policies
-- exist and no DELETE policy is present.
-- =============================================================================

SELECT
    policyname,
    cmd,
    qual       AS using_clause,
    with_check AS with_check_clause
FROM
    pg_policies
WHERE
    tablename = 'customer'
ORDER BY
    cmd, policyname;

-- Expected output (5 rows):
-- policyname                 | cmd
-- ---------------------------+--------
-- customer_insert            | INSERT
-- customer_select            | SELECT
-- customer_update_edit       | UPDATE
-- customer_update_recover    | UPDATE
-- customer_update_softdelete | UPDATE


-- =============================================================================
-- SECTION 10 — ROLE IMPERSONATION TEST SCRIPTS
--
-- Run these in the Supabase SQL Editor to validate each policy without
-- leaving the dashboard. Replace UUID placeholders with real user IDs
-- from public."user".
--
-- HOW IT WORKS:
-- set_config('request.jwt.claims', ..., true) injects a fake JWT payload
-- for the duration of the transaction. auth.uid() reads from this payload,
-- so all policy USING/WITH CHECK expressions evaluate as if that user is
-- logged in. The third argument (true) makes the setting local to the
-- transaction — it resets automatically after ROLLBACK.
-- =============================================================================


-- -------- TEST 1: USER sees only ACTIVE customers --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<USER_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: zero rows returned
    SELECT custno, custname, record_status
    FROM   public.customer
    WHERE  record_status = 'INACTIVE';
ROLLBACK;


-- -------- TEST 2: ADMIN sees ALL customers --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: INACTIVE rows ARE returned
    SELECT custno, custname, record_status
    FROM   public.customer
    ORDER  BY record_status;
ROLLBACK;


-- -------- TEST 3: USER cannot INSERT --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<USER_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy
    INSERT INTO public.customer (custno, custname, address, payterm)
    VALUES ('C9999', 'Test Corp', '1 Test St', 'COD');
ROLLBACK;


-- -------- TEST 4: SUPERADMIN can soft-delete --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<SUPERADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE 1
    UPDATE public.customer
    SET    record_status = 'INACTIVE',
           stamp         = 'DEACTIVATED|SUPERADMIN|2025-01-01 10:00:00'
    WHERE  custno = 'C0001';

    SELECT custno, record_status, stamp FROM public.customer WHERE custno = 'C0001';
ROLLBACK;


-- -------- TEST 5: ADMIN cannot soft-delete --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy
    UPDATE public.customer
    SET    record_status = 'INACTIVE'
    WHERE  custno = 'C0001';
ROLLBACK;


-- -------- TEST 6: ADMIN can recover a soft-deleted customer --------
-- Pre-condition: run TEST 4 without ROLLBACK first, then run this.
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE 1
    UPDATE public.customer
    SET    record_status = 'ACTIVE',
           stamp         = 'REACTIVATED|ADMIN|2025-01-01 11:00:00'
    WHERE  custno = 'C0001';

    SELECT custno, record_status, stamp FROM public.customer WHERE custno = 'C0001';
ROLLBACK;


-- -------- TEST 7: USER cannot UPDATE any customer --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<USER_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy
    UPDATE public.customer
    SET    custname = 'Hacked Name'
    WHERE  custno   = 'C0001';
ROLLBACK;


-- -------- TEST 8: No DELETE is possible for any user type --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<SUPERADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no policies permit DELETE on this table
    DELETE FROM public.customer WHERE custno = 'C0001';
ROLLBACK;


-- =============================================================================
-- END OF MIGRATION: 06_rls_customer.sql
-- Next migration: 07_rls_view_only_tables.sql  (PR-02 db/rls-view-only-tables)
-- =============================================================================