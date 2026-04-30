-- =============================================================================
-- HopeCMS — PR-02: db/rls-admin-module
-- File:    /db/migrations/11_rls_admin_module.sql
-- Branch:  db/rls-admin-module
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 01_initial_schema.sql          (user, UserModule_Rights tables)
--             02_rights_seed.sql             (SUPERADMIN row seeded)
--             05_trigger_provision_user.sql  (provision_new_user confirmed)
--             06_rls_customer.sql            (get_my_user_type + get_my_right
--                                            helper functions already deployed)
-- Description: Enables RLS and defines all access policies on public."user"
--              and public."UserModule_Rights". The SUPERADMIN guard is the
--              critical constraint: ADMIN can manage standard user accounts
--              (activate / deactivate via record_status) but cannot read,
--              write, or in any way modify a SUPERADMIN row on either table.
--
-- Policy inventory (6 new policies):
--   public."user"             → user_select, user_update_admin,
--                               user_update_superadmin
--   public."UserModule_Rights" → umr_select, umr_insert_guard,
--                               umr_update_guard
--
-- No INSERT policy on public."user"  — users are provisioned exclusively
--   by the provision_new_user() trigger (file 05). ADMIN never inserts
--   user rows directly.
-- No DELETE policy on either table   — hard deletes are strictly forbidden
--   by project rules. User deactivation is a soft operation via
--   record_status = 'INACTIVE' on public."user".
-- =============================================================================


-- =============================================================================
-- SECTION 1 — DESIGN RATIONALE: TWO-TABLE SUPERADMIN GUARD
--
-- The SUPERADMIN account (jcesperanza@neu.edu.ph) must be unmodifiable by
-- any other user type. Two tables require protection:
--
--   public."user"              — contains user_type and record_status.
--                                ADMIN activation flow writes only to
--                                record_status. A compromised ADMIN account
--                                must not be able to flip user_type to
--                                SUPERADMIN or deactivate the SUPERADMIN row.
--
--   public."UserModule_Rights" — contains the 9 right_value flags per user.
--                                ADMIN must not be able to strip or alter
--                                SUPERADMIN's rights even via direct Supabase
--                                SDK calls that bypass M1's service functions.
--
-- Guard strategy:
--   • All public."user" UPDATE policies use USING to exclude rows where
--     user_type = 'SUPERADMIN'. ADMIN cannot target those rows at all.
--   • The WITH CHECK on user_update_admin additionally blocks any attempt
--     to set user_type = 'SUPERADMIN' on the resulting row, closing the
--     elevation-by-edit vector.
--   • All public."UserModule_Rights" write policies use a NOT EXISTS
--     subquery to resolve the target userid to its user_type in
--     public."user". If the resolved user_type = 'SUPERADMIN', the
--     operation is blocked by RLS before it reaches the table.
--
-- Column-level restriction (record_status only):
--   PostgreSQL RLS cannot restrict which columns an UPDATE touches — that
--   is enforced at the GRANT level or in the application layer. M1's
--   activateUser() and deactivateUser() service functions must update
--   only record_status and never user_type. The USING + WITH CHECK
--   combination below prevents the worst outcome (SUPERADMIN elevation)
--   at the database level, with application logic as the complementary
--   guard for column-level intent.
--
-- FORCE ROW LEVEL SECURITY is intentionally NOT applied to these tables:
--   The provision_new_user() trigger (file 05) is SECURITY DEFINER and
--   must INSERT into both tables without RLS interference. FORCE RLS would
--   subject the trigger's definer role to policies, breaking provisioning
--   for new users. ENABLE ROW LEVEL SECURITY (without FORCE) correctly
--   applies policies to authenticated application users while leaving
--   SECURITY DEFINER trigger operations unaffected.
-- =============================================================================


-- =============================================================================
-- SECTION 2 — ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public."user"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserModule_Rights" ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 3 — HELPER FUNCTION REFERENCE
-- get_my_user_type() and get_my_right() were deployed in
-- 06_rls_customer.sql. They are SECURITY DEFINER functions that read
-- public."user" and public."UserModule_Rights" as the function owner,
-- bypassing any RLS on those tables during policy evaluation.
-- Both functions are reused unchanged in this file — do not redefine them.
--
-- Signatures (for reference):
--   public.get_my_user_type()             RETURNS TEXT
--   public.get_my_right(p_right_code TEXT) RETURNS INTEGER
-- =============================================================================


-- =============================================================================
-- SECTION 4 — TABLE: public."user" — POLICY 1: SELECT
--
-- Every authenticated user may read their own row (needed by AuthContext
-- and UserRightsContext on every sign-in to load user_type, record_status,
-- and username). ADMIN and SUPERADMIN may read all rows to populate the
-- UserManagementPage (M2).
--
-- USING conditions:
--   userid = auth.uid()::text          — own row always visible
--   OR get_my_user_type() IN (...)     — ADMIN/SUPERADMIN see everyone
--
-- NOTE for M4: UserRightsContext.jsx queries public."user" on every login.
--   This policy ensures the query returns the current user's own row even
--   before their user_type is confirmed. Do not filter by user_type before
--   the row is fetched — the policy handles visibility correctly.
-- NOTE for M1: getUsers() in the Admin Module service layer should call
--   supabase.from('user').select('*').
--   ADMIN and SUPERADMIN will receive all rows. USER will receive only
--   their own row (the UserManagementPage route is blocked for USER anyway
--   via the /admin route guard).
-- =============================================================================

CREATE POLICY user_select
    ON  public."user"
    FOR SELECT
    TO  authenticated
    USING (
        userid = auth.uid()::text
        OR
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
    );


-- =============================================================================
-- SECTION 5 — TABLE: public."user" — POLICY 2: UPDATE (ADMIN branch)
--
-- ADMIN may update only non-SUPERADMIN rows. This single policy covers
-- both activation (record_status → 'ACTIVE') and deactivation
-- (record_status → 'INACTIVE') of standard user accounts.
--
-- USING clause — which rows ADMIN can target:
--   get_my_user_type() = 'ADMIN'        — caller must be ADMIN
--   AND user_type != 'SUPERADMIN'       — target row must not be SUPERADMIN
--
-- WITH CHECK clause — what the row must look like after the update:
--   get_my_user_type() = 'ADMIN'        — caller still ADMIN (sanity check)
--   AND user_type != 'SUPERADMIN'       — post-update user_type is not SUPERADMIN
--                                         (blocks elevation: ADMIN cannot set
--                                          user_type = 'SUPERADMIN' on any row)
--
-- What this policy cannot do:
--   It cannot restrict which specific columns ADMIN touches. That is an
--   application-layer responsibility (M1's activateUser/deactivateUser must
--   only update record_status). The WITH CHECK blocks the only truly
--   dangerous column mutation — user_type promotion to SUPERADMIN.
--
-- NOTE for M1: activateUser(userId) and deactivateUser(userId) must only call:
--   .update({ record_status: 'ACTIVE' | 'INACTIVE' })
--   .eq('userid', userId)
--   Never include user_type in the update payload.
-- =============================================================================

CREATE POLICY user_update_admin
    ON  public."user"
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_user_type() = 'ADMIN'
        AND user_type != 'SUPERADMIN'
    )
    WITH CHECK (
        public.get_my_user_type() = 'ADMIN'
        AND user_type != 'SUPERADMIN'
    );


-- =============================================================================
-- SECTION 6 — TABLE: public."user" — POLICY 3: UPDATE (SUPERADMIN branch)
--
-- SUPERADMIN may update any row including other ADMIN and USER rows.
-- This policy has no row filter in USING (all rows are targetable) and
-- no value constraint in WITH CHECK beyond confirming the caller is still
-- SUPERADMIN after the update.
--
-- Intentional omission: there is no guard preventing SUPERADMIN from
-- modifying their own row. Locking SUPERADMIN out of their own row would
-- make password recovery and profile updates impossible. The single seeded
-- SUPERADMIN account is the project owner; self-modification risk is
-- accepted by design.
--
-- NOTE for M4: the UserManagementPage must disable all action buttons on
--   SUPERADMIN rows at the UI level with tooltip 'SUPERADMIN accounts cannot
--   be modified'. This is the UX guard. The DB guard below ensures that
--   even a direct SDK call from an ADMIN account is rejected.
-- =============================================================================

CREATE POLICY user_update_superadmin
    ON  public."user"
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_user_type() = 'SUPERADMIN'
    )
    WITH CHECK (
        public.get_my_user_type() = 'SUPERADMIN'
    );


-- =============================================================================
-- SECTION 7 — TABLE: public."user" — NO INSERT / NO DELETE POLICIES
--
-- INSERT: No INSERT policy is created. User rows are created exclusively
--   by the provision_new_user() SECURITY DEFINER trigger (file 05) on
--   every INSERT into auth.users. No application user — including SUPERADMIN —
--   creates user rows directly through the application. The absence of an
--   INSERT policy means authenticated users cannot INSERT into this table.
--
-- DELETE: No DELETE policy is created. Hard deletes are strictly forbidden
--   by project rules. The word DELETE does not appear as a DML command
--   anywhere in this file. User deactivation is always a soft operation:
--   UPDATE record_status = 'INACTIVE' via user_update_admin (Policy 2).
-- =============================================================================
-- [INTENTIONALLY BLANK — DO NOT ADD INSERT OR DELETE POLICIES ON public."user"]


-- =============================================================================
-- SECTION 8 — TABLE: public."UserModule_Rights" — POLICY 4: SELECT
--
-- Every authenticated user must be able to read their own rights rows.
-- UserRightsContext (M4) queries all 9 UserModule_Rights rows for the
-- current user on every login to build the rights map. ADMIN and SUPERADMIN
-- additionally need to read all users' rights for the Admin Module.
--
-- USING conditions:
--   userid = auth.uid()::text          — own rights always readable
--   OR get_my_user_type() IN (...)     — ADMIN/SUPERADMIN see everyone's rights
-- =============================================================================

CREATE POLICY umr_select
    ON  public."UserModule_Rights"
    FOR SELECT
    TO  authenticated
    USING (
        userid = auth.uid()::text
        OR
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
    );


-- =============================================================================
-- SECTION 9 — TABLE: public."UserModule_Rights" — POLICY 5: INSERT (guard)
--
-- Guards against inserting rights rows for a SUPERADMIN user. The NOT EXISTS
-- subquery resolves the target userid to its user_type in public."user".
-- If the resolved user_type is 'SUPERADMIN', the INSERT is blocked.
--
-- Caller scope: ADMIN and SUPERADMIN may INSERT for non-SUPERADMIN targets.
--   In normal operation, rights rows are created by the provision_new_user()
--   trigger (SECURITY DEFINER — not subject to this policy). This policy
--   guards against any future direct INSERT attempts via the SDK.
--
-- WITH CHECK column reference note:
--   Inside a WITH CHECK clause for INSERT, bare column references (userid)
--   refer to the values of the NEW row being inserted. The NOT EXISTS
--   subquery uses this value to look up the target user's type.
-- =============================================================================

CREATE POLICY umr_insert_guard
    ON  public."UserModule_Rights"
    FOR INSERT
    TO  authenticated
    WITH CHECK (
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
        AND NOT EXISTS (
            SELECT 1
            FROM   public."user" target_user
            WHERE  target_user.userid    = userid   -- userid = NEW row's column
              AND  target_user.user_type = 'SUPERADMIN'
        )
    );


-- =============================================================================
-- SECTION 10 — TABLE: public."UserModule_Rights" — POLICY 6: UPDATE (guard)
--
-- Guards against updating rights rows that belong to a SUPERADMIN user.
-- The NOT EXISTS subquery runs in both USING and WITH CHECK to close
-- two distinct attack vectors:
--
--   USING  — prevents targeting a SUPERADMIN's existing rights row.
--            ADMIN cannot SELECT-for-UPDATE a row owned by SUPERADMIN.
--
--   WITH CHECK — prevents the update from producing a row whose userid
--            resolves to a SUPERADMIN. This closes the reassignment vector:
--            an actor cannot move a rights row from a non-SUPERADMIN userid
--            to a SUPERADMIN userid by updating the userid column.
--
-- Caller scope: ADMIN and SUPERADMIN may UPDATE rights for non-SUPERADMIN
--   users. In practice this enables SUPERADMIN to adjust individual right
--   values for USER or ADMIN accounts if business requirements change.
--   ADMIN is permitted to update rights for USER accounts (e.g., granting
--   a temporary additional right) but is fully blocked from touching
--   SUPERADMIN rights rows at the database level.
--
-- NOTE for M1: if a rights adjustment API function is ever added, it must
--   call supabase.from('UserModule_Rights')
--     .update({ right_value: 0|1 })
--     .eq('userid', targetUserId)
--     .eq('rightcode', rightCode)
--   RLS will reject any attempt to target a SUPERADMIN's rows.
-- =============================================================================

CREATE POLICY umr_update_guard
    ON  public."UserModule_Rights"
    FOR UPDATE
    TO  authenticated
    USING (
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
        AND NOT EXISTS (
            SELECT 1
            FROM   public."user" target_user
            WHERE  target_user.userid    = userid   -- userid = existing row's column
              AND  target_user.user_type = 'SUPERADMIN'
        )
    )
    WITH CHECK (
        public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
        AND NOT EXISTS (
            SELECT 1
            FROM   public."user" target_user
            WHERE  target_user.userid    = userid   -- userid = NEW row's column
              AND  target_user.user_type = 'SUPERADMIN'
        )
    );


-- =============================================================================
-- SECTION 11 — TABLE: public."UserModule_Rights" — NO DELETE POLICY
--
-- No DELETE policy is created. Hard deletes are strictly forbidden by
-- project rules. Rights rows are never removed — they are toggled between
-- right_value = 0 and right_value = 1 via UPDATE (Policy 6). The absence
-- of a DELETE policy means no authenticated user — including SUPERADMIN —
-- can DELETE from this table through the application layer.
-- =============================================================================
-- [INTENTIONALLY BLANK — DO NOT ADD A DELETE POLICY ON public."UserModule_Rights"]


-- =============================================================================
-- SECTION 12 — POLICY SUMMARY VERIFICATION
-- Run after applying this migration to confirm exactly 6 new policies
-- exist across the two tables and no DELETE policy is present on either.
-- =============================================================================

SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM
    pg_policies
WHERE
    tablename IN ('user', 'UserModule_Rights')
ORDER BY
    tablename, cmd, policyname;

-- Expected output (6 rows):
-- tablename          | policyname              | cmd    | roles
-- -------------------+-------------------------+--------+------------------
-- UserModule_Rights  | umr_insert_guard        | INSERT | {authenticated}
-- UserModule_Rights  | umr_select              | SELECT | {authenticated}
-- UserModule_Rights  | umr_update_guard        | UPDATE | {authenticated}
-- user               | user_select             | SELECT | {authenticated}
-- user               | user_update_admin       | UPDATE | {authenticated}
-- user               | user_update_superadmin  | UPDATE | {authenticated}
--
-- Critical checks:
--   • cmd = DELETE must NOT appear for either table.
--   • cmd = INSERT must NOT appear for public."user".
--   • Exactly 3 policies per table.


-- Confirm RLS is enabled on both tables
SELECT
    relname             AS tablename,
    relrowsecurity      AS rls_enabled,
    relforcerowsecurity AS rls_forced
FROM
    pg_class
WHERE
    relnamespace = 'public'::regnamespace
    AND relname IN ('user', 'UserModule_Rights')
ORDER BY
    relname;

-- Expected:
-- tablename          | rls_enabled | rls_forced
-- -------------------+-------------+------------
-- UserModule_Rights  | true        | false
-- user               | true        | false
--
-- rls_forced = false is intentional — see Section 1 for rationale.


-- =============================================================================
-- SECTION 13 — ROLE IMPERSONATION TEST SCRIPTS
--
-- Replace all UUID placeholders with real values from public."user":
--   <USER_UUID>       — any user with user_type = 'USER'
--   <ADMIN_UUID>      — any user with user_type = 'ADMIN'
--   <SUPERADMIN_UUID> — jcesperanza@neu.edu.ph's userid
--   <TARGET_USER_UUID>    — the userid of any USER-type account to activate
--   <SUPERADMIN_RIGHTS_USERID> — the userid column value of a SUPERADMIN
--                                 row in UserModule_Rights
--
-- Every ROLLBACK at the end of each block ensures the database is not
-- mutated by these tests. Run each block independently.
-- =============================================================================


-- -------- TEST 1: ADMIN SELECT — must see all users --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: all rows returned (ADMIN passes user_select policy)
    SELECT userid, username, user_type, record_status
    FROM   public."user"
    ORDER BY user_type;
ROLLBACK;


-- -------- TEST 2: ADMIN activates a USER account — must SUCCEED --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE 1
    -- USING passes  (target user_type = 'USER', not 'SUPERADMIN')
    -- WITH CHECK passes (new user_type = 'USER', not 'SUPERADMIN')
    UPDATE public."user"
    SET    record_status = 'ACTIVE'
    WHERE  userid = '<TARGET_USER_UUID>';

    SELECT userid, user_type, record_status
    FROM   public."user"
    WHERE  userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- -------- TEST 3: ADMIN deactivates a USER account — must SUCCEED --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE 1
    UPDATE public."user"
    SET    record_status = 'INACTIVE'
    WHERE  userid = '<TARGET_USER_UUID>';

    SELECT userid, user_type, record_status
    FROM   public."user"
    WHERE  userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- -------- TEST 4 (CRITICAL): ADMIN updates SUPERADMIN record_status — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy for "user"
    -- USING clause rejects: target row's user_type = 'SUPERADMIN'
    UPDATE public."user"
    SET    record_status = 'INACTIVE'
    WHERE  user_type = 'SUPERADMIN';
ROLLBACK;


-- -------- TEST 5 (CRITICAL): ADMIN elevates any user to SUPERADMIN — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy for "user"
    -- WITH CHECK clause rejects: post-update user_type would be 'SUPERADMIN'
    UPDATE public."user"
    SET    user_type = 'SUPERADMIN'
    WHERE  userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- -------- TEST 6: ADMIN INSERT into public."user" — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no INSERT policy exists on public."user"
    -- Users are provisioned only by the provision_new_user() trigger.
    INSERT INTO public."user" (userid, username, user_type, record_status)
    VALUES ('ghost-uuid', 'ghost_user', 'ADMIN', 'ACTIVE');
ROLLBACK;


-- -------- TEST 7: No DELETE on public."user" for any user type — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<SUPERADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no DELETE policy exists on public."user"
    DELETE FROM public."user" WHERE userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- -------- TEST 8: ADMIN SELECT UserModule_Rights — must see all rows --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: all UserModule_Rights rows returned
    SELECT userid, rightcode, right_value
    FROM   public."UserModule_Rights"
    ORDER BY userid, rightcode;
ROLLBACK;


-- -------- TEST 9 (CRITICAL): ADMIN UPDATE rights of SUPERADMIN — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy for "UserModule_Rights"
    -- USING clause rejects: NOT EXISTS subquery finds user_type = 'SUPERADMIN'
    -- for the target userid. Zero rows are returned to ADMIN for this target,
    -- so the UPDATE silently affects 0 rows rather than raising an error in
    -- some PostgreSQL versions. Verify with the SELECT below.
    SET LOCAL ROLE authenticated;

    UPDATE public."UserModule_Rights"
    SET    right_value = 0
    WHERE  userid    = '<SUPERADMIN_RIGHTS_USERID>'
      AND  rightcode = 'CUST_DEL';

    -- Confirm the right was NOT changed (should still be 1 for SUPERADMIN)
    SELECT userid, rightcode, right_value
    FROM   public."UserModule_Rights"
    WHERE  userid    = '<SUPERADMIN_RIGHTS_USERID>'
      AND  rightcode = 'CUST_DEL';
    -- Expected: right_value = 1 (unchanged)
ROLLBACK;


-- -------- TEST 10 (CRITICAL): ADMIN INSERT rights for SUPERADMIN — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — new row violates row-level security policy for "UserModule_Rights"
    -- WITH CHECK subquery finds user_type = 'SUPERADMIN' for the inserted userid.
    INSERT INTO public."UserModule_Rights" (userid, rightcode, right_value)
    VALUES ('<SUPERADMIN_RIGHTS_USERID>', 'CUST_DEL', 0);
ROLLBACK;


-- -------- TEST 11: ADMIN UPDATE rights of a regular USER — must SUCCEED --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<ADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE N (where N = number of matching rows)
    -- NOT EXISTS subquery finds user_type = 'USER' — not SUPERADMIN. PASS.
    UPDATE public."UserModule_Rights"
    SET    right_value = 0
    WHERE  userid    = '<TARGET_USER_UUID>'
      AND  rightcode = 'CUST_VIEW';

    SELECT userid, rightcode, right_value
    FROM   public."UserModule_Rights"
    WHERE  userid    = '<TARGET_USER_UUID>'
      AND  rightcode = 'CUST_VIEW';
    -- Expected: right_value = 0
ROLLBACK;


-- -------- TEST 12: No DELETE on UserModule_Rights for any user type — must FAIL --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<SUPERADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: ERROR — no DELETE policy exists on public."UserModule_Rights"
    DELETE FROM public."UserModule_Rights"
    WHERE userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- -------- TEST 13: SUPERADMIN UPDATE any user row — must SUCCEED --------
BEGIN;
    SELECT set_config(
        'request.jwt.claims',
        '{"sub": "<SUPERADMIN_UUID>", "role": "authenticated"}',
        true
    );
    -- Expected: UPDATE 1
    -- user_update_superadmin policy has no row filter — all rows are targetable.
    UPDATE public."user"
    SET    record_status = 'ACTIVE'
    WHERE  userid = '<TARGET_USER_UUID>';

    SELECT userid, user_type, record_status
    FROM   public."user"
    WHERE  userid = '<TARGET_USER_UUID>';
ROLLBACK;


-- =============================================================================
-- END OF MIGRATION: 11_rls_admin_module.sql
-- Sprint 3 DB migrations continue with:
--   12_final_rls_audit.sql  (PR-03 docs/final-rls-audit)
-- =============================================================================