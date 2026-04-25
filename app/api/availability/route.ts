import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateAvailableSlots } from '@/lib/booking-engine/availability'
import { validateBookingParams } from '@/lib/booking-engine/validators'
import type { TimeRange, ScheduleBlock } from '@/lib/booking-engine/types'

// GET /api/availability?barberId=X&serviceId=Y&date=YYYY-MM-DD
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barberId = searchParams.get('barberId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')

  if (!barberId || !serviceId || !date) {
    return NextResponse.json(
      { error: 'Parámetros requeridos: barberId, serviceId, date' },
      { status: 400 }
    )
  }

  const validation = validateBookingParams({ barberId, serviceId, date })
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const supabase = createAdminClient()
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  const [serviceResult, schedulesResult, blocksResult, appointmentsResult] =
    await Promise.all([
      supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .eq('active', true)
        .single(),

      supabase
        .from('working_schedules')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true),

      supabase
        .from('schedule_blocks')
        .select('start_time, end_time, barber_id, tenant_id')
        .eq('date', date)
        .or(`barber_id.eq.${barberId},barber_id.is.null`),

      supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', date)
        .eq('status', 'pending'),
    ])

  if (serviceResult.error || !serviceResult.data) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  if (schedulesResult.error) {
    console.error('Error fetching working schedules:', schedulesResult.error)
    return NextResponse.json({ error: 'Error cargando horarios de trabajo' }, { status: 500 })
  }

  if (blocksResult.error) {
    console.error('Error fetching schedule blocks:', blocksResult.error)
    return NextResponse.json({ error: 'Error cargando bloqueos de horario' }, { status: 500 })
  }

  if (appointmentsResult.error) {
    console.error('Error fetching appointments:', appointmentsResult.error)
    return NextResponse.json({ error: 'Error cargando citas existentes' }, { status: 500 })
  }

  const service = serviceResult.data as { duration_minutes: number }

  const workingSchedules: TimeRange[] = ((schedulesResult.data ?? []) as { start_time: string; end_time: string }[]).map((ws) => ({
    startTime: ws.start_time.slice(0, 5),
    endTime: ws.end_time.slice(0, 5),
  }))

  const scheduleBlocks: ScheduleBlock[] = ((blocksResult.data ?? []) as { start_time: string | null; end_time: string | null }[]).map((b) => ({
    startTime: b.start_time ? b.start_time.slice(0, 5) : null,
    endTime: b.end_time ? b.end_time.slice(0, 5) : null,
  }))

  const existingAppointments: TimeRange[] = ((appointmentsResult.data ?? []) as { start_time: string; end_time: string }[]).map((a) => ({
    startTime: a.start_time.slice(0, 5),
    endTime: a.end_time.slice(0, 5),
  }))

  const result = calculateAvailableSlots({
    workingSchedules,
    scheduleBlocks,
    existingAppointments,
    serviceDurationMinutes: service.duration_minutes,
    date,
  })

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  })
}
