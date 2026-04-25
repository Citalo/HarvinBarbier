-- =============================================
-- 001_initial_schema.sql
-- Harvin The Lord Barbier — Schema inicial
-- Timezone del sistema: America/Costa_Rica (UTC-6)
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TENANTS
-- Preparado para SaaS futuro. MVP = 1 registro.
-- =============================================
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USERS
-- Solo barberos y super admin. Clientes no tienen cuenta.
-- =============================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('super_admin', 'barber')) NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BARBERS
-- Perfil público visible en el flujo de reserva
-- =============================================
CREATE TABLE barbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES
-- Catálogo de servicios definido por el super admin
-- =============================================
CREATE TABLE services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  duration_minutes    INTEGER NOT NULL CHECK (duration_minutes > 0),
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BARBER_SERVICES
-- Relación M:N — qué servicios realiza cada barbero
-- =============================================
CREATE TABLE barber_services (
  barber_id   UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);

-- =============================================
-- WORKING_SCHEDULES
-- Horario semanal recurrente por barbero.
-- Múltiples bloques posibles por día (ej: mañana y tarde).
-- day_of_week: 0=Domingo, 1=Lunes, ..., 6=Sábado
-- =============================================
CREATE TABLE working_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id       UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- =============================================
-- SCHEDULE_BLOCKS
-- Bloqueos manuales de fechas/rangos específicos.
-- Si barber_id IS NULL: bloqueo global del tenant (festivo, cierre total).
-- Si start_time IS NULL: bloquea el día completo.
-- =============================================
CREATE TABLE schedule_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id       UUID REFERENCES barbers(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  reason          TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS
-- Identificados por teléfono. Sin cuenta ni contraseña.
-- UNIQUE (tenant_id, phone) para reutilizar registro existente.
-- =============================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

-- =============================================
-- APPOINTMENTS
-- Tabla central. Cada fila = una cita.
-- end_time se calcula al crear (start_time + service.duration_minutes).
-- =============================================
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  barber_id       UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
  service_id      UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'no_show')),
  booked_at       TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- ÚNICO ÍNDICE PARCIAL CRÍTICO:
-- Solo una cita 'pending' por barbero en el mismo slot.
-- Permite múltiples cancelled/completed en el mismo slot (historial completo).
CREATE UNIQUE INDEX unique_pending_slot
  ON appointments (barber_id, date, start_time)
  WHERE status = 'pending';

-- =============================================
-- NOTIFICATIONS
-- Notificaciones in-app para barberos y super admin.
-- =============================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('new_appointment', 'cancellation')),
  appointment_id  UUID REFERENCES appointments(id) ON DELETE CASCADE,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para performance de queries frecuentes
-- =============================================
CREATE INDEX idx_appointments_barber_date ON appointments (barber_id, date);
CREATE INDEX idx_appointments_tenant_status ON appointments (tenant_id, status);
CREATE INDEX idx_appointments_client ON appointments (client_id);
CREATE INDEX idx_working_schedules_barber ON working_schedules (barber_id, day_of_week);
CREATE INDEX idx_schedule_blocks_barber_date ON schedule_blocks (barber_id, date);
CREATE INDEX idx_schedule_blocks_tenant_date ON schedule_blocks (tenant_id, date) WHERE barber_id IS NULL;
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read) WHERE read = FALSE;
CREATE INDEX idx_barbers_tenant_active ON barbers (tenant_id, active);
CREATE INDEX idx_services_tenant_active ON services (tenant_id, active);
