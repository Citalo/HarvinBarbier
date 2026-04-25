import { TimeRange, TimeSlot } from './types'

// Convierte "HH:MM" a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Convierte minutos desde medianoche a "HH:MM"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Genera slots consecutivos dentro de un bloque de horario.
// Cada slot dura exactamente durationMinutes.
// El siguiente slot inicia donde termina el anterior (sin solapamiento).
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const endMinutes = timeToMinutes(endTime)
  let currentStart = timeToMinutes(startTime)

  while (true) {
    const currentEnd = currentStart + durationMinutes
    if (currentEnd > endMinutes) break

    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(currentEnd),
      isAvailable: true,
    })

    currentStart = currentEnd
  }

  return slots
}

// Genera todos los slots posibles para múltiples bloques horarios del día.
// Ej: 8am-12pm + 2pm-6pm con servicio de 45min → slots de ambos bloques.
export function generateAllDaySlots(
  workingSchedules: TimeRange[],
  durationMinutes: number
): TimeSlot[] {
  return workingSchedules.flatMap((ws) =>
    generateTimeSlots(ws.startTime, ws.endTime, durationMinutes)
  )
}
