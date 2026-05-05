'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // users.id = auth.users.id
    const { data: { session } } = await supabase.auth.getSession()
    const { data: userData } = await supabase
      .from('users')
      .select('role, active')
      .eq('id', session?.user.id)
      .single()

    if (!userData?.active) {
      await supabase.auth.signOut()
      setError('Cuenta desactivada. Contactá al administrador.')
      setLoading(false)
      return
    }

    const roleRedirect = userData?.role === 'super_admin' ? '/admin' : '/barbero'
    const destination = next && (next.startsWith('/admin') || next.startsWith('/barbero')) ? next : roleRedirect
    router.push(destination)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full rounded-3xl max-w-md border-2 border-black p-10">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-[#111111] mb-1">Inicio de Sesión</h1>
          <p className="text-[#999999] text-sm tracking-widest uppercase">Para Barberos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#DDDDDD] rounded-lg text-[#111111] text-sm placeholder:text-[#BBBBBB] focus:outline-none focus:border-[#111111] transition-colors"
              placeholder="ejemplo@harvin.cr"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-white border border-[#DDDDDD] rounded-lg text-[#111111] text-sm placeholder:text-[#BBBBBB] focus:outline-none focus:border-[#111111] transition-colors"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#111111] transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] text-white font-semibold py-3 rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50 text-sm tracking-wider uppercase"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#EEEEEE]">
          <p className="text-xs text-[#AAAAAA] mb-2">ADVERTENCIA: SI ERES CLIENTE NO NESESITAS INICIAR SESIÓN</p>
          {/* <p className="text-xs text-[#888888] mb-1"><span className="font-mono">harvin@harvin.cr</span> — Barbero</p>
          <p className="text-xs text-[#888888]"><span className="font-mono">admin@harvin.cr</span> — Admin</p>
          <p className="text-xs text-[#888888] mt-1">Contraseña: <span className="font-mono">Password123!</span></p> */}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block border border-black text-black px-6 py-2 rounded-full text-sm hover:bg-black hover:text-white transition-colors"
          >
            ← Volver a inicio
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
