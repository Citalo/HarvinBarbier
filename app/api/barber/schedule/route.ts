import { NextRequest, NextResponse } from 'next/server'
import { getSessionBarber } from '@/lib/supabase/getSessionBarber'
import { createAdminClient } from '@/lib/supabase/server'

interface ScheduleRow {
  day_of_week: number
  start_time: string
  end_time: string
}

export async function POST(request: NextRequest) {
  const barber = await getSessionBarber()
  if (!barber) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { rows } = await request.json() as { rows: ScheduleRow[] }

  const admin = createAdminClient()

  const { error: deleteError } = await admin
    .from('working_schedules')
    .delete()
    .eq('barber_id', barber.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Error al limpiar horario: ' + deleteError.message }, { status: 500 })
  }

  if (rows.length > 0) {
    const { error: insertError } = await admin
      .from('working_schedules')
      .insert(rows.map(r => ({ ...r, barber_id: barber.id, active: true })))

    if (insertError) {
      return NextResponse.json({ error: 'Error al guardar horario: ' + insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
