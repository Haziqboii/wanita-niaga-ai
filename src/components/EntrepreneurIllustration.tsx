export function EntrepreneurIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="awningPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE1E72" />
        </linearGradient>
        <linearGradient id="hijabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="60%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      {/* Decorative Spark lines */}
      <g stroke="#BE1E72" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
        <path d="M125 45L120 33" />
        <path d="M135 48L140 37" />
        <path d="M115 52L105 45" />
      </g>
      <g stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <path d="M85 70L75 66" />
        <path d="M88 80L77 82" />
      </g>

      {/* Background Market Awning */}
      <g transform="translate(145, 10)">
        {/* Scalloped Awning Stripes */}
        <path d="M10 0H165L155 45C155 52 145 52 145 45L145 0" fill="#FFF5FA" />
        <path d="M35 0L35 45C35 52 15 52 15 45L15 0" fill="url(#awningPink)" />
        <path d="M45 0H75L75 45C75 52 55 52 55 45L55 0" fill="#FFF5FA" />
        <path d="M75 0H105L105 45C105 52 85 52 85 45L85 0" fill="url(#awningPink)" />
        <path d="M105 0H135L135 45C135 52 115 52 115 45L115 0" fill="#FFF5FA" />
        <path d="M135 0H165L160 45C160 52 140 52 140 45L140 0" fill="url(#awningPink)" />
        <rect x="10" y="45" width="155" height="4" fill="#BE1E72" rx="2" />
      </g>

      {/* Shop Shelves and Kuih Jars behind */}
      <g transform="translate(195, 60)">
        {/* Shelf 1 */}
        <rect x="0" y="45" width="115" height="5" fill="#E2E8F0" rx="2" />
        {/* Jar 1 */}
        <rect x="15" y="16" width="26" height="29" rx="5" fill="#E0E7FF" opacity="0.8" />
        <rect x="19" y="11" width="18" height="6" rx="2" fill="#BE1E72" />
        <circle cx="28" cy="30" r="7" fill="#F472B6" opacity="0.6" />
        {/* Jar 2 */}
        <rect x="55" y="16" width="26" height="29" rx="5" fill="#FEF3C7" opacity="0.8" />
        <rect x="59" y="11" width="18" height="6" rx="2" fill="#D97706" />
        <circle cx="68" cy="30" r="7" fill="#FBBF24" opacity="0.7" />
      </g>

      {/* Counter Table */}
      <path d="M10 200H315V250H10V200Z" fill="#FDE8E8" />
      <rect x="10" y="196" width="305" height="7" fill="#FBCFE8" rx="3" />

      {/* Bakery Plate with Kuih / Donuts */}
      <g transform="translate(200, 172)">
        <ellipse cx="45" cy="24" rx="42" ry="7" fill="#E2E8F0" />
        {/* Kuih 1 (Brownie / Golden cake) */}
        <rect x="15" y="8" width="18" height="13" rx="3" fill="#B45309" />
        <rect x="16" y="6" width="16" height="4" rx="2" fill="#F59E0B" />
        {/* Kuih 2 (Lapis / Pink) */}
        <rect x="36" y="5" width="20" height="16" rx="3" fill="#BE1E72" />
        <rect x="36" y="9" width="20" height="4" fill="#F472B6" />
        <rect x="36" y="13" width="20" height="4" fill="#FFF5FA" />
        {/* Kuih 3 (Karipap gold) */}
        <path d="M60 18C60 10 78 10 78 18H60Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      </g>

      {/* Muslimah Entrepreneur (Puan) */}
      <g transform="translate(85, 45)">
        {/* Torso & Clothes */}
        <path d="M35 155C35 125 55 110 85 110C115 110 135 125 135 155L145 200H25L35 155Z" fill="#FFF" />
        {/* Apron */}
        <path d="M50 130H120L125 200H45L50 130Z" fill="#7C3AED" />
        <path d="M60 112L50 130M110 112L120 130" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" />

        {/* Hijab Back */}
        <path d="M35 85C30 50 45 20 85 20C125 20 140 50 135 85C132 110 120 135 85 135C50 135 38 110 35 85Z" fill="url(#hijabGrad)" />

        {/* Face */}
        <ellipse cx="85" cy="65" rx="28" ry="32" fill="#FED7AA" />
        {/* Hijab Inner Frame */}
        <path d="M60 52C63 35 75 32 85 32C95 32 107 35 110 52C112 68 110 82 85 85C60 82 58 68 60 52Z" fill="#FED7AA" />

        {/* Eyes (Happy smiling crescents) */}
        <path d="M72 60C74 57 78 57 80 60" stroke="#28152F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M90 60C92 57 96 57 98 60" stroke="#28152F" strokeWidth="2.5" strokeLinecap="round" />

        {/* Eyebrows */}
        <path d="M70 53C73 51 77 52 79 54" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M91 54C93 52 97 51 100 53" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" />

        {/* Blushing cheeks */}
        <ellipse cx="69" cy="67" rx="5" ry="3.5" fill="#F472B6" opacity="0.6" />
        <ellipse cx="101" cy="67" rx="5" ry="3.5" fill="#F472B6" opacity="0.6" />

        {/* Cute Smile with teeth */}
        <path d="M78 70C80 77 90 77 92 70Z" fill="#BE1E72" />
        <path d="M80 70H90" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Hijab Drape Front */}
        <path d="M58 85C65 95 75 102 85 102C95 102 105 95 112 85C118 105 125 130 115 140C100 152 70 152 55 140C45 130 52 105 58 85Z" fill="url(#hijabGrad)" />

        {/* Left Arm raised cheerfully */}
        <g transform="translate(10, 80)">
          <path d="M28 45L12 18C10 14 13 8 18 10L35 22" fill="#FED7AA" />
          {/* Fist / Raised hand */}
          <circle cx="10" cy="12" r="8" fill="#FED7AA" />
          <path d="M7 10C8 8 11 8 13 11" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
          {/* Sleeve */}
          <path d="M25 45C22 35 25 25 32 20L42 35" fill="#FFF" />
        </g>

        {/* Right Arm working at laptop */}
        <path d="M120 135L145 155L115 165" fill="#FED7AA" />
      </g>

      {/* Modern Purple Laptop */}
      <g transform="translate(125, 160)">
        {/* Screen */}
        <polygon points="10,40 25,0 85,0 75,40" fill="url(#laptopGrad)" stroke="#7C3AED" strokeWidth="1.5" />
        <polygon points="14,37 27,4 81,4 71,37" fill="#EDE9FE" />
        {/* Chart icon on laptop screen */}
        <path d="M38 28L48 18L56 22L68 10" stroke="#BE1E72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="68" cy="10" r="2.5" fill="#0D9488" />
        {/* Keyboard base */}
        <polygon points="0,42 12,40 78,40 90,42" fill="#A78BFA" stroke="#6D28D9" strokeWidth="1" />
      </g>
    </svg>
  )
}
