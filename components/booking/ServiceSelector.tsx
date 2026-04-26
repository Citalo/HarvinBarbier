'use client'

import type { Service } from '@/lib/supabase/types'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/Button'

interface ServiceSelectorProps {
  services: Service[]
  selectedId: string | null
  onSelect: (service: Service) => void
  onNext: () => void
  onBack: () => void
}

export function ServiceSelector({ services, selectedId, onSelect, onNext, onBack }: ServiceSelectorProps) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Elegí el servicio</h2>
      <p className="text-gray-400 text-sm mb-6">
        Servicios disponibles con tu barbero seleccionado
      </p>

      {services.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          Este barbero no tiene servicios disponibles en este momento.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {services.map((service) => {
            const isSelected = service.id === selectedId
            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className={`selection-card text-left ${isSelected ? 'selected' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-zinc-900' : 'text-gray-900'}`}>
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="text-brand-gray-400 text-xs mt-0.5 leading-relaxed truncate">
                        {service.description}
                      </p>
                    )}
                    <p className="text-brand-gray-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
                      </svg>
                      {formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-xl font-bold text-zinc-800">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1.5 text-zinc-700 text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Seleccionado
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} size="lg" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!selectedId} size="lg" className="flex-2 min-w-0 flex-grow-[2]">
          Continuar
        </Button>
      </div>
    </div>
  )
}
