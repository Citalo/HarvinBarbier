import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import type { Barber, Service } from '@/lib/supabase/types'

async function getBarbers(): Promise<Barber[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('barbers')
    .select('id, user_id, tenant_id, name, bio, avatar_url, active, created_at')
    .eq('active', true)
    .order('name')
  return data ?? []
}

async function getServices(): Promise<Service[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('services')
    .select('id, tenant_id, name, description, duration_minutes, price, active, created_at')
    .eq('active', true)
    .order('price')
  return data ?? []
}

export const metadata = {
  alternates: { canonical: 'https://harvinbarbier.com' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: 'The Lord Barbier',
  description: 'Barbería premium en Costa Rica. Reservá tu cita online.',
  url: 'https://thelordbarbier.com',
  telephone: '+50688887777',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CR',
    addressRegion: 'Costa Rica',
  },
  openingHoursSpecification: [],
  priceRange: '$$',
}

export default async function HomePage() {
  const [barbers, services] = await Promise.all([getBarbers(), getServices()])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffffff', color: '#1A1A1A' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER — negro */}
      <header className="sticky top-0 z-40 bg-brand-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="container-app flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="The Lord Barbier"
              width={50}
              height={50}
              className="object-contain"
            />
            <span className="font-serif text-lg font-bold text-white tracking-wide">
              The Lord Barbier
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="font-serif text-sm text-white border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all"
            >
              Panel
            </Link>
            {/* <Link href="/reservar">
              <button className="border border-white text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors">
                Reservar cita
              </button>
            </Link> */}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container-app text-center flex flex-col items-center">

          {/* LOGO */}
          <Image
            src="/logo.webp"
            alt="The Lord Barbier"
            width={250}
            height={250}
            className="mb-6 object-contain"
            priority
          />

          {/* TITULO */}
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-6 text-[#111111]">
            The Lord Barbier
          </h1>

          {/* DESCRIPCIÓN */}
          <p className="text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed text-[#666660]">
            Reservá tu cita online. Elegí tu barbero, tu servicio y tu horario en minutos.
            Sin llamadas, sin WhatsApp.
          </p>

          {/* BOTÓN */}
          <Link href="/reservar">
            <button className="bg-black text-white font-semibold text-2xl px-24 py-6 rounded-full shadow-lg hover:scale-105 hover:bg-[#222] transition-all duration-300">
              Reservar mi cita
            </button>
          </Link>

        </div>
      </section>

      {/* DIVISOR */}
      <div className="container-app py-3">
        <div className="h-px" style={{ backgroundColor: '#ffffffff' }} />
      </div>

      {/* EQUIPO */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: '#ffffffff' }}>
        <div className="container-app">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#999990' }}>
              Nuestro equipo
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: '#111111' }}>
              Nuestros barberos
            </h2>
          </div>

          {barbers.length === 0 ? (
            <p className="text-center py-10" style={{ color: '#888880' }}>
              Próximamente nuestro equipo estará disponible para reservas.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-12">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DIVISOR */}
      <div className="container-app py-3">
        <div className="h-px" style={{ backgroundColor: '#C8C5BB' }} />
      </div>

      {/* SERVICIOS */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: '#ffffffff' }}>
        <div className="container-app">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#999990' }}>
              Lo que ofrecemos
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: '#111111' }}>
              Nuestros servicios
            </h2>
          </div>

          {services.length === 0 ? (
            <p className="text-center py-10" style={{ color: '#888880' }}>
              Servicios próximamente disponibles.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL — negro */}
      <section className="py-24 bg-[#111111]">
        <div className="container-app text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 text-white/40">
            Sin esperas
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-6">
            ¿Listo para lucir increíble?
          </h2>
          <p className="text-white/60 mb-10 text-lg max-w-md mx-auto">
            Reservá tu cita en menos de 2 minutos. Disponibilidad en tiempo real.
          </p>
          <Link href="/reservar">
            <button className="border border-white text-white font-semibold tracking-wider uppercase text-sm px-12 py-4 rounded-full hover:bg-white hover:text-black transition-colors">
              Reservar ahora
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER — negro */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 py-6">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-8">

          <div className="flex-shrink-0">
            <Image
              src="/teloryn-logo.png"
              alt="The Lord Barbier"
              width={220}
              height={60}
              className="object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="text-center">
            <p className="text-white/50 text-sm">
              © 2026 Teloryn · Plataforma desarrollada en Costa Rica
            </p>
            <p className="text-white/25 text-xs mt-1">
              Creada por Brady Méndez Developer y Santiago Pedraza Developer · Personalizada para esta barbería.
            </p>
          </div>

          <div className="text-center sm:text-right flex-shrink-0">
            <p className="text-white/50 text-sm mb-3">
              ¿Querés tu propia página web personalizada?
            </p>
            <a
              href="https://wa.me/50685097011?text=Hola%2C%20me%20interesa%20tener%20mi%20propia%20p%C3%A1gina%20web%20para%20mi%20barber%C3%ADa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/40 text-white/70 text-sm font-semibold px-4 py-2 rounded-lg hover:border-white hover:text-white transition-colors"
            >
              <WhatsAppIcon />
              Contáctanos aquí
            </a>
          </div>

        </div>
      </footer>
    </div>
  )
}

function BarberCard({ barber }: { barber: Barber }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div
        className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 transition-all duration-300 group-hover:scale-105"
        style={{ border: '2px solid #C8C5BB' }}
      >
        {barber.avatar_url ? (
          <Image
            src={barber.avatar_url}
            alt={`Foto de ${barber.name}, barbero en Harvin The Lord Barbier`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#DDDBD4' }}>
            <span className="text-sm font-bold" style={{ color: '#888880' }}>HB</span>
          </div>
        )}
      </div>
      <h3 className="font-serif font-semibold text-sm leading-tight mb-1" style={{ color: '#1A1A1A' }}>
        {barber.name}
      </h3>
      {barber.bio && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#888880' }}>
          {barber.bio}
        </p>
      )}
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
      style={{ border: '1px solid #DDDBD4' }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>{service.name}</h3>
        <span className="font-bold text-lg whitespace-nowrap ml-3" style={{ color: '#1A1A1A' }}>
          {formatPrice(service.price)}
        </span>
      </div>
      {service.description && (
        <p className="text-sm mb-3 leading-relaxed" style={{ color: '#777770' }}>{service.description}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#999990' }}>
        <ClockIcon />
        {formatDuration(service.duration_minutes)}
      </div>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  )
}
