import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionBarber } from '@/lib/supabase/getSessionBarber'

export async function GET(request: NextRequest) {
  const barber = await getSessionBarber()
  if (!barber) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, client:clients(first_name, last_name, phone), service:services(name, duration_minutes)')
    .eq('barber_id', barber.id)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const barber = await getSessionBarber()
  if (!barber) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, status } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('barber_id', barber.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
