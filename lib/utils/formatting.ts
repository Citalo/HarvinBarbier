import { COSTA_RICA_TZ } from './timezone'

// Formatea precio en colones costarricenses: 8000 → "₡8.000"
export function formatPrice(amount: number): string {
  return `₡${amount.toLocaleString('es-CR')}`
}

// Formatea duración en minutos: 30 → "30 min", 90 → "1 h 30 min"
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} h`
  return `${hours} h ${mins} min`
}

// Formatea hora "HH:MM" → "8:00 a.m." / "2:30 p.m."
export function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = parseInt(hoursStr, 10)
  const minutes = minutesStr
  const period = hours < 12 ? 'a.m.' : 'p.m.'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes} ${period}`
}

// Formatea fecha "YYYY-MM-DD" → "lunes, 15 de enero de 2024"
export function formatAppointmentDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CR', {
    timeZone: COSTA_RICA_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Formatea fecha "YYYY-MM-DD" → "15 ene" (para vistas compactas)
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CR', {
    timeZone: COSTA_RICA_TZ,
    day: 'numeric',
    month: 'short',
  })
}

// Formatea teléfono costarricense: "88887777" → "+506 8888-7777"
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '').replace(/^506/, '')
  if (clean.length === 8) {
    return `+506 ${clean.slice(0, 4)}-${clean.slice(4)}`
  }
  return `+506 ${clean}`
}

// Capitaliza primera letra de cada palabra
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

// Nombre completo del mes en español (para el calendario)
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function getMonthName(month: number): string {
  return MONTHS_ES[month]
}

const DAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAYS_LONG_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function getDayShortName(dayOfWeek: number): string {
  return DAYS_SHORT_ES[dayOfWeek]
}

export function getDayLongName(dayOfWeek: number): string {
  return DAYS_LONG_ES[dayOfWeek]
}
