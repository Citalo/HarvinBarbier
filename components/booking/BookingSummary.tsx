'use client'

import { useState } from 'react'
import { formatPrice, formatAppointmentDate, formatTime } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { Barber, Service } from '@/lib/supabase/types'
import type { CreateAppointmentInput } from '@/lib/booking-engine/types'

interface BookingSummaryProps {
  barber: Barber
  service: Service
  date: string
  time: string
  clientFirstName: string
  clientLastName: string
  clientPhone: string
  tenantId: string
  onConfirmed: (appointmentId: string) => void
  onBack: () => void
  onSlotTaken: () => void
}

export function BookingSummary({
  barber,
  service,
  date,
  time,
  clientFirstName,
  clientLastName,
  clientPhone,
  tenantId,
  onConfirmed,
  onBack,
  onSlotTaken,
}: BookingSummaryProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const payload: CreateAppointmentInput = {
        barberId: barber.id,
        serviceId: service.id,
        date,
        startTime: time,
        clientFirstName,
        clientLastName,
        clientPhone,
        tenantId,
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.status === 409) {
        showToast('Ese horario acaba de ser tomado. Elegí otro.', 'error')
        onSlotTaken()
        return
      }

      if (!res.ok) {
        showToast(data.error ?? 'Error al confirmar la reserva', 'error')
        return
      }

      onConfirmed(data.appointmentId)
    } catch {
      showToast('Error de conexión. Intentá de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Confirmá tu reserva</h2>
      <p className="text-gray-400 text-sm mb-6">
        Revisá los detalles antes de confirmar
      </p>

      {/* Resumen */}
      <div className="bg-brand-gray-900 border border-brand-gray-700 rounded-2xl p-5 mb-6 space-y-4">
        <SummaryRow label="Barbero" value={barber.name} />
        <SummaryRow label="Servicio" value={service.name} />
        <SummaryRow label="Duración" value={`${service.duration_minutes} min`} />
        <div className="gold-divider" />
        <SummaryRow label="Fecha" value={formatAppointmentDate(date)} highlight />
        <SummaryRow label="Hora" value={formatTime(time)} highlight />
        <div className="gold-divider" />
        <SummaryRow label="Tu nombre" value={`${clientFirstName} ${clientLastName}`} />
        <SummaryRow label="Teléfono" value={`+506 ${clientPhone}`} />
        <div className="gold-divider" />
        <div className="flex justify-between items-center">
          <span className="text-brand-gray-400 text-sm font-medium">Total</span>
          <span className="text-brand-gold text-2xl font-bold">{formatPrice(service.price)}</span>
        </div>
      </div>

      <p className="text-brand-gray-600 text-xs mb-6 text-center">
        Al confirmar aceptás nuestra política de cancelaciones.
        Para cancelar, contactá directamente a tu barbero.
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} disabled={loading} size="lg" className="flex-1">
          Atrás
        </Button>
        <Button onClick={handleConfirm} isLoading={loading} size="lg" className="flex-grow-[2] min-w-0">
          Confirmar reserva
        </Button>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-brand-gray-400 text-sm flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'text-brand-cream font-semibold' : 'text-brand-gray-200'}`}>
        {value}
      </span>
    </div>
  )
}
