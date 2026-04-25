'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      .select('role')
      .eq('id', session?.user.id)
      .single()

    const roleRedirect = userData?.role === 'super_admin' ? '/admin' : '/barbero'
    const destination = next && (next.startsWith('/admin') || next.startsWith('/barbero')) ? next : roleRedirect
    router.push(destination)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-[#111111] mb-1">Harvin</h1>
          <p className="text-[#999999] text-sm tracking-widest uppercase">The Lord Barbier</p>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#DDDDDD] rounded-lg text-[#111111] text-sm placeholder:text-[#BBBBBB] focus:outline-none focus:border-[#111111] transition-colors"
              placeholder="••••••••"
              required
            />
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
          <p className="text-xs text-[#AAAAAA] mb-2">Credenciales demo:</p>
          <p className="text-xs text-[#888888] mb-1"><span className="font-mono">harvin@harvin.cr</span> — Barbero</p>
          <p className="text-xs text-[#888888]"><span className="font-mono">admin@harvin.cr</span> — Admin</p>
          <p className="text-xs text-[#888888] mt-1">Contraseña: <span className="font-mono">Password123!</span></p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-[#AAAAAA] text-sm hover:text-[#111111] transition-colors">← Volver a inicio</a>
        </div>
      </div>
    </div>
  )
}
