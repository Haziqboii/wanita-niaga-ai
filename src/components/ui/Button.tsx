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
    'inline-flex items-center justify-center font-bold rounded-full transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none shadow-xs cursor-pointer'

  const variants: Record<string, string> = {
    primary:
      'bg-[#800020] text-white hover:bg-[#70193D] active:scale-[0.98] focus-visible:ring-[#800020] shadow-[0_4px_14px_rgba(128,0,32,0.22)]',
    teal:
      'bg-[#0D7355] text-white hover:bg-[#0A5D44] active:scale-[0.98] focus-visible:ring-[#0D7355] shadow-teal-200/50',
    outline:
      'border border-[#DFD3C7] bg-[#F4EDE5] text-[#171317] hover:bg-[#EBE2D8] active:scale-[0.98] focus-visible:ring-[#800020]',
    ghost:
      'bg-transparent text-[#6B6069] hover:bg-[#F4ECE3] hover:text-[#171317] active:scale-[0.98] focus-visible:ring-[#800020]/20 shadow-none',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:scale-[0.98] focus-visible:ring-rose-400 shadow-rose-200/50',
  }

  const sizes: Record<string, string> = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[44px] px-4.5 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-base',
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
