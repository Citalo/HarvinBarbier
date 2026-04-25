'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/panel/Header'

interface NotifAppointment {
  date: string
  start_time: string
  client: { first_name: string; last_name: string } | null
  service: { name: string } | null
}

interface Notification {
  id: string
  type: string
  read: boolean
  created_at: string
  appointment_id: string | null
  appointment?: NotifAppointment | null
}

export default function BarberNotificaciones() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const loadNotifications = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUserId(session.user.id)

    const { data } = await supabase
      .from('notifications')
      .select('*, appointment:appointments(date, start_time, client:clients(first_name, last_name), service:services(name))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    setNotifications((data as Notification[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadNotifications() }, [])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notif:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => loadNotifications())
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const handleMarkAsRead = async (notifId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    }
  }

  const handleMarkAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const buildMessage = (notif: Notification) => {
    const apt = notif.appointment
    if (!apt) return notif.type === 'new_appointment' ? 'Nueva cita' : 'Cita cancelada'
    const clientName = apt.client ? `${apt.client.first_name} ${apt.client.last_name}` : 'Cliente'
    const serviceName = apt.service?.name || 'servicio'
    const time = apt.start_time?.slice(0, 5) || ''
    if (notif.type === 'new_appointment') {
      return `${clientName} reservó ${serviceName} para el ${apt.date} a las ${time}`
    }
    return `${clientName} canceló ${serviceName} del ${apt.date} a las ${time}`
  }

  const relativeTime = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Justo ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`
    return `Hace ${Math.floor(diffHours / 24)}d`
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Notificaciones"
        description={unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
        isBarber
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Marcar todas como leídas
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 max-w-2xl">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">Sin notificaciones</p>
            <p className="text-xs text-gray-400 mt-1">Las nuevas citas aparecerán aquí en tiempo real</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    notif.read ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  {/* Dot indicator */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {buildMessage(notif)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{relativeTime(notif.created_at)}</p>
                  </div>

                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Leída
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
