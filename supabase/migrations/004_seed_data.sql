-- =============================================
-- 004_seed_data.sql
-- Datos iniciales para testing/desarrollo
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tenant principal
INSERT INTO tenants (name, slug) VALUES ('Harvin The Lord Barbier', 'harvin')
ON CONFLICT (slug) DO NOTHING;

-- Servicios (precios en colones costarricenses)
INSERT INTO services (tenant_id, name, description, duration_minutes, price)
SELECT
  t.id,
  unnest(ARRAY[
    'Corte clásico',
    'Corte + barba',
    'Afeitado tradicional',
    'Degradado moderno',
    'Corte niño'
  ]),
  unnest(ARRAY[
    'Corte de cabello clásico con tijera o máquina',
    'Corte de cabello con arreglo completo de barba',
    'Afeitado con navaja tradicional y toalla caliente',
    'Degradado moderno con acabados precisos',
    'Corte de cabello para niños menores de 12 años'
  ]),
  unnest(ARRAY[30, 60, 30, 45, 25]),
  unnest(ARRAY[8000, 15000, 8000, 10000, 6000]::NUMERIC[])
FROM tenants t WHERE t.slug = 'harvin';

-- Barberos (sin user_id para testing — se asocia en Semana 2 con Auth)
INSERT INTO barbers (tenant_id, name, bio, active)
SELECT
  t.id,
  unnest(ARRAY[
    'Harvin López',
    'Carlos Méndez',
    'Diego Vargas',
    'Luis Mora',
    'Andrés Castro'
  ]),
  unnest(ARRAY[
    'Dueño y maestro barbero con más de 10 años de experiencia. Especialista en estilos clásicos y modernos.',
    'Especialista en degradados y cortes contemporáneos. Siempre al día con las últimas tendencias.',
    'Experto en barba y afeitado tradicional. Maestro de la navaja con técnica impecable.',
    'Barbero creativo con estilo único. Especializado en cortes artísticos y personalizados.',
    'Especialista en cortes clásicos y técnica precisa. El detalle hace la diferencia.'
  ]),
  true
FROM tenants t WHERE t.slug = 'harvin';

-- Asignar todos los servicios a todos los barberos
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b
JOIN services s ON s.tenant_id = b.tenant_id
ON CONFLICT (barber_id, service_id) DO NOTHING;

-- Horario de trabajo: Lunes a Sábado de 8am a 6pm para todos los barberos
INSERT INTO working_schedules (barber_id, day_of_week, start_time, end_time)
SELECT
  b.id,
  d.day_of_week,
  '08:00:00'::TIME,
  '18:00:00'::TIME
FROM barbers b
CROSS JOIN (
  VALUES (1), (2), (3), (4), (5), (6)  -- Lunes a Sábado
) AS d(day_of_week)
ON CONFLICT DO NOTHING;
