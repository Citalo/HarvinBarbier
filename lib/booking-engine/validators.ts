import { TimeRange, ScheduleBlock, ValidationResult } from './types'

const MAX_BOOKING_DAYS_AHEAD = 20
const COSTA_RICA_TIMEZONE = 'America/Costa_Rica'

// Convierte "HH:MM" a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Retorna la fecha actual en Costa Rica como "YYYY-MM-DD"
function getCurrentCostaRicaDateStr(): string {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: COSTA_RICA_TIMEZONE })
}

// Retorna el tiempo actual en minutos (HH*60+MM) en Costa Rica
function getCurrentCostaRicaMinutes(): number {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', {
    timeZone: COSTA_RICA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return timeToMinutes(timeStr)
}

export function validateDateNotInPast(date: string): ValidationResult {
  const today = getCurrentCostaRicaDateStr()
  if (date < today) {
    return { valid: false, error: 'No se pueden hacer reservas en fechas pasadas' }
  }
  return { valid: true }
}

export function validateDateNotTooFarAhead(date: string): ValidationResult {
  const today = getCurrentCostaRicaDateStr()
  const todayMs = new Date(today + 'T00:00:00').getTime()
  const targetMs = new Date(date + 'T00:00:00').getTime()
  const diffDays = (targetMs - todayMs) / (1000 * 60 * 60 * 24)

  if (diffDays > MAX_BOOKING_DAYS_AHEAD) {
    return {
      valid: false,
      error: `Solo se puede reservar con ${MAX_BOOKING_DAYS_AHEAD} días de anticipación`,
    }
  }
  return { valid: true }
}

// Verifica si un slot se solapa con un bloque de tiempo.
// Regla: slot.start < block.end AND slot.end > block.start
export function slotOverlapsBlock(
  slotStart: string,
  slotEnd: string,
  block: TimeRange | ScheduleBlock
): boolean {
  // Bloqueo de día completo
  if (block.startTime === null || block.endTime === null) return true

  const slotStartMin = timeToMinutes(slotStart)
  const slotEndMin = timeToMinutes(slotEnd)
  const blockStartMin = timeToMinutes(block.startTime)
  const blockEndMin = timeToMinutes(block.endTime)

  return slotStartMin < blockEndMin && slotEndMin > blockStartMin
}

// Verifica si un slot ya pasó (para el día de hoy)
export function slotIsInPast(
  date: string,
  slotStart: string
): boolean {
  const today = getCurrentCostaRicaDateStr()
  if (date !== today) return false

  const slotStartMin = timeToMinutes(slotStart)
  const nowMin = getCurrentCostaRicaMinutes()
  return slotStartMin <= nowMin
}

export function validateTimeFormat(time: string): ValidationResult {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { valid: false, error: `Formato de hora inválido: ${time}` }
  }
  return { valid: true }
}

export function validateBookingParams(params: {
  barberId: string
  serviceId: string
  date: string
}): ValidationResult {
  if (!params.barberId || !params.serviceId || !params.date) {
    return { valid: false, error: 'Faltan parámetros requeridos' }
  }

  const pastCheck = validateDateNotInPast(params.date)
  if (!pastCheck.valid) return pastCheck

  const futureCheck = validateDateNotTooFarAhead(params.date)
  if (!futureCheck.valid) return futureCheck

  return { valid: true }
}
