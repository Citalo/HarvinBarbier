import { AvailabilityParams, AvailabilityResult, TimeSlot } from './types'
import { generateAllDaySlots } from './slots'
import { slotIsInPast, slotOverlapsBlock } from './validators'

// Motor principal de disponibilidad.
// Recibe datos ya cargados desde la DB (no hace queries directamente).
// Retorna la lista de horarios disponibles como strings "HH:MM".
export function calculateAvailableSlots(
  params: AvailabilityParams
): AvailabilityResult {
  const {
    workingSchedules,
    scheduleBlocks,
    existingAppointments,
    serviceDurationMinutes,
    date,
  } = params

  // El barbero no trabaja ese día
  if (workingSchedules.length === 0) {
    return {
      slots: [],
      isFullyBlocked: true,
      reason: 'El barbero no trabaja este día',
    }
  }

  // Verificar bloqueo de día completo (startTime === null)
  const hasFullDayBlock = scheduleBlocks.some(
    (b) => b.startTime === null || b.endTime === null
  )
  if (hasFullDayBlock) {
    return {
      slots: [],
      isFullyBlocked: true,
      reason: 'No hay disponibilidad para esta fecha',
    }
  }

  // Generar todos los slots posibles para el día
  const allSlots: TimeSlot[] = generateAllDaySlots(workingSchedules, serviceDurationMinutes)

  // Filtrar slots no disponibles
  const availableSlots = allSlots.filter((slot) => {
    // Slot en el pasado (para el día de hoy)
    if (slotIsInPast(date, slot.startTime)) return false

    // Solapamiento con algún bloqueo manual
    const blockedBySchedule = scheduleBlocks.some((block) =>
      slotOverlapsBlock(slot.startTime, slot.endTime, block)
    )
    if (blockedBySchedule) return false

    // Solapamiento con alguna cita existente
    const blockedByAppointment = existingAppointments.some((appt) =>
      slotOverlapsBlock(slot.startTime, slot.endTime, appt)
    )
    if (blockedByAppointment) return false

    return true
  })

  return {
    slots: availableSlots.map((s) => s.startTime),
    isFullyBlocked: false,
  }
}
