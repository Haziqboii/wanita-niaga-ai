import { useState, useEffect } from 'react'

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

  // Check initial connection status on open
  useEffect(() => {
    if (!isOpen) return

    // 1. Check legacy localStorage key without auto-filling or auto-uploading
    const legacyKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null
    if (legacyKey && legacyKey.trim()) {
      setHasLegacyKey(true)
    }

    // 2. Check server-side session status
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white border border-[#F1D3E3] rounded-3xl shadow-xl overflow-hidden p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1D3E3]">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 id="api-key-modal-title" className="text-base sm:text-lg font-bold text-[#28152F] font-heading">
              {isConnected && !isChangingKey ? 'Status Pembantu AI' : 'Sambungkan Pembantu AI'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full border border-[#F1D3E3] text-[#68586B] hover:text-[#BE1E72] hover:bg-[#FFF5FA] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status: CONNECTED */}
        {isConnected && !isChangingKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm sm:text-base">
                <span>🔒</span>
                <span>Gemini Disambungkan</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                Pembantu AI sedia digunakan pada telefon ini.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs font-mono text-emerald-800">
                <span className="text-emerald-700 font-sans font-semibold">Kunci:</span>
                <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200">{maskedPreview}</span>
              </div>
            </div>

            <div className="p-3 bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl text-xs text-[#68586B] space-y-1">
              <p className="font-semibold text-[#28152F]">🔒 Privasi &amp; Keselamatan:</p>
              <p>Kunci API anda disimpan secara tersulit dan digunakan hanya untuk soalan perniagaan anda.</p>
            </div>

            {successMessage && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold text-center">
                ✓ {successMessage}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1D3E3]">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Putuskan Sambungan
              </button>

              <button
                type="button"
                onClick={() => setIsChangingKey(true)}
                className="px-4 py-2 bg-white border border-[#F1D3E3] text-[#28152F] hover:text-[#BE1E72] hover:bg-pink-50 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Tukar Kunci API
              </button>
            </div>
          </div>
        ) : (
          /* Status: NOT CONNECTED or CHANGING KEY */
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-[#68586B] leading-relaxed">
              Masukkan kunci Gemini sekali sahaja untuk menggunakan pembantu AI pada telefon ini.
            </p>

            {hasLegacyKey && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> Kunci Lama Dikesan Dalam Pelayar:
                </p>
                <p className="text-[#68586B] leading-relaxed">
                  Sistem mengesan kunci lama dalam pelayar ini. Demi keselamatan, sila masukkan semula kunci anda untuk disimpan secara tersulit di pelayan, atau padam kunci lama ini.
                </p>
                <button
                  type="button"
                  onClick={handleClearLegacyKey}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Padam Kunci Lama Dari Pelayar
                </button>
              </div>
            )}

            {/* Input Field */}
            <div className="space-y-1.5">
              <label htmlFor="gemini-key-input" className="block text-xs font-bold text-[#28152F]">
                Kunci API Gemini
              </label>
              <div className="relative">
                <input
                  id="gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Contoh: AIza... atau AQ..."
                  disabled={isLoading}
                  className="w-full bg-[#FFF5FA] border border-[#F1D3E3] focus:border-[#BE1E72] focus:ring-2 focus:ring-[#BE1E72]/20 rounded-2xl px-3.5 py-2.5 text-sm font-mono text-[#28152F] pr-16 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#BE1E72] hover:underline px-1 py-0.5 cursor-pointer"
                >
                  {showKey ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Beginner Setup Instructions & Google AI Studio Link */}
            <div className="p-3 bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl space-y-1.5 text-xs text-[#28152F]">
              <p className="font-bold text-[#BE1E72] flex items-center gap-1">
                <span>💡</span> Panduan Mudah Peserta:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[#68586B]">
                <li>Buka Google AI Studio menggunakan akaun Google anda.</li>
                <li>Klik butang <strong>"Create API key"</strong>.</li>
                <li>Salin kunci dan tampalkan dalam kotak di atas.</li>
              </ol>
              <div className="pt-1.5">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#BE1E72] hover:underline"
                >
                  <span>Dapatkan Kunci Percuma di Google AI Studio</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1D3E3]">
              {isChangingKey ? (
                <button
                  type="button"
                  onClick={() => setIsChangingKey(false)}
                  className="text-xs font-semibold text-[#68586B] hover:text-[#28152F] px-3 py-2 rounded-xl transition-colors cursor-pointer"
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
                  className="text-xs sm:text-sm font-semibold text-[#68586B] hover:text-[#28152F] px-4 py-2.5 rounded-xl border border-transparent hover:border-[#F1D3E3] transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  <span>{isLoading ? 'Menyambung...' : 'Sambungkan Gemini'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
