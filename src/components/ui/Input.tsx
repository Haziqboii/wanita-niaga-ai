import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export function Input({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = error && inputId ? `${inputId}-error` : undefined
  const helperId = helper && inputId ? `${inputId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-bold text-[#171317]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-[#171317] placeholder-[#9C8F99] bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all ${
          error ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500' : 'border-[#EBE1D7]'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-xs text-[#6B6069]">
          {helper}
        </p>
      )}
    </div>
  )
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
}

export function Select({
  label,
  error,
  helper,
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = error && selectId ? `${selectId}-error` : undefined
  const helperId = helper && selectId ? `${selectId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs sm:text-sm font-bold text-[#171317]"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-[#171317] bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all cursor-pointer ${
          error ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500' : 'border-[#EBE1D7]'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-xs text-[#6B6069]">
          {helper}
        </p>
      )}
    </div>
  )
}
