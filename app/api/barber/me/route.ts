import { NextResponse } from 'next/server'
import { getSessionBarber } from '@/lib/supabase/getSessionBarber'

export async function GET() {
  const barber = await getSessionBarber()
  if (!barber) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(barber)
}
