import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'teal' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none shadow-sm cursor-pointer'

  const variants: Record<string, string> = {
    primary:
      'bg-purple-700 text-white hover:bg-purple-800 active:bg-purple-900 focus-visible:ring-purple-500 shadow-purple-200',
    teal:
      'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 focus-visible:ring-teal-500 shadow-teal-200',
    outline:
      'border-2 border-purple-200 bg-white text-purple-900 hover:bg-purple-50 active:bg-purple-100 focus-visible:ring-purple-400',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-300 shadow-none',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-400 shadow-red-200',
  }

  const sizes: Record<string, string> = {
    sm: 'min-h-[44px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-5 py-2.5 text-base',
    lg: 'min-h-[52px] px-6 py-3.5 text-lg font-bold',
  }

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
