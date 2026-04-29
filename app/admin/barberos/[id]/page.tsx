'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'

interface Barber {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  active: boolean
}

interface Service {
  id: string
  name: string
}

export default function EditBarberPage() {
  const router = useRouter()
  const params = useParams()
  const barberId = params.id as string

  const [barber, setBarber] = useState<Barber | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [barberServices, setBarberServices] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const [{ data: barberData }, { data: servicesData }, { data: barberServicesData }] = await Promise.all([
        supabase.from('barbers').select('id, name, bio, avatar_url, active').eq('id', barberId).single(),
        supabase.from('services').select('id, name').eq('active', true).order('name'),
        supabase.from('barber_services').select('service_id').eq('barber_id', barberId),
      ])

      if (barberData) {
        setBarber(barberData)
        setName(barberData.name)
        setBio(barberData.bio || '')
        setAvatarUrl(barberData.avatar_url || '')
      }

      setServices(servicesData || [])
      setBarberServices(new Set(barberServicesData?.map(bs => bs.service_id) || []))
      setLoading(false)
    }

    loadData()
  }, [barberId])

  const handleServiceToggle = (serviceId: string) => {
    const next = new Set(barberServices)
    if (next.has(serviceId)) { next.delete(serviceId) } else { next.add(serviceId) }
    setBarberServices(next)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('barbers')
      .update({ name, bio: bio || null, avatar_url: avatarUrl || null })
      .eq('id', barberId)

    if (updateError) {
      setToast({ type: 'error', message: 'Error al actualizar barbero' })
      setSaving(false)
      return
    }

    await supabase.from('barber_services').delete().eq('barber_id', barberId)

    if (barberServices.size > 0) {
      const { error: insertError } = await supabase.from('barber_services').insert(
        Array.from(barberServices).map(serviceId => ({ barber_id: barberId, service_id: serviceId }))
      )
      if (insertError) {
        setToast({ type: 'error', message: 'Error al actualizar servicios' })
        setSaving(false)
        return
      }
    }

    router.push('/admin/barberos')
  }

  const handleToggleActive = async () => {
    if (!barber) return
    if (!confirm('¿Eliminar este barbero?')) return
    const supabase = createClient()
    const { error } = await supabase.from('barbers').update({ active: false }).eq('id', barberId)
    if (error) {
      setToast({ type: 'error', message: 'Error al eliminar' })
    } else {
      router.push('/admin/barberos')
    }
  }

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Editar barbero" />
      <div className="p-4 md:p-8 flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    </div>
  )

  if (!barber) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="No encontrado" />
      <div className="p-4 md:p-8 text-center text-gray-400 text-sm py-24">
        Barbero no existe
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={name || barber.name}
        description="Edita la información del barbero"
        backHref="/admin/barberos"
      />

      <div className="p-4 md:p-8 max-w-xl">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Status banner */}
          {!barber.active && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Inactivo</span>
              <span className="text-sm text-red-600">Este barbero no aparece en el sistema de reservas</span>
            </div>
          )}

          {/* Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Información personal</h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Biografía</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>URL de foto</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Servicios asignados</h3>
              <div className="space-y-1">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={barberServices.has(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-900">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {barber.active && (
              <button
                type="button"
                onClick={handleToggleActive}
                className="px-6 py-2.5 text-sm font-medium rounded-xl transition-colors bg-red-50 text-red-700 hover:bg-red-100 border border-red-100"
              >
                Eliminar barbero
              </button>
            )}
          </div>
        </form>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
