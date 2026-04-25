import { createClient, createAdminClient } from './server'

export interface SessionBarber {
  id: string
  name: string
  tenant_id: string
  userId: string
}

export async function getSessionBarber(): Promise<SessionBarber | null> {
  const sessionClient = createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session) return null

  const admin = createAdminClient()

  // Use limit(1) instead of single() to avoid errors on 0 or multiple rows
  const { data: rows } = await admin
    .from('barbers')
    .select('id, name, tenant_id')
    .eq('user_id', session.user.id)
    .limit(1)

  const barber = rows?.[0]
  if (!barber) return null

  return { ...barber, userId: session.user.id }
}
