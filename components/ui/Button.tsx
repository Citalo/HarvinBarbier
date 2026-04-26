import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-zinc-800 text-white font-semibold hover:bg-zinc-900 active:bg-black disabled:opacity-50',

  secondary:
    'border border-zinc-700 text-zinc-800 font-semibold hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-50',

  ghost:
    'text-zinc-500 hover:text-black hover:bg-zinc-100 disabled:opacity-50',

  danger:
    'bg-red-600 text-white font-semibold hover:bg-red-700 active:bg-red-800 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
