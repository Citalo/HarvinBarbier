'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ClientData {
  firstName: string
  lastName: string
  phone: string
}

interface ClientFormProps {
  data: ClientData
  onChange: (data: ClientData) => void
  onNext: () => void
  onBack: () => void
}

export function ClientForm({ data, onChange, onNext, onBack }: ClientFormProps) {
  const [touched, setTouched] = useState({ firstName: false, lastName: false, phone: false })

  const phoneClean = data.phone.replace(/\D/g, '').replace(/^506/, '')
  const errors = {
    firstName: !data.firstName.trim() ? 'Requerido' : null,
    lastName: !data.lastName.trim() ? 'Requerido' : null,
    phone: phoneClean.length !== 8 ? 'Debe tener 8 dígitos' : null,
  }
  const isValid = !errors.firstName && !errors.lastName && !errors.phone

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handlePhoneChange = (value: string) => {
    // Solo permitir dígitos, máximo 8
    const clean = value.replace(/\D/g, '').slice(0, 8)
    onChange({ ...data, phone: clean })
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Tus datos</h2>
      <p className="text-gray-400 text-sm mb-6">
        Solo te pedimos lo esencial. No necesitás crear cuenta.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <Field
          label="Nombre"
          required
          error={touched.firstName ? errors.firstName : null}
        >
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            onBlur={() => handleBlur('firstName')}
            placeholder="Juan"
            className="input-field"
            autoCapitalize="words"
            autoComplete="given-name"
          />
        </Field>

        <Field
          label="Apellidos"
          required
          error={touched.lastName ? errors.lastName : null}
        >
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            onBlur={() => handleBlur('lastName')}
            placeholder="Pérez Rodríguez"
            className="input-field"
            autoCapitalize="words"
            autoComplete="family-name"
          />
        </Field>

        <Field
          label="Teléfono"
          required
          error={touched.phone ? errors.phone : null}
          hint="8 dígitos, sin código de país"
        >
          <div className="flex">
            <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm select-none">
              +506
            </span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="8888 7777"
              className="input-field rounded-l-none border-l-0 flex-1"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={8}
            />
          </div>
        </Field>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} size="lg" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg" className="flex-grow-[2] min-w-0">
          Continuar
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string | null
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-zinc-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-status-cancelled">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-brand-gray-400">{hint}</p>}
    </div>
  )
}
