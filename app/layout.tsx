import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Harvin The Lord Barbier — Reserva tu cita',
  description:
    'Reservá tu cita en Harvin The Lord Barbier. Barbería premium en Costa Rica. Elegí tu barbero, servicio y horario en minutos.',
  metadataBase: new URL('https://harvinbarbier.com'),
  openGraph: {
    title: 'Harvin The Lord Barbier — Reserva tu cita',
    description: 'Reservá tu cita online. Rápido, fácil y sin llamadas.',
    url: 'https://harvinbarbier.com',
    siteName: 'Harvin The Lord Barbier',
    locale: 'es_CR',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Harvin The Lord Barbier' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harvin The Lord Barbier — Reserva tu cita',
    description: 'Reservá tu cita online. Rápido, fácil y sin llamadas.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
