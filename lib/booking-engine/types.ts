// Tipos del dominio del booking engine.
// Este módulo no importa nada de React, Next.js ni Supabase.

export interface TimeRange {
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
}

export interface TimeSlot extends TimeRange {
  isAvailable: boolean
}

export interface WorkingSchedule extends TimeRange {
  dayOfWeek: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
}

export interface ScheduleBlock {
  startTime: string | null // null = bloqueo de día completo
  endTime: string | null
}

export interface ExistingAppointment extends TimeRange {
  id: string
}

export interface AvailabilityParams {
  workingSchedules: TimeRange[]        // Bloques de trabajo del día
  scheduleBlocks: ScheduleBlock[]      // Bloqueos del día (null = día completo)
  existingAppointments: TimeRange[]    // Citas ya reservadas con status='pending'
  serviceDurationMinutes: number
  date: string                         // "YYYY-MM-DD" en hora Costa Rica
}

export interface AvailabilityResult {
  slots: string[]         // ["08:00", "08:45", ...]
  isFullyBlocked: boolean
  reason?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface CreateAppointmentInput {
  barberId: string
  serviceId: string
  date: string         // "YYYY-MM-DD"
  startTime: string    // "HH:MM"
  clientFirstName: string
  clientLastName: string
  clientPhone: string
  tenantId: string
  notes?: string
}

export interface CreateAppointmentResult {
  success: boolean
  appointmentId?: string
  error?: string
  code?: 'SLOT_TAKEN' | 'VALIDATION_ERROR' | 'SERVER_ERROR'
}
