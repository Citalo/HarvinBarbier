import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), admin: null, callerTenantId: null }
  const admin = createAdminClient()
  const { data: caller } = await admin.from('users').select('role, tenant_id').eq('id', session.user.id).single()
  if (caller?.role !== 'super_admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), admin: null, callerTenantId: null }
  return { error: null, admin, callerTenantId: (caller?.tenant_id as string | null) ?? null }
}

export async function POST(request: NextRequest) {
  const { error: authError, admin, callerTenantId } = await assertAdmin()
  if (authError) return authError

  const { name, description, price, duration_minutes } = await request.json()

  let tenantId: string | null = callerTenantId
  if (!tenantId) {
    const { data: tenant } = await admin!.from('tenants').select('id').limit(1).single()
    tenantId = (tenant?.id as string | undefined) ?? null
  }
  if (!tenantId) return NextResponse.json({ error: 'No se encontró tenant' }, { status: 500 })

  const { error } = await admin!.from('services').insert([{
    name,
    description: description || null,
    price,
    duration_minutes,
    tenant_id: tenantId,
  }])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
