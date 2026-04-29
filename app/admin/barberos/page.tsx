import { createClient } from '@/lib/supabase/server'
import Header from '@/components/panel/Header'
import Link from 'next/link'

export const metadata = {
  title: 'Barberos - Panel Admin',
}

export default async function AdminBarberos() {
  const supabase = await createClient()

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, bio, avatar_url, active')
    .eq('active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Barberos"
        description="Gestiona el equipo de la barbería"
        actions={
          <Link
            href="/admin/barberos/nuevo"
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo barbero
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {barbers && barbers.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {barbers.map((barber) => (
                <Link
                  key={barber.id}
                  href={`/admin/barberos/${barber.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {barber.avatar_url ? (
                      <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-400">
                          {barber.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{barber.name}</p>
                      {!barber.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {barber.bio && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{barber.bio}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-4">No hay barberos registrados</p>
            <Link
              href="/admin/barberos/nuevo"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Crear primer barbero
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
