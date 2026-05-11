import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface RouteContext { params: { id: string } }

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

  const { name, description, price, duration_minutes } = await request.json()
  const { error } = await admin!
    .from('services')
    .update({ name, description: description || null, price, duration_minutes })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { error: authError, admin } = await assertAdmin()
  if (authError) return authError

  const { error } = await admin!.from('services').update({ active: false }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
