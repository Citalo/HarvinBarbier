-- =============================================
-- 003_functions_and_triggers.sql
-- Funciones y triggers del sistema
-- =============================================

-- =============================================
-- TRIGGER: Notificar al barbero cuando se crea una cita
-- Se ejecuta AFTER INSERT en appointments con status='pending'
-- =============================================

CREATE OR REPLACE FUNCTION notify_barber_on_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, appointment_id)
    SELECT b.user_id, 'new_appointment', NEW.id
    FROM public.barbers b
    WHERE b.id = NEW.barber_id
      AND b.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_barber_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_barber_on_new_appointment();

-- =============================================
-- FUNCIÓN: Calcular slots disponibles
-- Esta función es un helper SQL que complementa la lógica TypeScript.
-- La lógica principal vive en /lib/booking-engine/availability.ts
-- =============================================

CREATE OR REPLACE FUNCTION get_available_slots(
  p_barber_id     UUID,
  p_service_id    UUID,
  p_date          DATE
)
RETURNS TABLE (slot_time TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_duration INTEGER;
  v_current_time TIME;
  v_slot_end TIME;
  v_ws RECORD;
BEGIN
  -- Obtener duración del servicio
  SELECT duration_minutes INTO v_duration
  FROM public.services
  WHERE id = p_service_id AND active = TRUE;

  IF v_duration IS NULL THEN
    RETURN;
  END IF;

  -- Iterar sobre bloques de horario de trabajo del barbero para ese día
  FOR v_ws IN
    SELECT ws.start_time, ws.end_time
    FROM public.working_schedules ws
    WHERE ws.barber_id = p_barber_id
      AND ws.day_of_week = EXTRACT(DOW FROM p_date)
      AND ws.active = TRUE
  LOOP
    v_current_time := v_ws.start_time;

    LOOP
      v_slot_end := v_current_time + (v_duration || ' minutes')::INTERVAL;

      -- Parar si el slot sobrepasa el horario de trabajo
      EXIT WHEN v_slot_end > v_ws.end_time;

      -- Verificar que el slot no esté bloqueado ni ocupado
      IF NOT EXISTS (
        -- Bloqueo del barbero o global para esa fecha
        SELECT 1 FROM public.schedule_blocks sb
        WHERE (sb.barber_id = p_barber_id OR (sb.barber_id IS NULL AND sb.tenant_id = (
          SELECT b.tenant_id FROM public.barbers b WHERE b.id = p_barber_id
        )))
          AND sb.date = p_date
          AND (
            sb.start_time IS NULL  -- día completo
            OR (sb.start_time < v_slot_end AND sb.end_time > v_current_time)
          )
      ) AND NOT EXISTS (
        -- Cita pendiente que se solapa
        SELECT 1 FROM public.appointments a
        WHERE a.barber_id = p_barber_id
          AND a.date = p_date
          AND a.status = 'pending'
          AND a.start_time < v_slot_end
          AND a.end_time > v_current_time
      ) THEN
        slot_time := TO_CHAR(v_current_time, 'HH24:MI');
        RETURN NEXT;
      END IF;

      v_current_time := v_slot_end;
    END LOOP;
  END LOOP;
END;
$$;

-- =============================================
-- FUNCIÓN: Crear cita de forma transaccional
-- Usada por la Edge Function create-appointment para garantizar atomicidad.
-- Retorna el ID de la cita creada o NULL si el slot ya fue tomado.
-- =============================================

CREATE OR REPLACE FUNCTION create_appointment_atomic(
  p_tenant_id     UUID,
  p_client_id     UUID,
  p_barber_id     UUID,
  p_service_id    UUID,
  p_date          DATE,
  p_start_time    TIME,
  p_end_time      TIME,
  p_notes         TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
BEGIN
  INSERT INTO public.appointments (
    tenant_id, client_id, barber_id, service_id,
    date, start_time, end_time, status, notes
  )
  VALUES (
    p_tenant_id, p_client_id, p_barber_id, p_service_id,
    p_date, p_start_time, p_end_time, 'pending', p_notes
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- =============================================
-- FUNCIÓN: Upsert cliente por teléfono
-- Reutiliza el registro si el teléfono ya existe en ese tenant.
-- =============================================

CREATE OR REPLACE FUNCTION upsert_client(
  p_tenant_id   UUID,
  p_first_name  TEXT,
  p_last_name   TEXT,
  p_phone       TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
BEGIN
  INSERT INTO public.clients (tenant_id, first_name, last_name, phone)
  VALUES (p_tenant_id, p_first_name, p_last_name, p_phone)
  ON CONFLICT (tenant_id, phone) DO NOTHING
  RETURNING id INTO v_client_id;

  -- Si no se insertó (conflicto), buscar el existente
  IF v_client_id IS NULL THEN
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE tenant_id = p_tenant_id AND phone = p_phone;
  END IF;

  RETURN v_client_id;
END;
$$;
