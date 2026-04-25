import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify session via regular client (respects cookies)
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  // Use admin client to bypass RLS when checking role
  const { data: callerRows } = await admin.from('users').select('role, tenant_id').eq('id', session.user.id).limit(1)
  const caller = callerRows?.[0]
  if (!caller) return NextResponse.json({ error: 'Usuario no encontrado en users' }, { status: 403 })
  if (caller.role !== 'super_admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  // Get tenant_id: from caller, or fallback to first tenant in DB
  let tenantId = caller?.tenant_id
  if (!tenantId) {
    const { data: tenant } = await admin.from('tenants').select('id').limit(1).single()
    tenantId = tenant?.id
  }
  if (!tenantId) return NextResponse.json({ error: 'No se encontró tenant' }, { status: 500 })

  const body = await request.json()
  const { name, bio, avatar_url, email, password } = body

  // Create auth user (email auto-confirmed, no email sent)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Error al crear usuario auth' }, { status: 400 })
  }

  const newUserId = authData.user.id

  // Insert into public.users
  const { error: userError } = await admin.from('users').insert({
    id: newUserId,
    tenant_id: tenantId,
    role: 'barber',
    name,
    email,
  })
  if (userError) {
    await admin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: 'Error al crear registro de usuario: ' + userError.message }, { status: 500 })
  }

  // Insert into barbers
  const { error: barberError } = await admin.from('barbers').insert({
    user_id: newUserId,
    tenant_id: tenantId,
    name,
    bio: bio || null,
    avatar_url: avatar_url || null,
    active: true,
  })
  if (barberError) {
    await admin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: 'Error al crear barbero: ' + barberError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
