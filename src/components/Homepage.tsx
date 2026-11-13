import {
  SparklesIcon,
  ExcelFileIcon,
  PencilEditIcon,
  PlayCircleIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from './ui/Icons'
import heroBannerDesktop from '../assets/hero-banner-desktop.jpg'
import heroBannerMobile from '../assets/hero-banner-mobile.jpg'

export interface HomepageProps {
  onStory: () => void
  onUpload: () => void
  onManual: () => void
  onSample: () => void
  onOpenGuide?: () => void
}

export function Homepage({ onStory, onUpload, onManual, onSample, onOpenGuide }: HomepageProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ========================================================
          SECTION B: Hero Banner ("Hai Puan! Jom semak jualan. ♡")
          - Desktop / Laptop: hero-banner-desktop.jpg
          - Phone / Mobile: hero-banner-mobile.jpg
          ======================================================== */}
      <section
        aria-label="Bahagian Selamat Datang"
        className="relative border border-[#F1D3E3] rounded-3xl overflow-hidden bg-[#FFF5FA] shadow-xs"
      >
        {/* Mobile Background Layer (<640px) */}
        <div
          aria-hidden="true"
          className="sm:hidden absolute inset-0 bg-no-repeat bg-[center_bottom] bg-[length:100%_auto] pointer-events-none z-0"
          style={{ backgroundImage: `url(${heroBannerMobile})` }}
        />

        {/* Laptop / Desktop Background Layer (>=640px) */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute inset-0 bg-no-repeat bg-[position:right_center] bg-cover pointer-events-none z-0"
          style={{ backgroundImage: `url(${heroBannerDesktop})` }}
        />

        {/* Foreground Content Container */}
        <div className="relative z-10 flex flex-col justify-start sm:justify-center h-[clamp(530px,142vw,610px)] sm:h-auto sm:min-h-[290px] md:min-h-[320px] p-5 xs:p-6 sm:p-8 md:p-9">
          {/* Text and Primary CTA Button */}
          <div className="w-full max-w-[290px] xs:max-w-xs sm:max-w-[48%] md:max-w-[50%] space-y-2 sm:space-y-2.5">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 bg-pink-100/95 border border-pink-200/90 text-[#BE1E72] text-xs font-bold px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs">
              <SparklesIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
              <span>Pembantu Perniagaan Pintar</span>
            </div>

            {/* Heading */}
            <h1 className="text-[23px] xs:text-2xl sm:text-3xl font-extrabold text-[#28152F] tracking-tight leading-tight font-heading">
              Hai Puan!
              <span className="block mt-0.5">
                Jom semak jualan.{' '}
                <span className="text-[#BE1E72] inline-block font-normal" aria-hidden="true">
                  ♡
                </span>
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-xs xs:text-sm sm:text-base text-[#68586B] leading-relaxed font-body">
              Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.
            </p>

            {/* Primary Action Button (Mula dengan AI) */}
            <div className="pt-1 sm:pt-2">
              <button
                type="button"
                onClick={onStory}
                className="inline-flex items-center justify-center gap-2 bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.98] text-white font-bold text-sm sm:text-base px-6 py-3 rounded-2xl shadow-sm shadow-pink-300 transition-all cursor-pointer min-h-[44px]"
              >
                <span>Mula dengan AI</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION D: Secondary Input Methods ("Atau pilih cara lain")
          ======================================================== */}
      <section aria-label="Kaedah Kemasukan Jualan Lain" className="space-y-2.5">
        <h2 className="text-base sm:text-lg font-bold text-[#28152F] font-heading px-1">
          Atau pilih cara lain
        </h2>

        {/* Compact Navigation Rows (Mobile) / Vertical Cards (Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* 1. Muat Naik Excel / CSV */}
          <button
            type="button"
            onClick={onUpload}
            className="min-h-[64px] sm:min-h-[140px] bg-white hover:bg-emerald-50/25 active:bg-emerald-50/40 border border-[#F1D3E3] hover:border-emerald-300 rounded-2xl p-3.5 sm:p-5 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer text-left group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <ExcelFileIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 sm:mt-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading group-hover:text-emerald-800 transition-colors">
                Muat Naik Excel / CSV
              </h3>
              <p className="text-xs sm:text-sm text-[#68586B] font-body mt-0.5 leading-snug">
                Gunakan fail jualan sedia ada.
              </p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[#BE1E72] group-hover:translate-x-0.5 transition-transform shrink-0 sm:hidden" />
          </button>

          {/* 2. Isi Jualan Manual */}
          <button
            type="button"
            onClick={onManual}
            className="min-h-[64px] sm:min-h-[140px] bg-white hover:bg-violet-50/25 active:bg-violet-50/40 border border-[#F1D3E3] hover:border-violet-300 rounded-2xl p-3.5 sm:p-5 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer text-left group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-[#7C3AED] shrink-0">
              <PencilEditIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3AED]" />
            </div>
            <div className="flex-1 sm:mt-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading group-hover:text-violet-800 transition-colors">
                Isi Jualan Manual
              </h3>
              <p className="text-xs sm:text-sm text-[#68586B] font-body mt-0.5 leading-snug">
                Masukkan maklumat satu persatu.
              </p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[#BE1E72] group-hover:translate-x-0.5 transition-transform shrink-0 sm:hidden" />
          </button>

          {/* 3. Cuba Data Contoh */}
          <button
            type="button"
            onClick={onSample}
            className="min-h-[64px] sm:min-h-[140px] bg-white hover:bg-amber-50/25 active:bg-amber-50/40 border border-[#F1D3E3] hover:border-amber-300 rounded-2xl p-3.5 sm:p-5 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer text-left group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D97706] shrink-0">
              <PlayCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#D97706]" />
            </div>
            <div className="flex-1 sm:mt-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading group-hover:text-amber-800 transition-colors">
                  Cuba Data Contoh
                </h3>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                  Simulasi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#68586B] font-body mt-0.5 leading-snug">
                Lihat contoh laporan dan carta.
              </p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[#BE1E72] group-hover:translate-x-0.5 transition-transform shrink-0 sm:hidden" />
          </button>
        </div>
      </section>

      {/* ========================================================
          SECTION E: Help Section (Discreet Link)
          ======================================================== */}
      {onOpenGuide && (
        <section aria-label="Bantuan dan Panduan">
          <div className="bg-gradient-to-r from-pink-50/80 via-purple-50/40 to-white border border-[#F1D3E3] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-[#7C3AED] flex items-center justify-center shrink-0">
                <BookOpenIcon className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div className="flex items-center flex-wrap gap-1 text-xs sm:text-sm">
                <span className="font-bold text-[#28152F]">Baru pertama kali?</span>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="font-bold text-[#BE1E72] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Baca panduan ringkas</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
            <div className="hidden sm:flex text-[#F472B6] font-black text-sm select-none" aria-hidden="true">
              ✨
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
