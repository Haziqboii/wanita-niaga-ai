import { useEffect } from 'react'

export interface HomepageProps {
  onStory: () => void
  onUpload: () => void
  onManual: () => void
  onSample: () => void
  onOpenGuide?: () => void
  hasSavedReport?: boolean
  savedRecordCount?: number
  onResumeSavedReport?: () => void
  onStartNewReport?: () => void
  isHomeActive?: boolean
}

export function Homepage({
  onStory,
  onUpload,
  onManual,
  onSample,
  onOpenGuide,
  hasSavedReport = false,
  savedRecordCount = 0,
  onResumeSavedReport,
  onStartNewReport,
}: HomepageProps) {
  // Apple-grade Staggered Float & Fade-Up Choreography (Emil Kowalski guidance)
  useEffect(() => {
    // Ensure fresh view to Section 2 starts at the top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
      {/* 1. Returning User Dossier Card */}
      {hasSavedReport && (
        <section
          aria-label="Sambung Laporan Tersimpan"
          className="apple-reveal-card bg-white border border-[#EBE2DA] rounded-[22px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,19,23,0.03)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(23,19,23,0.06)] transition-all duration-300"
          style={{ animationDelay: '0ms' }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#171317] tracking-tight">
              Selamat kembali, Puan!
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6E77] mt-0.5">
              Rekod jualan Puan masih ada dalam pelayar ini ({savedRecordCount} rekod tersimpan).
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={onResumeSavedReport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#800020] hover:bg-[#70193D] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-[0_2px_8px_rgba(128,0,32,0.22)] transition-all cursor-pointer min-h-[40px]"
            >
              <span>Sambung Laporan</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={onStartNewReport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 bg-[#FBF8F4] hover:bg-[#F4ECE3] active:scale-[0.98] border border-[#E4D9CF] text-[#171317] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all cursor-pointer min-h-[40px]"
            >
              Mula Rekod Baharu
            </button>
          </div>
        </section>
      )}

      {/* 2. Section Heading & The Three Sales Entry Methods */}
      <section aria-label="Kaedah Kemasukan Jualan" className="space-y-3 sm:space-y-3.5">
        <div
          className="apple-reveal-card flex items-baseline justify-between px-1 pt-1"
          style={{ animationDelay: hasSavedReport ? '80ms' : '0ms' }}
        >
          <h2 className="text-lg sm:text-xl font-extrabold text-[#171317] tracking-tight">
            Pilih Cara Memasukkan Jualan
          </h2>
          <span className="text-xs sm:text-sm text-[#7A6E77] font-medium shrink-0">
            3 Kaedah Mudah
          </span>
        </div>

        {/* METHOD 1: CERITA JUALAN KEPADA AI (Flagship Hero Bento Card) */}
        <article
          onClick={onStory}
          className="apple-reveal-card relative overflow-hidden bg-gradient-to-br from-[#FAF5EC] via-[#FAF4EA] to-[#F5ECE0] border border-[#EBE1D7] rounded-[24px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,19,23,0.04)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(128,0,32,0.08)] hover:border-[#DFD4C8] transition-all duration-300 cursor-pointer group"
          style={{ animationDelay: hasSavedReport ? '160ms' : '80ms' }}
        >
          {/* Subtle soft organic wave texture in upper-right corner */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-52 h-52 overflow-hidden"
            aria-hidden="true"
          >
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-35">
              <path
                d="M30 0C60 40 85 90 145 100C185 106 200 70 200 40V0H30Z"
                fill="url(#wave-grad-1)"
              />
              <path
                d="M70 0C90 60 130 110 180 120C195 123 200 110 200 90V0H70Z"
                fill="url(#wave-grad-2)"
                opacity="0.65"
              />
              <defs>
                <linearGradient id="wave-grad-1" x1="100" y1="0" x2="180" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D5C0AD" />
                  <stop offset="1" stopColor="#EAD8CA" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="wave-grad-2" x1="120" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#C9B09A" />
                  <stop offset="1" stopColor="#E5D1C3" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              {/* Top Conversational Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F4E9DF] border border-[#E9DDD1] flex items-center justify-center text-[#800020] shadow-2xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#171317] mt-3 tracking-tight">
                1. Cerita Jualan kepada AI
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6069] mt-1 leading-relaxed">
                Taip ayat biasa macam mesej WhatsApp. AI membantu menyusun rekod jualan secara automatik.
              </p>

              {/* Inset Quote Panel */}
              <div className="mt-3.5 bg-white/85 backdrop-blur-2xs border border-[#EBE1D7] rounded-xl p-3 flex items-center gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#FAF0E6] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#800020] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-[#6B6069] italic font-normal leading-snug">
                  &ldquo;Pagi tadi laku 50 biji karipap RM2.00 dan 20 botol air sirap...&rdquo;
                </p>
              </div>
            </div>

            {/* Primary Button */}
            <div className="pt-4 mt-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onStory()
                }}
                className="w-full bg-[#800020] hover:bg-[#70193D] active:scale-[0.98] text-white font-bold text-xs sm:text-sm py-3 rounded-full flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(128,0,32,0.28)] transition-all cursor-pointer min-h-[44px]"
              >
                <span>Mula Cerita Jualan</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </article>

        {/* PAIRED SECONDARY CARDS (Excel & Isi Sendiri) */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 pt-0.5">
          {/* METHOD 2: MUAT NAIK EXCEL */}
          <article
            onClick={onUpload}
            className="apple-reveal-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[20px] p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(23,19,23,0.03)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(23,19,23,0.06)] hover:border-[#DFD4C8] transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: hasSavedReport ? '240ms' : '160ms' }}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#F4EBE3] border border-[#E8DCD2] flex items-center justify-center text-[#800020]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-[#7A6E77] bg-[#EFE6DD] px-2 py-0.5 rounded-full">
                  .xlsx / .csv
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[#171317] mt-2.5 tracking-tight">
                2. Muat Naik Excel
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 leading-relaxed">
                Gunakan fail sedia ada dari telefon atau komputer.
              </p>
            </div>

            <div className="pt-3.5 mt-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onUpload()
                }}
                className="w-full bg-[#F4EDE5] hover:bg-[#EBE2D8] active:scale-[0.98] border border-[#DFD3C7] text-[#171317] font-semibold text-xs py-2 px-3 rounded-full flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[38px]"
              >
                <span>Pilih Fail</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>

          {/* METHOD 3: ISI JUALAN SENDIRI */}
          <article
            onClick={onManual}
            className="apple-reveal-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[20px] p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(23,19,23,0.03)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(23,19,23,0.06)] hover:border-[#DFD4C8] transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: hasSavedReport ? '320ms' : '240ms' }}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#F4EBE3] border border-[#E8DCD2] flex items-center justify-center text-[#800020]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-[#800020] bg-[#F8EAE8] border border-[#EED7D5] px-2 py-0.5 rounded-full">
                  Borang Mudah
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[#171317] mt-2.5 tracking-tight">
                3. Urus Rekod Jualan
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 leading-relaxed">
                Tambah, cari dan edit rekod jualan.
              </p>
            </div>

            <div className="pt-3.5 mt-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onManual()
                }}
                className="w-full bg-[#F4EDE5] hover:bg-[#EBE2D8] active:scale-[0.98] border border-[#DFD3C7] text-[#171317] font-semibold text-xs py-2 px-3 rounded-full flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[38px]"
              >
                <span>Urus Jualan</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Demo Data Simulation Card (Aligned single-row matching reference) */}
      <section
        aria-label="Data Simulasi"
        className="apple-reveal-card pt-0.5"
        style={{ animationDelay: hasSavedReport ? '400ms' : '320ms' }}
      >
        <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[20px] p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_4px_16px_rgba(23,19,23,0.03)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(23,19,23,0.06)] transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#F5ECE2] border border-[#EAE0D4] flex items-center justify-center text-[#800020] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" />
                <path d="M19 17L20.1 19.9L23 21L20.1 22.1L19 25L17.9 22.1L15 21L17.9 19.9L19 17Z" opacity="0.8" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#171317] tracking-tight">
                Cuba Data Contoh?
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6B6069] leading-tight">
                Demonstrasi gerai makanan percuma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSample}
            className="bg-[#800020] hover:bg-[#70193D] active:scale-[0.98] text-white font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-[0_2px_8px_rgba(128,0,32,0.22)] transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px]"
          >
            <span>Muatkan Data</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {/* 4. User Guide Discreet Link */}
      {onOpenGuide && (
        <section
          aria-label="Bantuan dan Panduan"
          className="apple-reveal-card text-center pt-2 pb-1"
          style={{ animationDelay: hasSavedReport ? '480ms' : '400ms' }}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B6069] flex-wrap">
            <span>💡 Baru pertama kali menggunakan Mekara?</span>
            <button
              type="button"
              onClick={onOpenGuide}
              className="font-bold text-[#800020] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Baca Panduan Mekara</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
