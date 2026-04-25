export const COSTA_RICA_TZ = 'America/Costa_Rica'

// Retorna la fecha actual en Costa Rica como "YYYY-MM-DD"
export function getCurrentCostaRicaDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: COSTA_RICA_TZ })
}

// Formatea una fecha "YYYY-MM-DD" al formato "YYYY-MM-DD" para queries de DB.
// La columna date en appointments es DATE (sin timezone), representa hora local CR.
export function formatDateForDB(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: COSTA_RICA_TZ })
}

// Retorna cuántos días faltan desde hoy (Costa Rica) hasta una fecha dada.
export function daysFromToday(dateStr: string): number {
  const today = getCurrentCostaRicaDate()
  const todayMs = new Date(today + 'T00:00:00').getTime()
  const targetMs = new Date(dateStr + 'T00:00:00').getTime()
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24))
}

// Verifica si una fecha (YYYY-MM-DD) es hoy en Costa Rica
export function isToday(dateStr: string): boolean {
  return dateStr === getCurrentCostaRicaDate()
}

// Verifica si una fecha pasó (en Costa Rica)
export function isPastDate(dateStr: string): boolean {
  return dateStr < getCurrentCostaRicaDate()
}

// Verifica si una fecha supera el límite de 20 días
export function isBeyondBookingWindow(dateStr: string, maxDays = 20): boolean {
  return daysFromToday(dateStr) > maxDays
}

// Retorna el día de la semana en Costa Rica (0=Domingo, 1=Lunes, ..., 6=Sábado)
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00')
  return date.getDay()
}
