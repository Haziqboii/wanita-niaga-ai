const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\nav_popover_colors';
  fs.mkdirSync(outDir, { recursive: true });

  const symbolBase64 = fs.readFileSync('public/images/mekara-logo.png').toString('base64');
  const logoSrc = 'data:image/png;base64,' + symbolBase64;

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  const getHtml = (popoverContent, title, subtitle) => `
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
      <!-- Top Title -->
      <div class="bg-[#800020] text-white text-center py-2 px-4 shadow-sm flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider">Konsep B</span>
        <span class="text-xs font-bold font-heading">${title}</span>
        <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">${subtitle}</span>
      </div>

      <!-- App Header Bar with active 'X' Hamburger -->
      <header class="bg-[#FAF6F0] border-b border-[#EBE1D7] px-4 py-3 sticky top-0 z-30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="${logoSrc}" alt="Mekara" class="h-7 w-auto object-contain" />
          </div>

          <div class="flex items-center gap-2">
            <button class="w-10 h-10 rounded-xl bg-[#F4ECE3] border border-[#E8DCD2] text-[#800020] flex items-center justify-center shadow-xs">
              <svg class="w-5 h-5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="relative flex-1 p-4 space-y-4">
        <div class="bg-white border border-[#EBE1D7] rounded-2xl p-4 shadow-xs space-y-2">
          <div class="flex items-center gap-2 text-[#800020] font-bold text-sm">
            <span class="w-2 h-2 rounded-full bg-[#800020]"></span>
            <span>Prestasi Jualan Semasa</span>
          </div>
          <p class="text-xs text-[#7A6E77] leading-relaxed">
            Halaman anda tetap nampak jelas di belakang. Menu hanya pulau kecil terapung di penjuru atas kanan!
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

        <!-- Dimmed backdrop overlay -->
        <div class="fixed inset-0 top-[90px] bg-black/15 backdrop-blur-xs z-30 pointer-events-none"></div>

        <!-- FLOATING POPOVER DROPDOWN -->
        <div class="absolute right-4 top-2 z-40 w-[265px] bg-[#FAF6F0]/98 backdrop-blur-2xl border border-[#EBE1D7] rounded-[22px] shadow-[0_16px_40px_rgba(23,19,23,0.18)] p-2.5 animate-slideDown">
          ${popoverContent}
        </div>
      </main>

      <div class="pb-2 pt-1 flex justify-center bg-[#FAF6F0]">
        <div class="w-32 h-1 bg-[#171317]/30 rounded-full"></div>
      </div>
    </body>
    </html>
  `;

  // HARMONY 1: Monochromatic Warm Burgundy (Satu Tema Warna Burgundy Seragam, Tiada Pelangi)
  const harmony1Html = `
    <div class="divide-y divide-[#EBE1D7]/70 text-xs">
      <!-- Item 1: Utama -->
      <div class="py-2.5 px-2 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="py-2.5 px-2 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Panduan Mekara</p>
            <p class="text-[10px] text-[#7A6E77]">Tutorial Guna</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 3: Kunci Gemini -->
      <div class="py-2.5 px-2 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Kunci Gemini AI</p>
            <p class="text-[10px] text-[#7A6E77]">Sambungan AI</p>
          </div>
        </div>
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      </div>

      <!-- Item 4: SULAM -->
      <div class="py-2.5 px-2 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[#F8EAE8] border border-[#EED7D5] text-[#800020] flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // HARMONY 2: Apple Pure Minimalist (Ikon Garisan Bersih Tanpa Kotak Warna Langsung)
  const harmony2Html = `
    <div class="divide-y divide-[#EBE1D7]/60 text-xs">
      <!-- Item 1: Utama -->
      <div class="py-2.5 px-2.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Menu Utama</p>
            <p class="text-[10px] text-[#7A6E77]">Halaman Mula</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 2: Panduan -->
      <div class="py-2.5 px-2.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Panduan Mekara</p>
            <p class="text-[10px] text-[#7A6E77]">Tutorial & Bantuan</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>

      <!-- Item 3: Kunci Gemini -->
      <div class="py-2.5 px-2.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Kunci Gemini AI</p>
            <p class="text-[10px] text-[#7A6E77]">Sambungan AI</p>
          </div>
        </div>
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      </div>

      <!-- Item 4: SULAM -->
      <div class="py-2.5 px-2.5 flex items-center justify-between cursor-pointer active:bg-[#FAF4EA] rounded-xl transition-colors">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="font-bold text-[#171317] font-heading leading-tight">Tentang SULAM</p>
            <p class="text-[10px] text-[#7A6E77]">Khidmat Komuniti</p>
          </div>
        </div>
        <span class="text-[#7A6E77] text-sm">&rsaquo;</span>
      </div>
    </div>
  `;

  // Render & Screenshot Harmony 1
  await page.setContent(getHtml(harmony1Html, 'Pilihan B1: Burgundy Monokrom', 'Seragam & Mewah'));
  await page.screenshot({ path: path.join(outDir, '01_popover_burgundy_monochrome.png') });
  console.log('Saved 01_popover_burgundy_monochrome.png');

  // Render & Screenshot Harmony 2
  await page.setContent(getHtml(harmony2Html, 'Pilihan B2: Apple Minimalis Tulen', 'Ikon Garisan Bersih'));
  await page.screenshot({ path: path.join(outDir, '02_popover_apple_minimalist.png') });
  console.log('Saved 02_popover_apple_minimalist.png');

  await browser.close();
  console.log('Color harmony mockups generated!');
}

run().catch(console.error);
