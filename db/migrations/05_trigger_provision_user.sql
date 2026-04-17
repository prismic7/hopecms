-- =============================================================================
-- HopeCMS — PR-04: db/trigger-provision-user
-- Branch: db/trigger-provision-user
-- Engineer: M4 (Rights & Auth Specialist)
-- Depends on: PR-01 db/initial-schema, PR-02 db/rights-seed
-- Description: Deploys provision_new_user() trigger. Fires on every new
--              auth.users INSERT. Creates USER / INACTIVE row with default
--              view rights. Template provided by M3 in 02_rights_seed.sql.
-- Run in: Supabase SQL Editor after PR-01 and PR-02 have been applied.
-- =============================================================================

CREATE OR REPLACE FUNCTION provision_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- 1. Create user row: USER / INACTIVE
    INSERT INTO public."user" (userId, username, email, user_type, record_status, stamp)
    VALUES (
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        'USER',
        'INACTIVE',
        'AUTO-PROVISIONED ' || NOW()::text
    );

    -- 2. Map to modules: Cust, Sales, Prod enabled; Adm disabled
    INSERT INTO public.user_module (userId, moduleCode, rights_value) VALUES
        (NEW.id::text, 'Cust_Mod',  1),
        (NEW.id::text, 'Sales_Mod', 1),
        (NEW.id::text, 'Prod_Mod',  1),
        (NEW.id::text, 'Adm_Mod',   0);

    -- 3. Grant view rights; deny all CRUD and admin rights
    INSERT INTO public."UserModule_Rights" (userId, rightCode, right_value) VALUES
        (NEW.id::text, 'CUST_VIEW',  1),
        (NEW.id::text, 'CUST_ADD',   0),
        (NEW.id::text, 'CUST_EDIT',  0),
        (NEW.id::text, 'CUST_DEL',   0),
        (NEW.id::text, 'SALES_VIEW', 1),
        (NEW.id::text, 'SD_VIEW',    1),
        (NEW.id::text, 'PROD_VIEW',  1),
        (NEW.id::text, 'PRICE_VIEW', 1),
        (NEW.id::text, 'ADM_USER',   0);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION provision_new_user();