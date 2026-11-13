import { useState } from 'react'

export interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : ''
  )
  const [showKey, setShowKey] = useState(false)
  const [isSavedMessage, setIsSavedMessage] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      localStorage.removeItem('user_gemini_api_key')
    } else {
      localStorage.setItem('user_gemini_api_key', trimmed)
    }
    setIsSavedMessage(true)
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 700)
  }

  const handleClear = () => {
    localStorage.removeItem('user_gemini_api_key')
    setApiKey('')
    setIsSavedMessage(true)
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 700)
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
            <span className="text-xl">🔑</span>
            <h2 id="api-key-modal-title" className="text-base sm:text-lg font-bold text-[#28152F] font-heading">
              Tetapan Kunci API Gemini
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

        {/* Informational Guidance */}
        <div className="space-y-2 text-xs sm:text-sm text-[#68586B] leading-relaxed">
          <p>
            Untuk menggunakan ciri AI di laman web ini, kunci API Gemini diperlukan.
          </p>
          <div className="p-3 bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl space-y-1.5 text-xs text-[#28152F]">
            <p className="font-bold text-[#BE1E72] flex items-center gap-1">
              <span>💡</span> Cara Pantas (Peranti Ini):
            </p>
            <p>
              Tampal kunci Gemini API anda di bawah dan klik <strong>Simpan Kunci</strong>. Kunci disimpan secara selamat dalam penyemak imbas anda.
            </p>
            <p className="font-bold text-[#BE1E72] pt-1 flex items-center gap-1">
              <span>🌐</span> Cara Kekal (Semua Peserta di Vercel):
            </p>
            <p>
              Tetapkan pembolehubah <code className="bg-pink-100 text-[#BE1E72] px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY</code> di papan pemuka Vercel (<em>Settings &gt; Environment Variables</em>).
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-1.5">
          <label htmlFor="gemini-key-input" className="block text-xs font-bold text-[#28152F]">
            Kunci API Gemini (Google AI Studio)
          </label>
          <div className="relative">
            <input
              id="gemini-key-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Contoh: AIzaSy... atau AQ.Ab8..."
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

        {/* Success message feedback */}
        {isSavedMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center animate-in fade-in">
            ✓ Kunci berjaya dikemas kini!
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1D3E3]">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              Padam Kunci
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
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-1.5 bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
            >
              <span>Simpan Kunci</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
