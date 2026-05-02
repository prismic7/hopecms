-- =============================================================================
-- HopeCMS — db/superadmin-self-recovery
-- File:    /db/migrations/13_superadmin_self_recovery.sql
-- Branch:  feat/db-superadmin-self-recovery
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 02_rights_seed.sql             (user table + SUPERADMIN seed)
--             05_trigger_provision_user.sql   (provision_new_user trigger)
--             11_rls_admin_module.sql         (user table RLS policies)
--             12_sync_admin_rights.sql        (sync_admin_rights trigger)
-- Description: Adds is_superadmin column to public."user". This flag is
--              permanent and immutable through the application — it marks
--              accounts that were ever granted SUPERADMIN status, enabling
--              self-recovery after voluntary demotion. Also updates:
--                - provision_new_user() trigger (always sets FALSE)
--                - sync_admin_rights() trigger (never touches is_superadmin)
--                - RLS policy blocking any UPDATE to is_superadmin column
--                - SUPERADMIN seed row (set to TRUE)
-- =============================================================================


-- =============================================================================
-- SECTION 1 — ADD is_superadmin COLUMN
-- DEFAULT FALSE ensures all existing rows (including already-seeded users)
-- get FALSE unless explicitly updated. We update the SUPERADMIN row in
-- Section 2. The NOT NULL constraint ensures no ambiguous NULLs.
-- =============================================================================

ALTER TABLE public."user"
    ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public."user".is_superadmin IS
    'Permanent flag. TRUE only for accounts that have ever held SUPERADMIN status. '
    'Never changed by role transitions or provision_new_user(). Used exclusively '
    'to show the Restore SUPERADMIN button in AppShell when the account has been '
    'voluntarily demoted. Cannot be updated through the application by any user.';


-- =============================================================================
-- SECTION 2 — SEED EXISTING SUPERADMIN ROW
-- Set is_superadmin = TRUE for jcesperanza@neu.edu.ph.
-- Any future SUPERADMIN accounts must also have this set manually after
-- creation. The application role-change UI should handle this automatically
-- when SUPERADMIN promotes another user TO SUPERADMIN (see Section 4).
-- =============================================================================

UPDATE public."user"
SET    is_superadmin = TRUE
WHERE  user_type = 'SUPERADMIN';

-- Verify
SELECT userid, username, user_type, is_superadmin
FROM   public."user"
WHERE  user_type = 'SUPERADMIN';
-- Expected: is_superadmin = TRUE for jcesperanza@neu.edu.ph


-- =============================================================================
-- SECTION 3 — UPDATE provision_new_user() TRIGGER
-- New accounts always get is_superadmin = FALSE. No new user registered
-- through the app should ever start as a SUPERADMIN.
-- =============================================================================

DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.provision_new_user();

CREATE OR REPLACE FUNCTION public.provision_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username TEXT;
BEGIN
    v_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'),  ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Create user row: USER / INACTIVE / is_superadmin = FALSE (always)
    INSERT INTO public."user" (
        userId, username, email, user_type, record_status, is_superadmin, stamp
    )
    VALUES (
        NEW.id::TEXT,
        v_username,
        NEW.email,
        'USER',
        'INACTIVE',
        FALSE,   -- never TRUE for auto-provisioned accounts
        'AUTO-PROVISIONED ' || NOW()::TEXT
    );

    -- Map to modules: Adm_Mod disabled for new users
    INSERT INTO public.user_module (userId, moduleCode, rights_value)
    VALUES
        (NEW.id::TEXT, 'Cust_Mod',  1),
        (NEW.id::TEXT, 'Sales_Mod', 1),
        (NEW.id::TEXT, 'Prod_Mod',  1),
        (NEW.id::TEXT, 'Adm_Mod',   0);

    -- Default rights: VIEW = 1, all CRUD and ADM = 0
    INSERT INTO public."UserModule_Rights" (userId, rightCode, right_value)
    VALUES
        (NEW.id::TEXT, 'CUST_VIEW',  1),
        (NEW.id::TEXT, 'CUST_ADD',   0),
        (NEW.id::TEXT, 'CUST_EDIT',  0),
        (NEW.id::TEXT, 'CUST_DEL',   0),
        (NEW.id::TEXT, 'SALES_VIEW', 1),
        (NEW.id::TEXT, 'SD_VIEW',    1),
        (NEW.id::TEXT, 'PROD_VIEW',  1),
        (NEW.id::TEXT, 'PRICE_VIEW', 1),
        (NEW.id::TEXT, 'ADM_USER',   0);

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '[provision_new_user] Failed for % (%) : % | SQLSTATE: %',
            NEW.email, NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.provision_new_user();

GRANT EXECUTE ON FUNCTION public.provision_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_new_user() TO service_role;


-- =============================================================================
-- SECTION 4 — UPDATE sync_admin_rights() TRIGGER
-- When any account is promoted TO SUPERADMIN, is_superadmin is set to TRUE.
-- This covers the case where SUPERADMIN promotes another user to SUPERADMIN
-- in the future. is_superadmin is NEVER set back to FALSE by any transition —
-- it is a permanent historical flag.
-- =============================================================================

DROP TRIGGER  IF EXISTS on_user_type_change ON public."user";
DROP FUNCTION IF EXISTS public.sync_admin_rights();

CREATE OR REPLACE FUNCTION public.sync_admin_rights()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- ── No-op guard ──────────────────────────────────────────────────────────
    IF NEW.user_type = OLD.user_type THEN
        RETURN NEW;
    END IF;

    -- ── SUPERADMIN promotion guard ───────────────────────────────────────────
    -- Only a SUPERADMIN caller may set user_type = 'SUPERADMIN' on any row.
    IF NEW.user_type = 'SUPERADMIN' THEN
        IF public.get_my_user_type() != 'SUPERADMIN' THEN
            RAISE EXCEPTION
                '[sync_admin_rights] Only a SUPERADMIN may promote a user to SUPERADMIN. '
                'Attempted by: %', public.get_my_user_type();
        END IF;
    END IF;

    -- ── Rights sync by target role ────────────────────────────────────────────

    -- → SUPERADMIN: all 9 rights = 1, all 4 modules = 1
    --               is_superadmin permanently set to TRUE
    IF NEW.user_type = 'SUPERADMIN' THEN
        UPDATE public."UserModule_Rights"
        SET    right_value = 1
        WHERE  userid = NEW.userid;

        UPDATE public.user_module
        SET    rights_value = 1
        WHERE  userid = NEW.userid;

        -- Mark this account permanently as a SUPERADMIN-origin account
        -- so the self-recovery button appears even after demotion.
        -- NOTE: this is the ONLY place is_superadmin is ever set to TRUE.
        UPDATE public."user"
        SET    is_superadmin = TRUE
        WHERE  userid = NEW.userid;

    -- → ADMIN: ADMIN rights profile, Adm_Mod enabled
    ELSIF NEW.user_type = 'ADMIN' THEN
        UPDATE public."UserModule_Rights"
        SET right_value = CASE rightcode
            WHEN 'CUST_VIEW'  THEN 1
            WHEN 'CUST_ADD'   THEN 1
            WHEN 'CUST_EDIT'  THEN 1
            WHEN 'CUST_DEL'   THEN 0
            WHEN 'SALES_VIEW' THEN 1
            WHEN 'SD_VIEW'    THEN 1
            WHEN 'PROD_VIEW'  THEN 1
            WHEN 'PRICE_VIEW' THEN 1
            WHEN 'ADM_USER'   THEN 1
        END
        WHERE userid = NEW.userid;

        UPDATE public.user_module
        SET    rights_value = 1  -- all modules enabled for ADMIN
        WHERE  userid = NEW.userid;

        -- is_superadmin is intentionally NOT touched here.
        -- If this account was previously SUPERADMIN, the flag stays TRUE.

    -- → USER: standard USER profile, Adm_Mod disabled
    ELSIF NEW.user_type = 'USER' THEN
        UPDATE public."UserModule_Rights"
        SET right_value = CASE rightcode
            WHEN 'CUST_VIEW'  THEN 1
            WHEN 'SALES_VIEW' THEN 1
            WHEN 'SD_VIEW'    THEN 1
            WHEN 'PROD_VIEW'  THEN 1
            WHEN 'PRICE_VIEW' THEN 1
            ELSE 0  -- CUST_ADD, CUST_EDIT, CUST_DEL, ADM_USER → 0
        END
        WHERE userid = NEW.userid;

        UPDATE public.user_module
        SET rights_value = CASE moduleCode
            WHEN 'Adm_Mod' THEN 0
            ELSE 1
        END
        WHERE userid = NEW.userid;

        -- is_superadmin is intentionally NOT touched here.
        -- If this account was previously SUPERADMIN, the flag stays TRUE.

    ELSE
        RAISE EXCEPTION
            '[sync_admin_rights] Unknown user_type value: %. '
            'Only USER, ADMIN, and SUPERADMIN are valid.', NEW.user_type;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_type_change
    AFTER UPDATE OF user_type ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_rights();

GRANT EXECUTE ON FUNCTION public.sync_admin_rights() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_admin_rights() TO service_role;


-- =============================================================================
-- SECTION 5 — RLS: BLOCK is_superadmin UPDATES THROUGH THE APP
-- is_superadmin is managed exclusively by sync_admin_rights() which runs
-- as SECURITY DEFINER (postgres role — bypasses RLS). No authenticated
-- user should ever be able to set this column directly through the app.
--
-- PostgreSQL RLS cannot restrict individual columns in an UPDATE — that
-- requires column-level privileges. We use REVOKE to remove UPDATE
-- permission on is_superadmin from all authenticated users. The trigger
-- (SECURITY DEFINER) is unaffected by this restriction.
-- =============================================================================

-- Revoke column-level UPDATE on is_superadmin from all app roles
REVOKE UPDATE (is_superadmin) ON public."user" FROM authenticated;
REVOKE UPDATE (is_superadmin) ON public."user" FROM anon;

COMMENT ON COLUMN public."user".is_superadmin IS
    'Permanent flag set only by sync_admin_rights() SECURITY DEFINER trigger. '
    'REVOKE UPDATE prevents any authenticated user from modifying this column '
    'directly. Never reset to FALSE by any role transition.';


-- =============================================================================
-- SECTION 6 — VERIFICATION QUERIES
-- =============================================================================

-- 6a. Confirm is_superadmin column exists with correct default
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'user'
  AND column_name  = 'is_superadmin';
-- Expected: data_type = boolean, column_default = false, is_nullable = NO


-- 6b. Confirm SUPERADMIN seed row has is_superadmin = TRUE
SELECT userid, username, user_type, is_superadmin
FROM   public."user"
WHERE  user_type = 'SUPERADMIN';
-- Expected: is_superadmin = TRUE


-- 6c. Confirm all non-SUPERADMIN rows have is_superadmin = FALSE
SELECT COUNT(*) AS bad_rows
FROM   public."user"
WHERE  user_type  != 'SUPERADMIN'
  AND  is_superadmin = TRUE;
-- Expected: 0


-- 6d. Confirm both triggers are attached
SELECT trigger_name, event_object_table
FROM   information_schema.triggers
WHERE  trigger_name IN ('on_auth_user_created', 'on_user_type_change')
ORDER BY trigger_name;
-- Expected: 2 rows


-- 6e. Test SUPERADMIN demotion → is_superadmin stays TRUE (ROLLBACK safe)
BEGIN;
    UPDATE public."user"
    SET    user_type = 'ADMIN'
    WHERE  user_type = 'SUPERADMIN';

    SELECT userid, user_type, is_superadmin
    FROM   public."user"
    WHERE  is_superadmin = TRUE;
    -- Expected: is_superadmin still TRUE even though user_type is now ADMIN
ROLLBACK;


-- 6f. Test authenticated user cannot update is_superadmin directly
-- Run this as an authenticated role in Supabase SQL Editor:
-- BEGIN;
--     SELECT set_config(
--         'request.jwt.claims',
--         '{"sub": "<ANY_UUID>", "role": "authenticated"}',
--         true
--     );
--     UPDATE public."user"
--     SET    is_superadmin = TRUE
--     WHERE  userid = '<TARGET_UUID>';
--     -- Expected: ERROR — permission denied for column is_superadmin
-- ROLLBACK;


-- =============================================================================
-- END OF MIGRATION: 13_superadmin_self_recovery.sql
-- Next steps:
--   Frontend: AppShell restore button + modal (M2)
--   Service:  restoreSuperadmin() function (M1)
--   Auth:     currentUser.is_superadmin available via AuthContext spread (M4)
-- =============================================================================