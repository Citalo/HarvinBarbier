import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: { id: string }
}

async function assertAdmin() {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), admin: null }
  const admin = createAdminClient()
  const { data: caller } = await admin.from('users').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'super_admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), admin: null }
  return { error: null, admin }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error: authError, admin } = await assertAdmin()
  if (authError) return authError

  const barberId = params.id
  const body = await request.json()

  if (body.action === 'deactivate') {
    const { data: barber } = await admin!.from('barbers').select('user_id').eq('id', barberId).single()

    const { error: barberError } = await admin!.from('barbers').update({ active: false }).eq('id', barberId)
    if (barberError) return NextResponse.json({ error: barberError.message }, { status: 500 })

    if (barber?.user_id) {
      const { error: userError } = await admin!.from('users').update({ active: false }).eq('id', barber.user_id)
      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // Update barber info
  const { name, bio, avatar_url, avatar_position } = body
  const { error } = await admin!
    .from('barbers')
    .update({ name, bio: bio || null, avatar_url, avatar_position })
    .eq('id', barberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
