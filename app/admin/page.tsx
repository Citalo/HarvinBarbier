import { createAdminClient } from '@/lib/supabase/server'
import { formatTime } from '@/lib/utils/formatting'
import Header from '@/components/panel/Header'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard - Panel Admin',
}

export default async function AdminDashboard() {
  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
  const TIMEZONE = 'America/Costa_Rica'
  const todayCR = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  const [crY, crMo, crD] = todayCR.split('-').map(Number)
  // Sakamoto's algorithm — 0=Sun, 1=Mon, ..., 6=Sat — no locale string parsing
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const sy = crMo < 3 ? crY - 1 : crY
  const dow = (sy + Math.floor(sy / 4) - Math.floor(sy / 100) + Math.floor(sy / 400) + t[crMo - 1] + crD) % 7
  const daysFromMonday = (dow + 6) % 7
  const crDateStr = (d: number) =>
    new Date(crY, crMo - 1, d, 12).toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  const startOfWeek = crDateStr(crD - daysFromMonday)      // lunes
  const endOfWeek   = crDateStr(crD - daysFromMonday + 6)  // domingo

  const [
    { data: todayAppointments },
    { count: weekCount },
    { count: monthCount },
    // TODO: PRO feature (monthly revenue / analytics)
    // { data: barberStats },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, barber:barbers(name), client:clients(first_name, last_name), service:services(name)')
      .eq('date', today)
      .order('start_time', { ascending: true }),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date', startOfWeek)
      .lte('date', endOfWeek),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date', monthStart)
      .lt('date', nextMonthStart)
    // TODO: PRO feature (monthly revenue / analytics)
    // supabase
    //   .from('appointments')
    //   .select('barber_id, barber:barbers(name), service:services(price)')
    //   .gte('date', monthStart)
    //   .lte('date', today)
    //   .eq('status', 'completed'),
  ])

  // TODO: PRO feature (monthly revenue / analytics)
  // const stats: Record<string, { name: string; count: number; revenue: number }> = {}
  // barberStats?.forEach((apt) => { ... })
  // const totalRevenue = Object.values(stats).reduce((s, b) => s + b.revenue, 0)

  const STATUS_MAP: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-blue-50 text-blue-700 border border-blue-100' },
    completed: { label: 'Completada', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border border-red-100' },
    no_show: { label: 'No asistió', className: 'bg-orange-50 text-orange-700 border border-orange-100' },
  }

  const statCards = [
    { label: 'Citas hoy', value: todayAppointments?.length ?? 0 },
    { label: 'Esta semana', value: weekCount ?? 0 },
    { label: 'Este mes', value: monthCount ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" description="Resumen general del negocio" />

      <div className="p-4 md:p-8 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</p>
              <p className="text-3xl font-bold leading-none text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* TODO: PRO feature (monthly revenue / analytics) */}
        {/* Rendimiento por barbero con ingresos — descomentar cuando se implemente el plan PRO */}

        {/* Citas de hoy */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
            {todayAppointments && todayAppointments.length > 0 && (
              <Link href="/admin/agenda" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Ver agenda →
              </Link>
            )}
          </div>

          {todayAppointments && todayAppointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {todayAppointments.slice(0, 6).map((apt) => {
                const barber = Array.isArray(apt.barber) ? apt.barber[0] : apt.barber
                const service = Array.isArray(apt.service) ? apt.service[0] : apt.service
                return (
                  <div key={apt.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm font-mono font-semibold text-gray-500 w-12 flex-shrink-0">
                        {formatTime(apt.start_time)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {apt.client?.first_name ?? 'Sin cliente'} {apt.client?.last_name ?? ''}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {barber?.name} · {service?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_MAP[apt.status]?.className ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {STATUS_MAP[apt.status]?.label ?? apt.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No hay citas para hoy</p>
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/barberos"
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Barberos
          </Link>
          <Link
            href="/admin/servicios"
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            Servicios
          </Link>
          <Link
            href="/admin/agenda"
            className="flex items-center justify-center gap-2 bg-gray-900 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Agenda Global
          </Link>
        </div>

      </div>
    </div>
  )
}
