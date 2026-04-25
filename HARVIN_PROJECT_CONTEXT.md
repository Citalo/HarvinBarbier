# HARVIN THE LORD BARBIER — Documento de Contexto del Proyecto

> **Este documento es la fuente de verdad del proyecto.**
> Claude Code debe leerlo completo antes de escribir cualquier línea de código.
> Ante cualquier duda de implementación, la respuesta está aquí.

---

## ÍNDICE

1. [Visión y Contexto del Negocio](#1-visión-y-contexto-del-negocio)
2. [El Problema](#2-el-problema)
3. [La Solución](#3-la-solución)
4. [Usuarios y Roles](#4-usuarios-y-roles)
5. [Stack Tecnológico](#5-stack-tecnológico)
6. [Modelo de Datos Completo](#6-modelo-de-datos-completo)
7. [Booking Engine — Lógica de Disponibilidad](#7-booking-engine--lógica-de-disponibilidad)
8. [Flujos Completos del Sistema](#8-flujos-completos-del-sistema)
9. [Funcionalidades por Módulo](#9-funcionalidades-por-módulo)
10. [Requisitos Funcionales](#10-requisitos-funcionales)
11. [Requisitos No Funcionales](#11-requisitos-no-funcionales)
12. [Permisos por Rol](#12-permisos-por-rol)
13. [Notificaciones](#13-notificaciones)
14. [Arquitectura y Estructura de Carpetas](#14-arquitectura-y-estructura-de-carpetas)
15. [Plan de Desarrollo — 2 Semanas](#15-plan-de-desarrollo--2-semanas)
16. [Decisiones Técnicas Críticas](#16-decisiones-técnicas-críticas)
17. [Edge Cases y Cómo Manejarlos](#17-edge-cases-y-cómo-manejarlos)
18. [Errores Comunes a Evitar](#18-errores-comunes-a-evitar)
19. [Escalabilidad Futura](#19-escalabilidad-futura)

---

## 1. VISIÓN Y CONTEXTO DEL NEGOCIO

### ¿Qué es esto?
Sistema web de gestión de citas para **Harvin The Lord Barbier**, una barbería en Costa Rica con 5 barberos activos. Harvin es dueño y también barbero activo.

### Contexto actual del negocio
- 5 barberos en total, incluyendo Harvin
- Aproximadamente **100 citas por día / 600 por semana**
- Hoy las citas llegan **100% por WhatsApp** de forma manual
- Los clientes siempre **eligen su barbero específico**
- **No se aceptan walk-ins** — todo es por reserva
- No hay sistema de depósito ni pago anticipado
- Cada barbero tiene sus propios días y horarios de trabajo

### Objetivo del proyecto
Reemplazar completamente la gestión por WhatsApp con un sistema web donde:
- El cliente reserva solo, sin hablar con nadie
- El barbero gestiona su propia agenda
- El super admin tiene visibilidad y control total

### Visión futura (no para este MVP)
Este sistema está pensado para eventualmente convertirse en un **SaaS multi-tenant** que se pueda vender a otras barberías con una mensualidad mensual. La arquitectura del MVP debe contemplarlo sin sobre-construirlo ahora.

---

## 2. EL PROBLEMA

| Problema | Impacto |
|---|---|
| Citas gestionadas por WhatsApp manualmente | Tiempo perdido, errores humanos |
| Sin validación de disponibilidad en tiempo real | Dobles reservas frecuentes |
| Sin trazabilidad histórica de citas | Imposible analizar el negocio |
| Clientes sin respuesta inmediata | Pérdida de clientes a la competencia |
| Dependencia total de disponibilidad del dueño | Cuello de botella operativo |
| Sin registro de estados de citas | No se sabe quién llegó, quién canceló |

---

## 3. LA SOLUCIÓN

Aplicación web con **tres vistas diferenciadas**:

1. **Landing page pública** — cualquier persona puede reservar su cita sin crear cuenta
2. **Panel del barbero** — cada barbero gestiona su propia agenda y disponibilidad
3. **Panel del super admin** — Harvin tiene visibilidad y control total de toda la operación

### Propuesta de valor
- Reservas 24/7 sin intervención humana
- Eliminación de dobles reservas con validación en tiempo real y bloqueo concurrente
- Cada barbero controla su propia disponibilidad
- El admin ve todo desde un solo lugar
- Cero dependencia de WhatsApp para coordinar citas

---

## 4. USUARIOS Y ROLES

El sistema tiene exactamente **3 roles**. No hay más.

### Super Admin
- Es Harvin (dueño)
- Acceso total a todo el sistema
- Gestiona barberos, servicios y agenda global
- El único que puede ver la agenda de todos los barberos
- Puede cancelar o modificar cualquier cita del sistema

### Barbero
- Empleado de la barbería
- Ve y gestiona **únicamente su propia agenda**
- Configura su propia disponibilidad (días, bloques horarios, bloqueos)
- Puede cambiar el estado de sus propias citas
- Recibe notificaciones in-app de nuevas citas

### Cliente
- Público general
- **No crea cuenta, no se registra**
- Reserva como invitado: nombre, apellidos y teléfono
- Se identifica por coincidencia de número de teléfono en reservas futuras

---

## 5. STACK TECNOLÓGICO

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, routing, performance |
| Base de datos | Supabase (PostgreSQL) | Plan gratuito suficiente para MVP, RLS incluido |
| Auth | Supabase Auth | Manejo de roles con JWT, sin costo adicional |
| Realtime | Supabase Realtime | Notificaciones in-app y bloqueo de slots concurrentes |
| Edge Functions | Supabase Edge Functions | Lógica transaccional del booking engine |
| Deploy | Vercel | Free tier suficiente, deploy automático |
| Estilos | Tailwind CSS | Desarrollo rápido |
| Descarga de confirmación | html2canvas o dom-to-image | Generar imagen PNG de confirmación en el cliente |

### Restricción de infraestructura
**Presupuesto máximo: $20 USD/mes.** El plan gratuito de Supabase + Vercel cubre el MVP sin costo. Solo se paga si el tráfico lo requiere.

### Idioma
**Solo español.** Sin soporte multiidioma en el MVP.

---

## 6. MODELO DE DATOS COMPLETO

> Todas las tablas deben tener `created_at TIMESTAMPTZ DEFAULT NOW()`.
> Timezone del sistema: **America/Costa_Rica (UTC-6)**.
> Toda hora almacenada debe ser en UTC, mostrada en Costa Rica time.

---

### `tenants`
Preparado para SaaS futuro. En el MVP solo existe un registro.

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        TEXT NOT NULL
slug        TEXT UNIQUE NOT NULL
active      BOOLEAN DEFAULT TRUE
created_at  TIMESTAMPTZ DEFAULT NOW()
```

---

### `users`
Vinculado a Supabase Auth. Solo barberos y super admin tienen usuario.

```sql
id          UUID PRIMARY KEY REFERENCES auth.users(id)
tenant_id   UUID REFERENCES tenants(id)
role        TEXT CHECK (role IN ('super_admin', 'barber')) NOT NULL
name        TEXT NOT NULL
email       TEXT NOT NULL
phone       TEXT
active      BOOLEAN DEFAULT TRUE
created_at  TIMESTAMPTZ DEFAULT NOW()
```

---

### `barbers`
Perfil público del barbero, visible para el cliente en el flujo de reserva.

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id)
tenant_id   UUID REFERENCES tenants(id)
name        TEXT NOT NULL
bio         TEXT
avatar_url  TEXT
active      BOOLEAN DEFAULT TRUE
created_at  TIMESTAMPTZ DEFAULT NOW()
```

---

### `services`
Catálogo de servicios definido por el super admin.

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id           UUID REFERENCES tenants(id)
name                TEXT NOT NULL
description         TEXT
duration_minutes    INTEGER NOT NULL
price               NUMERIC(10,2) NOT NULL
active              BOOLEAN DEFAULT TRUE
created_at          TIMESTAMPTZ DEFAULT NOW()
```

---

### `barber_services`
Relación muchos a muchos: qué servicios realiza cada barbero.
No todos los barberos realizan todos los servicios.

```sql
barber_id   UUID REFERENCES barbers(id)
service_id  UUID REFERENCES services(id)
PRIMARY KEY (barber_id, service_id)
```

---

### `working_schedules`
Horario semanal recurrente por barbero. Define los días y bloques en que trabaja normalmente.
Un barbero puede tener múltiples bloques en el mismo día (ej: 8am-12pm y 2pm-6pm para contemplar almuerzo).

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
barber_id       UUID REFERENCES barbers(id)
day_of_week     INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL
                -- 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles,
                -- 4=Jueves, 5=Viernes, 6=Sábado
start_time      TIME NOT NULL
end_time        TIME NOT NULL
active          BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### `schedule_blocks`
Bloqueos manuales de fechas o rangos horarios específicos.
Usado para: días festivos, vacaciones, almuerzo de un día específico, cierre por enfermedad.

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
barber_id       UUID REFERENCES barbers(id)
tenant_id       UUID REFERENCES tenants(id)
                -- Si tenant_id está presente y barber_id es NULL,
                -- es un bloqueo global (cierre total de la barbería)
date            DATE NOT NULL
start_time      TIME
end_time        TIME
                -- Si start_time y end_time son NULL, bloquea el día completo
reason          TEXT
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### `clients`
Clientes identificados por número de teléfono. No tienen cuenta ni contraseña.

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   UUID REFERENCES tenants(id)
first_name  TEXT NOT NULL
last_name   TEXT NOT NULL
phone       TEXT NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()

UNIQUE (tenant_id, phone)
-- Si un cliente reserva con el mismo teléfono, se reutiliza el registro
```

---

### `appointments`
Tabla central del sistema. Cada fila es una cita.

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID REFERENCES tenants(id)
client_id       UUID REFERENCES clients(id)
barber_id       UUID REFERENCES barbers(id)
service_id      UUID REFERENCES services(id)
date            DATE NOT NULL
start_time      TIME NOT NULL
end_time        TIME NOT NULL
                -- end_time = start_time + services.duration_minutes
                -- Se calcula al crear, se almacena para simplificar queries
status          TEXT CHECK (status IN (
                  'pending',    -- Reservada, esperando atención
                  'completed',  -- Atendida
                  'cancelled',  -- Cancelada
                  'no_show'     -- El cliente no llegó
                )) DEFAULT 'pending'
booked_at       TIMESTAMPTZ DEFAULT NOW()
cancelled_at    TIMESTAMPTZ
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()

-- CONSTRAINT CRÍTICO: previene dobles reservas
-- Solo una cita 'pending' por barbero en el mismo slot
UNIQUE (barber_id, date, start_time)
  -- Nota: este constraint debe ser parcial solo para status='pending'
  -- Implementar como unique index parcial:
  -- CREATE UNIQUE INDEX unique_pending_slot
  -- ON appointments (barber_id, date, start_time)
  -- WHERE status = 'pending';
```

---

### `notifications`
Notificaciones in-app para barberos y super admin.

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id)
type                TEXT CHECK (type IN ('new_appointment', 'cancellation'))
appointment_id      UUID REFERENCES appointments(id)
read                BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ DEFAULT NOW()
```

---

## 7. BOOKING ENGINE — Lógica de Disponibilidad

> Esta es la parte más crítica del sistema.
> NO es CRUD. Es un motor de reglas y disponibilidad.
> Toda esta lógica debe ejecutarse en el **servidor** (Edge Function o API Route), nunca solo en el frontend.

---

### Reglas del sistema

1. Solo se puede reservar con **máximo 20 días de anticipación** desde hoy
2. No se puede reservar en el **pasado**
3. No se puede reservar en un slot donde el barbero ya tiene una cita `pending`
4. No se puede reservar fuera del horario de trabajo del barbero
5. No se puede reservar en una fecha/bloque que el barbero haya bloqueado manualmente
6. No se puede reservar en una fecha con bloqueo global del tenant
7. Los slots disponibles se calculan en base a la **duración del servicio** seleccionado
8. En caso de conflicto concurrente, **gana el primero que confirme**

---

### Algoritmo de cálculo de disponibilidad

Cuando el cliente selecciona: barbero + servicio + fecha

```
ENTRADA: barber_id, service_id, date

PASO 1 — Obtener duración del servicio
  SELECT duration_minutes FROM services WHERE id = service_id

PASO 2 — Obtener horario base del barbero para ese día de semana
  SELECT start_time, end_time FROM working_schedules
  WHERE barber_id = X
    AND day_of_week = EXTRACT(DOW FROM date)
    AND active = true
  → Si no hay resultado: el barbero no trabaja ese día → retornar []

PASO 3 — Verificar bloqueos manuales para esa fecha
  SELECT start_time, end_time FROM schedule_blocks
  WHERE barber_id = X AND date = Z
  UNION
  SELECT start_time, end_time FROM schedule_blocks
  WHERE tenant_id = T AND barber_id IS NULL AND date = Z
  → Bloqueos de día completo (start_time IS NULL) → retornar []

PASO 4 — Obtener citas ya confirmadas para ese barbero ese día
  SELECT start_time, end_time FROM appointments
  WHERE barber_id = X AND date = Z AND status = 'pending'

PASO 5 — Generar todos los slots posibles
  Empezando en working_schedule.start_time
  Cada slot dura duration_minutes del servicio
  Terminando cuando slot.end_time > working_schedule.end_time

PASO 6 — Filtrar slots no disponibles:
  Un slot NO está disponible si:
  a) slot.start_time < NOW() (es en el pasado)
  b) date > TODAY + 20 días
  c) El slot se solapa con algún schedule_block:
     block.start_time < slot.end_time AND block.end_time > slot.start_time
  d) El slot se solapa con alguna cita existente:
     appointment.start_time < slot.end_time AND appointment.end_time > slot.start_time

PASO 7 — Retornar lista de slots disponibles como array de strings ["08:00", "08:30", ...]

SALIDA: string[] de horarios disponibles
```

---

### Manejo de concurrencia — Prevención de dobles reservas

Cuando dos clientes intentan reservar el mismo slot al mismo tiempo:

```
FLUJO TRANSACCIONAL (Supabase Edge Function):

BEGIN TRANSACTION;

1. SELECT id FROM appointments
   WHERE barber_id = X AND date = D AND start_time = T AND status = 'pending'
   FOR UPDATE SKIP LOCKED;
   → Si retorna una fila: el slot ya está tomado → ROLLBACK → error al cliente

2. INSERT INTO appointments (client_id, barber_id, service_id, date, start_time, end_time, status)
   VALUES (...)
   ON CONFLICT (barber_id, date, start_time) WHERE status = 'pending'
   DO NOTHING
   RETURNING id;
   → Si RETURNING retorna vacío: otro proceso ganó → ROLLBACK → error al cliente

3. INSERT INTO notifications (user_id, type, appointment_id)
   VALUES (barber.user_id, 'new_appointment', new_appointment.id);

COMMIT;
```

Adicionalmente, usar **Supabase Realtime** para que el frontend del otro cliente reciba el evento y quite el slot de la pantalla automáticamente.

---

## 8. FLUJOS COMPLETOS DEL SISTEMA

### Flujo de Reserva (Cliente)

```
[Landing page]
      ↓
Selecciona barbero
  → Muestra: foto, nombre, servicios que realiza
      ↓
Selecciona servicio
  → Solo servicios asignados a ese barbero
  → Muestra: nombre, descripción, duración, precio
      ↓
Selecciona fecha
  → Calendario — solo habilita días en que el barbero trabaja
  → Deshabilita fechas pasadas y fechas a más de 20 días
      ↓
Selecciona hora
  → Llama al booking engine con barber_id + service_id + date
  → Muestra slots disponibles en tiempo real
  → Supabase Realtime escucha cambios: si otro reserva mientras el cliente
    está en esta pantalla, el slot desaparece automáticamente
      ↓
Ingresa datos personales
  → Nombre, apellidos, teléfono
  → Sistema busca si ese teléfono ya existe en clients
  → Si existe: reutiliza el registro. Si no: crea uno nuevo
      ↓
Pantalla de confirmación
  → Resumen: barbero, servicio, fecha, hora, precio
  → Botón "Confirmar reserva" → llama Edge Function transaccional
      ↓
[Si éxito]
Pantalla de éxito
  → Resumen visual de la cita
  → Botón "Descargar confirmación" → genera PNG con html2canvas
  → Notificación in-app al barbero

[Si conflicto concurrente]
  → Mensaje: "Ese horario acaba de ser tomado, por favor elegí otro"
  → Redirige al paso de selección de hora
```

---

### Flujo de Gestión de Disponibilidad (Barbero)

```
[Panel Barbero → Mi Disponibilidad]
      ↓
Sección 1: Horario semanal recurrente
  → Toggle por cada día de semana (Lunes a Domingo)
  → Si el día está activo: puede agregar uno o más bloques horarios
    Ejemplo: 8:00am–12:00pm y 2:00pm–6:00pm (contempla almuerzo)
  → Puede eliminar bloques
  → Al guardar: se actualiza working_schedules
      ↓
Sección 2: Bloqueos de fechas específicas
  → Calendario donde puede seleccionar cualquier fecha futura
  → Opción: bloquear día completo o un rango de horas
  → Ejemplo: "Viernes 20 de junio — día completo — Feriado"
  → Ejemplo: "Martes 15 — 12:00pm a 1:30pm — Almuerzo especial"
  → Al guardar: se crea registro en schedule_blocks
      ↓
[Los cambios se reflejan inmediatamente en la disponibilidad pública]
```

---

### Flujo de Gestión de Cita (Barbero)

```
[Panel Barbero → Agenda o Lista de Citas]
      ↓
Ve cita con datos: cliente, servicio, hora, estado actual
      ↓
Opciones disponibles según estado actual:

  Si status = 'pending':
    → [Completar] → status = 'completed'
    → [Cancelar] → status = 'cancelled', cancelled_at = NOW()
    → [No asistió] → status = 'no_show'
                  → Aparece botón WhatsApp directo: 
                    href="https://wa.me/506XXXXXXXX"
                    con mensaje pre-escrito: "Hola [nombre], 
                    tenías una cita hoy a las [hora], 
                    ¿todo bien?"

  Si status = 'completed' o 'cancelled' o 'no_show':
    → Solo lectura, no se puede cambiar
      ↓
[El cambio de estado se refleja en tiempo real]
[Si se cancela, el slot queda libre para nuevas reservas automáticamente]
```

---

### Flujo de Cancelación

No hay cancelación de autoservicio para el cliente.

```
1. Cliente contacta al barbero por WhatsApp (fuera del sistema)
2. Barbero entra al sistema y cancela la cita manualmente
3. El slot queda libre automáticamente para nuevas reservas
4. Se registra cancelled_at en la cita
```

---

### Flujo de Creación de Barbero (Super Admin)

```
[Panel Admin → Barberos → Agregar barbero]
      ↓
Formulario:
  → Nombre completo
  → Email (se usará para el login)
  → Contraseña temporal
  → Foto (avatar)
  → Bio corta (opcional)
      ↓
Asignación de servicios:
  → Lista de todos los servicios activos
  → Checkboxes: seleccionar cuáles realiza este barbero
      ↓
Al guardar:
  → Crear usuario en Supabase Auth con role='barber'
  → Crear registro en users
  → Crear registro en barbers
  → Crear registros en barber_services
      ↓
El barbero puede iniciar sesión inmediatamente
```

---

### Flujo de Creación de Servicio (Super Admin)

```
[Panel Admin → Servicios → Agregar servicio]
      ↓
Formulario:
  → Nombre del servicio
  → Descripción
  → Duración en minutos
  → Precio en colones
      ↓
Al guardar:
  → Crear registro en services
  → El servicio aparece disponible para asignar a barberos
  → No aparece en el flujo de reserva hasta que al menos un barbero lo tenga asignado
```

---

## 9. FUNCIONALIDADES POR MÓDULO

### LANDING PAGE (pública)

- [ ] Logo y nombre de la barbería (hardcodeado desde código fuente en MVP)
- [ ] Presentación del equipo: foto, nombre, especialidad de cada barbero
- [ ] Lista de servicios con precios y duración
- [ ] Botón "Reservar cita" prominente que inicia el wizard
- [ ] Links a Instagram y WhatsApp de la barbería en el footer
- [ ] Footer con créditos al desarrollador
- [ ] Diseño responsive, mobile-first

### WIZARD DE RESERVA (público)

- [ ] Paso 1: Selección de barbero con foto y nombre
- [ ] Paso 2: Selección de servicio (filtrado por barbero elegido) con nombre, duración y precio
- [ ] Paso 3: Calendario con días habilitados/deshabilitados según disponibilidad real
- [ ] Paso 4: Selección de hora en slots disponibles (calculados en tiempo real)
- [ ] Paso 5: Formulario de datos personales (nombre, apellidos, teléfono)
- [ ] Paso 6: Pantalla de confirmación con resumen completo
- [ ] Pantalla de éxito con resumen descargable como imagen PNG
- [ ] Validación en tiempo real de disponibilidad durante el flujo
- [ ] Manejo de error por concurrencia con mensaje claro y redirección

### PANEL DEL BARBERO

**Dashboard personal:**
- [ ] Citas de hoy con estado y datos del cliente
- [ ] Próximas citas (siguiente semana)
- [ ] Contador de citas completadas del mes
- [ ] Badge de notificaciones no leídas

**Agenda:**
- [ ] Vista de lista cronológica por día
- [ ] Vista de calendario semanal (opcional para v2)
- [ ] Cada cita muestra: hora, nombre del cliente, servicio, precio, estado
- [ ] Acciones por cita: Completar / Cancelar / No asistió
- [ ] Botón WhatsApp directo al cliente (visible siempre, énfasis en "No asistió")

**Mi disponibilidad:**
- [ ] Toggle de días de trabajo por semana
- [ ] Gestión de bloques horarios por día (múltiples bloques posibles)
- [ ] Agregar bloqueos de fechas específicas (día completo o rango horario)
- [ ] Ver y eliminar bloqueos existentes

**Notificaciones:**
- [ ] Badge con conteo de notificaciones no leídas en el menú
- [ ] Toast al recibir nueva cita en tiempo real
- [ ] Lista de notificaciones recientes

### PANEL DEL SUPER ADMIN

**Dashboard global:**
- [ ] Total de citas hoy / esta semana
- [ ] Citas por barbero hoy
- [ ] Citas pendientes vs completadas vs canceladas
- [ ] Última cita agendada

**Gestión de barberos:**
- [ ] Lista de barberos con estado (activo/inactivo)
- [ ] Crear barbero (nombre, email, password, foto, bio, servicios asignados)
- [ ] Editar barbero (todos los datos + servicios)
- [ ] Desactivar barbero (no eliminar, ocultar del flujo de reservas)

**Gestión de servicios:**
- [ ] Lista de servicios con nombre, duración y precio
- [ ] Crear servicio (nombre, descripción, duración en minutos, precio)
- [ ] Editar servicio
- [ ] Desactivar servicio (no eliminar)

**Agenda global:**
- [ ] Vista de todas las citas de todos los barberos
- [ ] Filtros: por barbero, por fecha, por estado
- [ ] Capacidad de cancelar cualquier cita

**Bloqueos globales:**
- [ ] Crear bloqueo de día completo para toda la barbería (ej: feriado)

---

## 10. REQUISITOS FUNCIONALES

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema calcula disponibilidad en tiempo real basado en horario del barbero, bloqueos y citas existentes | Alta |
| RF-02 | Si dos clientes intentan el mismo slot simultáneamente, solo el primero confirma; al segundo se le muestra error con opción de elegir otro horario | Alta |
| RF-03 | Los horarios disponibles se recalculan dinámicamente según la duración del servicio seleccionado | Alta |
| RF-04 | No se permiten reservas con más de 20 días de anticipación | Alta |
| RF-05 | No se permiten reservas en el pasado | Alta |
| RF-06 | Al confirmar una cita, el barbero asignado recibe notificación in-app inmediata | Alta |
| RF-07 | Cada barbero solo puede ver y gestionar su propia agenda | Alta |
| RF-08 | El super admin puede ver y gestionar la agenda de todos los barberos | Alta |
| RF-09 | Los servicios disponibles en el flujo de reserva dependen del barbero seleccionado | Alta |
| RF-10 | El cliente puede descargar el resumen de su cita como imagen PNG | Alta |
| RF-11 | El barbero puede bloquear cualquier fecha o bloque horario manualmente | Alta |
| RF-12 | Un barbero puede tener múltiples bloques horarios en el mismo día | Alta |
| RF-13 | Al cancelar una cita, el slot queda disponible inmediatamente para nuevas reservas | Alta |
| RF-14 | El barbero tiene acceso directo a WhatsApp del cliente desde la plataforma | Alta |
| RF-15 | Si un cliente reserva con el mismo teléfono, se reutiliza su registro en clients | Media |
| RF-16 | El super admin puede desactivar barberos y servicios sin eliminarlos | Media |
| RF-17 | Los bloques horarios (slots) se generan respetando la duración exacta de cada servicio | Alta |

---

## 11. REQUISITOS NO FUNCIONALES

| Categoría | Requisito |
|---|---|
| Performance | Cálculo de disponibilidad en menos de 500ms |
| Concurrencia | Sin dobles reservas bajo ninguna circunstancia |
| Disponibilidad | 99% uptime usando Supabase + Vercel |
| Seguridad | Rutas de admin y barbero protegidas con autenticación JWT |
| Seguridad | RLS en Supabase protege cada query a nivel de base de datos |
| Costo | Infraestructura dentro de $20 USD/mes |
| Responsive | Mobile-first. La mayoría de clientes reservan desde el celular |
| Timezone | Todo en America/Costa_Rica. Almacenamiento en UTC, display en GMT-6 |
| Idioma | Solo español |
| Escalabilidad | Arquitectura multi-tenant desde el inicio aunque MVP sea mono-tenant |

---

## 12. PERMISOS POR ROL

| Acción | Cliente | Barbero | Super Admin |
|---|---|---|---|
| Ver landing y reservar | ✅ | ✅ | ✅ |
| Ver agenda propia | ❌ | ✅ | ✅ |
| Ver agenda de todos los barberos | ❌ | ❌ | ✅ |
| Cambiar estado de cita propia | ❌ | ✅ | ✅ |
| Cancelar cualquier cita | ❌ | ❌ | ✅ |
| Gestionar disponibilidad propia | ❌ | ✅ | ✅ |
| Gestionar disponibilidad de otros | ❌ | ❌ | ✅ |
| Crear/editar servicios | ❌ | ❌ | ✅ |
| Crear/editar barberos | ❌ | ❌ | ✅ |
| Crear bloqueos globales | ❌ | ❌ | ✅ |
| Ver notificaciones propias | ❌ | ✅ | ✅ |

**Implementación:** Row Level Security (RLS) en Supabase. Cada política de seguridad se define a nivel de base de datos. El JWT del usuario contiene su `role` y `tenant_id`. Las políticas RLS filtran automáticamente los datos por tenant y por rol.

---

## 13. NOTIFICACIONES

### In-app para barbero — nueva cita

```
TRIGGER: Se confirma una nueva cita
  ↓
Supabase Database Trigger:
  INSERT INTO notifications (user_id, type, appointment_id)
  VALUES (barber.user_id, 'new_appointment', appointment.id)
  ↓
Supabase Realtime:
  El cliente web del barbero recibe el evento via websocket
  ↓
Frontend:
  1. Badge en el ícono de notificaciones se incrementa (+1)
  2. Toast notification: "Nueva cita — [nombre del cliente] — [hora]"
  3. La cita aparece en la agenda sin necesidad de refrescar
```

### Confirmación visual para el cliente

Al completar el flujo de reserva:
- Pantalla de éxito con resumen completo de la cita
- Botón "Descargar confirmación" que genera una imagen PNG con:
  - Logo de la barbería
  - "Tu cita está confirmada"
  - Nombre del cliente
  - Barbero asignado
  - Servicio reservado
  - Fecha y hora
  - Número de WhatsApp de la barbería

No hay notificaciones por WhatsApp, SMS ni correo en el MVP.

---

## 14. ARQUITECTURA Y ESTRUCTURA DE CARPETAS

### Estructura de la aplicación Next.js

```
/app
  /page.tsx                          ← Landing page pública
  /reservar
    /page.tsx                        ← Wizard de reserva (multi-paso)
  /confirmacion
    /[appointmentId]/page.tsx        ← Pantalla de éxito post-reserva

  /admin
    /layout.tsx                      ← Middleware: protegido, solo super_admin
    /page.tsx                        ← Dashboard global
    /barberos
      /page.tsx                      ← Lista y gestión de barberos
      /[id]/page.tsx                 ← Editar barbero específico
    /servicios
      /page.tsx                      ← Lista y gestión de servicios
    /agenda
      /page.tsx                      ← Agenda global de todos los barberos
    /configuracion
      /page.tsx                      ← Bloqueos globales y config general

  /barbero
    /layout.tsx                      ← Middleware: protegido, solo barber
    /page.tsx                        ← Dashboard personal
    /agenda
      /page.tsx                      ← Agenda personal con cambio de estado
    /disponibilidad
      /page.tsx                      ← Gestión de horarios y bloqueos
    /notificaciones
      /page.tsx                      ← Lista de notificaciones

  /login
    /page.tsx                        ← Login para barbero y admin

/components
  /booking
    /BarberSelector.tsx
    /ServiceSelector.tsx
    /DatePicker.tsx
    /TimeSlotPicker.tsx
    /ClientForm.tsx
    /BookingSummary.tsx
    /ConfirmationCard.tsx            ← Componente que se convierte a imagen PNG
  /admin
    /BarberForm.tsx
    /ServiceForm.tsx
    /AppointmentTable.tsx
    /GlobalCalendar.tsx
  /barber
    /DailyAgenda.tsx
    /AppointmentCard.tsx
    /AvailabilityForm.tsx
    /NotificationBell.tsx
  /ui
    /Button.tsx
    /Modal.tsx
    /Toast.tsx
    /Badge.tsx

/lib
  /supabase
    /client.ts                       ← Cliente browser
    /server.ts                       ← Cliente server (SSR)
    /types.ts                        ← Tipos generados de la DB
  /booking-engine
    /availability.ts                 ← Algoritmo de disponibilidad (pura lógica)
    /slots.ts                        ← Generación de slots de tiempo
    /validators.ts                   ← Validaciones de reglas de negocio
    /types.ts                        ← Tipos del dominio (Slot, TimeBlock, etc.)
  /utils
    /timezone.ts                     ← Helpers de timezone Costa Rica
    /formatting.ts                   ← Formateo de fechas, precios, etc.

/supabase
  /migrations
    /001_initial_schema.sql
    /002_rls_policies.sql
    /003_functions_and_triggers.sql
  /functions
    /create-appointment
      /index.ts                      ← Edge Function transaccional
    /get-availability
      /index.ts                      ← Edge Function de disponibilidad
```

### Separación clave: `/lib/booking-engine/`

Esta carpeta contiene **toda la lógica de negocio del sistema de citas**, completamente desacoplada de:
- La UI (no importa nada de React ni Next.js)
- Supabase directamente (recibe datos como parámetros, no hace queries)

Esto permite:
- Testear la lógica en aislamiento
- Reutilizarla en otros proyectos o convertirla en un paquete npm
- Cambiar de base de datos en el futuro sin tocar la lógica

---

## 15. PLAN DE DESARROLLO — 2 SEMANAS

### SEMANA 1 — Base y flujo principal

**Días 1-2: Setup y modelo de datos**
- [ ] Inicializar proyecto Next.js 14 + Tailwind
- [ ] Configurar Supabase: proyecto, tablas, RLS
- [ ] Configurar Supabase Auth con roles
- [ ] Deploy inicial en Vercel (vacío)
- [ ] Insertar datos seed: 1 tenant, servicios de ejemplo, 5 barberos

**Días 3-4: Booking Engine**
- [ ] Implementar `/lib/booking-engine/availability.ts`
- [ ] Implementar `/lib/booking-engine/slots.ts`
- [ ] Crear Edge Function `get-availability`
- [ ] Crear Edge Function `create-appointment` con manejo de concurrencia
- [ ] Probar concurrencia con inserciones simultáneas

**Días 5-7: Landing page y wizard de reserva**
- [ ] Landing page con info de la barbería, equipo y servicios
- [ ] Wizard de reserva completo (6 pasos)
- [ ] Integración con Supabase Realtime para slots en tiempo real
- [ ] Pantalla de éxito con descarga de imagen PNG
- [ ] Manejo de error de concurrencia

---

### SEMANA 2 — Paneles y entrega

**Días 8-9: Panel del barbero**
- [ ] Login y auth
- [ ] Dashboard personal
- [ ] Agenda con cambio de estado de citas
- [ ] Botón WhatsApp directo al cliente
- [ ] Gestión de disponibilidad (horario semanal + bloqueos)
- [ ] Notificaciones in-app con Supabase Realtime

**Días 10-11: Panel del super admin**
- [ ] Dashboard global
- [ ] Gestión de barberos (CRUD + asignación de servicios)
- [ ] Gestión de servicios (CRUD)
- [ ] Vista de agenda global con filtros
- [ ] Bloqueos globales

**Días 12-14: QA y entrega**
- [ ] Pruebas de flujo completo
- [ ] Pruebas de concurrencia
- [ ] Verificación de RLS (que barbero no vea datos de otro)
- [ ] Ajustes de UI mobile
- [ ] Deploy final
- [ ] Entrega a Harvin con documentación de uso

---

## 16. DECISIONES TÉCNICAS CRÍTICAS

### Timezone
- **Todo se almacena en UTC en la base de datos**
- **Todo se muestra en America/Costa_Rica (UTC-6)**
- Usar la librería `date-fns-tz` para conversiones
- El calendario del cliente debe mostrar horas en Costa Rica time
- Nunca mezclar timezones en las queries

### Slots de tiempo
- El intervalo entre slots es **igual a la duración del servicio**
- Si un servicio dura 45 minutos, los slots son: 8:00, 8:45, 9:30...
- No hay solapamiento posible entre citas del mismo barbero

### Identificación de cliente
- El teléfono es el identificador único del cliente dentro de un tenant
- Si el número ya existe: se reutiliza el `client_id` existente
- No se pide confirmación al cliente, es transparente

### Estados de cita
- Solo `pending` bloquea el slot en el unique index parcial
- `completed`, `cancelled`, `no_show` liberan el slot para nuevas reservas
- No se puede volver a `pending` desde cualquier otro estado

### Autenticación
- Clientes: sin auth, sin cuenta, sin sesión
- Barberos y admin: Supabase Auth con email + password
- El middleware de Next.js protege las rutas `/admin/*` y `/barbero/*`
- El rol se lee del JWT para mostrar la UI correcta

---

## 17. EDGE CASES Y CÓMO MANEJARLOS

| Edge Case | Solución |
|---|---|
| Dos clientes reservan el mismo slot simultáneamente | Transacción con FOR UPDATE + unique index parcial. El segundo recibe error y debe elegir otro horario |
| Cliente intenta reservar en fecha pasada | Validación en servidor (Edge Function), no solo en frontend |
| Cliente intenta reservar a más de 20 días | Validación en servidor + días deshabilitados en el calendario |
| Barbero bloquea un día que tiene citas pendientes | El sistema permite el bloqueo pero las citas existentes permanecen. El barbero debe cancelarlas manualmente |
| Se desactiva un servicio que tiene citas futuras | Las citas pendientes permanecen. El servicio desaparecerá de futuras reservas |
| Se desactiva un barbero con citas pendientes | Las citas permanecen. El barbero desaparece del flujo de reservas para nuevas citas |
| Cliente reserva con mismo teléfono pero diferente nombre | Se reutiliza el client_id del teléfono existente. El nombre no se actualiza en el MVP |
| Barbero no tiene horario configurado | El calendario no muestra ningún día disponible para ese barbero |
| Servicio sin barberos asignados | No aparece como opción en el flujo de reserva |
| Intento de acceso a ruta protegida sin auth | Middleware redirige a `/login` |
| Barbero intenta ver citas de otro barbero | RLS en Supabase rechaza la query con error de permisos |

---

## 18. ERRORES COMUNES A EVITAR

| Error | Consecuencia | Prevención |
|---|---|---|
| Calcular disponibilidad solo en el frontend | Dobles reservas, datos desincronizados | Siempre calcular en servidor via Edge Function |
| No usar transacción al crear cita | Dobles reservas bajo carga concurrente | Edge Function con FOR UPDATE |
| RLS mal configurado | Barbero ve datos de otro / cliente accede al admin | Probar cada política RLS explícitamente antes de lanzar |
| No definir timezone desde el inicio | Citas a horas incorrectas, bugs difíciles de depurar | Usar UTC en DB + date-fns-tz en frontend desde el día 1 |
| Slots hardcodeados de 30 min | No respeta duración real de cada servicio | Slots dinámicos basados en `duration_minutes` del servicio |
| No validar el límite de 20 días en servidor | Cliente puede manipular el frontend y reservar más lejos | Validar en Edge Function, no solo en el calendario |
| Eliminar registros en lugar de desactivarlos | Pérdida de historial, errores en FK | Siempre usar `active = false`, nunca DELETE en producción |
| Guardar el `end_time` como calculado en JS | Errores de DST o timezone | Calcular `end_time` en el servidor al crear la cita |
| Hacer demasiado en el MVP | No entregar en 2 semanas | Si no está en este documento, es v2 |

---

## 19. ESCALABILIDAD FUTURA

La arquitectura del MVP está diseñada para crecer a SaaS sin reescribir el núcleo.

### Lo que ya está preparado en el MVP
- Tabla `tenants` existente desde el inicio
- Todas las tablas tienen `tenant_id`
- RLS filtra automáticamente por tenant con el JWT
- El booking engine es independiente del tenant (recibe IDs como parámetros)
- El campo `active` en `tenants` permite activar/desactivar barberías (modelo de mensualidad)

### Para agregar una nueva barbería en el futuro
1. Crear registro en `tenants` (activo = true tras validar pago)
2. Crear usuario super_admin para el dueño
3. El dueño configura sus barberos y servicios desde su panel
4. Cada barbería vive en su propio subdominio o ruta

### Modelo de monetización futuro
- Mensualidad fija por barbería
- Activación manual: `UPDATE tenants SET active = TRUE WHERE id = X`
- Si no paga: `active = FALSE` → todas las rutas del tenant retornan 403

---

## NOTAS FINALES PARA CLAUDE CODE

1. **Este documento es la fuente de verdad.** Ante cualquier duda, la respuesta está aquí.
2. **Construir módulo por módulo**, en el orden del plan de desarrollo.
3. **El booking engine va primero.** Si esa lógica está mal, todo lo demás falla.
4. **RLS desde el inicio**, no como afterthought. Configurarlo en las migraciones.
5. **Mobile-first siempre.** Los clientes reservan desde el celular.
6. **No agregar features que no estén en este documento** sin consultar. El MVP tiene scope definido.
7. **Timezone = America/Costa_Rica.** Sin excepciones.
8. **Nunca hacer DELETE en producción.** Siempre `active = false`.
9. **Todo el contenido en español.** Variables y código en inglés, UI en español.
10. **Si algo no es claro en este documento, preguntar antes de asumir.**
