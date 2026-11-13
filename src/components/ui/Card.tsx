import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className = '',
  padding = 'md',
}: CardProps) {
  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
