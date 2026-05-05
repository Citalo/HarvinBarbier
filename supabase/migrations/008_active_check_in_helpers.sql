-- Filtrar usuarios inactivos en las funciones helper de RLS
-- Si users.active = FALSE o barbers.active = FALSE, las funciones retornan NULL
-- y todas las políticas que las usan rechazan al usuario automáticamente.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND active = TRUE
$$;

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() AND active = TRUE
$$;

CREATE OR REPLACE FUNCTION get_my_barber_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT b.id
  FROM public.barbers b
  JOIN public.users u ON u.id = b.user_id
  WHERE b.user_id = auth.uid()
    AND b.active = TRUE
    AND u.active = TRUE
$$;
