'use client'

import { useRef } from 'react'
import { formatAppointmentDate, formatTime, formatPrice } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/Button'
import type { AppointmentWithDetails } from '@/lib/supabase/types'

interface ConfirmationCardProps {
  appointment: AppointmentWithDetails
}

export function ConfirmationCard({ appointment }: ConfirmationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!cardRef.current) return

    // html2canvas se importa dinámicamente para evitar errores de SSR
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#1A1A1A',
      scale: 2,
      useCORS: true,
      logging: false,
    })

    const link = document.createElement('a')
    link.download = `cita-harvin-${appointment.date}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div>
      {/* Tarjeta que se convierte a imagen */}
      <div
        ref={cardRef}
        className="bg-brand-gray-900 rounded-2xl p-6 border border-brand-gold/30 max-w-sm mx-auto"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/20 mb-3">
            <span className="text-2xl">✂</span>
          </div>
          <p className="text-brand-gold text-xs font-medium tracking-widest uppercase">
            Harvin The Lord Barbier
          </p>
          <h3 className="text-brand-cream font-bold text-xl mt-1">
            Tu cita está confirmada
          </h3>
        </div>

        <div style={{ height: 1, backgroundColor: '#FFFFFF', opacity: 0.2, marginBottom: '1.25rem' }} />

        {/* Detalles */}
        <div className="space-y-3">
          <CardRow label="Cliente" value={`${appointment.client.first_name} ${appointment.client.last_name}`} />
          <CardRow label="Barbero" value={appointment.barber.name} />
          <CardRow label="Servicio" value={appointment.service.name} />
          <CardRow label="Fecha" value={formatAppointmentDate(appointment.date)} />
          <CardRow label="Hora" value={formatTime(appointment.start_time.slice(0, 5))} />
          <CardRow label="Precio" value={formatPrice(appointment.service.price)} />
        </div>

        <div style={{ height: 1, backgroundColor: '#FFFFFF', opacity: 0.2, margin: '1.25rem 0' }} />

        {/* Footer de la tarjeta */}
        <div className="text-center">
          <p className="text-brand-gray-400 text-xs">¿Necesitás cancelar o consultar?</p>
          <p className="text-brand-gold text-sm font-medium mt-1">+506 8888-7777</p>
          <p className="text-brand-gray-600 text-xs mt-3">Costa Rica</p>
        </div>
      </div>

      {/* Botón de descarga (fuera de la tarjeta, no aparece en la imagen) */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Button onClick={handleDownload} variant="secondary" size="lg" fullWidth>
          ↓ Descargar confirmación
        </Button>
        <p className="text-brand-gray-600 text-xs">
          Guardá esta imagen como comprobante de tu reserva
        </p>
      </div>
    </div>
  )
}

function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-brand-gray-400 text-xs flex-shrink-0">{label}</span>
      <span className="text-brand-cream text-xs text-right font-medium">{value}</span>
    </div>
  )
}
