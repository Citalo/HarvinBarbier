import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/panel/Sidebar'

export const metadata = {
  title: 'Mi Panel - Harvin',
  robots: { index: false, follow: false },
}

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()

  let barberName = 'Barbero'
  if (session) {
    const admin = createAdminClient()
    const { data: barberRows } = await admin
      .from('barbers')
      .select('name')
      .eq('user_id', session.user.id)
      .limit(1)

    if (barberRows?.[0]) {
      barberName = barberRows[0].name
    } else {
      const { data: userRows } = await admin
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .limit(1)
      if (userRows?.[0]) barberName = userRows[0].name
    }
  }

  return (
    <div className="flex">
      <Sidebar userRole="barber" userName={barberName} />
      <main className="flex-1 md:ml-64 bg-white min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
