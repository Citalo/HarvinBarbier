'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarberSelector } from '@/components/booking/BarberSelector'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { DatePicker } from '@/components/booking/DatePicker'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { ClientForm } from '@/components/booking/ClientForm'
import { BookingSummary } from '@/components/booking/BookingSummary'
import type { Barber, Service } from '@/lib/supabase/types'

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface BookingState {
  step: Step
  selectedBarber: Barber | null
  selectedService: Service | null
  selectedDate: string | null
  selectedTime: string | null
  clientData: {
    firstName: string
    lastName: string
    phone: string
  }
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Barbero',
  2: 'Servicio',
  3: 'Fecha',
  4: 'Hora',
  5: 'Datos',
  6: 'Confirmar',
}

export default function ReservarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [state, setState] = useState<BookingState>({
    step: 1,
    selectedBarber: null,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    clientData: { firstName: '', lastName: '', phone: '' },
  })

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [tenantId, setTenantId] = useState<string>('')
  const [loadingBarbers, setLoadingBarbers] = useState(true)

  // Cargar barberos y tenant al montar
  useEffect(() => {
    async function load() {
      const [barbersRes, tenantRes] = await Promise.all([
        supabase.from('barbers').select('*').eq('active', true).order('name'),
        supabase.from('tenants').select('id').eq('active', true).single(),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBarbers((barbersRes.data ?? []) as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTenantId(((tenantRes.data ?? {}) as any)?.id ?? '')
      setLoadingBarbers(false)
    }
    load()
  }, [])

  // Cargar servicios cuando se selecciona un barbero
  useEffect(() => {
    if (!state.selectedBarber) return
    async function loadServices() {
      const { data } = await supabase
        .from('barber_services')
        .select('service_id, services(*)')
        .eq('barber_id', (state.selectedBarber as Barber).id)

      const svcs = (data ?? [])
        .map((row: { services: Service | null }) => row.services)
        .filter((s): s is Service => s !== null && s.active)
      setServices(svcs)
    }
    loadServices()
  }, [state.selectedBarber])

  // Cargar días de trabajo cuando se selecciona un barbero (para el calendario)
  useEffect(() => {
    if (!state.selectedBarber) return
    async function loadWorkingDays() {
      const { data } = await supabase
        .from('working_schedules')
        .select('day_of_week')
        .eq('barber_id', (state.selectedBarber as Barber).id)
        .eq('active', true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const days = Array.from(new Set((data ?? []).map((ws: any) => ws.day_of_week as number)))
      setWorkingDays(days)
    }
    loadWorkingDays()
  }, [state.selectedBarber])

  const set = (patch: Partial<BookingState>) => setState((prev) => ({ ...prev, ...patch }))
  const goTo = (step: Step) => set({ step })

  const handleBarberSelect = (barber: Barber) => {
    set({ selectedBarber: barber, selectedService: null, selectedDate: null, selectedTime: null })
  }

  const handleServiceSelect = (service: Service) => {
    set({ selectedService: service, selectedDate: null, selectedTime: null })
  }

  const handleDateSelect = (date: string) => {
    set({ selectedDate: date, selectedTime: null })
  }

  const handleTimeSelect = (time: string) => {
    set({ selectedTime: time || null })
  }

  const handleSlotTaken = () => {
    set({ selectedTime: null, step: 4 })
  }

  const handleConfirmed = (appointmentId: string) => {
    router.push(`/confirmacion/${appointmentId}`)
  }

  const { step, selectedBarber, selectedService, selectedDate, selectedTime, clientData } = state

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-brand-black/90 backdrop-blur-sm border-b border-brand-gray-800 sticky top-0 z-40">
        <div className="container-app h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-brand-gray-400 hover:text-brand-cream transition-colors text-sm"
          >
            ← Inicio
          </button>
          <span className="font-serif text-brand-gold font-bold text-sm">
            Harvin The Lord Barbier
          </span>
          <div className="w-14" />
        </div>
      </header>

      {/* Progreso */}
      <div className="bg-brand-gray-900 border-b border-brand-gray-800">
        <div className="container-app py-4">
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${s < step ? 'bg-brand-gold text-brand-black' : s === step ? 'bg-brand-gold/20 border-2 border-brand-gold text-brand-gold' : 'bg-brand-gray-800 text-brand-gray-600'}
                  `}>
                    {s < step ? '✓' : s}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block text-brand-gray-400 whitespace-nowrap">
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {s < 6 && (
                  <div className={`h-0.5 flex-1 mx-1 ${s < step ? 'bg-brand-gold' : 'bg-brand-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <main className="container-app py-8 max-w-xl mx-auto animate-fade-in">
        {loadingBarbers ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : step === 1 ? (
          <BarberSelector
            barbers={barbers}
            selectedId={selectedBarber?.id ?? null}
            onSelect={handleBarberSelect}
            onNext={() => goTo(2)}
          />
        ) : step === 2 ? (
          <ServiceSelector
            services={services}
            selectedId={selectedService?.id ?? null}
            onSelect={handleServiceSelect}
            onNext={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        ) : step === 3 ? (
          <DatePicker
            selectedDate={selectedDate}
            workingDays={workingDays}
            onSelect={handleDateSelect}
            onNext={() => goTo(4)}
            onBack={() => goTo(2)}
          />
        ) : step === 4 ? (
          <TimeSlotPicker
            barberId={selectedBarber!.id}
            serviceId={selectedService!.id}
            date={selectedDate!}
            selectedTime={selectedTime}
            onSelect={handleTimeSelect}
            onNext={() => goTo(5)}
            onBack={() => goTo(3)}
          />
        ) : step === 5 ? (
          <ClientForm
            data={clientData}
            onChange={(d) => set({ clientData: d })}
            onNext={() => goTo(6)}
            onBack={() => goTo(4)}
          />
        ) : (
          <BookingSummary
            barber={selectedBarber!}
            service={selectedService!}
            date={selectedDate!}
            time={selectedTime!}
            clientFirstName={clientData.firstName}
            clientLastName={clientData.lastName}
            clientPhone={clientData.phone}
            tenantId={tenantId}
            onConfirmed={handleConfirmed}
            onBack={() => goTo(5)}
            onSlotTaken={handleSlotTaken}
          />
        )}
      </main>
    </div>
  )
}
