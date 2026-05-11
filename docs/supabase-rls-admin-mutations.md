# Patrón: Mutaciones admin con Supabase + RLS

Documento portable de lecciones aprendidas. Aplicar en cualquier proyecto Next.js + Supabase con RLS.

---

## El problema

Si usás el cliente browser de Supabase (`createBrowserClient`, anon key) para hacer **INSERT/UPDATE/DELETE** desde una página admin, las operaciones pasan por RLS. Si la política depende de un campo del usuario (`tenant_id`, `role`, `active`) y ese campo está mal seteado, las operaciones fallan — pero a veces **fallan en silencio**.

### Ejemplo de política típica que falla silenciosamente

```sql
CREATE POLICY "barbers_admin_update"
  ON barbers FOR UPDATE
  USING (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id())
  WITH CHECK (get_my_role() = 'super_admin' AND tenant_id = get_my_tenant_id());
```

Donde `get_my_tenant_id()` es:
```sql
SELECT tenant_id FROM public.users WHERE id = auth.uid()
```

Si el admin tiene `users.tenant_id = NULL`, la función devuelve `NULL`. En SQL, `tenant_id = NULL` siempre es **falso** (nunca `true`, nunca `false` lógico — es `UNKNOWN`, que evalúa como falso en RLS). La política rechaza la operación.

### La trampa: comportamiento distinto según operación

| Operación | Cláusula RLS evaluada | Cuando falla | Comportamiento de Supabase |
|---|---|---|---|
| `INSERT` | `WITH CHECK` | post-evaluación | **Error explícito** (`code: 42501`, "new row violates row-level security policy") |
| `UPDATE` | `USING` (filtra filas) | pre-evaluación | **0 filas afectadas, sin error** |
| `UPDATE` | `WITH CHECK` (valida nuevos valores) | post-evaluación | Error explícito |
| `DELETE` | `USING` | pre-evaluación | **0 filas afectadas, sin error** |
| `SELECT` | `USING` | filtra | Array vacío, sin error |

**El caso peligroso**: `UPDATE`/`DELETE` con `USING` que falla → tu código piensa que funcionó (no hubo error) y muestra "Guardado correctamente". Pero la BD no cambió.

```typescript
// ❌ Esto se ve correcto, pero puede mentir
const { error } = await supabase.from('barbers').update({ active: false }).eq('id', id)
if (error) showError()  // Nunca entra acá si RLS USING falla
else showSuccess('Eliminado')  // Mentira: nada se eliminó
```

---

## El fix: API routes server-side con service role

Mover todas las mutaciones admin a route handlers que usan el **service role key** (bypasea RLS) + validación explícita de permisos.

### Estructura

```
app/api/admin/
├── barbers/
│   ├── route.ts          # POST crear
│   └── [id]/
│       ├── route.ts      # PATCH editar / "deactivate"
│       └── services/
│           └── route.ts  # PATCH actualizar servicios asignados
└── services/
    ├── route.ts          # POST crear
    └── [id]/
        └── route.ts      # PATCH editar, DELETE soft-delete
```

### Template del route handler

```typescript
// app/api/admin/<recurso>/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface RouteContext { params: { id: string } }

// Helper reutilizable
async function assertAdmin() {
  const sessionClient = createClient()           // anon, lee sesión de cookies
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), admin: null }

  const admin = createAdminClient()              // service role, bypasea RLS
  const { data: caller } = await admin.from('users').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'super_admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), admin: null }

  return { error: null, admin }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error: authError, admin } = await assertAdmin()
  if (authError) return authError

  const body = await request.json()
  const { error } = await admin!.from('<tabla>').update(body).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

### Template del cliente browser

```typescript
// En la página admin
const res = await fetch(`/api/admin/<recurso>/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...payload }),
})
if (!res.ok) {
  const errBody = await res.json().catch(() => ({}))
  // CRÍTICO: mostrar status + mensaje, no toast genérico
  setToast({ type: 'error', message: `Error al guardar (${res.status}: ${errBody?.error ?? 'desconocido'})` })
  return
}
```

### Las lecturas (SELECT) sí pueden quedar en el browser

Si la política `SELECT` es pública (ej: `USING (TRUE)` o `USING (active = TRUE OR get_my_role() ...)`), no hay problema en leer desde el browser. Las lecturas no tienen el problema del fallo silencioso porque devuelven array vacío visible, no un éxito falso.

---

## Reglas de oro

### 1. **Nunca confíes en `.error == null` para mutaciones que pasan por RLS**
RLS `USING` filtra silenciosamente. Si necesitás verificar que algo se actualizó:
- Opción A (preferida): usar el service role en un API route
- Opción B: pedir las filas afectadas con `.select()` después del `.update()` y verificar que no esté vacío

### 2. **Toasts deben mostrar el error real, no un mensaje genérico**
```typescript
// ❌ Imposible de debuggear
setToast({ message: 'Error al guardar' })

// ✅ Te dice exactamente qué pasó
const errBody = await res.json().catch(() => ({}))
setToast({ message: `Error al guardar (${res.status}: ${errBody?.error ?? 'desconocido'})` })
```

Los códigos te dicen la causa al instante:
- `404` → ruta no existe (¿reiniciaste el dev server?)
- `401` → sesión expirada
- `403` → no es super_admin
- `500` → error de BD (el mensaje viene de PostgreSQL)

### 3. **Mutaciones admin van por API route con service role. Sin excepción.**
La regla simple: si la operación requiere ser admin, **no la hagas desde el browser**.

```typescript
// ❌ Frágil — depende de que RLS funcione perfecto Y de que el admin tenga todos sus campos OK
const supabase = createClient()
await supabase.from('services').insert([{ ...payload, tenant_id }])

// ✅ Robusto — RLS no aplica, validación explícita
await fetch('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) })
```

### 4. **Las políticas RLS son defensa-en-profundidad, NO autenticación**
Tu app debe asumir que RLS puede fallar (campos NULL, sesión expirada, etc). La autenticación real va en el API route — RLS protege contra accesos directos al postgrest si la auth de la app se rompe.

### 5. **Cuidado con comparaciones NULL en RLS**
```sql
-- Esto siempre es FALSO si get_my_tenant_id() devuelve NULL
tenant_id = get_my_tenant_id()
```

Si tu política depende de un campo que puede ser NULL, considerá:
```sql
-- Más explícito y predecible
tenant_id IS NOT NULL AND tenant_id = get_my_tenant_id()
```

Y asegurate de que las columnas críticas (`tenant_id`, `role`, `active`) tengan `NOT NULL` o defaults seguros.

### 6. **SECURITY DEFINER funciones que devuelven NULL son trampa**
Después de migración 008 cambiamos `get_my_role()` para que filtre por `active = TRUE`. Si un usuario tenía `active = NULL` (no FALSE, NULL), la función devolvía NULL y TODAS sus políticas RLS empezaban a fallar. Si vas a agregar filtros a estas funciones, hacer primero `UPDATE users SET active = FALSE WHERE active IS NULL` para evitar este caso.

---

## Checklist al empezar un proyecto nuevo

- [ ] Tabla `users` con `active BOOLEAN NOT NULL DEFAULT TRUE` (no permitir NULL)
- [ ] Tabla `users` con `tenant_id` (NOT NULL si es multi-tenant) seteado al crear cualquier usuario admin
- [ ] Helper `assertAdmin()` definido una vez y reutilizado en todos los `/api/admin/*`
- [ ] Convención: **todas** las mutaciones admin pasan por `/api/admin/*` (jamás `createClient().from('tabla').insert/update/delete()` en componentes admin)
- [ ] Lecturas admin sí pueden quedar en el browser si tienen política `SELECT` pública o si filtran por `active = TRUE`
- [ ] Toasts genéricos prohibidos en handlers de fetch — siempre incluir status + body del error
- [ ] Middleware Next.js valida session + rol antes de servir cualquier `/admin/*` o `/api/admin/*`
- [ ] No correr el proyecto Next.js en una carpeta sincronizada por OneDrive/Dropbox/iCloud (rompe los symlinks de `.next/`). Si es inevitable, excluir `.next/` y `node_modules/` de la sincronización.

---

## Síntomas que disparan revisión

Si en tu app ves cualquiera de estos:
- "Cambios guardados correctamente" pero al recargar nada cambió
- Eliminar algo y que siga apareciendo
- Un usuario admin que claramente no es admin (`role = 'admin'` en vez de `'super_admin'`, por ejemplo)
- Operación INSERT que falla con error pero UPDATE/DELETE del mismo usuario "funciona" (esto es el patrón más claro de RLS silent fail)

Investigá inmediatamente: `SELECT id, role, active, tenant_id FROM public.users WHERE id = '<uuid>'` y verificá que ningún campo crítico esté NULL.
