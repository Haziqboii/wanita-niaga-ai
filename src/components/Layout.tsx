import React from 'react'
import {
  BookOpenIcon,
  StorefrontIcon,
  QuestionCircleIcon,
  LockIcon,
  HomeIcon,
  InfoIcon,
  ArrowLeftIcon,
} from './ui/Icons'

export interface LayoutProps {
  children: React.ReactNode
  currentStep?: string
  subtitle?: string
  stepIndicator?: string
  onBack?: () => void
  showBack?: boolean
  onOpenGuide?: () => void
  isHome?: boolean
  isStory?: boolean
  isInnerBerryPop?: boolean
  hideHeader?: boolean
  onNavHome?: () => void
}

export function Layout({
  children,
  currentStep,
  subtitle,
  stepIndicator,
  onBack,
  showBack = false,
  onOpenGuide,
  isHome = false,
  isStory = false,
  isInnerBerryPop = false,
  hideHeader = false,
  onNavHome,
}: LayoutProps) {
  // If on Story Input / Review / Upload / Manual / Dashboard: Berry Pop inner page layout matching reference images
  if (isStory || isInnerBerryPop) {
    return (
      <div className="min-h-screen bg-[#FFF5FA] text-[#28152F] flex flex-col font-sans antialiased selection:bg-pink-100 selection:text-[#BE1E72]">
        {/* Berry Pop Inner Compact Navigation Header */}
        {!hideHeader && (
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F1D3E3] shadow-xs">
            <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 py-2.5">
              <div className="flex items-center justify-between">
                {/* Back Button + Page Title & Subtitle */}
                <div className="flex items-center gap-2">
                  {showBack && onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[#28152F] hover:text-[#BE1E72] hover:bg-pink-50 active:scale-95 transition-all cursor-pointer"
                      aria-label={stepIndicator ? 'Kembali' : 'Kembali ke Menu Utama'}
                      title={stepIndicator ? 'Kembali' : 'Kembali ke Menu Utama'}
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#28152F] font-heading leading-tight">
                      {currentStep || 'Kembali'}
                    </h1>
                    {subtitle && (
                      <p className="text-[11px] sm:text-xs text-[#68586B] font-body leading-tight">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Step Indicator (e.g. "Langkah 2/3") or Help Icon (?) or Close Button */}
                {stepIndicator ? (
                  <span className="text-xs sm:text-sm font-semibold text-[#68586B] font-body">
                    {stepIndicator}
                  </span>
                ) : onOpenGuide ? (
                  <button
                    type="button"
                    onClick={onOpenGuide}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border-2 border-[#BE1E72] text-[#BE1E72] hover:bg-pink-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Buka Panduan Pengguna"
                    aria-label="Buka Panduan Pengguna"
                  >
                    <QuestionCircleIcon className="w-5 h-5 text-[#BE1E72]" />
                  </button>
                ) : onBack && currentStep === 'Panduan Pengguna' ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-xs sm:text-sm font-bold text-[#BE1E72] hover:text-[#9B1258] bg-[#FCE7F3] hover:bg-pink-100 active:scale-95 px-3.5 sm:px-4 py-1.5 min-h-[40px] rounded-full border border-pink-200 transition-all cursor-pointer shadow-2xs"
                  >
                    ✕ Tutup
                  </button>
                ) : null}
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 sm:py-6">
          {children}
        </main>
      </div>
    )
  }

  // If on Homepage: Berry Pop compact navigation header & compact footer
  if (isHome) {
    return (
      <div className="min-h-screen bg-[#FFF5FA] text-[#28152F] flex flex-col font-sans antialiased selection:bg-pink-100 selection:text-[#BE1E72]">
        {/* Berry Pop Compact Navigation Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F1D3E3] shadow-xs">
          <div className="max-w-xl sm:max-w-3xl lg:max-w-4xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between">
              {/* Brand Logo & Tagline */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <StorefrontIcon className="w-6 h-6 text-[#BE1E72]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#28152F]">
                      Wanita Niaga
                    </span>
                    <span className="bg-[#BE1E72] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68586B] tracking-wide font-medium">
                    Kenali Jualan, Rancang Keuntungan
                  </p>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center gap-2">
                {/* Mobile: Question Circle Help Button (?) */}
                {onOpenGuide && (
                  <button
                    type="button"
                    onClick={onOpenGuide}
                    className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border-2 border-[#BE1E72] text-[#BE1E72] hover:bg-pink-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Buka Panduan Pengguna"
                    aria-label="Buka Panduan Pengguna"
                  >
                    <QuestionCircleIcon className="w-5 h-5 text-[#BE1E72]" />
                  </button>
                )}

                {/* Desktop: Navigation Pills */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onNavHome}
                    className="bg-[#FCE7F3] text-[#BE1E72] font-bold px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-pink-200 shadow-2xs cursor-pointer"
                  >
                    <HomeIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
                    <span>Utama</span>
                  </button>
                  {onOpenGuide && (
                    <button
                      type="button"
                      onClick={onOpenGuide}
                      className="text-[#68586B] hover:text-[#BE1E72] hover:bg-pink-50 font-semibold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpenIcon className="w-3.5 h-3.5 text-[#68586B]" />
                      <span>Panduan</span>
                    </button>
                  )}
                  <div
                    className="text-[#68586B] hover:text-[#BE1E72] font-semibold px-2.5 py-1.5 rounded-full text-xs flex items-center gap-1 cursor-default opacity-75"
                    title="Program Komuniti SULAM Universiti"
                  >
                    <InfoIcon className="w-3.5 h-3.5 text-[#68586B]" />
                    <span>SULAM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-xl sm:max-w-3xl lg:max-w-4xl mx-auto px-4 py-4 sm:py-6">
          {children}
        </main>

        {/* Compact Berry Pop Footer */}
        <footer className="mt-auto bg-white/80 border-t border-[#F1D3E3] py-4 px-4">
          <div className="max-w-xl sm:max-w-3xl lg:max-w-4xl mx-auto text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#68586B]">
              <LockIcon className="w-3.5 h-3.5 text-[#68586B] shrink-0" />
              <span>Privasi Terjamin &bull; Soalan AI dihantar ke Google Gemini</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Program Komuniti SULAM Universiti &bull; Wanita Niaga AI
            </p>
          </div>
          <div className="h-2 w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-pink-200/50 to-transparent rounded-full mt-2" />
        </footer>
      </div>
    )
  }

  // Other pages: Existing Header and Footer preserved 100%
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-purple-900 text-white shadow-md border-b border-purple-800">
        <div className="max-w-lg mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showBack && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-purple-200 hover:text-white rounded-xl hover:bg-purple-800 active:scale-95 transition-all cursor-pointer"
                  aria-label="Kembali ke halaman sebelumnya"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white">
                    Wanita Niaga
                  </span>
                  <span className="bg-teal-400 text-purple-950 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-purple-200 tracking-wide font-normal">
                  Kenali Jualan, Rancang Keuntungan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-teal-200 hover:text-white bg-purple-800/90 hover:bg-purple-700 active:scale-95 px-3 py-2 rounded-xl border border-purple-700 transition-all cursor-pointer shadow-xs"
                  title="Buka Panduan Pengguna"
                  aria-label="Buka Panduan Pengguna"
                >
                  <BookOpenIcon className="w-4 h-4 text-teal-300" />
                  <span className="hidden sm:inline">Panduan</span>
                </button>
              )}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold bg-purple-800 text-teal-300 px-2 py-0.5 rounded-full border border-purple-700">
                  Wanita with AI
                </span>
                {currentStep && (
                  <span className="text-[11px] text-purple-200 mt-0.5 font-medium">
                    {currentStep}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 space-y-5">
        {children}
      </main>

      {/* Privacy & Session Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-4 px-4">
        <div className="max-w-lg mx-auto space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <svg
              className="w-4 h-4 text-teal-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Privasi Terjamin: Data sesi peranti &bull; Soalan AI dihantar ke Google Gemini</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal">
            Memuat semula atau menutup laman web ini akan memadamkan data sesi ini. Soalan AI menghantar ringkasan jualan tanpa data peribadi pelanggan.
            <br />
            Program Komuniti SULAM Universiti &bull; Wanita with AI
          </p>
        </div>
      </footer>
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle?: string
  badge?: string
}) {
  return (
    <div className="space-y-1">
      {badge && (
        <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
          {badge}
        </span>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-gray-600 leading-relaxed">{subtitle}</p>}
    </div>
  )
}
