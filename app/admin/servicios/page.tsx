'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'
import { formatPrice } from '@/lib/utils/formatting'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

export default function AdminServicios() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadServices = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data || [])
    setLoading(false)
  }

  useEffect(() => { loadServices() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const payload = {
      name,
      description: description || null,
      price: parseFloat(price),
      duration_minutes: parseInt(durationMinutes),
    }

    if (editingId) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingId)
      if (error) { setToast({ type: 'error', message: 'Error al actualizar' }); setSaving(false); return }
      setToast({ type: 'success', message: 'Servicio actualizado' })
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setSaving(false); return }
      const { data: user } = await supabase.from('users').select('tenant_id').eq('id', session.user.id).single()
      if (!user?.tenant_id) { setToast({ type: 'error', message: 'No se encontró tenant' }); setSaving(false); return }

      const { error } = await supabase.from('services').insert([{ ...payload, tenant_id: user.tenant_id }])
      if (error) { setToast({ type: 'error', message: 'Error al crear servicio' }); setSaving(false); return }
      setToast({ type: 'success', message: 'Servicio creado' })
    }

    resetForm()
    await loadServices()
    setSaving(false)
  }

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); setDurationMinutes('')
    setEditingId(null); setShowForm(false)
  }

  const handleEdit = (service: Service) => {
    setName(service.name)
    setDescription(service.description || '')
    setPrice(service.price.toString())
    setDurationMinutes(service.duration_minutes.toString())
    setEditingId(service.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    const supabase = createClient()
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (error) { setToast({ type: 'error', message: 'Error al eliminar' }) }
    else { setToast({ type: 'success', message: 'Servicio eliminado' }); await loadServices() }
  }

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Servicios"
        description="Gestiona los servicios de la barbería"
        actions={
          !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo servicio
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 max-w-3xl">

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Editar servicio' : 'Nuevo servicio'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Corte clásico"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Duración (minutos)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min="5"
                    placeholder="30"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Precio</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  placeholder="5000"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripción breve del servicio..."
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear servicio'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Cargando servicios...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {service.duration_minutes} min
                      </span>
                      <span className="text-xs font-semibold text-brand-gold">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-4">No hay servicios registrados</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Crear primer servicio
            </button>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
