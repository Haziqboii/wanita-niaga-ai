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
          className="block text-sm font-semibold text-gray-800"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[46px] rounded-xl border px-3.5 py-2.5 text-base text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
          error ? 'border-red-400 bg-red-50/30 focus:ring-red-500' : 'border-gray-200'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-xs text-gray-500">
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
          className="block text-sm font-semibold text-gray-800"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[46px] rounded-xl border px-3.5 py-2.5 text-base text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
          error ? 'border-red-400 bg-red-50/30 focus:ring-red-500' : 'border-gray-200'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-xs text-gray-500">
          {helper}
        </p>
      )}
    </div>
  )
}
