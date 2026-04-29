'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'

interface ScheduleBlock {
  id: string
  date: string
  reason: string | null
}

export default function AdminConfiguracion() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: user } = await supabase.from('users').select('tenant_id').eq('id', session.user.id).single()
    if (user?.tenant_id) setTenantId(user.tenant_id)

    const { data } = await supabase
      .from('schedule_blocks')
      .select('id, date, reason')
      .is('barber_id', null)
      .gte('date', today)
      .order('date')

    setBlocks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('schedule_blocks').insert([{
      tenant_id: tenantId,
      barber_id: null,
      date: blockDate,
      reason: blockReason || null,
    }])

    if (error) {
      setToast({ type: 'error', message: 'Error al crear bloqueo: ' + error.message })
    } else {
      setToast({ type: 'success', message: 'Bloqueo global creado' })
      setBlockDate('')
      setBlockReason('')
      await loadData()
    }
    setSaving(false)
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Eliminar este bloqueo global?')) return
    const supabase = createClient()
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId)
    if (error) {
      setToast({ type: 'error', message: 'Error al eliminar bloqueo' })
    } else {
      setToast({ type: 'success', message: 'Bloqueo eliminado' })
      setBlocks(prev => prev.filter(b => b.id !== blockId))
    }
  }

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Configuración" description="Bloqueos globales de la barbería" backHref="/admin" />

      <div className="p-4 md:p-8 max-w-2xl">

        {/* Create block */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900">Bloquear día completo</h3>
            <p className="text-xs text-gray-400 mt-1">
              Aplica a todos los barberos — ideal para feriados y cierres.
            </p>
          </div>

          <form onSubmit={handleAddBlock} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  min={today}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Razón (opcional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="ej: Feriado, Cierre"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando...' : 'Bloquear día'}
            </button>
          </form>
        </div>

        {/* Active blocks */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Bloqueos activos</h3>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Cargando...</p>
            </div>
          ) : blocks.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                {blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{block.date}</p>
                      {block.reason && <p className="text-xs text-gray-500 mt-0.5">{block.reason}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">Aplica a todos los barberos</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
              <p className="text-sm text-gray-400">Sin bloqueos globales activos</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
