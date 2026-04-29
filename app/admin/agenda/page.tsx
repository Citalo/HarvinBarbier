'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'
import { formatAppointmentDate, formatTime, formatPrice } from '@/lib/utils/formatting'

async function fetchAdminAppointments(date: string, status: string, barber_id: string) {
  const params = new URLSearchParams({ date, status, barber_id })
  const res = await fetch(`/api/admin/appointments?${params}`)
  if (!res.ok) return []
  return res.json()
}

async function cancelAdminAppointment(id: string) {
  const res = await fetch('/api/admin/appointments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: 'cancelled' }),
  })
  return res.ok
}

interface Appointment {
  id: string
  date: string
  start_time: string
  status: string
  client: { first_name: string; last_name: string; phone: string }
  barber: { name: string }
  service: { name: string; price: number }
}

interface Barber {
  id: string
  name: string
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

export default function AdminAgenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [dateFilter, setDateFilter] = useState(today)
  const [statusFilter, setStatusFilter] = useState('all')
  const [barberFilter, setBarberFilter] = useState('all')

  useEffect(() => {
    const loadBarbers = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('barbers').select('id, name').eq('active', true).order('name')
      setBarbers(data || [])
    }
    loadBarbers()
  }, [])

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true)
      const data = await fetchAdminAppointments(dateFilter, statusFilter, barberFilter)
      setAppointments(data || [])
      setLoading(false)
    }
    loadAppointments()
  }, [dateFilter, statusFilter, barberFilter])

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('¿Cancelar esta cita?')) return
    const ok = await cancelAdminAppointment(appointmentId)
    if (!ok) {
      setToast({ type: 'error', message: 'Error al cancelar cita' })
    } else {
      setToast({ type: 'success', message: 'Cita cancelada' })
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    }
  }

  const selectClass = "px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Agenda Global" description="Todas las citas de la barbería" backHref="/admin" />

      <div className="p-4 md:p-8">

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={selectClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Barbero</label>
              <select value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} className={selectClass}>
                <option value="all">Todos los barberos</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="no_show">No asistió</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setDateFilter(today); setBarberFilter('all'); setStatusFilter('all') }}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Cargando citas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-500">Sin citas con estos filtros</p>
            <p className="text-xs text-gray-300 mt-1">Cambiá la fecha, el barbero o el estado</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hora · Fecha</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Barbero</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Servicio</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acción</p>
            </div>

            <div className="divide-y divide-gray-100">
              {appointments.map((apt) => {
                const barber = Array.isArray(apt.barber) ? apt.barber[0] : apt.barber
                const service = Array.isArray(apt.service) ? apt.service[0] : apt.service
                return (
                  <div key={apt.id} className="px-6 py-4 hover:bg-gray-50/70 transition-colors">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900">{formatTime(apt.start_time)}</span>
                          <span className="text-xs text-gray-400">{formatAppointmentDate(apt.date)}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASS[apt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[apt.status] ?? apt.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                          <p className="font-semibold text-gray-900">{apt.client?.first_name} {apt.client?.last_name}</p>
                          {apt.client?.phone && <p className="text-xs text-gray-400">{apt.client.phone}</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Barbero</p>
                          <p className="font-semibold text-gray-900">{barber?.name ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Servicio</p>
                          <p className="font-semibold text-gray-900">{service?.name ?? '—'}</p>
                          {service?.price && <p className="text-xs font-semibold text-zinc-700">{formatPrice(service.price)}</p>}
                        </div>
                        {apt.status === 'pending' && (
                          <div className="flex items-end">
                            <button onClick={() => handleCancel(apt.id)} className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout — aligned grid */}
                    <div className="hidden md:grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-4 items-center">
                      {/* Time + Date + Status */}
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-sm text-zinc-900 leading-tight">{formatTime(apt.start_time)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatAppointmentDate(apt.date)}</p>
                        <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASS[apt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[apt.status] ?? apt.status}
                        </span>
                      </div>

                      {/* Client */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{apt.client?.first_name ?? '—'} {apt.client?.last_name ?? ''}</p>
                        {apt.client?.phone && <p className="text-xs text-gray-400 mt-0.5">{apt.client.phone}</p>}
                      </div>

                      {/* Barber */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{barber?.name ?? '—'}</p>
                      </div>

                      {/* Service + Price */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{service?.name ?? '—'}</p>
                        {service?.price && <p className="text-xs font-semibold text-zinc-700 mt-0.5">{formatPrice(service.price)}</p>}
                      </div>

                      {/* Action */}
                      <div className="flex justify-end">
                        {apt.status === 'pending' ? (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
