'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/panel/Header'
import { Toast } from '@/components/ui/Toast'

export default function NuevoBarberPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/admin/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, avatar_url: avatarUrl, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setToast({ type: 'error', message: data.error || 'Error al crear barbero' })
      setSaving(false)
      return
    }

    setToast({ type: 'success', message: 'Barbero creado correctamente' })
    setTimeout(() => router.push('/admin/barberos'), 1500)
  }

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Nuevo barbero"
        description="Crea una cuenta de acceso para el barbero"
        backHref="/admin/barberos"
      />

      <div className="p-4 md:p-8 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Personal info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Información personal</h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
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
                  placeholder="Cuéntale a los clientes sobre ti..."
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

          {/* Access */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Cuenta de acceso</h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barbero@ejemplo.com"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Contraseña temporal</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear barbero'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
