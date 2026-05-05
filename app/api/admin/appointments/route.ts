import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function assertAdmin() {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), admin: null }

  const admin = createAdminClient()
  const { data: caller } = await admin
    .from('users')
    .select('role, active')
    .eq('id', session.user.id)
    .single()

  if (caller?.role !== 'super_admin' || caller?.active === false) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), admin: null }
  }
  return { error: null, admin }
}

export async function GET(req: NextRequest) {
  const { error: authError, admin } = await assertAdmin()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const barber_id = searchParams.get('barber_id')

  let query = admin!
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
  const { error: authError, admin } = await assertAdmin()
  if (authError) return authError

  const { id, status } = await req.json()
  const { error } = await admin!
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
