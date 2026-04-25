import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateBookingParams, validateTimeFormat } from '@/lib/booking-engine/validators'
import type { CreateAppointmentInput } from '@/lib/booking-engine/types'

// POST /api/appointments
export async function POST(request: Request) {
  let body: CreateAppointmentInput

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de request inválido' }, { status: 400 })
  }

  const { barberId, serviceId, date, startTime, clientFirstName, clientLastName, clientPhone, tenantId, notes } = body

  if (!barberId || !serviceId || !date || !startTime || !clientFirstName || !clientLastName || !clientPhone || !tenantId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const dateValidation = validateBookingParams({ barberId, serviceId, date })
  if (!dateValidation.valid) {
    return NextResponse.json({ error: dateValidation.error, code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const timeValidation = validateTimeFormat(startTime)
  if (!timeValidation.valid) {
    return NextResponse.json({ error: timeValidation.error, code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const cleanPhone = clientPhone.replace(/\D/g, '').replace(/^506/, '')
  if (cleanPhone.length !== 8) {
    return NextResponse.json({ error: 'Número de teléfono inválido (debe tener 8 dígitos)' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .eq('active', true)
    .single()

  if (serviceError || !serviceData) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const service = serviceData as { duration_minutes: number }
  const [hours, minutes] = startTime.split(':').map(Number)
  const endMinutes = hours * 60 + minutes + service.duration_minutes
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientId, error: clientError } = await (supabase as any).rpc('upsert_client', {
    p_tenant_id: tenantId,
    p_first_name: clientFirstName.trim(),
    p_last_name: clientLastName.trim(),
    p_phone: cleanPhone,
  })

  if (clientError || !clientId) {
    console.error('Error creando cliente:', clientError)
    return NextResponse.json({ error: 'Error procesando datos del cliente', code: 'SERVER_ERROR' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointmentId, error: appointmentError } = await (supabase as any).rpc(
    'create_appointment_atomic',
    {
      p_tenant_id: tenantId,
      p_client_id: clientId,
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_date: date,
      p_start_time: startTime + ':00',
      p_end_time: endTime + ':00',
      p_notes: notes ?? null,
    }
  )

  if (appointmentError) {
    console.error('Error creando cita:', appointmentError)
    return NextResponse.json({ error: 'Error al procesar la reserva', code: 'SERVER_ERROR' }, { status: 500 })
  }

  if (!appointmentId) {
    return NextResponse.json(
      { error: 'Ese horario acaba de ser tomado. Por favor elegí otro.', code: 'SLOT_TAKEN' },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true, appointmentId }, { status: 201 })
}
