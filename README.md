# 🦋 MEKARA — Kenali Jualan, Rancang Keuntungan

> **Sistem Pengurusan Jualan, Analisis Keuntungan & Bimbingan Pintar AI Khas untuk Usahawan Wanita Mikro Malaysia**  
> *Inisiatif Program Komuniti SULAM 2.0 (Wanita dan AI) | Universiti*

---

## 📖 Gambaran Keseluruhan (Overview)

**Mekara** ialah aplikasi web moden berorientasikan telefon pintar (*mobile-first*) dan komputer riba yang direka khusus untuk memperkasakan usahawan wanita mikro Malaysia. Berteraskan sistem reka bentuk **Burgundy & Cream Apple-Inspired**, Mekara menggabungkan keindahan estetika minimalis, kejelasan angka perakaunan jujur, dan kecerdasan buatan (Google Gemini) yang mesra pengguna tanpa jargon kewangan yang mengelirukan.

Aplikasi ini dibina mengikut piawaian kemasukan mudah, interaksi animasi terapung (*Apple float-up animations*), navigasi lancar, dan kebolehcapaian tinggi (sasaran sentuhan minimum 48px).

---

## ✨ Ciri-Ciri Lengkap (Key Features)

### 1. 🌟 Halaman Utama Premium (Landing Page & Bento Hub)
- **Hero Landing Page:** Visual usahawan wanita mikro Malaysia dengan butang interaktif **"Masuk →"**.
- **Koleksi Kad Bento Terapung:** Kesan animasi berperingkat (*staggered Apple-reveal*) untuk navigasi pantas ke semua ciri utama.
- **Navigasi & Bar Status:** Memaparkan status storan data, penunjuk sesi, dan capaian pantas ke tetapan API Key.

### 2. 📝 4 Kaedah Kemasukan Jualan Fleksibel
- **Cerita Jualan AI:** Taip atau ceritakan jualan harian dalam bahasa santai harian (cth: *"Saya jual 40 bungkus nasi lemak RM3.00, modal RM1.50..."*), AI akan mengekstrak senarai transaksi, unit, dan harga modal secara automatik.
- **Muat Naik Excel / CSV:** Sokongan muat naik fail spreadsheet (`.xlsx`, `.xls`, `.csv`) dengan pemadanan lajur pintar (*flexible column detection*) dan zon seret-dan-lepas (*dropzone*).
- **Borang Jualan Manual:** Borang kemasukan satu-demi-satu dengan pengiraan subtotal automatik dan validasi pantas.
- **Cuba Data Contoh (Demo):** Demonstrasi serta-merta dengan 1-klik menggunakan data simulasi 16 kuih-muih tradisional (Sep & Okt 2026).

### 3. 📊 Papan Pemuka Eksekutif (Executive Dashboard)
- **4 Kad Ringkasan Pintar (KPI):**
  - **Hasil Jualan Kasar (Gross Revenue)**
  - **Jumlah Unit Terjual**
  - **Produk Paling Laris (Volume Leader) & Penyumbang Hasil Terbesar (Revenue Champion)**
  - **Untung Kasar (Gross Profit) & Margin Untung (%)**
- **Perakaunan Jujur & Telus:**
  $$\text{Untung Kasar} = \text{Hasil Jualan} - \text{Kos Modal}$$
  $$\text{Untung Bersih} = \text{Untung Kasar} - \text{Kos Operasi (Opex)}$$
  *(Terminologi perakaunan tepat dan diiktiraf tanpa dakwaan palsu).*
- **Penapis Bulanan Dinamik:** Beralih antara bulan (cth: September 2026, Oktober 2026, atau Semua Data) dengan penyegerakan automatik.
- **Visualisasi HiDPI Retina (Chart.js):**
  - Carta Bar Kedudukan Produk Teratas.
  - Carta Garis Trend Jualan Harian (skala tarikh yang kemas dan mudah dibaca).
  - Carta Donut Saluran Pemasaran (Gerai, WhatsApp, Tempahan, Booth, Online).
  - Carta Sumbangan Top 5 Produk vs Lain-lain.
- **Penemuan Pintar Automatik:** Analisis perniagaan algoritma tanpa halusinasi yang menyerlahkan margin tertinggi, produk juara, dan cadangan tindakan praktikal.

### 4. 🤖 Tanya Mekara — Pembantu Pintar AI (Chatbot)
- Dikuasakan oleh Google Gemini AI dengan sandaran (*fallback*) pintar enjin pengiraan tempatan sekiranya tiada sambungan internet.
- Antaramuka gelembung sembang moden dengan cadangan soalan pantas (*quick suggestion chips*).
- Menjawab soalan prestasi produk, kos operasi, dan strategi harga dalam Bahasa Melayu yang santai dan membina.

### 5. 📄 Laporan PDF Rasmi 3-Muka Surat (A4 Executive Export)
- Penjanaan PDF vektor resolusi tinggi berasaskan jsPDF:
  - **Muka Surat 1 — Ringkasan Perniagaan:** KPI utama, Penemuan Pintar (100% konsisten dengan Papan Pemuka), dan perbandingan bulanan.
  - **Muka Surat 2 — Analisis Jualan & Prestasi Pasaran:** Carta bar produk, graf trend jualan harian, carta saluran donut & sumbangan produk (nisbah aspek bulat tulen).
  - **Muka Surat 3 — Penyata Jualan Terperinci:** Jadual perakaunan lengkap 16 produk dengan kos modal, unit terjual, hasil jualan, untung kasar, dan margin keuntungan.

### 6. 📖 Panduan Mekara & Keselamatan
- Pusat panduan pengguna bersepadu (4 modul: Panduan Asas, Kemasukan Jualan, Papan Pemuka, Soalan Lazim & Gemini API).
- Ketahanan bengkel sehingga 50 peserta serentak dengan kawalan giliran (*concurrency rate limiting*).
- Storan data setempat (IndexedDB / LocalStorage) — privasi data usahawan terjamin 100%.

### 7. 🦋 Footer Minimalis Bersepadu
- Menggunakan simbol rama-rama rasmi Mekara:
  `[Rama-Rama Mekara] SULAM 2.0 | WANITA DAN AI`

---

## 🛠️ Teknologi & Seni Bina (Tech Stack)

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Gaya & Reka Bentuk** | Tailwind CSS v4, Apple-Inspired Burgundy & Cream (`#70193D`, `#FAF7F2`) |
| **Animasi & Interaksi** | Apple-Style Reveal & Float-Up (`.apple-reveal-card`, `.apple-hover-card`) |
| **Visualisasi Data** | Chart.js 4, react-chartjs-2 (HiDPI Retina 2x Rendering) |
| **Penjanaan Dokumen** | jsPDF (vektor resolusi tinggi A4 dengan nisbah aspek berkunci) |
| **Pemprosesan Spreadsheet** | SheetJS (`xlsx`), PapaParse |
| **Kecerdasan Buatan** | Google Gen AI SDK (`@google/genai`), Google Gemini API |
| **Ujian & Kualiti Kod** | Vitest (18 fail ujian, 179 ujian lulus), Oxlint |

---

## 🚀 Panduan Pantas (Quick Start)

### 1. Pasang Kebergantungan (*Dependencies*)
```bash
npm install
```

### 2. Konfigurasi Kunci API (Pilihan untuk AI secara Langsung)
Salin `.env.example` kepada `.env` dan masukkan kunci API Gemini anda:
```bash
cp .env.example .env
```
*(Nota: Mekara beroperasi secara luar talian sepenuhnya untuk pengiraan angka, graf, Excel, dan eksport PDF walaupun tanpa kunci API).*

### 3. Jalankan Aplikasi
```bash
npm run dev
```
Buka pelayar di `http://localhost:5173`.  
Untuk capaian dari telefon pintar dalam rangkaian Wi-Fi yang sama:
```bash
npm run dev -- --host
```

### 4. Jalankan Ujian Automasi & Pemeriksaan Kod
```bash
# Ujian Unit & Integrasi Vitest (179 ujian)
npm test

# Pemeriksaan Kod Pantas Oxlint (0 errors)
npm run lint

# Kompilasi Pengeluaran (Production Build)
npm run build
```

---

## 📁 Struktur Direktori Utama

```text
wanita-niaga-ai/
├── src/
│   ├── assets/              # Imej banner & logo Mekara
│   ├── calc/                # Enjin pengiraan kewangan, keuntungan jujur & analisis
│   ├── components/          # Komponen UI utama (LandingHero, Dashboard, Chat, dsb.)
│   │   └── ui/              # Komponen asas (Button, Card, Icons SVG tulen)
│   ├── data/                # Data simulasi usahawan (Okt & Sep 2026) & storan tempatan
│   ├── services/            # Servis Gemini AI, PDF Export 3-muka surat, PDF Chart Renderer
│   ├── types.ts             # Definisi TypeScript perniagaan, laporan & sembang
│   ├── App.tsx              # Titik masuk pengawal aliran & navigasi
│   ├── index.css            # Sistem gaya Burgundy & Cream + animasi Apple Float
│   └── main.tsx             # Titik masuk React
├── server/                  # Pengendali API & proksi sesi selamat
├── public/                  # Aset statik, imej rama-rama rasmi, & landing hero
└── package.json             # Konfigurasi projek & pakej
```

---

## 🔒 Privasi, Integriti & Kerahsiaan Data

- **Storan Tempatan Penuh:** Data jualan disimpan secara setempat di dalam pelayar peranti pengguna menggunakan IndexedDB / LocalStorage.
- **Tiada Pangkalan Data Luar:** Tiada maklumat peribadi atau rekod jualan dihantar ke pelayan luaran tanpa kebenaran.
- **Ketahanan Luar Talian:** Semua formula kewangan, semakan integriti data, dan penjanaan dokumen PDF dijana secara terus di dalam pelayar pengguna.

---

## 🤝 Inisiatif SULAM 2.0

Dihasilkan dengan penuh iltizam dan dedikasi di bawah **Program Khidmat Komuniti Universiti (SULAM 2.0 — Wanita dan AI)** bagi memacu celik digital, literasi kewangan, dan keupayaan berdaya saing usahawan wanita mikro Malaysia.
