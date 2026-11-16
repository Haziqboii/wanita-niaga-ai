
export interface LandingHeroProps {
  onEnter?: () => void
}

export function LandingHero({ onEnter }: LandingHeroProps) {
  return (
    <section
      aria-label="Pengenalan Utama Mekara"
      className="relative w-full h-full flex-1 min-h-0 flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[#FAF0EB] via-[#FDF5F1] to-[#F7E7E0] select-none"
    >
      {/* 1. Ambient Extended Backdrop for Tablet & Desktop Viewports */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden opacity-40 select-none"
      >
        <img
          src="/images/mekara-landing.png"
          alt=""
          className="w-full h-full object-cover blur-3xl scale-125 brightness-105"
        />
      </div>

      {/* 2. Main Illustration Container (Full-bleed mobile, unclipped contain on desktop) */}
      <div className="relative z-10 w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden p-0 m-0">
        <img
          src="/images/mekara-landing.png"
          alt="Mekara — Urus Jualan. Lebih Mudah."
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-[center_top] sm:h-full sm:w-auto sm:max-w-full sm:object-contain sm:object-center sm:drop-shadow-[0_10px_40px_rgba(128,0,32,0.08)] select-none pointer-events-none"
        />
      </div>

      {/* 3. Official Burgundy Apple Pill Button: "Masuk →" */}
      <div className="absolute bottom-5 xs:bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={onEnter}
          aria-label="Masuk ke Mekara"
          className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:px-9 sm:py-4 bg-[#800020] hover:bg-[#70193D] active:scale-95 text-white font-heading font-bold text-sm sm:text-base tracking-wide rounded-full shadow-[0_8px_24px_rgba(128,0,32,0.35),0_2px_6px_rgba(128,0,32,0.2)] hover:shadow-[0_12px_28px_rgba(128,0,32,0.45)] transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#800020]/50"
        >
          <span>Masuk</span>
          <span
            aria-hidden="true"
            className="text-base sm:text-lg transition-transform duration-300 ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </div>
    </section>
  )
}
