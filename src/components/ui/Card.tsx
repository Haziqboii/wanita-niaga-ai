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
    lg: 'p-5 sm:p-7',
  }

  return (
    <div
      className={`bg-[#FAF6F0] rounded-[22px] border border-[#EBE1D7] shadow-[0_4px_20px_rgba(23,19,23,0.03)] ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
