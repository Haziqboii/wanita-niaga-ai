const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\nav_popover';
  fs.mkdirSync(outDir, { recursive: true });

  const symbolBase64 = fs.readFileSync('public/images/mekara-logo.png').toString('base64');
  const logoSrc = 'data:image/png;base64,' + symbolBase64;

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Base HTML
  const getHtml = (popoverContent, title) => `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', sans-serif; background-color: #FAF6F0; margin: 0; padding: 0; }
        .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
      </style>
    </head>
    <body class="min-h-screen bg-[#FAF6F0] flex flex-col justify-between relative overflow-hidden">
      <!-- Top Concept Title -->
      <div class="bg-[#800020] text-white text-center py-2 px-4 shadow-sm flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider">Apple Popover</span>
        <span class="text-xs font-bold font-heading">${title}</span>
        <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Kompak Terapung</span>
      </div>

      <!-- App Header Bar with active 'X' Hamburger -->
      <header class="bg-[#FAF6F0] border-b border-[#EBE1D7] px-4 py-3 sticky top-0 z-30">
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

      <!-- Main Content Area showing page is STILL VISIBLE (not covered!) -->
      <main class="relative flex-1 p-4 space-y-4">
        <!-- Visible page elements to prove it does NOT take whole upper screen -->
        <div class="bg-white border border-[#EBE1D7] rounded-2xl p-4 shadow-xs space-y-2">
          <div class="flex items-center gap-2 text-[#800020] font-bold text-sm">
            <span class="w-2 h-2 rounded-full bg-[#800020]"></span>
            <span>Prestasi Jualan Semasa</span>
          </div>
          <p class="text-xs text-[#7A6E77] leading-relaxed">
            Halaman anda tetap nampak dengan jelas di latar belakang. Menu hanya muncul sebagai pulau terapung kecil di penjuru atas kanan!
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs">
            <p class="text-[11px] text-[#7A6E77]">Jumlah Jualan</p>
            <p class="text-base font-extrabold text-[#171317] mt-1">RM 2,450</p>
          </div>
          <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs">
            <p class="text-[11px] text-[#7A6E77]">Untung Kasar</p>
            <p class="text-base font-extrabold text-[#0D7355] mt-1">RM 1,180</p>
          </div>
        </div>

        <!-- Dimmed backdrop overlay that covers background on click-away -->
        <div class="fixed inset-0 top-[90px] bg-black/20 backdrop-blur-xs z-30 pointer-events-none"></div>

        <!-- FLOATING POPOVER DROPDOWN (Anchored to Top-Right below the X button) -->
        <div class="absolute right-4 top-2 z-40 w-[270px] bg-[#FAF6F0]/98 backdrop-blur-2xl border border-[#EBE1D7] rounded-[24px] shadow-[0_16px_40px_rgba(23,19,23,0.18)] p-3 animate-slideDown">
          ${popoverContent}
        </div>
      </main>

      <!-- Bottom Home Bar Indicator -->
      <div class="pb-2 pt-1 flex justify-center bg-[#FAF6F0]">
        <div class="w-32 h-1 bg-[#171317]/30 rounded-full"></div>
      </div>
    </body>
    </html>
  `;

  // CONCEPT A: Floating 2x2 Mini-Bento Island
  const conceptAHtml = `
    <div class="space-y-2.5">
      <div class="flex items-center justify-between px-1 pt-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#7A6E77]">Menu Pilihan</span>
        <span class="text-[9px] bg-[#E8F5E9] text-[#0D7355] font-bold px-1.5 py-0.5 rounded-full border border-[#C8E6C9]">SULAM</span>
      </div>

      <!-- 2x2 Compact Bento Grid -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Tile 1: Utama -->
        <div class="bg-gradient-to-br from-[#800020] to-[#5A0016] text-white rounded-xl p-3 shadow-xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[78px]">
          <div class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold text-xs font-heading leading-tight">Utama</p>
            <p class="text-[9px] text-white/80">Papan Pemuka</p>
          </div>
        </div>

        <!-- Tile 2: Panduan -->
        <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[78px] hover:bg-[#FAF4EA]">
          <div class="w-6 h-6 rounded-lg bg-[#FAF4EA] border border-[#EEDCC8] text-[#B25E00] flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[#B25E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold text-xs font-heading text-[#171317] leading-tight">Panduan</p>
            <p class="text-[9px] text-[#7A6E77]">Tutorial</p>
          </div>
        </div>

        <!-- Tile 3: Kunci Gemini -->
        <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[78px] hover:bg-[#FAF4EA]">
          <div class="flex items-center justify-between">
            <div class="w-6 h-6 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div>
            <p class="font-extrabold text-xs font-heading text-[#171317] leading-tight">Kunci AI</p>
            <p class="text-[9px] text-[#0D7355] font-semibold">Tersambung</p>
          </div>
        </div>

        <!-- Tile 4: SULAM -->
        <div class="bg-white border border-[#EBE1D7] rounded-xl p-3 shadow-2xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[78px] hover:bg-[#FAF4EA]">
          <div class="w-6 h-6 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-[#0D7355] flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[#0D7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold text-xs font-heading text-[#171317] leading-tight">SULAM</p>
            <p class="text-[9px] text-[#7A6E77]">Komuniti</p>
          </div>
        </div>
      </div>

      <!-- Small Bottom Note -->
      <div class="pt-1 text-center text-[10px] text-[#7A6E77]">
        Disimpan dalam peranti ini &bull; v2.0
      </div>
    </div>
  `;

  // CONCEPT B: Apple Context Menu Card (Slim floating card with hairline dividers)
  const conceptBHtml = `
    <div class="divide-y divide-[#EBE1D7]/70 text-xs">
      <!-- Item 1: Utama -->
      <div class="py-2 px-1.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-lg transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#800020] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Menu Utama</p>
            <p class="text-[10px] text-[#7A6E77]">Papan Pemuka</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 2: Panduan -->
      <div class="py-2 px-1.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-lg transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#FAF4EA] border border-[#EEDCC8] text-[#B25E00] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#B25E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Panduan Mekara</p>
            <p class="text-[10px] text-[#7A6E77]">Pusat Bantuan</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 3: Kunci Gemini -->
      <div class="py-2 px-1.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-lg transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Kunci Gemini</p>
            <p class="text-[10px] text-[#0D7355] font-semibold">● Sambungan Aktif</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 4: SULAM -->
      <div class="py-2 px-1.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-lg transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-[#0D7355] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#0D7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Tentang SULAM</p>
            <p class="text-[10px] text-[#7A6E77]">Khidmat Komuniti</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>
    </div>
  `;

  // Render & Screenshot Concept A
  await page.setContent(getHtml(conceptAHtml, 'Konsep A: Pulau Bento 2×2 Terapung'));
  await page.screenshot({ path: path.join(outDir, '01_popover_bento_grid.png') });
  console.log('Saved 01_popover_bento_grid.png');

  // Render & Screenshot Concept B
  await page.setContent(getHtml(conceptBHtml, 'Konsep B: Kad Apple Context Menu Terapung'));
  await page.screenshot({ path: path.join(outDir, '02_popover_context_menu.png') });
  console.log('Saved 02_popover_context_menu.png');

  await browser.close();
  console.log('Popover mockups generated!');
}

run().catch(console.error);
