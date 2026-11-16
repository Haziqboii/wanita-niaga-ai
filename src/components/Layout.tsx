import React, { useState, useEffect, useRef } from 'react'
import { ApiKeyModal } from './ApiKeyModal'
import {
  BookOpenIcon,
  HomeIcon,
  InfoIcon,
  ArrowLeftIcon,
  KeyIcon,
} from './ui/Icons'
import type { SaveStatus } from '../data/storage'

export interface LayoutProps {
  children: React.ReactNode
  currentStep?: string
  subtitle?: string
  stepIndicator?: string
  onBack?: () => void
  showBack?: boolean
  onOpenGuide?: () => void
  isLanding?: boolean
  isHome?: boolean
  isStory?: boolean
  isInnerBerryPop?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  isFullScreen?: boolean
  onNavHome?: () => void
  saveStatus?: SaveStatus
}

export function Layout({
  children,
  currentStep,
  subtitle,
  stepIndicator,
  onBack,
  showBack = false,
  onOpenGuide,
  isLanding = false,
  isHome = false,
  hideHeader = false,
  hideFooter = false,
  isFullScreen = false,
  onNavHome,
  saveStatus = 'idle',
}: LayoutProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showSulamModal, setShowSulamModal] = useState(false)
  const [hasSessionKey, setHasSessionKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewportStyle, setViewportStyle] = useState<{ height: string; top: string } | null>(null)
  const menuContainerRef = useRef<HTMLElement>(null)

  // Ensure fresh visit to Home or Landing starts at the top
  useEffect(() => {
    if (isHome || isLanding) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [isHome, isLanding])

  useEffect(() => {
    fetch('/api/keys/status', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setHasSessionKey(Boolean(data?.connected))
      })
      .catch(() => {})
  }, [showApiKeyModal])

  // Close mobile navigation menu on Escape key or outside clicks
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [mobileMenuOpen])

  // Manage viewport height and lock outer document scroll when in full-screen chat
  useEffect(() => {
    if (!isFullScreen) {
      setViewportStyle(null)
      return
    }

    const origHtmlOverflow = document.documentElement.style.overflow
    const origHtmlHeight = document.documentElement.style.height
    const origBodyOverflow = document.body.style.overflow
    const origBodyHeight = document.body.style.height
    const origBodyPosition = document.body.style.position
    const origBodyWidth = document.body.style.width
    const origBodyTop = document.body.style.top
    const origBodyLeft = document.body.style.left

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100%'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = '0'
    document.body.style.left = '0'

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    const updateViewport = () => {
      const vv = window.visualViewport
      if (vv) {
        setViewportStyle({
          height: `${vv.height}px`,
          top: `${vv.offsetTop}px`,
        })
      } else {
        setViewportStyle({
          height: '100dvh',
          top: '0px',
        })
      }
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0)
      }
    }

    updateViewport()
    const vv = window.visualViewport
    vv?.addEventListener('resize', updateViewport)
    vv?.addEventListener('scroll', updateViewport)

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow
      document.documentElement.style.height = origHtmlHeight
      document.body.style.overflow = origBodyOverflow
      document.body.style.height = origBodyHeight
      document.body.style.position = origBodyPosition
      document.body.style.width = origBodyWidth
      document.body.style.top = origBodyTop
      document.body.style.left = origBodyLeft
      vv?.removeEventListener('resize', updateViewport)
      vv?.removeEventListener('scroll', updateViewport)
    }
  }, [isFullScreen])

  const hasKey =
    hasSessionKey ||
    (typeof window !== 'undefined' ? Boolean(localStorage.getItem('user_gemini_api_key')) : false)

  const renderNavTitle = (title?: string) => {
    if (!title) return 'Kembali'
    if (title === 'Pembantu Mekara' || title === 'Mekara') {
      return (
        <span className="font-brand font-bold text-[#800020] text-base min-[360px]:text-lg sm:text-xl tracking-wide">
          Mekara
        </span>
      )
    }
    if (title === 'Panduan Mekara') {
      return (
        <span>
          Panduan <span className="font-brand font-bold text-[#800020]">Mekara</span>
        </span>
      )
    }
    if (title === 'Laporan Jualan') {
      return (
        <span>
          Laporan <span className="font-brand font-bold text-[#800020]">Jualan</span>
        </span>
      )
    }
    if (title === 'Ceritakan Jualan') {
      return (
        <span>
          Ceritakan <span className="font-brand font-bold text-[#800020]">Jualan</span>
        </span>
      )
    }
    if (title === 'Muat Naik Jualan') {
      return (
        <span>
          Muat Naik <span className="font-brand font-bold text-[#800020]">Jualan</span>
        </span>
      )
    }
    if (title === 'Semak Maklumat') {
      return (
        <span>
          Semak <span className="font-brand font-bold text-[#800020]">Maklumat</span>
        </span>
      )
    }
    if (title === 'Urus Rekod Jualan' || title === 'Isi Jualan Manual') {
      return (
        <span>
          Urus Rekod <span className="font-brand font-bold text-[#800020]">Jualan</span>
        </span>
      )
    }
    return title
  }

  const headerNode = !hideHeader && (
    <header
      ref={menuContainerRef}
      id="site-header"
      className="sticky top-0 z-30 shrink-0 bg-[#FAF7F2]/85 backdrop-blur-md border-b border-[#EBE1D7] shadow-2xs"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left Side: Brand Logo OR Back Button with Title */}
          {isLanding ? (
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/images/mekara-logo.png"
                alt="Mekara"
                className="h-7 sm:h-8 w-auto object-contain select-none"
              />
              <span className="sr-only">Mekara</span>
              <p className="hidden md:block text-[11px] text-[#7A6E77] tracking-wide font-medium truncate pl-2 border-l border-[#EBE1D7]">
                Urus Jualan. Lebih Mudah.
              </p>
            </div>
          ) : isHome ? (
            <button
              type="button"
              onClick={onNavHome}
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] rounded-lg"
              aria-label="Kembali ke Halaman Pendaratan"
            >
              <img
                src="/images/mekara-logo.png"
                alt="Mekara"
                className="h-7 sm:h-8 w-auto object-contain select-none"
              />
              <span className="sr-only">Mekara</span>
              <p className="hidden md:block text-[11px] text-[#7A6E77] tracking-wide font-medium truncate pl-2 border-l border-[#EBE1D7]">
                Urus Jualan. Lebih Mudah.
              </p>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {showBack && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="min-h-[44px] min-w-[44px] -ml-1 sm:-ml-2 flex items-center justify-center rounded-xl text-[#171317] hover:text-[#800020] hover:bg-[#F4ECE3] active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="Kembali ke Halaman Sebelumnya"
                  title="Kembali ke Halaman Sebelumnya"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-[#171317]" />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1
                    className="font-extrabold text-sm min-[360px]:text-base sm:text-lg tracking-tight font-heading truncate text-[#171317]"
                  >
                    {renderNavTitle(currentStep)}
                  </h1>
                  {stepIndicator && (
                    <span className="text-[10px] font-bold text-[#800020] bg-[#F8EAE8] border border-[#EED7D5] px-2 py-0.5 rounded-full shrink-0">
                      {stepIndicator}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p className="hidden sm:block text-[11px] sm:text-xs text-[#7A6E77] font-body truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Right Side: Responsive Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Auto-Save Indicator */}
            {saveStatus && saveStatus !== 'idle' && (
              <div className="flex items-center">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] sm:text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="hidden sm:inline">Menyimpan...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span
                    className="text-[10px] sm:text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-2xs"
                    title="Disimpan automatik"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="hidden sm:inline">Disimpan</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-[10px] sm:text-xs text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="hidden sm:inline">Gagal simpan</span>
                  </span>
                )}
              </div>
            )}

            {/* Animated Mobile Hamburger Menu Toggle Button (shown on < 640px) */}
            <div className={`sm:hidden relative ${mobileMenuOpen ? 'z-50' : ''}`}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-h-[40px] min-w-[40px] w-10 h-10 rounded-xl bg-[#FAF6F0] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-[#171317] flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
                aria-label={mobileMenuOpen ? 'Tutup menu pilihan' : 'Menu Pilihan'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-panel"
              >
                <span className="relative w-5 h-3.5 flex flex-col justify-between" aria-hidden="true">
                  <span
                    className={`block h-0.5 w-5 ${isHome ? 'bg-[#171317]' : 'bg-[#1C151F]'} rounded-full transition-all duration-200 ease-out origin-center motion-reduce:transition-none ${
                      mobileMenuOpen ? 'translate-y-[6px] rotate-45' : 'translate-y-0 rotate-0'
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 ${isHome ? 'bg-[#171317]' : 'bg-[#1C151F]'} rounded-full transition-all duration-200 ease-out motion-reduce:transition-none ${
                      mobileMenuOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 ${isHome ? 'bg-[#171317]' : 'bg-[#1C151F]'} rounded-full transition-all duration-200 ease-out origin-center motion-reduce:transition-none ${
                      mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : 'translate-y-0 rotate-0'
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Desktop Action Pills (hidden on mobile, visible on sm:) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {/* Home Nav Button (Inner Pages) */}
              {!isHome && onNavHome && (
                <button
                  type="button"
                  onClick={onNavHome}
                  className="min-h-[40px] px-3.5 rounded-full bg-[#FAF6F0] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-xs font-semibold text-[#171317] hover:text-[#800020] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <HomeIcon className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Utama</span>
                </button>
              )}

              {/* Panduan Button */}
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="min-h-[38px] sm:min-h-[40px] px-3.5 rounded-full bg-[#FAF6F0] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-xs font-semibold text-[#171317] hover:text-[#800020] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Buka Panduan Mekara"
                >
                  <BookOpenIcon className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Panduan</span>
                </button>
              )}

              {/* Kunci Gemini Button */}
              <button
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                className="relative min-h-[38px] sm:min-h-[40px] px-3.5 rounded-full bg-[#FAF6F0] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-xs font-semibold text-[#171317] hover:text-[#800020] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Tetapan Sambungan Kunci Gemini AI"
              >
                <KeyIcon className="w-3.5 h-3.5 text-[#800020]" />
                <span>Kunci Gemini</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasKey ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  title={hasKey ? 'Kunci Gemini Aktif' : 'Kunci Belum Ditetapkan'}
                />
              </button>

              {/* SULAM Info Button */}
              <button
                type="button"
                onClick={() => setShowSulamModal(true)}
                className="min-h-[38px] sm:min-h-[40px] px-3 rounded-full bg-[#FAF6F0]/80 hover:bg-[#F4ECE3] text-xs font-semibold text-[#7A6E77] hover:text-[#800020] flex items-center gap-1 transition-all cursor-pointer border border-[#E8DCD2]"
                title="Maklumat Program SULAM"
              >
                <InfoIcon className="w-3.5 h-3.5 text-[#800020]" />
                <span className="hidden md:inline">SULAM</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dimmed backdrop overlay when floating popover is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs transition-opacity animate-fadeIn sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Floating Popover Overlay (Konsep B1: Apple Monochromatic Burgundy) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="sm:hidden absolute right-3 top-[56px] z-50 w-[265px] bg-[#FAF6F0]/98 backdrop-blur-2xl border border-[#EBE1D7] rounded-[22px] shadow-[0_16px_40px_rgba(23,19,23,0.18)] p-2.5 animate-slideDown"
        >
          <div className="divide-y divide-[#EBE1D7]/70 text-xs">
            {!isHome && onNavHome && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavHome()
                }}
                className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-[#FAF4EA] active:bg-[#F4EDE5] rounded-xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
                    <HomeIcon className="w-3.5 h-3.5 text-[#800020]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#171317] font-heading leading-tight">Menu Utama</p>
                    <p className="text-[10px] text-[#7A6E77]">Papan Pemuka</p>
                  </div>
                </div>
                <span className="text-[#7A6E77] text-sm pr-1">&rsaquo;</span>
              </button>
            )}

            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenGuide()
                }}
                className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-[#FAF4EA] active:bg-[#F4EDE5] rounded-xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
                    <BookOpenIcon className="w-3.5 h-3.5 text-[#800020]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#171317] font-heading leading-tight">Panduan Mekara</p>
                    <p className="text-[10px] text-[#7A6E77]">Tutorial Guna</p>
                  </div>
                </div>
                <span className="text-[#7A6E77] text-sm pr-1">&rsaquo;</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setShowApiKeyModal(true)
              }}
              className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-[#FAF4EA] active:bg-[#F4EDE5] rounded-xl transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
                  <KeyIcon className="w-3.5 h-3.5 text-[#800020]" />
                </div>
                <div>
                  <p className="font-bold text-[#171317] font-heading leading-tight">Kunci Gemini AI</p>
                  <p className="text-[10px] text-[#7A6E77]">Sambungan AI</p>
                </div>
              </div>
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  hasKey ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
                title={hasKey ? 'Kunci Gemini Aktif' : 'Kunci Belum Ditetapkan'}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setShowSulamModal(true)
              }}
              className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-[#FAF4EA] active:bg-[#F4EDE5] rounded-xl transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
                  <InfoIcon className="w-3.5 h-3.5 text-[#800020]" />
                </div>
                <div>
                  <p className="font-bold text-[#171317] font-heading leading-tight">Tentang SULAM</p>
                  <p className="text-[10px] text-[#7A6E77]">Khidmat Komuniti</p>
                </div>
              </div>
              <span className="text-[#7A6E77] text-sm pr-1">&rsaquo;</span>
            </button>
          </div>

          <div className="pt-2 mt-1 border-t border-[#EBE1D7]/60 text-center text-[10px] text-[#7A6E77] flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Disimpan automatik dalam peranti</span>
          </div>
        </div>
      )}
    </header>
  )

  const footerNode = !hideFooter && (
    <footer
      role="contentinfo"
      className="mt-auto bg-[#FAF7F2] border-t border-[#EBE1D7] py-4 sm:py-5 px-4 text-center shrink-0"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
        <img
          src="/images/mekara-symbol.png"
          alt=""
          aria-hidden="true"
          className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] object-contain shrink-0 select-none"
        />
        <span className="font-medium text-[12px] sm:text-[13px] tracking-[0.04em] text-[#70193D] leading-none select-none">
          SULAM 2.0 | WANITA DAN AI
        </span>
      </div>
    </footer>
  )

  const modalsNode = (
    <>
      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={() => {
          fetch('/api/keys/status', { credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              setHasSessionKey(Boolean(data?.connected))
            })
            .catch(() => {})
        }}
      />

      {/* SULAM Info Modal */}
      {showSulamModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowSulamModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-pink-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FAF0E6] border border-[#EBE1D7] flex items-center justify-center">
                  <img src="/images/mekara-symbol.png" alt="Mekara" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1C151F] font-heading">
                    Mekara
                  </h3>
                  <p className="text-[11px] text-[#786C7C]">Inisiatif Khidmat Komuniti SULAM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSulamModal(false)}
                className="text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Tutup Maklumat SULAM"
              >
                ✕
              </button>
            </div>

            <div className="text-xs sm:text-sm text-[#4A3E4E] space-y-2.5 leading-relaxed">
              <p>
                <strong>Mekara</strong> dibangunkan khusus untuk membantu usahawan mikro wanita di Malaysia menguruskan rekod jualan harian secara mudah, selamat, dan bebas kos.
              </p>
              <div className="bg-[#FAF0E6] p-3 rounded-2xl border border-[#EBE1D7] text-xs text-[#800020] space-y-1">
                <p className="font-bold">Prinsip Privasi Data 100% Tempatan:</p>
                <p className="text-[#171317]">
                  Data jualan Puan diproses terus dalam pelayar peranti Puan. Tiada rekod kewangan perniagaan Puan disimpan di pelayan luaran.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSulamModal(false)}
              className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full cursor-pointer"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-x-0 w-full bg-[#FAF7F2] text-[#171317] flex flex-col font-sans antialiased overflow-hidden selection:bg-[#F4E9DF] selection:text-[#800020] z-20'
          : isLanding
            ? 'h-screen max-h-screen bg-[#FAF7F2] text-[#171317] flex flex-col font-sans antialiased overflow-hidden selection:bg-[#F4E9DF] selection:text-[#800020] relative'
            : 'min-h-screen bg-[#FAF7F2] text-[#171317] flex flex-col font-sans antialiased selection:bg-[#F4E9DF] selection:text-[#800020] relative'
      }
      style={
        isFullScreen && viewportStyle
          ? {
              height: viewportStyle.height,
              maxHeight: viewportStyle.height,
              top: viewportStyle.top,
            }
          : isFullScreen
            ? { height: '100dvh', maxHeight: '100dvh', top: '0px' }
            : undefined
      }
    >
      {/* 1. Apple-grade Translucent Sticky Navbar */}
      {headerNode}

      {/* 1b. Mobile Metadata Strip (scrolls away naturally with page content) */}
      {subtitle && !isFullScreen && !isHome && !isLanding && (
        <div className="sm:hidden bg-[#FAF6F0] border-b border-[#EBE1D7] px-3 py-1.5 text-xs text-[#7A6E77] text-center font-medium truncate">
          {subtitle}
        </div>
      )}

      {/* 2. Functional Content Area */}
      <main
        id="main-content"
        className={
          isFullScreen || isLanding
            ? 'flex-1 min-h-0 w-full flex flex-col overflow-hidden p-0'
            : isHome
              ? 'flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8'
              : 'flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6'
        }
      >
        {children}
      </main>

      {/* 4. Footer & Modals */}
      {footerNode}
      {modalsNode}
    </div>
  )
}
