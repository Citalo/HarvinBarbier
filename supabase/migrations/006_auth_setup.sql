-- Migration 006: Setup authentication for barbers and admin
-- Creates auth users, inserts into public.users, then links barbers.user_id
-- public.users.id = auth.users.id (same UUID)

DO $$
DECLARE
  v_tenant_id     UUID;
  v_barber_ids    UUID[];
  v_auth_id       UUID;
  v_emails        TEXT[] := ARRAY['harvin@harvin.cr','carlos@harvin.cr','diego@harvin.cr','luis@harvin.cr','andres@harvin.cr'];
  v_names         TEXT[] := ARRAY['Harvin López','Carlos Méndez','Diego Vargas','Luis Mora','Andrés Castro'];
  i               INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'harvin' LIMIT 1;

  -- Load barber IDs in seed insertion order
  SELECT ARRAY(
    SELECT id FROM barbers WHERE tenant_id = v_tenant_id ORDER BY created_at
  ) INTO v_barber_ids;

  FOR i IN 1..5 LOOP
    -- 1. Create Supabase auth user
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated_user',
      v_emails[i],
      crypt('Password123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false
    ) RETURNING id INTO v_auth_id;

    -- 2. Create public.users (id = auth.users.id per schema: REFERENCES auth.users(id))
    INSERT INTO users (id, tenant_id, role, name, email)
    VALUES (v_auth_id, v_tenant_id, 'barber', v_names[i], v_emails[i]);

    -- 3. Link barber to user (barbers.user_id → users.id)
    UPDATE barbers
    SET user_id = v_auth_id
    WHERE id = v_barber_ids[i];
  END LOOP;

  -- Admin auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated_user',
    'admin@harvin.cr',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    true
  ) RETURNING id INTO v_auth_id;

  INSERT INTO users (id, tenant_id, role, name, email)
  VALUES (v_auth_id, v_tenant_id, 'super_admin', 'Admin Harvin', 'admin@harvin.cr');
END $$;
