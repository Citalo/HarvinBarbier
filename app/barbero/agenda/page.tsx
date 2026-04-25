'use client'

import { useEffect, useState } from 'react'
import { formatAppointmentDate, formatTime } from '@/lib/utils/formatting'
import Header from '@/components/panel/Header'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

interface Appointment {
  id: string
  date: string
  start_time: string
  status: string
  client: { first_name: string; last_name: string; phone: string }
  service: { name: string; duration_minutes: number }
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completada',
  no_show: 'No asistió',
  cancelled: 'Cancelada',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700 border border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  no_show: 'bg-orange-50 text-orange-700 border border-orange-100',
  cancelled: 'bg-red-50 text-red-700 border border-red-100',
}

export default function BarberAgenda() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadAppointments = async () => {
    setLoading(true)
    const res = await fetch(`/api/barber/appointments?date=${date}`)
    const data = res.ok ? await res.json() : []
    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadAppointments() }, [])
  useEffect(() => { loadAppointments() }, [date])

  const handleStatusChange = async (appointmentId: string, newStatus: 'completed' | 'cancelled' | 'no_show') => {
    setUpdating(appointmentId)
    const res = await fetch('/api/barber/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appointmentId, status: newStatus }),
    })
    if (!res.ok) {
      setToast({ type: 'error', message: 'Error al actualizar cita' })
    } else {
      setToast({ type: 'success', message: 'Cita actualizada' })
      await loadAppointments()
    }
    setUpdating(null)
  }

  const openWhatsApp = (apt: Appointment) => {
    const msg = `Hola ${apt.client?.first_name ?? 'cliente'}, confirmo tu cita para el ${formatAppointmentDate(apt.date)} a las ${formatTime(apt.start_time)}. ${apt.service?.name} - ${apt.service?.duration_minutes} minutos.`
    window.open(`https://wa.me/${apt.client?.phone ?? ''}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Mi Agenda" description="Gestiona tus citas del día" isBarber />

      <div className="p-4 md:p-8">

        {/* Selector de fecha */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
          />
          <span className="text-sm text-gray-500">{formatAppointmentDate(date)}</span>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Cargando citas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-500">Sin citas para este día</p>
            <p className="text-xs text-gray-300 mt-1">Seleccioná otra fecha o esperá nuevas reservas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Hora + badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-brand-gold font-mono">
                        {formatTime(apt.start_time)}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLASS[apt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[apt.status] ?? apt.status}
                      </span>
                    </div>

                    {/* Cliente */}
                    <p className="font-semibold text-gray-900">
                      {apt.client?.first_name ?? '—'} {apt.client?.last_name ?? ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {apt.service?.name} · {apt.service?.duration_minutes} min
                    </p>
                    {apt.client?.phone && (
                      <p className="text-xs text-gray-400 mt-1">{apt.client.phone}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  {apt.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStatusChange(apt.id, 'completed')}
                        disabled={updating === apt.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => openWhatsApp(apt)}
                        className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#1ebe57] transition-colors"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'no_show')}
                        disabled={updating === apt.id}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors"
                      >
                        No asistió
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'cancelled')}
                        disabled={updating === apt.id}
                        className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
