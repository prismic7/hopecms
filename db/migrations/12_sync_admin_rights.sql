-- =============================================================================
-- HopeCMS — db/trigger-sync-admin-rights
-- File:    /db/migrations/12_sync_admin_rights.sql
-- Branch:  fix/db-sync-admin-rights
-- Engineer: M3 (Backend / DB Engineer)
-- Depends on: 02_rights_seed.sql             (UserModule_Rights table)
--             11_rls_admin_module.sql         (umr_update_guard policy)
-- Description: Adds a trigger that automatically syncs UserModule_Rights
--              and user_module whenever a user's user_type is changed.
--              Covers all valid role transitions (USER ↔ ADMIN).
--              Transitions TO or FROM SUPERADMIN are explicitly blocked
--              at the trigger level as a second line of defence after RLS.
-- Bug reported: Sprint 3 E2E test — ADMIN accounts had ADM_USER = 0 after
--              promotion, hiding the Admin sidebar link.
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
    -- ── Safety guard ────────────────────────────────────────────────────────
    -- Block any transition that involves SUPERADMIN as source or target.
    -- This is a second line of defence after RLS (11_rls_admin_module.sql).
    -- The application UI and RLS should prevent this from ever firing,
    -- but if it does the trigger raises an exception and rolls back.
    IF NEW.user_type = 'SUPERADMIN' OR OLD.user_type = 'SUPERADMIN' THEN
        RAISE EXCEPTION
            '[sync_admin_rights] Transitions to or from SUPERADMIN are not permitted. '
            'Attempted: % → %', OLD.user_type, NEW.user_type;
    END IF;

    -- ── No-op guard ─────────────────────────────────────────────────────────
    -- If user_type did not actually change, do nothing.
    IF NEW.user_type = OLD.user_type THEN
        RETURN NEW;
    END IF;

    -- ── USER → ADMIN ─────────────────────────────────────────────────────────
    -- Apply full ADMIN rights profile.
    IF NEW.user_type = 'ADMIN' AND OLD.user_type = 'USER' THEN
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
        SET rights_value = 1
        WHERE userid = NEW.userid
          AND moduleCode = 'Adm_Mod';
    END IF;

    -- ── ADMIN → USER ─────────────────────────────────────────────────────────
    -- Reset to standard USER rights profile.
    IF NEW.user_type = 'USER' AND OLD.user_type = 'ADMIN' THEN
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
        SET rights_value = 0
        WHERE userid = NEW.userid
          AND moduleCode = 'Adm_Mod';
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
-- VERIFICATION
-- =============================================================================

-- Confirm trigger is attached
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_user_type_change';
-- Expected: 1 row — event_object_table = user

-- Test USER → ADMIN promotion (replace with a real USER userid):
-- UPDATE public."user" SET user_type = 'ADMIN' WHERE userid = '<user_userid>';
-- SELECT rightcode, right_value FROM public."UserModule_Rights"
-- WHERE userid = '<user_userid>' ORDER BY rightcode;
-- Expected: CUST_ADD=1, CUST_EDIT=1, ADM_USER=1, CUST_DEL=0

-- Test ADMIN → USER demotion (same userid):
-- UPDATE public."user" SET user_type = 'USER' WHERE userid = '<user_userid>';
-- SELECT rightcode, right_value FROM public."UserModule_Rights"
-- WHERE userid = '<user_userid>' ORDER BY rightcode;
-- Expected: CUST_ADD=0, CUST_EDIT=0, ADM_USER=0, all VIEW=1

-- Test SUPERADMIN guard — must raise an exception:
-- UPDATE public."user" SET user_type = 'ADMIN' WHERE user_type = 'SUPERADMIN';
-- Expected: ERROR — [sync_admin_rights] Transitions to or from SUPERADMIN are not permitted.