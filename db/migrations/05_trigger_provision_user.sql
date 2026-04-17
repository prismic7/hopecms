-- =============================================================================
-- HopeCMS — [S1-M4-04] db/trigger-provision-user
-- File:    /db/migrations/05_trigger_provision_user.sql
-- Branch:  db/trigger-provision-user
-- Role:    M4 – Rights & Authentication Specialist
-- Depends: PR-01 db/initial-schema  (public.user, user_module, UserModule_Rights)
--          PR-02 db/rights-seed     (Module + rights rows must exist)
-- =============================================================================
--
-- WHAT THIS DOES
-- ──────────────
-- Fires automatically on every INSERT into auth.users — triggered by BOTH
-- email/password signUp AND Google OAuth first sign-in.
-- Creates three sets of rows so AuthContext's login guard can find the user:
--
--   1. public.user row           → user_type='USER', record_status='INACTIVE'
--   2. public.user_module rows   → 4 rows (Adm_Mod disabled)
--   3. public.UserModule_Rights  → 9 rows (VIEW=1, all CRUD/admin=0)
--
-- RESULT FOR THE USER
-- ───────────────────
-- New account lands on /login?error=Your account is pending activation.
-- Admin activates it → user can log in → /customers.
-- =============================================================================


-- =============================================================================
-- STEP 1 — Safe re-run guards
-- Drop existing trigger and function first so this script can be re-run
-- without getting "trigger already exists" or "function already exists" errors.
-- =============================================================================
DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.provision_new_user();


-- =============================================================================
-- STEP 2 — Create the trigger function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.provision_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the function owner (postgres), not the caller
SET search_path = public  -- prevents search_path injection attacks
AS $$
DECLARE
  v_username TEXT;
BEGIN

  -- ── Derive username ────────────────────────────────────────────────────────
  -- Priority order:
  --   1. 'username' key in raw_user_meta_data  (set by email signUp via options.data)
  --   2. 'full_name' key                       (set by Google OAuth)
  --   3. email prefix before '@'              (final fallback for both flows)
  v_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- ── 1. Create public.user row ─────────────────────────────────────────────
  -- user_type     = 'USER'     — all new registrations are standard users
  -- record_status = 'INACTIVE' — login guard blocks until admin activates
  -- stamp         = audit string showing when and how the row was created
  INSERT INTO public."user" (userId, username, email, user_type, record_status, stamp)
  VALUES (
    NEW.id::TEXT,
    v_username,
    NEW.email,
    'USER',
    'INACTIVE',
    'AUTO-PROVISIONED ' || NOW()::TEXT
  );

  -- ── 2. Map user to modules ────────────────────────────────────────────────
  -- Cust_Mod, Sales_Mod, Prod_Mod enabled (1); Adm_Mod disabled (0)
  INSERT INTO public.user_module (userId, moduleCode, rights_value)
  VALUES
    (NEW.id::TEXT, 'Cust_Mod',  1),
    (NEW.id::TEXT, 'Sales_Mod', 1),
    (NEW.id::TEXT, 'Prod_Mod',  1),
    (NEW.id::TEXT, 'Adm_Mod',   0);

  -- ── 3. Set default rights ─────────────────────────────────────────────────
  -- VIEW rights = 1 (can see customers, sales, products, price history)
  -- CRUD rights = 0 (cannot add, edit, or delete anything)
  -- ADM_USER    = 0 (cannot access admin module)
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
  -- If any INSERT fails (duplicate key, missing FK, etc.) log a warning
  -- but let the auth.users INSERT succeed. AuthContext will catch the missing
  -- row and show "Unable to verify account status" — which is recoverable.
  WHEN OTHERS THEN
    RAISE WARNING '[provision_new_user] Failed for % (%) : % | SQLSTATE: %',
      NEW.email, NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;


-- =============================================================================
-- STEP 3 — Attach trigger to auth.users
-- =============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users   -- fires AFTER the auth row is committed
  FOR EACH ROW                 -- once per new user
  EXECUTE FUNCTION public.provision_new_user();


-- =============================================================================
-- STEP 4 — Grant execute permission
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.provision_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_new_user() TO service_role;


-- =============================================================================
-- STEP 5 — Verification queries  (run separately after deploying)
-- =============================================================================

-- 5a. Confirm trigger is attached
SELECT trigger_name, event_manipulation, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Expected: 1 row — trigger_name = on_auth_user_created, event_object_table = users

-- 5b. After test registration — check user row
-- Replace the email below with your test account email
SELECT userId, username, email, user_type, record_status, stamp
FROM public."user"
WHERE email = 'test@example.com';
-- Expected: 1 row — user_type = USER, record_status = INACTIVE

-- 5c. Check 4 module rows
SELECT userId, moduleCode, rights_value
FROM public.user_module
WHERE userId = (SELECT userId FROM public."user" WHERE email = 'test@example.com');
-- Expected: 4 rows — Cust_Mod=1, Sales_Mod=1, Prod_Mod=1, Adm_Mod=0

-- 5d. Check 9 rights rows
SELECT userId, rightCode, right_value
FROM public."UserModule_Rights"
WHERE userId = (SELECT userId FROM public."user" WHERE email = 'test@example.com')
ORDER BY rightCode;
-- Expected 9 rows:
--  rightCode  | right_value
-- ────────────┼────────────
--  ADM_USER   | 0
--  CUST_ADD   | 0
--  CUST_DEL   | 0
--  CUST_EDIT  | 0
--  CUST_VIEW  | 1
--  PRICE_VIEW | 1
--  PROD_VIEW  | 1
--  SALES_VIEW | 1
--  SD_VIEW    | 1