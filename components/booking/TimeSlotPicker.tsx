'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/Button'

interface TimeSlotPickerProps {
  barberId: string
  serviceId: string
  date: string
  selectedTime: string | null
  onSelect: (time: string) => void
  onNext: () => void
  onBack: () => void
}

export function TimeSlotPicker({
  barberId,
  serviceId,
  date,
  selectedTime,
  onSelect,
  onNext,
  onBack,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/availability?barberId=${barberId}&serviceId=${serviceId}&date=${date}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error cargando disponibilidad')
        setSlots([])
      } else {
        setSlots(data.slots ?? [])
      }
    } catch {
      setError('No se pudo conectar con el servidor')
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [barberId, serviceId, date])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  // Supabase Realtime: refetch slots cuando se crea una cita
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`appointments-${barberId}-${date}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          const newAppt = payload.new as { date: string; start_time: string }
          if (newAppt.date !== date) return
          // Refetch slots para obtener la lista actualizada (excluye overlaps)
          fetchSlots()
          // Si el usuario tenía ese horario seleccionado, deseleccionarlo
          const takenTime = newAppt.start_time.slice(0, 5)
          if (selectedTime === takenTime) {
            onSelect('')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barberId, date, selectedTime, onSelect, fetchSlots])

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Elegí el horario</h2>
      <p className="text-gray-400 text-sm mb-6">
        Horarios disponibles para tu cita
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-status-cancelled mb-4">{error}</p>
          <Button variant="secondary" onClick={fetchSlots} size="sm">
            Reintentar
          </Button>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-brand-gray-400 text-lg mb-2">Sin disponibilidad</p>
          <p className="text-brand-gray-600 text-sm">
            No hay horarios disponibles para esta fecha. Intentá con otro día.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
          {slots.map((slot) => {
            const isSelected = slot === selectedTime
            return (
              <button
                key={slot}
                onClick={() => onSelect(slot)}
                className={`
                  py-3 rounded-xl text-sm font-medium transition-all duration-150 border
                  ${isSelected
                    ? 'bg-zinc-800 text-white border-zinc-800 font-bold'
                    : 'border-gray-200 text-gray-900 hover:border-zinc-700 hover:bg-zinc-100'
                  }
                `}
              >
                {formatTime(slot)}
              </button>
            )
          })}
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="flex items-center gap-1.5 text-brand-gray-600 text-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse inline-block" />
          Disponibilidad en tiempo real
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} size="lg" className="flex-1">
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedTime || loading}
          size="lg"
          className="flex-grow-[2] min-w-0"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
