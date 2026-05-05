-- Permite al super_admin actualizar registros de usuarios de su mismo tenant
-- Necesario para desactivar la cuenta (active = false) al eliminar un barbero
CREATE POLICY "users_admin_update"
  ON users FOR UPDATE
  USING (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());
