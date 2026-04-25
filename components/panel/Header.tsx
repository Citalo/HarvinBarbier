import NotificationBell from './NotificationBell'

interface HeaderProps {
  title: string
  description?: string
  isBarber?: boolean
  actions?: React.ReactNode
}

export default function Header({ title, description, isBarber, actions }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pl-10 md:pl-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          {isBarber && <NotificationBell />}
        </div>
      </div>
    </div>
  )
}
