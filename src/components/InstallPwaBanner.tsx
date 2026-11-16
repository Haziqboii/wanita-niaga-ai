import React, { useState, useEffect } from 'react'
import {
  UploadArrowIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
} from './ui/Icons'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(false)

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standaloneMode)
    if (standaloneMode) return

    // 2. Detect iOS (Safari/iPhone/iPad)
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIOS(iosDevice)

    // 3. Check dismissal memory in sessionStorage / localStorage (hide for current session)
    const dismissed = sessionStorage.getItem('mekara_pwa_dismissed')
    if (dismissed) return

    // 4. Capture native Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS and other mobile devices where beforeinstallprompt doesn't fire,
    // show gentle banner after 2 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('mekara_pwa_dismissed')) {
        setShowBanner(true)
      }
    }, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setShowBanner(false)
    sessionStorage.setItem('mekara_pwa_dismissed', 'true')
  }

  const handleOpenInstallGuide = () => {
    setShowModal(true)
  }

  const handleNativeInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setShowModal(false)
          setShowBanner(false)
          sessionStorage.setItem('mekara_pwa_dismissed', 'true')
        }
        setDeferredPrompt(null)
      })
    }
  }

  if (isStandalone) return null

  return (
    <>
      {/* 1. Floating Smart Bottom Banner (Pilihan 1 - Apple Style) */}
      {showBanner && !showModal && (
        <aside
          role="region"
          aria-label="Pemasangan Aplikasi Mekara"
          className="fixed bottom-4 inset-x-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm z-40 bg-[#FAF6F0]/95 backdrop-blur-md border border-[#EBE1D7] rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgba(23,19,23,0.14)] transition-all animate-slideUp flex items-center justify-between gap-3"
        >
          {/* Butterfly Squircle */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800020] to-[#5A0016] flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <img
              src="/images/mekara-symbol.png"
              alt="Mekara Icon"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Text Description */}
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-[#171317] truncate leading-tight">
              Pasang Mekara di Telefon
            </p>
            <p className="text-[11px] text-[#7A6E77] truncate mt-0.5">
              Buka terus dari skrin utama Puan
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenInstallGuide}
              className="btn-primary-burgundy text-xs font-bold px-3 py-1.5 rounded-full text-white cursor-pointer shadow-xs active:scale-95 transition-transform"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-full text-[#7A6E77] hover:text-[#171317] hover:bg-[#F4ECE3] transition-colors cursor-pointer"
              aria-label="Tutup pemberitahuan pasang aplikasi"
              title="Tutup"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Apple-Style Bottom Sheet Drawer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setShowModal(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="relative w-full max-w-lg bg-[#FAF6F0] rounded-t-[28px] border-t border-[#EBE1D7] p-5 sm:p-6 shadow-[0_-10px_40px_rgba(23,19,23,0.18)] z-10 animate-slideUp space-y-5">
            {/* Apple Drag Handle */}
            <div className="w-12 h-1 bg-[#D8C7B8] rounded-full mx-auto" />

            {/* Header with App Icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#800020] to-[#5A0016] flex items-center justify-center p-2 shrink-0 shadow-xs">
                <img
                  src="/images/mekara-symbol.png"
                  alt="Mekara Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold text-[#171317] font-heading leading-snug">
                  Pasang Mekara di Skrin Utama
                </h3>
                <p className="text-xs text-[#7A6E77] mt-0.5 leading-relaxed">
                  Buka terus seperti aplikasi telefon tanpa perlu menaip pautan web lagi.
                </p>
              </div>
            </div>

            {/* Platform Walkthrough */}
            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 bg-[#FAF4EA] border border-[#EBE1D7] rounded-2xl p-4 text-xs sm:text-sm text-[#171317]">
                <p className="font-bold text-[#800020] text-xs uppercase tracking-wider">
                  Cara Pasang di iPhone / iPad (Safari)
                </p>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0 font-bold text-xs shadow-2xs">
                    1
                  </div>
                  <div className="leading-relaxed">
                    Tekan butang <strong>Kongsi</strong> (<UploadArrowIcon className="w-3.5 h-3.5 inline text-[#800020] -mt-0.5" /> <em>Share</em>) di bahagian palang bawah Safari telefon Puan.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0 font-bold text-xs shadow-2xs">
                    2
                  </div>
                  <div className="leading-relaxed">
                    Skrol sedikit ke bawah dan pilih <span className="font-semibold text-[#800020]">"Tambah ke Skrin Utama"</span> (<PlusIcon className="w-3.5 h-3.5 inline text-[#800020] -mt-0.5" /> <em>Add to Home Screen</em>).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE1D7] flex items-center justify-center text-[#0D7355] shrink-0 font-bold text-xs shadow-2xs">
                    3
                  </div>
                  <div className="leading-relaxed">
                    Tekan butang <strong className="text-[#0D7355]">Tambah</strong> (<em>Add</em>) di penjuru atas kanan skrin. Siap!
                  </div>
                </div>
              </div>
            ) : (
              /* Android Instructions */
              <div className="space-y-3 bg-[#FAF4EA] border border-[#EBE1D7] rounded-2xl p-4 text-xs sm:text-sm text-[#171317]">
                {deferredPrompt && (
                  <div className="pb-1">
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      className="w-full btn-primary-burgundy text-xs sm:text-sm font-bold py-3 rounded-full text-white cursor-pointer shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 mb-2"
                    >
                      <PlusIcon className="w-4 h-4 text-white" />
                      <span>Pasang Aplikasi Sekarang</span>
                    </button>
                  </div>
                )}

                <p className="font-bold text-[#800020] text-xs uppercase tracking-wider">
                  {deferredPrompt ? 'Atau Pasang Melalui Menu Chrome:' : 'Cara Pasang di Telefon Android (Chrome):'}
                </p>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0 font-bold text-xs shadow-2xs">
                    1
                  </div>
                  <div className="leading-relaxed">
                    Tekan ikon <strong>tiga titik (⋮)</strong> di penjuru atas kanan pelayar Chrome.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0 font-bold text-xs shadow-2xs">
                    2
                  </div>
                  <div className="leading-relaxed">
                    Pilih <span className="font-semibold text-[#800020]">"Pasang Aplikasi"</span> atau <span className="font-semibold text-[#800020]">"Tambah ke Skrin Utama"</span>.
                  </div>
                </div>
              </div>
            )}

            {/* Benefits Badge */}
            <div className="flex items-center gap-2 text-xs text-[#0D7355] bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl px-3 py-2">
              <CheckCircleIcon className="w-4 h-4 text-[#0D7355] shrink-0" />
              <span>Aplikasi akan dibuka serta-merta tanpa perlu menaip URL lagi.</span>
            </div>

            {/* Close Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setShowBanner(false)
                  sessionStorage.setItem('mekara_pwa_dismissed', 'true')
                }}
                className="w-full btn-secondary-neutral text-xs sm:text-sm font-bold py-3 rounded-full text-[#171317] border border-[#EBE1D7] bg-white hover:bg-[#FAF4EA] transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Faham, Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
