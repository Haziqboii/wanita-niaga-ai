const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\nav_options';
  fs.mkdirSync(outDir, { recursive: true });

  const symbolBase64 = fs.readFileSync('public/images/mekara-logo.png').toString('base64');
  const logoSrc = 'data:image/png;base64,' + symbolBase64;

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Base HTML template
  const getHtml = (contentHtml, optionTitle, optionBadge) => `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', sans-serif; background-color: #F7F1E8; margin: 0; padding: 0; }
        .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
      </style>
    </head>
    <body class="min-h-screen bg-[#F7F1E8] flex flex-col justify-between">
      <!-- Top Status Header in Concept -->
      <div class="bg-[#800020] text-white text-center py-2 px-4 shadow-sm flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider">${optionBadge}</span>
        <span class="text-xs font-bold font-heading">${optionTitle}</span>
        <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Apple Style</span>
      </div>

      <!-- App Header Bar with active 'X' Hamburger -->
      <header class="bg-[#FAF6F0] border-b border-[#EBE1D7] px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="${logoSrc}" alt="Mekara" class="h-7 w-auto object-contain" />
          </div>

          <div class="flex items-center gap-2">
            <!-- Active Hamburger turned into X -->
            <button class="w-10 h-10 rounded-xl bg-[#F4ECE3] border border-[#E8DCD2] text-[#800020] flex items-center justify-center shadow-xs">
              <svg class="w-5 h-5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Mobile Content Area with Menu Expanded -->
      <main class="relative flex-1">
        <!-- Dimmed background of the app page -->
        <div class="p-4 space-y-4 opacity-30 pointer-events-none filter blur-[1px]">
          <div class="h-28 rounded-2xl bg-amber-200/50"></div>
          <div class="h-44 rounded-2xl bg-stone-200/50"></div>
          <div class="h-56 rounded-2xl bg-rose-200/50"></div>
        </div>

        <!-- The Menu Overlay Dropdown -->
        <div class="absolute inset-x-0 top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-xl border-b border-[#EBE1D7] shadow-[0_12px_40px_rgba(23,19,23,0.15)] animate-slideDown p-4">
          ${contentHtml}
        </div>
      </main>

      <!-- Bottom Home Bar Indicator -->
      <div class="pb-2 pt-1 flex justify-center bg-[#FAF6F0]">
        <div class="w-32 h-1 bg-[#171317]/30 rounded-full"></div>
      </div>
    </body>
    </html>
  `;

  // OPTION 1: Apple Control Center Bento Grid (2x2)
  const option1Html = `
    <div class="space-y-3.5">
      <div class="flex items-center justify-between px-1">
        <p class="text-[11px] font-bold uppercase tracking-wider text-[#7A6E77] font-heading">Menu Pantas Mekara</p>
        <span class="text-[10px] text-[#0D7355] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full font-bold">Modul SULAM 2.0</span>
      </div>

      <!-- 2x2 Bento Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Tile 1: Menu Utama -->
        <div class="bg-gradient-to-br from-[#800020] to-[#5A0016] text-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(128,0,32,0.25)] flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all">
          <div class="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div class="mt-3">
            <p class="font-extrabold text-sm font-heading leading-tight">Menu Utama</p>
            <p class="text-[11px] text-white/80 mt-0.5">Papan Pemuka</p>
          </div>
        </div>

        <!-- Tile 2: Panduan Mekara -->
        <div class="bg-white border border-[#EBE1D7] rounded-2xl p-4 shadow-[0_2px_8px_rgba(23,19,23,0.03)] flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all hover:bg-[#FAF4EA]">
          <div class="w-8 h-8 rounded-xl bg-[#FAF4EA] border border-[#EEDCC8] flex items-center justify-center text-[#B25E00]">
            <svg class="w-4 h-4 text-[#B25E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="mt-3">
            <p class="font-extrabold text-sm font-heading text-[#171317] leading-tight">Panduan Mekara</p>
            <p class="text-[11px] text-[#7A6E77] mt-0.5">Pusat Bantuan</p>
          </div>
        </div>

        <!-- Tile 3: Kunci Gemini AI -->
        <div class="bg-white border border-[#EBE1D7] rounded-2xl p-4 shadow-[0_2px_8px_rgba(23,19,23,0.03)] flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all hover:bg-[#FAF4EA]">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020]">
              <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span class="flex items-center gap-1 text-[10px] font-bold text-[#0D7355] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-[#0D7355]"></span> Aktif
            </span>
          </div>
          <div class="mt-3">
            <p class="font-extrabold text-sm font-heading text-[#171317] leading-tight">Kunci Gemini</p>
            <p class="text-[11px] text-[#7A6E77] mt-0.5">Sambungan Pintar</p>
          </div>
        </div>

        <!-- Tile 4: Tentang SULAM -->
        <div class="bg-white border border-[#EBE1D7] rounded-2xl p-4 shadow-[0_2px_8px_rgba(23,19,23,0.03)] flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all hover:bg-[#FAF4EA]">
          <div class="w-8 h-8 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#0D7355]">
            <svg class="w-4 h-4 text-[#0D7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="mt-3">
            <p class="font-extrabold text-sm font-heading text-[#171317] leading-tight">Tentang SULAM</p>
            <p class="text-[11px] text-[#7A6E77] mt-0.5">Khidmat Komuniti</p>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#7A6E77]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Data perniagaan disimpan selamat dalam peranti ini.</span>
      </div>
    </div>
  `;

  // OPTION 2: Apple Springboard Icon Row (Horizontal Row with 3D Squircles)
  const option2Html = `
    <div class="space-y-4 py-1">
      <div class="flex items-center justify-between px-1">
        <p class="text-[11px] font-bold uppercase tracking-wider text-[#7A6E77] font-heading">Aplikasi Mekara</p>
        <span class="text-[10px] text-[#800020] bg-[#F8EAE8] border border-[#EED7D5] px-2 py-0.5 rounded-full font-bold">iPhone Springboard</span>
      </div>

      <!-- Horizontal 4-Icon Launcher Row -->
      <div class="grid grid-cols-4 gap-2 pt-1 pb-2">
        <!-- Icon 1: Utama -->
        <div class="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-transform">
          <div class="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#800020] to-[#5A0016] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(128,0,32,0.28)] border border-white/20">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span class="text-[11px] font-bold text-[#171317] text-center tracking-tight">Utama</span>
        </div>

        <!-- Icon 2: Panduan -->
        <div class="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-transform">
          <div class="w-14 h-14 rounded-[18px] bg-white border border-[#EBE1D7] text-[#B25E00] flex items-center justify-center shadow-[0_4px_12px_rgba(23,19,23,0.04)]">
            <svg class="w-6 h-6 text-[#B25E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="text-[11px] font-bold text-[#171317] text-center tracking-tight">Panduan</span>
        </div>

        <!-- Icon 3: Gemini -->
        <div class="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-transform relative">
          <div class="w-14 h-14 rounded-[18px] bg-white border border-[#EBE1D7] text-[#800020] flex items-center justify-center shadow-[0_4px_12px_rgba(23,19,23,0.04)]">
            <svg class="w-6 h-6 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span class="absolute top-0 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <span class="text-[11px] font-bold text-[#171317] text-center tracking-tight">Gemini AI</span>
        </div>

        <!-- Icon 4: SULAM -->
        <div class="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-transform">
          <div class="w-14 h-14 rounded-[18px] bg-white border border-[#EBE1D7] text-[#0D7355] flex items-center justify-center shadow-[0_4px_12px_rgba(23,19,23,0.04)]">
            <svg class="w-6 h-6 text-[#0D7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-[11px] font-bold text-[#171317] text-center tracking-tight">SULAM</span>
        </div>
      </div>

      <!-- Quick Status Strip -->
      <div class="bg-white/80 border border-[#EBE1D7] rounded-xl p-2.5 flex items-center justify-between text-xs text-[#7A6E77]">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Status AI: <strong>Tersambung</strong></span>
        </span>
        <span class="text-[10px] text-[#800020] font-bold">Mekara v2.0</span>
      </div>
    </div>
  `;

  // OPTION 3: Apple Dynamic Capsule (Hero Status Card + 2 Primary Action Cards + 2 Bottom Pills)
  const option3Html = `
    <div class="space-y-3">
      <!-- Top Apple Hero Card -->
      <div class="bg-gradient-to-r from-[#FAF4EA] to-[#F4ECE3] border border-[#EEDCC8] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#800020] flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold text-xs text-[#171317] font-heading">Pusat Navigasi Mekara</p>
            <p class="text-[11px] text-[#7A6E77]">SULAM 2.0 &bull; Wanita &amp; AI</p>
          </div>
        </div>
        <span class="text-[10px] bg-emerald-100 text-[#0D7355] font-bold px-2.5 py-1 rounded-full border border-emerald-200">Online</span>
      </div>

      <!-- 2 Main Cards Side by Side -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all hover:border-[#800020]">
          <div class="w-8 h-8 rounded-lg bg-[#F8EAE8] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="font-bold text-xs text-[#171317] truncate font-heading">Menu Utama</p>
            <p class="text-[10px] text-[#7A6E77] truncate">Papan Pemuka</p>
          </div>
        </div>

        <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all hover:border-[#800020]">
          <div class="w-8 h-8 rounded-lg bg-[#FAF4EA] text-[#B25E00] flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-[#B25E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="font-bold text-xs text-[#171317] truncate font-heading">Panduan</p>
            <p class="text-[10px] text-[#7A6E77] truncate">Cara Guna</p>
          </div>
        </div>
      </div>

      <!-- 2 Compact Bottom Pills -->
      <div class="grid grid-cols-2 gap-2 pt-0.5">
        <div class="bg-white border border-[#EBE1D7] rounded-full py-2 px-3 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all">
          <span class="flex items-center gap-1.5 font-bold text-[#171317] text-[11px]">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Kunci AI
          </span>
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>

        <div class="bg-white border border-[#EBE1D7] rounded-full py-2 px-3 flex items-center justify-between text-xs cursor-pointer active:scale-95 transition-all">
          <span class="flex items-center gap-1.5 font-bold text-[#171317] text-[11px]">
            <svg class="w-3.5 h-3.5 text-[#0D7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            SULAM
          </span>
          <span class="text-[10px] text-[#7A6E77] font-semibold">Info &rsaquo;</span>
        </div>
      </div>
    </div>
  `;

  // Render & Screenshot Option 1
  await page.setContent(getHtml(option1Html, 'Pilihan 1: Grid Bento 2×2 (Control Center)', 'Cadangan Utama'));
  await page.screenshot({ path: path.join(outDir, '01_option1_bento_grid.png') });
  console.log('Saved 01_option1_bento_grid.png');

  // Render & Screenshot Option 2
  await page.setContent(getHtml(option2Html, 'Pilihan 2: Ikon Springboard (Skrin Utama)', 'Minimalis'));
  await page.screenshot({ path: path.join(outDir, '02_option2_springboard_row.png') });
  console.log('Saved 02_option2_springboard_row.png');

  // Render & Screenshot Option 3
  await page.setContent(getHtml(option3Html, 'Pilihan 3: Kapsul Dinamik (Bento Hibrid)', 'Fungsi Utama'));
  await page.screenshot({ path: path.join(outDir, '03_option3_dynamic_capsule.png') });
  console.log('Saved 03_option3_dynamic_capsule.png');

  await browser.close();
  console.log('All 3 options visual mockups generated successfully!');
}

run().catch(console.error);
