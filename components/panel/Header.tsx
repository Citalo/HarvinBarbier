import Link from 'next/link'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  title: string
  description?: string
  isBarber?: boolean
  actions?: React.ReactNode
  backHref?: string
}

export default function Header({ title, description, isBarber, actions, backHref }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          ) : (
            <div className="flex-shrink-0 w-8 md:hidden" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          {isBarber && <NotificationBell />}
        </div>
      </div>
    </div>
  )
}
