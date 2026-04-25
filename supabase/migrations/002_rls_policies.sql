-- =============================================
-- 002_rls_policies.sql
-- Row Level Security policies para todas las tablas
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- Leen datos del usuario actual desde el JWT / tabla users.
-- SECURITY DEFINER: se ejecutan con permisos del owner, no del caller.
-- =============================================

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_barber_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.barbers WHERE user_id = auth.uid()
$$;

-- =============================================
-- TENANTS
-- Solo lectura pública de tenants activos.
-- =============================================
CREATE POLICY "tenants_public_select"
  ON tenants FOR SELECT
  USING (active = TRUE);

-- =============================================
-- USERS
-- Cada usuario solo ve su propio registro.
-- Super admin ve todos del mismo tenant.
-- =============================================
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (
    auth.uid() = id
    OR (
      get_my_role() = 'super_admin'
      AND tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- BARBERS
-- Lectura pública de barberos activos.
-- Solo super_admin puede crear/editar.
-- =============================================
CREATE POLICY "barbers_public_select"
  ON barbers FOR SELECT
  USING (active = TRUE OR get_my_role() IN ('super_admin', 'barber'));

CREATE POLICY "barbers_admin_insert"
  ON barbers FOR INSERT
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());

CREATE POLICY "barbers_admin_update"
  ON barbers FOR UPDATE
  USING (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());

-- =============================================
-- SERVICES
-- Lectura pública de servicios activos.
-- Solo super_admin puede crear/editar.
-- =============================================
CREATE POLICY "services_public_select"
  ON services FOR SELECT
  USING (active = TRUE OR get_my_role() = 'super_admin');

CREATE POLICY "services_admin_insert"
  ON services FOR INSERT
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());

CREATE POLICY "services_admin_update"
  ON services FOR UPDATE
  USING (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());

-- =============================================
-- BARBER_SERVICES
-- Lectura pública (necesario para el flujo de reserva).
-- Solo super_admin puede modificar.
-- =============================================
CREATE POLICY "barber_services_public_select"
  ON barber_services FOR SELECT
  USING (TRUE);

CREATE POLICY "barber_services_admin_insert"
  ON barber_services FOR INSERT
  WITH CHECK (get_my_role() = 'super_admin');

CREATE POLICY "barber_services_admin_delete"
  ON barber_services FOR DELETE
  USING (get_my_role() = 'super_admin');

-- =============================================
-- WORKING_SCHEDULES
-- Lectura pública (necesario para calcular disponibilidad).
-- Barbero gestiona los suyos. Admin gestiona todos del tenant.
-- =============================================
CREATE POLICY "working_schedules_public_select"
  ON working_schedules FOR SELECT
  USING (TRUE);

CREATE POLICY "working_schedules_barber_insert"
  ON working_schedules FOR INSERT
  WITH CHECK (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR get_my_role() = 'super_admin'
  );

CREATE POLICY "working_schedules_barber_update"
  ON working_schedules FOR UPDATE
  USING (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR get_my_role() = 'super_admin'
  )
  WITH CHECK (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR get_my_role() = 'super_admin'
  );

CREATE POLICY "working_schedules_barber_delete"
  ON working_schedules FOR DELETE
  USING (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR get_my_role() = 'super_admin'
  );

-- =============================================
-- SCHEDULE_BLOCKS
-- Lectura pública (necesario para disponibilidad).
-- Barbero gestiona los suyos. Admin gestiona todos + globales.
-- =============================================
CREATE POLICY "schedule_blocks_public_select"
  ON schedule_blocks FOR SELECT
  USING (TRUE);

CREATE POLICY "schedule_blocks_barber_insert"
  ON schedule_blocks FOR INSERT
  WITH CHECK (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id() AND tenant_id = get_my_tenant_id())
    OR get_my_role() = 'super_admin'
  );

CREATE POLICY "schedule_blocks_barber_delete"
  ON schedule_blocks FOR DELETE
  USING (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR get_my_role() = 'super_admin'
  );

-- =============================================
-- CLIENTS
-- Sin acceso directo desde el frontend.
-- Se crean/leen SOLO desde Edge Functions con SERVICE_ROLE_KEY.
-- =============================================
CREATE POLICY "clients_no_direct_access"
  ON clients FOR ALL
  USING (FALSE);

-- =============================================
-- APPOINTMENTS
-- Barbero ve y gestiona SOLO sus propias citas.
-- Super admin ve y gestiona todas del tenant.
-- Clientes no tienen acceso directo (usan Edge Function).
-- =============================================
CREATE POLICY "appointments_select"
  ON appointments FOR SELECT
  USING (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  );

CREATE POLICY "appointments_update_status"
  ON appointments FOR UPDATE
  USING (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  )
  WITH CHECK (
    (get_my_role() = 'barber' AND barber_id = get_my_barber_id())
    OR (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  );

-- =============================================
-- NOTIFICATIONS
-- Cada usuario ve y gestiona SOLO sus propias notificaciones.
-- =============================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
