-- =============================================
-- 005_fix_appointment_overlaps.sql
-- Fix: Prevenir overlaps de citas usando EXCLUDE CONSTRAINT
-- Ejecutar en Supabase SQL Editor DESPUÉS de 004_seed_data.sql
-- =============================================

-- Habilitar extensión necesaria para EXCLUDE CONSTRAINT
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Remover el índice único insuficiente
DROP INDEX IF EXISTS unique_pending_slot;

-- Limpiar citas solapadas (mantener la primera, eliminar solapadas posteriores)
DELETE FROM appointments a
WHERE EXISTS (
  SELECT 1 FROM appointments b
  WHERE a.barber_id = b.barber_id
    AND a.date = b.date
    AND a.status = 'pending'
    AND b.status = 'pending'
    AND a.created_at > b.created_at
    AND a.start_time >= b.start_time
    AND a.start_time < b.end_time
);

-- Agregar EXCLUDE CONSTRAINT que previene overlaps
ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_pending_appointments
EXCLUDE USING gist (
  barber_id WITH =,
  date WITH =,
  tsrange(
    (date::timestamp + start_time),
    (date::timestamp + end_time),
    '[)'::text
  ) WITH &&
) WHERE (status = 'pending');
