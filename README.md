# 🌸 Wanita Niaga AI

> **Kenali Jualan, Rancang Keuntungan**  
> *Sistem pengurusan jualan, perakaunan ringkas, dan nasihat perniagaan pintar berteraskan AI khas untuk komuniti usahawan wanita mikro di Malaysia.*  
> Inisiatif Program Komuniti SULAM Universiti.

---

## 📖 Gambaran Keseluruhan (Overview)

**Wanita Niaga AI** ialah aplikasi web moden berorientasikan telefon pintar (*mobile-first*) yang direka khusus untuk membantu peniaga wanita mikro merekod jualan harian, mengira keuntungan dengan tepat, dan mendapatkan nasihat bimbingan perniagaan menggunakan kecerdasan buatan (Google Gemini) tanpa perlu memahami istilah perakaunan yang rumit.

Aplikasi ini menggunakan sistem reka bentuk **Berry Pop** yang ceria, mesra pemula, bersih, dan mematuhi piawaian kebolehcapaian kontras tinggi serta sasaran sentuhan minimum 44–48px.

---

## ✨ Ciri-Ciri Utama (Key Features)

1. **📝 4 Kaedah Kemasukan Jualan Fleksibel:**
   - **Cerita Jualan AI:** Taip ayat perbualan santai seperti WhatsApp (*cth: "Saya jual karipap RM2 sebiji, laku 50 biji..."*), AI akan menyusun nombor dan produk secara automatik.
   - **Muat Naik Excel / CSV:** Sokongan fail spreadsheet (.xlsx, .xls, .csv) dengan pengesanan lajur pintar.
   - **Borang Jualan Manual:** Kemasukan satu persatu yang kemas dengan validasi segera.
   - **Cuba Data Contoh:** Demonstrasi segera dengan 1 klik menggunakan data simulasi kuih-muih.

2. **✅ Semakan & Pengesahan Data Dinamik:**
   - Kad semakan rekod dengan fungsi kemas kini (*inline edit*) dan padam.
   - Pilihan kemasukan **Perbelanjaan Operasi (Opex)** untuk pengiraan untung bersih.

3. **📊 Papan Pemuka Laporan Prestasi & Keuntungan:**
   - 4 Kad KPI Pintar: Jumlah Jualan (RM), Unit Terjual, Produk Paling Laris, dan Untung Kasar / Bersih.
   - **Formula Kewangan Jujur:**
     - `Untung Kasar = Hasil Jualan − Kos Modal Produk`
     - `Untung Bersih = Untung Kasar − Perbelanjaan Operasi`
   - **Visualisasi HiDPI 2x Retina:**
     - Carta bar hasil jualan mengikut produk (Chart.js resolusi tajam).
     - Carta pai sumbangan jualan produk.
     - Trend jualan mengikut tarikh dan saluran perniagaan.

4. **🤖 Pembantu Niaga AI (Chatbot):**
   - Integrasi Google Gemini API dengan pintasan pengiraan tempatan pantas.
   - Cadangan soalan pantas (*quick question chips*) dengan leretan lancar.
   - Cadangan balas cepat (*contextual quick replies*) di bawah jawapan AI.
   - Butang *"Terangkan Lagi"* untuk bimbingan mendalam.

5. **📥 Simpan Laporan PDF Rasmi (A4):**
   - Eksport satu klik menghasilkan dokumen rasmi bersaiz A4 yang kemas dan sedia dicetak atau dikongsi melalui WhatsApp.

6. **📖 Panduan Pengguna Interaktif:**
   - Pusat bantuan komprehensif dengan penapis topik, panduan langkah demi langkah, dan tip praktikal.

---

## 🛠️ Teknologi & Pustaka (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite
- **Gaya & Reka Bentuk:** Tailwind CSS v4, Plus Jakarta Sans (Tajuk) & Inter (Teks)
- **Visualisasi Data:** Chart.js, react-chartjs-2 (Konfigurasi HiDPI Retina 2x)
- **Pemprosesan Data:** SheetJS (xlsx), PapaParse
- **Eksport Dokumen:** jsPDF, html2canvas
- **Kecerdasan Buatan:** Google Gen AI SDK (`@google/genai`), Google Gemini API
- **Kualiti Kod & Ujian:** Vitest, Oxlint (116 peraturan aktif)

---

## 🚀 Panduan Pemasangan & Pembangunan (Quick Start)

### 1. Pasang Kebergantungan (*Dependencies*)
```bash
npm install
```

### 2. Konfigurasi Kunci API (Pilihan untuk AI secara Live)
Salin `.env.example` kepada `.env` dan masukkan kunci API Gemini anda:
```bash
cp .env.example .env
```
*(Nota: Sistem masih berfungsi sepenuhnya untuk pengiraan angka, graf, dan data contoh walaupun tanpa API key).*

### 3. Jalankan Pelayan Pembangunan
```bash
npm run dev
```
Buka pelayar anda di `http://localhost:5173`.

### 4. Jalankan Ujian Automasi & Pemeriksaan Kod
```bash
# Ujian Unit & Integrasi Vitest
npm test

# Pemeriksaan Kod Pantas Oxlint
npm run lint

# Kompilasi Pengeluaran (Production Build)
npm run build
```

---

## 📁 Struktur Projek (Project Directory)

```
wanita-niaga-ai/
├── src/
│   ├── assets/              # Imej banner hero responsif (desktop & mudah alih)
│   ├── calc/                # Enjin pengiraan kewangan & keuntungan jujur
│   ├── components/          # Komponen UI Berry Pop (Homepage, Dashboard, Chat, etc.)
│   │   └── ui/              # Komponen asas (Button, Card, Icons SVG tulen)
│   ├── data/                # Data contoh simulasi & fungsi validasi
│   ├── services/            # Servis Gemini AI, PDF Export, sesi
│   ├── types.ts             # Definisi TypeScript perniagaan & sembang
│   ├── App.tsx              # Pengawal navigasi & aliran aplikasi
│   └── main.tsx             # Titik masuk React
├── server/                  # Pelayan Express ringan & pengendali chat
├── functions/               # Serverless endpoints untuk deployment
└── package.json             # Konfigurasi skrip & pakej
```

---

## 🔒 Privasi & Keselamatan

- **Data Tempatan:** Data jualan diproses secara setempat dalam peranti pengguna.
- **Tiada Storan Pangkalan Data Pihak Ketiga:** Tidak memerlukan akaun atau kata laluan.
- **Kerahsiaan:** Soalan AI dihantar secara selamat ke Google Gemini tanpa sebarang maklumat peribadi sensitif pelanggan.

---

## 🤝 Inisiatif Komuniti

Dihasilkan dengan penuh dedikasi di bawah **Program Komuniti SULAM Universiti** bagi memperkasakan usahawan wanita mikro Malaysia ke arah celik digital dan kestabilan kewangan perniagaan.
