import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/panel/Sidebar'

export const metadata = {
  title: 'Panel Admin - Harvin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()

  let adminName = 'Administrador'
  if (session) {
    const admin = createAdminClient()
    const { data: user } = await admin
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .single()

    if (user) adminName = user.name
  }

  return (
    <div className="flex">
      <Sidebar userRole="super_admin" userName={adminName} />
      <main className="flex-1 md:ml-64 bg-white min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
