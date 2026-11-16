import { useState, useEffect, useRef } from 'react'

export interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [maskedPreview, setMaskedPreview] = useState<string>('')
  const [isChangingKey, setIsChangingKey] = useState<boolean>(false)
  const [inputKey, setInputKey] = useState<string>('')
  const [showKey, setShowKey] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasLegacyKey, setHasLegacyKey] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // 1. Check initial connection status on open
  useEffect(() => {
    if (!isOpen) return

    // Check legacy localStorage key without auto-filling or auto-uploading
    const legacyKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null
    if (legacyKey && legacyKey.trim()) {
      setHasLegacyKey(true)
    }

    // Check server-side session status
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/keys/status', {
          credentials: 'same-origin',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            setIsConnected(true)
            setMaskedPreview(data.maskedPreview || '••••••••')
            setIsChangingKey(false)
          } else {
            setIsConnected(false)
          }
        }
      } catch {
        // Safe offline/fallback: do not auto-connect legacy key
        setIsConnected(false)
      }
    }

    checkStatus()
  }, [isOpen])

  // 2. Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  // 3. Body scroll locking while modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // 4. Focus management on open
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      if (isConnected && !isChangingKey) {
        closeButtonRef.current?.focus()
      } else {
        inputRef.current?.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [isOpen, isConnected, isChangingKey])

  if (!isOpen) return null

  const handleClearLegacyKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_gemini_api_key')
    }
    setHasLegacyKey(false)
    setSuccessMessage('Kunci lama telah dipadam daripada pelayar.')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleConnect = async () => {
    const trimmed = inputKey.trim()
    setErrorMessage(null)

    if (!trimmed) {
      setErrorMessage('Sila masukkan kunci API Gemini anda.')
      return
    }

    const isValidFormat =
      (trimmed.startsWith('AIza') || trimmed.startsWith('AQ')) &&
      trimmed.length >= 25 &&
      trimmed.length <= 256 &&
      /^[A-Za-z0-9_.-]+$/.test(trimmed) &&
      !/^(sk-|sk-ant-|hf_|ghp_|gho_|AKIA)/i.test(trimmed)

    if (!isValidFormat) {
      setErrorMessage(
        'Format kunci API tidak sah. Sila pastikan kunci adalah dari Google AI Studio (bermula dengan "AIza" atau "AQ").'
      )
      return
    }

    setIsLoading(true)

    try {
      // Connect through secure server endpoint
      const res = await fetch('/api/keys/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ apiKey: trimmed }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsConnected(true)
        setMaskedPreview(data.maskedPreview || `${trimmed.substring(0, 6)}...${trimmed.substring(trimmed.length - 4)}`)
        setIsChangingKey(false)
        setInputKey('')
        // Remove legacy plaintext key from localStorage only after explicit successful connection
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_gemini_api_key')
        }
        setHasLegacyKey(false)
        setSuccessMessage('Kunci API berjaya disimpan secara tersulit pada peranti ini.')
      } else {
        const errData = await res.json().catch(() => ({}))
        setErrorMessage(errData.error || 'Gagal menyambung ke pelayan keselamatan. Sila semak semula kunci anda.')
      }
      onSaved?.()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setErrorMessage('Ralat sambungan rangkaian. Sila pastikan pelayan berjalan dan cuba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      await fetch('/api/keys/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
      })
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_gemini_api_key')
    }

    setIsConnected(false)
    setMaskedPreview('')
    setInputKey('')
    setIsChangingKey(false)
    setHasLegacyKey(false)
    setIsLoading(false)
    setSuccessMessage('Sambungan Gemini telah diputuskan.')
    onSaved?.()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose()
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white border border-[#E5DEE4] rounded-3xl shadow-xl overflow-hidden p-5 sm:p-6 space-y-4 max-h-[90dvh] flex flex-col justify-between animate-scaleIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE1D7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020] shrink-0">
              <span className="text-base">🔑</span>
            </div>
            <div>
              <h2 id="api-key-modal-title" className="text-base sm:text-lg font-bold text-[#171317] font-heading leading-tight">
                {isConnected && !isChangingKey ? 'Status Pembantu Mekara' : 'Sambungkan Pembantu Mekara'}
              </h2>
              <p className="text-xs text-[#7A6E77]">
                {isConnected && !isChangingKey ? 'Kunci Gemini Aktif' : 'Google Gemini API'}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup tetingkap"
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] rounded-full border border-[#DFD3C7] text-[#7A6E77] hover:text-[#800020] hover:bg-[#FAF4EA] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body (Scrollable if screen is small) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Status: CONNECTED */}
          {isConnected && !isChangingKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm sm:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Gemini Disambungkan</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-body">
                  Pembantu AI sedia digunakan untuk menganalisis data dan menjawab soalan perniagaan Puan.
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs font-mono text-emerald-800">
                  <span className="text-emerald-700 font-sans font-semibold">Kunci:</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs font-bold">{maskedPreview}</span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF6F0] border border-[#EBE1D7] rounded-2xl text-xs text-[#7A6E77] space-y-1">
                <p className="font-semibold text-[#171317]">🔒 Privasi &amp; Keselamatan Terjamin:</p>
                <p className="leading-relaxed">Kunci API Puan disimpan secara tersulit (AES-256) dan digunakan hanya untuk soalan perniagaan Puan.</p>
              </div>

              {successMessage && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold text-center animate-fadeIn">
                  ✓ {successMessage}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBE1D7]">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="min-h-[44px] text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Putuskan Sambungan
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangingKey(true)}
                  className="min-h-[44px] px-4 py-2 bg-white border border-[#DFD3C7] text-[#171317] hover:text-[#800020] hover:bg-[#FAF4EA] text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Tukar Kunci API
                </button>
              </div>
            </div>
          ) : (
            /* Status: NOT CONNECTED or CHANGING KEY */
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#7A6E77] leading-relaxed">
                Sambungkan kunci percuma Google Gemini sekali sahaja untuk membolehkan pembantu AI menjawab soalan perniagaan Puan.
              </p>

              {hasLegacyKey && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> Kunci Lama Dikesan Dalam Pelayar:
                  </p>
                  <p className="text-[#6B6069] leading-relaxed">
                    Sistem mengesan kunci lama dalam pelayar ini. Demi keselamatan, sila masukkan semula kunci anda untuk disimpan secara tersulit di pelayan, atau padam kunci lama ini.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearLegacyKey}
                    className="min-h-[36px] flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Padam Kunci Lama Dari Pelayar
                  </button>
                </div>
              )}

              {/* Input Field */}
              <div className="space-y-1.5">
                <label htmlFor="gemini-key-input" className="block text-xs sm:text-sm font-bold text-[#171317]">
                  Kunci API Gemini
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="gemini-key-input"
                    type={showKey ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Contoh: AIza... atau AQ..."
                    disabled={isLoading}
                    className="w-full bg-white border border-[#EBE1D7] focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 rounded-2xl px-3.5 py-3 text-sm font-mono text-[#171317] pr-20 outline-none transition-all placeholder:text-[#7A6E77]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#800020] hover:bg-[#FAF4EA] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer min-h-[36px] flex items-center"
                  >
                    {showKey ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium animate-fadeIn">
                  {errorMessage}
                </div>
              )}

              {/* Beginner Setup Instructions & Google AI Studio Link */}
              <div className="p-3.5 bg-[#FAF6F0] border border-[#EBE1D7] rounded-2xl space-y-2 text-xs sm:text-sm text-[#171317]">
                <p className="font-bold text-[#800020] flex items-center gap-1.5">
                  <span>💡</span> Panduan Mudah Peserta:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#6B6069] text-xs">
                  <li>Buka Google AI Studio menggunakan akaun Google Puan.</li>
                  <li>Tekan butang <strong>"Create API key"</strong>.</li>
                  <li>Salin kunci dan tampalkan dalam kotak di atas.</li>
                </ol>
                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#800020] hover:underline min-h-[36px]"
                  >
                    <span>Dapatkan Kunci Percuma di Google AI Studio</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBE1D7]">
                {isChangingKey ? (
                  <button
                    type="button"
                    onClick={() => setIsChangingKey(false)}
                    className="min-h-[44px] text-xs sm:text-sm font-semibold text-[#7A6E77] hover:text-[#171317] px-3 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] text-xs sm:text-sm font-semibold text-[#7A6E77] hover:text-[#171317] px-4 py-2.5 rounded-full border border-transparent hover:border-[#DFD3C7] transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isLoading || !inputKey.trim()}
                    className="btn-primary-burgundy min-h-[44px] px-5 py-2.5 text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_2px_8px_rgba(128,0,32,0.22)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
                  >
                    <span>{isLoading ? 'Menyambung...' : 'Sambungkan Gemini'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
