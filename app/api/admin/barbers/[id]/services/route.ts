import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: caller } = await admin.from('users').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { serviceIds } = await request.json() as { serviceIds: string[] }
  const barberId = params.id

  const { error: deleteError } = await admin.from('barber_services').delete().eq('barber_id', barberId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (serviceIds.length > 0) {
    const { error: insertError } = await admin.from('barber_services').insert(
      serviceIds.map(serviceId => ({ barber_id: barberId, service_id: serviceId }))
    )
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
