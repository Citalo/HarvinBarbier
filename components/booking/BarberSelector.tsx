'use client'

import Image from 'next/image'
import type { Barber } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'

interface BarberSelectorProps {
  barbers: Barber[]
  selectedId: string | null
  onSelect: (barber: Barber) => void
  onNext: () => void
}

export function BarberSelector({ barbers, selectedId, onSelect, onNext }: BarberSelectorProps) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Elegí tu barbero</h2>
      <p className="text-gray-400 text-sm mb-6">
        Seleccioná el barbero con el que querés tu cita
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {barbers.map((barber) => {
          const isSelected = barber.id === selectedId
          return (
            <button
              key={barber.id}
              onClick={() => onSelect(barber)}
              className={`selection-card flex flex-col items-center text-center p-4 ${isSelected ? 'selected' : ''}`}
            >
              <div className={`
                relative w-20 h-20 rounded-full overflow-hidden mb-3
                border-2 transition-colors duration-200
                ${isSelected ? 'border-brand-gold' : 'border-gray-200'}
              `}>
                {barber.avatar_url ? (
                  <Image
                    src={barber.avatar_url}
                    alt={`Barbero ${barber.name}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-bold">HB</span>
                  </div>
                )}
              </div>
              <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-brand-gold' : 'text-gray-900'}`}>
                {barber.name}
              </span>
              {barber.bio && (
                <p className="text-brand-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                  {barber.bio}
                </p>
              )}
            </button>
          )
        })}
      </div>

      <Button onClick={onNext} disabled={!selectedId} fullWidth size="lg">
        Continuar
      </Button>
    </div>
  )
}
