'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !active) return

      const userId = session.user.id

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false)

      if (!active) return

      setUnreadCount(count || 0)

      channel = supabase.channel(`bell:${userId}:${Date.now()}`)
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => setUnreadCount(prev => prev + 1)
        )
        .subscribe()
    }

    init()

    return () => {
      active = false
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [])

  return (
    <Link href="/barbero/notificaciones" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors inline-flex" aria-label="Notificaciones">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
