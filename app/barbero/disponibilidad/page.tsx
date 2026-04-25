'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'

interface TimeBlock {
  id?: string
  start: string
  end: string
}

interface DayConfig {
  enabled: boolean
  blocks: TimeBlock[]
}

interface ScheduleBlock {
  id: string
  date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const emptyWeek = (): DayConfig[] => Array.from({ length: 7 }, () => ({ enabled: false, blocks: [] }))

export default function BarberDisponibilidad() {
  const [weekConfig, setWeekConfig] = useState<DayConfig[]>(emptyWeek())
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [barberId, setBarberId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const [blockDate, setBlockDate] = useState('')
  const [blockStartTime, setBlockStartTime] = useState('')
  const [blockEndTime, setBlockEndTime] = useState('')
  const [blockReason, setBlockReason] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const loadData = async () => {
    setLoading(true)

    const meRes = await fetch('/api/barber/me')
    if (!meRes.ok) { setLoading(false); return }
    const barber = await meRes.json()

    setBarberId(barber.id)
    setTenantId(barber.tenant_id)
    const supabase = createClient()

    const [{ data: schedules }, { data: futureBlocks }] = await Promise.all([
      supabase.from('working_schedules').select('*').eq('barber_id', barber.id).order('day_of_week').order('start_time'),
      supabase.from('schedule_blocks').select('*').eq('barber_id', barber.id).gte('date', today).order('date'),
    ])

    const config = emptyWeek()
    for (const s of (schedules || []) as { id: string; day_of_week: number; start_time: string; end_time: string }[]) {
      config[s.day_of_week].enabled = true
      config[s.day_of_week].blocks.push({ id: s.id, start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) })
    }

    setWeekConfig(config)
    setBlocks((futureBlocks || []) as ScheduleBlock[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const toggleDay = (dayIndex: number) => {
    setWeekConfig(prev => {
      const next = [...prev]
      const day = { ...next[dayIndex] }
      if (!day.enabled) {
        day.enabled = true
        if (day.blocks.length === 0) day.blocks = [{ start: '08:00', end: '18:00' }]
      } else {
        day.enabled = false
      }
      next[dayIndex] = day
      return next
    })
  }

  const addBlock = (dayIndex: number) => {
    setWeekConfig(prev => {
      const next = [...prev]
      next[dayIndex] = { ...next[dayIndex], blocks: [...next[dayIndex].blocks, { start: '08:00', end: '18:00' }] }
      return next
    })
  }

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    setWeekConfig(prev => {
      const next = [...prev]
      const blocks = next[dayIndex].blocks.filter((_, i) => i !== blockIndex)
      next[dayIndex] = { ...next[dayIndex], blocks, enabled: blocks.length > 0 }
      return next
    })
  }

  const updateBlock = (dayIndex: number, blockIndex: number, field: 'start' | 'end', value: string) => {
    setWeekConfig(prev => {
      const next = [...prev]
      const blocks = [...next[dayIndex].blocks]
      blocks[blockIndex] = { ...blocks[blockIndex], [field]: value }
      next[dayIndex] = { ...next[dayIndex], blocks }
      return next
    })
  }

  const handleSaveSchedule = async () => {
    if (!barberId) return
    setSaving(true)
    const supabase = createClient()

    for (let day = 0; day < 7; day++) {
      await supabase.from('working_schedules').delete().eq('barber_id', barberId).eq('day_of_week', day)
      const dayConfig = weekConfig[day]
      if (dayConfig.enabled && dayConfig.blocks.length > 0) {
        await supabase.from('working_schedules').insert(
          dayConfig.blocks.map(b => ({ barber_id: barberId, day_of_week: day, start_time: b.start, end_time: b.end }))
        )
      }
    }

    setToast({ type: 'success', message: 'Horario guardado correctamente' })
    setSaving(false)
    await loadData()
  }

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barberId || !tenantId) return

    if (blockStartTime && !blockEndTime) {
      setToast({ type: 'error', message: 'Si definís hora de inicio, debés definir hora de fin' })
      return
    }
    if (blockStartTime && blockEndTime && blockEndTime <= blockStartTime) {
      setToast({ type: 'error', message: 'La hora de fin debe ser mayor a la de inicio' })
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('schedule_blocks').insert([{
      barber_id: barberId,
      tenant_id: tenantId,
      date: blockDate,
      start_time: blockStartTime || null,
      end_time: blockEndTime || null,
      reason: blockReason || null,
    }])

    if (error) {
      setToast({ type: 'error', message: 'Error al crear bloqueo' })
    } else {
      setToast({ type: 'success', message: 'Bloqueo creado' })
      setBlockDate('')
      setBlockStartTime('')
      setBlockEndTime('')
      setBlockReason('')
      await loadData()
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId)
    if (error) {
      setToast({ type: 'error', message: 'Error al eliminar bloqueo' })
    } else {
      setToast({ type: 'success', message: 'Bloqueo eliminado' })
      await loadData()
    }
  }

  const timeInputClass = "px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Mi Disponibilidad" isBarber />
      <div className="p-4 md:p-8 flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando horario...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Mi Disponibilidad" description="Horario semanal y días bloqueados" isBarber />

      <div className="p-4 md:p-8 space-y-8 max-w-2xl">

        {/* Horario Semanal */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Horario semanal</h2>
            <button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar horario'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {DAYS.map((dayName, dayIndex) => {
                const day = weekConfig[dayIndex]
                return (
                  <div key={dayIndex} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDay(dayIndex)}
                          className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none flex-shrink-0 ${day.enabled ? 'bg-gray-900' : 'bg-gray-200'}`}
                          style={{ height: '22px', width: '40px' }}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${day.enabled ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span className={`text-sm font-semibold w-24 ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {dayName}
                        </span>
                      </div>
                      {day.enabled && (
                        <button
                          type="button"
                          onClick={() => addBlock(dayIndex)}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium"
                        >
                          + Bloque
                        </button>
                      )}
                    </div>

                    {day.enabled ? (
                      <div className="mt-3 space-y-2 pl-[52px]">
                        {day.blocks.map((block, blockIndex) => (
                          <div key={blockIndex} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={block.start}
                              onChange={(e) => updateBlock(dayIndex, blockIndex, 'start', e.target.value)}
                              className={timeInputClass}
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input
                              type="time"
                              value={block.end}
                              onChange={(e) => updateBlock(dayIndex, blockIndex, 'end', e.target.value)}
                              className={timeInputClass}
                            />
                            <button
                              type="button"
                              onClick={() => removeBlock(dayIndex, blockIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 pl-[52px] text-xs text-gray-400">No trabaja este día</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bloqueos */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Bloquear día u horario</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
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
                    placeholder="ej: Almuerzo, Reunión"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Horario{' '}
                  <span className="normal-case font-normal text-gray-400">(vacío = día completo)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className={timeInputClass}
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className={timeInputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Agregar bloqueo
              </button>
            </form>
          </div>

          {blocks.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                {blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{block.date}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {block.start_time && block.end_time
                          ? `${block.start_time.slice(0, 5)} — ${block.end_time.slice(0, 5)}`
                          : 'Día completo'}
                      </p>
                      {block.reason && (
                        <p className="text-xs text-gray-400 mt-0.5">{block.reason}</p>
                      )}
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
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">No tenés días bloqueados</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
