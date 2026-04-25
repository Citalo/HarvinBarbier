import { createAdminClient } from '@/lib/supabase/server'
import { getSessionBarber } from '@/lib/supabase/getSessionBarber'
import { formatAppointmentDate, formatTime } from '@/lib/utils/formatting'
import Header from '@/components/panel/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard - Mi Panel Barbero',
}

export default async function BarberDashboard() {
  const barber = await getSessionBarber()

  if (!barber) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Mi Dashboard" isBarber />
      <div className="p-8 text-center text-gray-400 text-sm">
        Tu perfil de barbero no está vinculado a tu cuenta. Contactá al administrador.
      </div>
    </div>
  )

  const today = new Date().toISOString().split('T')[0]
  const admin = createAdminClient()

  const [
    { data: todayAppointments },
    { data: upcomingAppointments },
    { count: monthCount },
  ] = await Promise.all([
    admin
      .from('appointments')
      .select('*, client:clients(*), service:services(*)')
      .eq('barber_id', barber.id)
      .eq('date', today)
      .eq('status', 'pending')
      .order('start_time', { ascending: true }),
    admin
      .from('appointments')
      .select('*, client:clients(*), service:services(*)')
      .eq('barber_id', barber.id)
      .gt('date', today)
      .lte('date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10),
    admin
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('barber_id', barber.id)
      .gte('date', new Date(new Date().setDate(1)).toISOString().split('T')[0])
      .lte('date', today)
      .in('status', ['pending', 'completed']),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Hola, ${barber.name.split(' ')[0]}`} description="Resumen de tu actividad" isBarber />

      <div className="p-4 md:p-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Citas hoy', value: todayAppointments?.length ?? 0 },
            { label: 'Próximos 7 días', value: upcomingAppointments?.length ?? 0 },
            { label: 'Este mes', value: monthCount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
              <p className="text-4xl font-bold text-brand-gold">{value}</p>
            </div>
          ))}
        </div>

        {/* Citas de hoy */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
            {todayAppointments && todayAppointments.length > 0 && (
              <Link href="/barbero/agenda" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Ver agenda →
              </Link>
            )}
          </div>

          {todayAppointments && todayAppointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-mono font-semibold text-gray-400 w-12 flex-shrink-0">
                      {formatTime(apt.start_time)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {apt.client?.first_name} {apt.client?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {apt.service?.name} · {apt.service?.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/barbero/agenda"
                    className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Ver →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">Sin citas para hoy</p>
              <p className="text-xs text-gray-300 mt-1">Disfrutá el día libre</p>
            </div>
          )}
        </div>

        {/* Próximas citas */}
        {upcomingAppointments && upcomingAppointments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Próximas citas (7 días)</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 text-center min-w-[48px]">
                    <p className="text-xs font-semibold text-brand-gold uppercase">
                      {new Date(apt.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {new Date(apt.date + 'T12:00:00').getDate()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {apt.client?.first_name} {apt.client?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(apt.start_time)} · {apt.service?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/barbero/agenda"
            className="flex items-center justify-center bg-gray-900 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all text-sm"
          >
            Ver agenda completa
          </Link>
          <Link
            href="/barbero/disponibilidad"
            className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-medium py-3.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
          >
            Gestionar horario
          </Link>
        </div>

      </div>
    </div>
  )
}
