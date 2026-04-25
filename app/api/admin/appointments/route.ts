import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const barber_id = searchParams.get('barber_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('appointments')
    .select('*, client:clients(first_name, last_name, phone), barber:barbers(name), service:services(name, price)')
    .order('start_time', { ascending: true })

  if (date) query = query.eq('date', date)
  if (status && status !== 'all') query = query.eq('status', status)
  if (barber_id && barber_id !== 'all') query = query.eq('barber_id', barber_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  const { error } = await createAdminClient()
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
