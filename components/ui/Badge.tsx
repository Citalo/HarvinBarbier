import type { AppointmentStatus } from '@/lib/supabase/types'

interface BadgeProps {
  status: AppointmentStatus
}

const config: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  completed: {
    label: 'Completada',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  no_show: {
    label: 'No asistió',
    className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
}

export function Badge({ status }: BadgeProps) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
