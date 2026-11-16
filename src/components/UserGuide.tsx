import { useState, useEffect } from 'react'
import {
  LightBulbIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ChatBubbleIcon,
  DocumentIcon,
  PencilSquareIcon,
} from './ui/Icons'
import { ApiKeyModal } from './ApiKeyModal'

export type GuideTopicId = 'catat' | 'laporan' | 'tanya' | 'bantuan'
export type SalesMethodId = 'ai' | 'excel' | 'manual'
export type OtherHelpId = 'gemini' | 'simpanan' | 'rekod'

export interface UserGuideProps {
  onClose: () => void
  onNavigate?: (page: 'home' | 'story' | 'upload' | 'manual' | 'dashboard' | 'chat') => void
  hasExistingData?: boolean
  initialTopic?: GuideTopicId | null
}

// Polished Apple-style SVG icons
function KeyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  )
}

function DevicePhoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  )
}

function ArrowPathIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

export function UserGuide({
  onClose,
  onNavigate,
  hasExistingData = false,
  initialTopic = null,
}: UserGuideProps) {
  const [selectedTopic, setSelectedTopic] = useState<GuideTopicId | null>(initialTopic)
  const [salesMethod, setSalesMethod] = useState<SalesMethodId>('ai')
  const [otherHelpSection, setOtherHelpSection] = useState<OtherHelpId>('gemini')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [hasSessionKey, setHasSessionKey] = useState(false)

  // Check connection status from server session and local storage
  useEffect(() => {
    fetch('/api/keys/status', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setHasSessionKey(Boolean(data?.connected))
      })
      .catch(() => {})
  }, [showApiKeyModal])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedTopic])

  const hasKey =
    hasSessionKey ||
    (typeof window !== 'undefined' ? Boolean(localStorage.getItem('user_gemini_api_key')) : false)

  const handleGoToFeature = (page: 'home' | 'story' | 'upload' | 'manual' | 'dashboard' | 'chat') => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      onClose()
    }
  }

  // ==========================================
  // VIEW 1: TOPIC A — CATAT JUALAN WALKTHROUGH
  // ==========================================
  const renderTopicCatatJualan = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Topic Header Card */}
      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs">
            <PencilSquareIcon className="w-5 h-5 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#171317] font-heading">
              1. Catat Jualan
            </h2>
            <p className="text-xs text-[#6B6069] font-medium">Pilih kaedah merekod jualan harian yang paling mudah untuk Puan.</p>
          </div>
        </div>

        {/* 3 Selectable Method Pills */}
        <div className="pt-1 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSalesMethod('ai')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              salesMethod === 'ai'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <ChatBubbleIcon className="w-3.5 h-3.5" />
            <span>Cerita Jualan AI</span>
          </button>
          <button
            type="button"
            onClick={() => setSalesMethod('excel')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              salesMethod === 'excel'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <DocumentIcon className="w-3.5 h-3.5" />
            <span>Muat Naik Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setSalesMethod('manual')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              salesMethod === 'manual'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            <span>Urus Rekod Jualan</span>
          </button>
        </div>
      </div>

      {/* Method Details */}
      {salesMethod === 'ai' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
              Kaedah Paling Digemari Usahawan
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#171317]">
              Ceritakan Jualan Seperti Mesej Biasa
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-[#171317]">
                <strong>Mula:</strong> Tekan butang <strong>"Mula Cerita Jualan"</strong> dari halaman utama.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="space-y-1.5 flex-1">
                <p className="text-[#171317]">
                  <strong>Taip Cerita Jualan:</strong> Taip cerita jualan Puan seperti mesej WhatsApp biasa.
                </p>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE1D7] text-[#800020] italic font-medium">
                  "Hari ini saya jual 20 karipap, RM2 sebiji. Modal bahan mentah RM0.80 sebiji."
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-[#171317]">
                <strong>Semak Jualan:</strong> Mekara akan susun nama produk, kuantiti terjual, harga jualan dan kos modal secara automatik. Semak kad produk yang terhasil.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="text-[#171317]">
                <strong>Sahkan:</strong> Tekan <strong>"Sahkan &amp; Lihat Laporan"</strong> untuk menjana papan pemuka jualan dan untung.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD2] text-xs text-[#6B6069] flex items-start gap-2">
            <LightBulbIcon className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />
            <span>
              <strong>Peringatan:</strong> Sentiasa semak nilai yang disusun sebelum menekan butang sahkan untuk memastikan kiraan keuntungan tepat.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleGoToFeature('story')}
            className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Cuba Catat Jualan</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {salesMethod === 'excel' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
              Pantas &bull; Fail Komputer &amp; Telefon
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#171317]">
              Muat Naik Rekod Sedia Ada
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-[#171317]">
                <strong>Mula:</strong> Pilih pilihan <strong>"Pilih Fail"</strong> di halaman utama.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="text-[#171317]">
                <strong>Pilih Fail:</strong> Muat naik fail lembaran kerja berformat <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-[#171317]">
                <strong>Lajur Diperlukan:</strong> Pastikan dokumen Puan mengandungi sekurang-kurangnya lajur Nama Produk, Kuantiti, dan Harga Jualan.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="text-[#171317]">
                <strong>Semak &amp; Sahkan:</strong> Sistem akan menyusun rekod secara automatik. Tekan butang sahkan untuk melihat laporan kewangan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoToFeature('upload')}
            className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Buka Muat Naik Excel</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {salesMethod === 'manual' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
              Tersusun &bull; Satu Demi Satu
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#171317]">
              Urus Rekod Jualan
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-[#171317]">
                <strong>Mula:</strong> Tekan butang <strong>"Urus Jualan"</strong> di halaman utama.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="text-[#171317]">
                <strong>Isi Borang:</strong> Masukkan Nama Produk, Kuantiti terjual, Harga Jualan seunit, dan Kos Modal seunit (pilihan).
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-[#171317]">
                <strong>Tambah Menu Lain:</strong> Tekan butang <strong>"Tambah Produk"</strong> untuk menambah barangan jualan yang seterusnya.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="text-[#171317]">
                <strong>Sahkan:</strong> Tekan <strong>"Sahkan Jualan"</strong> untuk terus menjana papan pemuka perniagaan Puan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoToFeature('manual')}
            className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Urus Jualan</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  )

  // ==========================================
  // VIEW 2: TOPIC B — FAHAM LAPORAN WALKTHROUGH
  // ==========================================
  const renderTopicFahamLaporan = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs">
            <ChartBarIcon className="w-5 h-5 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#171317] font-heading">
              2. Faham Laporan &amp; Untung
            </h2>
            <p className="text-xs text-[#6B6069] font-medium">
              Fahami maksud setiap angka kewangan tanpa istilah perakaunan rumit.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
        <div className="space-y-3 text-xs sm:text-sm">
          {/* 1. Jualan & Unit */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#171317]">
              <span className="w-2 h-2 rounded-full bg-[#800020]" />
              <span>Jumlah Jualan &amp; Unit Terjual</span>
            </div>
            <p className="text-[#6B6069] leading-relaxed">
              <strong>Jumlah Jualan:</strong> Jumlah nilai jualan daripada semua produk yang direkodkan.
              <br />
              <strong>Unit Terjual:</strong> Jumlah bilangan unit produk yang berjaya diserahkan kepada pelanggan.
            </p>
          </div>

          {/* 2. Untung Kasar */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#0D7355]">
              <span className="w-2 h-2 rounded-full bg-[#0D7355]" />
              <span>Untung Kasar</span>
            </div>
            <p className="text-[#171317] leading-relaxed">
              Untung Kasar ialah jumlah jualan selepas ditolak kos modal produk yang direkodkan.
            </p>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-[#0D7355] font-semibold text-xs inline-block shadow-2xs">
              Untung Kasar = Jumlah Jualan − Kos Modal Bahan Mentah
            </div>
            <p className="text-[11px] text-[#7A6E77] italic">
              *Jika kos modal tidak diisi, untung kasar tidak dapat dipaparkan secara tepat.
            </p>
          </div>

          {/* 3. Untung Bersih & Opex */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#70193D]">
              <span className="w-2 h-2 rounded-full bg-[#70193D]" />
              <span>Perbelanjaan Operasi &amp; Untung Bersih</span>
            </div>
            <p className="text-[#171317] leading-relaxed">
              Untung Bersih mengambil kira perbelanjaan operasi yang dimasukkan (seperti sewa tapak, bil elektrik, air, atau pengangkutan).
            </p>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-purple-200 text-[#70193D] font-semibold text-xs inline-block shadow-2xs">
              Untung Bersih = Untung Kasar − Perbelanjaan Operasi
            </div>
            <p className="text-[11px] text-[#7A6E77] italic">
              *Jika tiada perbelanjaan operasi dimasukkan, sistem akan memaparkan Untung Kasar tanpa mereka-reka nombor.
            </p>
          </div>

          {/* 4. Produk Terlaris & Penemuan */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#171317]">
              <span className="w-2 h-2 rounded-full bg-[#800020]" />
              <span>Produk Paling Laris &amp; Jualan Tertinggi</span>
            </div>
            <p className="text-[#6B6069] leading-relaxed">
              Mekara membezakan antara produk yang paling banyak unit terjual (Produk Paling Laris) dan produk yang menyumbang hasil jualan terbesar (Jualan Tertinggi).
            </p>
          </div>

          {/* 5. PDF */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#171317]">
              <span className="w-2 h-2 rounded-full bg-[#800020]" />
              <span>Simpan Laporan PDF</span>
            </div>
            <p className="text-[#6B6069] leading-relaxed">
              Tekan butang <strong>"Simpan Laporan PDF"</strong> pada papan pemuka untuk menjana dokumen ringkasan kemas bersaiz A4 bagi simpanan peribadi atau rujukan pembiayaan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleGoToFeature(hasExistingData ? 'dashboard' : 'home')}
          className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
        >
          <span>{hasExistingData ? 'Buka Papan Pemuka' : 'Catat Jualan Dahulu'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )

  // ==========================================
  // VIEW 3: TOPIC C — TANYA MEKARA WALKTHROUGH
  // ==========================================
  const renderTopicTanyaMekara = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs">
            <ChatBubbleIcon className="w-5 h-5 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#171317] font-heading">
              3. Tanya Mekara (Pembantu Pintar)
            </h2>
            <p className="text-xs text-[#6B6069] font-medium">
              Dapatkan pandangan segera dan nasihat perniagaan pintar melalui perbualan santai.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="text-[#171317]">
              <strong>Buka Pembantu Mekara:</strong> Tekan butang <strong>"Tanya Mekara (AI)"</strong> di bahagian bawah papan pemuka jualan.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-1.5 flex-1">
              <p className="text-[#171317]">
                <strong>Pilih Cadangan atau Taip:</strong> Taip soalan Puan di ruangan mesej, atau tekan ikon mentol 💡 untuk melihat cadangan soalan sedia ada.
              </p>
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD2] text-xs text-[#6B6069] flex items-start gap-2">
                <LightBulbIcon className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />
                <span>
                  <strong>Penting:</strong> Memilih soalan cadangan <em>hanya mengisi ruangan teks</em>. Soalan <strong>TIDAK</strong> dihantar secara automatik — Puan masih boleh menyemak atau mengubah soalan sebelum menghantar.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="text-[#171317]">
              <strong>Hantar Pertanyaan:</strong> Tekan butang hantar (ikon kapal terbang kertas) untuk memulakan semakan AI.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <p className="text-[#171317]">
              <strong>Semak Jawapan AI:</strong> AI akan menjawab dalam Bahasa Melayu harian berpandukan angka sebenar rekod jualan Puan.
            </p>
          </div>
        </div>

        {/* Contoh Soalan */}
        <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EBE1D7] space-y-2">
          <span className="text-xs font-bold text-[#800020] block">
            Contoh Soalan Pantas Yang Boleh Ditanya:
          </span>
          <div className="space-y-1.5 text-xs text-[#171317]">
            <div className="bg-white px-3 py-2 rounded-xl border border-[#EBE1D7] shadow-2xs">
              &bull; "Produk mana paling laris?"
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-[#EBE1D7] shadow-2xs">
              &bull; "Berapa untung kasar saya?"
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-[#EBE1D7] shadow-2xs">
              &bull; "Bagaimana prestasi jualan bulan ini?"
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleGoToFeature(hasExistingData ? 'chat' : 'home')}
          className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
        >
          <span>{hasExistingData ? 'Buka Pembantu Mekara' : 'Mula Catat Jualan'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )

  // ==========================================
  // VIEW 4: TOPIC D — BANTUAN LAIN WALKTHROUGH
  // ==========================================
  const renderTopicBantuanLain = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Breadcrumb & Topic Title */}
      <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs">
            <KeyIcon className="w-5 h-5 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#171317] font-heading">
              4. Bantuan Lain
            </h2>
            <p className="text-xs text-[#6B6069] font-medium">
              Kunci Gemini AI, simpanan peranti dan pengurusan rekod lama.
            </p>
          </div>
        </div>

        {/* 3 Selectable Sub-Tabs */}
        <div className="pt-1 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setOtherHelpSection('gemini')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              otherHelpSection === 'gemini'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <KeyIcon className="w-3.5 h-3.5" />
            <span>Sambungkan Gemini</span>
          </button>
          <button
            type="button"
            onClick={() => setOtherHelpSection('simpanan')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              otherHelpSection === 'simpanan'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <DevicePhoneIcon className="w-3.5 h-3.5" />
            <span>Simpanan Automatik</span>
          </button>
          <button
            type="button"
            onClick={() => setOtherHelpSection('rekod')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center gap-2 ${
              otherHelpSection === 'rekod'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#171317] border border-[#EBE1D7] hover:bg-[#F4ECE3]'
            }`}
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Sambung Rekod Lama</span>
          </button>
        </div>
      </div>

      {/* Sub-Section 1: Gemini */}
      {otherHelpSection === 'gemini' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
                Sesi Bengkel SULAM
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#171317] mt-1">
                Cara Menyambung Kunci Gemini AI
              </h3>
            </div>
            {hasKey && (
              <span className="text-[11px] font-bold text-[#0D7355] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Kunci Bersambung</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-[#171317]">
                <strong>Buka Google AI Studio:</strong> Layari <em>aistudio.google.com</em> dan log masuk dengan akaun Google peribadi Puan.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="text-[#171317]">
                <strong>Cipta Kunci API:</strong> Tekan butang <strong>"Create API Key"</strong> di antara muka yang disediakan.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-[#171317]">
                <strong>Salin Kunci:</strong> Salin teks kunci yang dipaparkan (bermula dengan <em>AIza...</em>).
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FAF0E6] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="text-[#171317]">
                <strong>Tampal di Mekara:</strong> Buka bahagian Kunci Gemini di Mekara (ikon 🔑 pada menu atas), tampal kunci dan tekan <strong>"Simpan Kunci"</strong>.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCD2] text-xs text-[#6B6069] space-y-1">
            <p className="text-[#800020] font-bold flex items-center gap-1">
              <span>⚠️</span>
              <span>Peringatan Keselamatan:</span>
            </p>
            <p>
              Jangan kongsi kunci Gemini Puan dengan orang lain. Penggunaan kunci tertakluk kepada kelayakan akaun Google dan had kuota percuma Google AI Studio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{hasKey ? 'Semak / Tukar Kunci Gemini' : 'Buka Tetapan Gemini'}</span>
            <span aria-hidden="true">🔑</span>
          </button>
        </div>
      )}

      {/* Sub-Section 2: Simpanan Automatik */}
      {otherHelpSection === 'simpanan' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
              Storan Tempatan
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#171317]">
              Bagaimana Data Puan Disimpan
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#171317]">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
              <p className="font-bold text-[#800020]">Disimpan di Pelayar Peranti Ini Sahaja</p>
              <p className="text-[#6B6069] leading-relaxed">
                Semua rekod jualan, draf cerita jualan, dan perbualan disimpan terus di dalam pelayar telefon Puan secara automatik. Apabila Puan membuka semula laman ini, rekod sedia ada akan dipaparkan serta-merta.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
              <p className="font-bold text-[#800020]">Kesan Menukar Peranti atau Memadam Sejarah</p>
              <p className="text-[#6B6069] leading-relaxed">
                Jika Puan memadam data pelayar (clear browsing data/cache), menukar pelayar (contohnya dari Safari ke Chrome), atau membuka laman ini di telefon yang lain, rekod terdahulu tidak akan dapat diakses dari peranti baharu.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
              <p className="font-bold text-[#0D7355]">Privasi Data Peribadi</p>
              <p className="text-[#6B6069] leading-relaxed">
                Tiada pangkalan data luaran yang menyimpan maklumat perniagaan Puan. Data kewangan Puan kekal dalam kawalan peranti Puan sendiri.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTopic(null)}
            className="w-full min-h-[46px] rounded-full bg-[#FAF7F2] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-xs sm:text-sm font-bold text-[#171317] hover:text-[#800020] transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Faham, Kembali ke Panduan</span>
          </button>
        </div>
      )}

      {/* Sub-Section 3: Sambung Rekod Lama */}
      {otherHelpSection === 'rekod' && (
        <div className="bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] text-[11px] font-bold border border-[#E8DCD2]">
              Pengurusan Sesi
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#171317]">
              Meneruskan Laporan atau Mula Rekod Baharu
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#171317]">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
              <p className="font-bold text-[#800020]">Sambung Laporan Sedia Ada</p>
              <p className="text-[#6B6069] leading-relaxed">
                Jika telefon Puan mempunyai rekod jualan terdahulu, butang <strong>"Sambung Laporan"</strong> akan muncul di halaman utama. Tekan butang tersebut untuk terus menyambung semakan atau menambah data.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EBE1D7] space-y-1">
              <p className="font-bold text-[#800020]">Mula Rekod Baharu</p>
              <p className="text-[#6B6069] leading-relaxed">
                Jika Puan ingin merekodkan sesi jualan yang berbeza sepenuhnya, tekan butang <strong>"Mula Rekod Baharu"</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DCD2] text-xs text-[#6B6069] space-y-1">
              <p className="text-[#800020] font-bold flex items-center gap-1">
                <span>⚠️</span>
                <span>Peringatan Keselamatan Data:</span>
              </p>
              <p>
                Memulakan rekod baharu akan mengosongkan rekod semasa di peranti ini. Sistem sentiasa meminta pengesahan Puan terlebih dahulu dan tidak pernah memadam data tanpa persetujuan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoToFeature('home')}
            className="btn-primary-burgundy w-full min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Buka Halaman Utama</span>
            <span aria-hidden="true">🏠</span>
          </button>
        </div>
      )}
    </div>
  )

  // ==========================================
  // VIEW 0: MAIN GUIDE LANDING (4 WHITE FLOATING TILES)
  // ==========================================
  const renderMainLanding = () => (
    <div className="space-y-4">
      {/* 1. Refined Mekara Brand Header */}
      <div className="apple-reveal-card text-center space-y-1.5 pt-1 pb-1" style={{ animationDelay: '0ms' }}>
        <div className="inline-flex items-center justify-center gap-2.5">
          <img
            src="/images/mekara-symbol.png"
            alt="Mekara"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 select-none drop-shadow-2xs"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171317] tracking-tight font-heading">
            <span>Panduan</span>{' '}
            <span className="font-brand text-[#800020] font-bold">Mekara</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#6B6069] font-medium max-w-sm mx-auto">
          Pilih topik yang Puan perlukan.
        </p>
      </div>

      {/* 2. Premium White Floating Gemini Setup Card */}
      <div
        className="apple-reveal-card apple-hover-card bg-white rounded-[22px] sm:rounded-[24px] border border-[#EBE1D7] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] space-y-3.5"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs">
              <KeyIcon className="w-5 h-5 text-[#800020]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-[#171317] font-heading">
                  Baru menggunakan Mekara?
                </h2>
                {hasKey && (
                  <span className="text-[10px] font-bold text-[#0D7355] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Gemini Bersambung</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6069] mt-0.5 leading-relaxed">
                Sediakan Gemini dengan bantuan fasilitator.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-0.5 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('bantuan')
              setOtherHelpSection('gemini')
            }}
            className="btn-primary-burgundy apple-hover-card flex-1 min-h-[42px] px-4 text-white font-bold text-xs sm:text-sm rounded-full shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span>Lihat Cara Sambung Gemini</span>
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="apple-hover-card min-h-[42px] px-4 rounded-full bg-[#FAF7F2] hover:bg-[#F4ECE3] border border-[#E8DCD2] text-xs sm:text-sm font-bold text-[#800020] transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <KeyIcon className="w-3.5 h-3.5 text-[#800020]" />
            <span>{hasKey ? 'Semak Kunci' : 'Masukkan Kunci Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* 3. Section Title with Apple-Style Understated Typography */}
      <div className="apple-reveal-card space-y-2.5 pt-1" style={{ animationDelay: '160ms' }}>
        <h3 className="text-xs font-semibold text-[#7A6E77] px-1 tracking-wide">
          Pilih Topik Panduan
        </h3>

        {/* 4. Four White Floating Apple-Style Tiles (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Catat Jualan */}
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('catat')
              setSalesMethod('ai')
            }}
            className="apple-reveal-card apple-hover-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(34,18,24,0.09),0_4px_10px_rgba(34,18,24,0.05)] active:translate-y-0 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between min-h-[136px] sm:min-h-[148px] group"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <PencilSquareIcon className="w-5 h-5 text-[#800020]" />
              </div>
              <ChevronRightIcon className="w-4 h-4 text-[#800020]/60 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="pt-3">
              <h4 className="font-extrabold text-sm sm:text-base text-[#171317] font-heading leading-tight">
                Catat Jualan
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 font-medium leading-snug">
                AI, Excel &amp; Manual
              </p>
            </div>
          </button>

          {/* Card 2: Faham Laporan */}
          <button
            type="button"
            onClick={() => setSelectedTopic('laporan')}
            className="apple-reveal-card apple-hover-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(34,18,24,0.09),0_4px_10px_rgba(34,18,24,0.05)] active:translate-y-0 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between min-h-[136px] sm:min-h-[148px] group"
            style={{ animationDelay: '260ms' }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <ChartBarIcon className="w-5 h-5 text-[#800020]" />
              </div>
              <ChevronRightIcon className="w-4 h-4 text-[#800020]/60 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="pt-3">
              <h4 className="font-extrabold text-sm sm:text-base text-[#171317] font-heading leading-tight">
                Faham Laporan
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 font-medium leading-snug">
                Jualan, untung &amp; PDF
              </p>
            </div>
          </button>

          {/* Card 3: Tanya Mekara */}
          <button
            type="button"
            onClick={() => setSelectedTopic('tanya')}
            className="apple-reveal-card apple-hover-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(34,18,24,0.09),0_4px_10px_rgba(34,18,24,0.05)] active:translate-y-0 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between min-h-[136px] sm:min-h-[148px] group"
            style={{ animationDelay: '320ms' }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <ChatBubbleIcon className="w-5 h-5 text-[#800020]" />
              </div>
              <ChevronRightIcon className="w-4 h-4 text-[#800020]/60 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="pt-3">
              <h4 className="font-extrabold text-sm sm:text-base text-[#171317] font-heading leading-tight">
                Tanya <span className="font-brand font-bold text-[#800020]">Mekara</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 font-medium leading-snug">
                Pembantu pintar
              </p>
            </div>
          </button>

          {/* Card 4: Bantuan Lain */}
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('bantuan')
              setOtherHelpSection('gemini')
            }}
            className="apple-reveal-card apple-hover-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(34,18,24,0.09),0_4px_10px_rgba(34,18,24,0.05)] active:translate-y-0 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between min-h-[136px] sm:min-h-[148px] group"
            style={{ animationDelay: '380ms' }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#800020] border border-[#E8DCD2] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <KeyIcon className="w-5 h-5 text-[#800020]" />
              </div>
              <ChevronRightIcon className="w-4 h-4 text-[#800020]/60 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="pt-3">
              <h4 className="font-extrabold text-sm sm:text-base text-[#171317] font-heading leading-tight">
                Bantuan Lain
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B6069] mt-1 font-medium leading-snug">
                Gemini &amp; simpanan
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. SULAM Training Module Understated Card */}
      <div className="bg-[#FAF6F0] rounded-[20px] border border-[#EBE1D7] p-3 sm:p-3.5 text-center space-y-0.5 shadow-2xs">
        <div className="flex items-center justify-center gap-1.5 text-[#800020]">
          <img src="/images/mekara-symbol.png" alt="Mekara" className="w-4 h-4 object-contain" />
          <h4 className="text-xs font-bold font-heading">
            Modul Latihan SULAM
          </h4>
        </div>
        <p className="text-[11px] text-[#6B6069] max-w-sm mx-auto leading-relaxed">
          Panduan pembelajaran lengkap akan disediakan secara berasingan.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 max-w-xl sm:max-w-2xl mx-auto pb-4 sm:pb-6">
      {/* If a topic is selected, render back bar */}
      {selectedTopic !== null && (
        <div className="flex items-center justify-between gap-2 pb-1">
          <button
            type="button"
            onClick={() => setSelectedTopic(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#800020] hover:underline cursor-pointer min-h-[36px] px-2 rounded-lg hover:bg-[#FAF4EA] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-[#800020]" />
            <span>Kembali ke Panduan</span>
          </button>
          <span className="text-[11px] text-[#7A6E77] font-medium hidden sm:inline-flex items-center gap-1.5">
            <img src="/images/mekara-symbol.png" alt="" className="w-3.5 h-3.5 object-contain select-none" />
            <span>
              Panduan <strong className="font-brand text-[#800020] font-bold">Mekara</strong> &bull; Bantuan Pantas
            </span>
          </span>
        </div>
      )}

      {/* Main Switcher */}
      {selectedTopic === null && renderMainLanding()}
      {selectedTopic === 'catat' && renderTopicCatatJualan()}
      {selectedTopic === 'laporan' && renderTopicFahamLaporan()}
      {selectedTopic === 'tanya' && renderTopicTanyaMekara()}
      {selectedTopic === 'bantuan' && renderTopicBantuanLain()}

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={() => {
          fetch('/api/keys/status', { credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              setHasSessionKey(Boolean(data?.connected))
            })
            .catch(() => {})
        }}
      />
    </div>
  )
}
