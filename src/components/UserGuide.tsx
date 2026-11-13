import { useState } from 'react'
import {
  BookOpenIcon,
  CheckCircleIcon,
  LightBulbIcon,
  StorefrontIcon,
  LockIcon,
  ChevronDownIcon,
  SparklesIcon,
} from './ui/Icons'

export interface UserGuideProps {
  onClose: () => void
}

interface GuideStep {
  title: string
  description: string
  tip?: string
  badge?: string
}

interface GuideSection {
  id: string
  title: string
  icon: string
  badge: string
  badgeColor: string
  summary: string
  steps: GuideStep[]
  formula?: {
    grossProfit: string
    netProfit: string
  }
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'input',
    icon: '📝',
    title: '1. Cara Memasukkan Data Jualan',
    badge: '4 Pilihan Fleksibel',
    badgeColor: 'bg-pink-50 text-[#BE1E72] border-pink-200',
    summary: 'Pilih cara paling mudah mengikut keselesaan Puan — bercerita, fail Excel, atau borang.',
    steps: [
      {
        badge: 'Pilihan 1',
        title: 'Ceritakan Jualan Puan (Kecerdasan AI)',
        description:
          'Paling mudah dan disyorkan! Taip seperti menghantar mesej WhatsApp biasa:\n"Saya jual karipap RM2 sebiji. Hari ini laku 50 biji. Kos membuatnya RM0.80 sebiji."\nKecerdasan AI Wanita Niaga akan mengesan produk, kuantiti, harga, dan kos modal secara automatik.',
        tip: 'Tak perlu risau tentang format jadual atau ejaan sempurna. Cerita sahaja seperti biasa.',
      },
      {
        badge: 'Pilihan 2',
        title: 'Muat Naik Fail Excel atau CSV',
        description:
          'Sesuai jika Puan sudah mencatat rekod jualan dalam komputer atau telefon. Sistem menerima fail format .xlsx, .xls, dan .csv serta menyusunnya terus ke dalam sistem.',
        tip: 'Pastikan fail mempunyai maklumat nama produk, kuantiti, dan harga.',
      },
      {
        badge: 'Pilihan 3',
        title: 'Isi Jualan Manual (Satu demi Satu)',
        description:
          'Masukkan maklumat jualan satu persatu menggunakan borang kemas: Nama Produk, Kuantiti terjual, Harga seunit, dan Kos Modal seunit (pilihan).',
      },
      {
        badge: 'Pilihan 4',
        title: 'Cuba Data Contoh (Demonstrasi Segera)',
        description:
          'Tekan satu klik pada Menu Utama untuk melihat contoh simulasi jualan sebenar (Karipap, Brownies, Kuih Lapis) lengkap dengan laporan kewangan dan carta.',
      },
    ],
  },
  {
    id: 'confirm',
    icon: '✅',
    title: '2. Cara Semak & Sahkan Maklumat',
    badge: 'Jaminan Ketepatan',
    badgeColor: 'bg-teal-50 text-[#0D9488] border-teal-200',
    summary: 'Puan sentiasa mempunyai kawalan penuh untuk menyemak dan mengubah data sebelum laporan dijana.',
    steps: [
      {
        title: 'Periksa Kad Produk Yang AI Susunkan',
        description:
          'Sistem akan menyenaraikan setiap produk, kuantiti, harga seunit, dan jumlah hasil jualan dalam kad yang bersih.',
      },
      {
        title: 'Boleh Ubah (Edit) atau Padam',
        description:
          'Jika ada nombor yang tersilap atau nama produk yang perlu dibetulkan, tekan butang "Edit" pada bila-bila masa.',
      },
      {
        title: 'Tambah Perbelanjaan Operasi (Pilihan)',
        description:
          'Puan boleh mencatat kos sampingan seperti sewa tapak gerai, bil elektrik/air, atau minyak pengangkutan. Ini membolehkan sistem mengira anggaran Untung Bersih.',
        tip: 'Jika tiada perbelanjaan operasi lain, biarkan kosong. Sistem akan memaparkan Untung Kasar yang tepat dan tidak mereka-reka nombor.',
      },
      {
        title: 'Tekan Butang "Sahkan & Jana Laporan"',
        description:
          'Setelah berpuas hati dengan rekod yang dipaparkan, tekan butang utama untuk terus membuka Papan Pemuka Laporan.',
      },
    ],
  },
  {
    id: 'dashboard',
    icon: '📊',
    title: '3. Memahami Laporan & Untung',
    badge: 'Kewangan Jelas',
    badgeColor: 'bg-purple-50 text-[#7C3AED] border-purple-200',
    summary: 'Laporan perniagaan menjawab 4 persoalan penting tanpa istilah perakaunan rumit.',
    formula: {
      grossProfit: 'Untung Kasar = Jumlah Jualan − Kos Modal Produk',
      netProfit: 'Untung Bersih = Untung Kasar − Perbelanjaan Operasi (Sewa, Bil, Pengangkutan)',
    },
    steps: [
      {
        title: 'Jumlah Jualan & Unit Terjual',
        description:
          'Kad atas memaparkan jumlah tunai terkumpul (RM) dan jumlah bilangan unit barangan yang telah diserahkan kepada pelanggan.',
      },
      {
        title: 'Produk Paling Laris',
        description:
          'Kad emas mengenal pasti produk mana yang mencatat rekod jualan tertinggi untuk membantu Puan merancang stok hari esok.',
      },
      {
        title: 'Perbezaan Untung Kasar vs Untung Bersih',
        description:
          'Untung Kasar ialah wang lebihan selepas ditolak modal bahan mentah produk.\nUntung Bersih ialah baki sebenar di tangan Puan setelah ditolak kos sewa, bil utiliti, dan pengangkutan.',
        tip: 'Sentiasa rekod kos modal seunit agar Puan tahu margin keuntungan sebenar setiap barang.',
      },
      {
        title: 'Grafik Visual & Carta Pintar',
        description:
          'Lihat carta bar jualan mengikut produk, carta pai sumbangan jualan, dan graf trend harian yang jelas dan beresolusi tinggi.',
      },
    ],
  },
  {
    id: 'ai',
    icon: '🤖',
    title: '4. Cara Bertanya Pembantu AI',
    badge: 'Nasihat Percuma',
    badgeColor: 'bg-pink-50 text-[#BE1E72] border-pink-200',
    summary: 'Dapatkan nasihat perniagaan ringkas dan pandangan pintar pada bila-bila masa.',
    steps: [
      {
        title: 'Buka Ruang "Pembantu Niaga AI"',
        description:
          'Tekan butang "Tanya Pembantu AI" di papan pemuka untuk memulakan perbualan santai bersama AI pintar.',
      },
      {
        title: 'Gunakan Cadangan Soalan Pantas',
        description:
          'Tekan soalan tersedia seperti "Produk mana paling laris?" atau "Berapa keuntungan saya?" untuk jawapan angka segera tanpa perlu menaip panjang.',
      },
      {
        title: 'Tanya Nasihat Perniagaan Bebas',
        description:
          'Taip soalan seperti "Patutkah saya tambah stok esok?", "Bagaimana cara kurangkan kos modal?", atau "Tips lariskan jualan di WhatsApp".',
        tip: 'AI akan memberikan nasihat sopan, ringkas, dan berasaskan fakta jualan Puan.',
      },
      {
        title: 'Gunakan Butang "Terangkan Lagi"',
        description:
          'Jika Puan mahukan penjelasan yang lebih mendalam mengenai sesuatu jawapan, tekan butang "Terangkan Lagi" di bawah respons AI.',
      },
    ],
  },
  {
    id: 'pdf',
    icon: '📥',
    title: '5. Menyimpan Laporan PDF (A4)',
    badge: 'Simpan & Kongsi',
    badgeColor: 'bg-teal-50 text-[#0D9488] border-teal-200',
    summary: 'Muat turun laporan perniagaan rasmi untuk simpanan peribadi atau perkongsian WhatsApp.',
    steps: [
      {
        title: 'Tekan "Simpan Laporan PDF"',
        description:
          'Di bahagian bawah papan pemuka jualan, tekan butang "Simpan Laporan PDF" untuk menjana fail laporan rasmi bersaiz A4.',
      },
      {
        title: 'Kandungan Laporan Rasmi Lengkap',
        description:
          'Fail PDF mengandungi ringkasan eksekutif kewangan, graf carta jualan mengikut produk, jadual pecahan untung, dan tarikh cetakan.',
      },
      {
        title: 'Kongsi ke WhatsApp atau Cetak',
        description:
          'Laporan PDF boleh disimpan terus di dalam telefon pintar atau dikongsi kepada rakan kongsi, juruaudit, dan pembimbing program komuniti.',
        tip: 'Sangat berguna sebagai dokumen rujukan rekod jualan atau permohonan geran dan pembiayaan mikro.',
      },
    ],
  },
]

export function UserGuide({ onClose }: UserGuideProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    input: true,
    confirm: false,
    dashboard: false,
    ai: false,
    pdf: false,
  })
  const [activeTab, setActiveTab] = useState<string>('all')

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {}
    GUIDE_SECTIONS.forEach((s) => {
      allOpen[s.id] = true
    })
    setOpenSections(allOpen)
  }

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {}
    GUIDE_SECTIONS.forEach((s) => {
      allClosed[s.id] = false
    })
    setOpenSections(allClosed)
  }

  const filteredSections =
    activeTab === 'all'
      ? GUIDE_SECTIONS
      : GUIDE_SECTIONS.filter((s) => s.id === activeTab)

  return (
    <div className="space-y-4 max-w-xl sm:max-w-2xl mx-auto pb-10">
      {/* 1. Hero Welcome Card */}
      <div className="bg-white rounded-3xl border border-[#F1D3E3] p-5 sm:p-6 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5FA] border border-[#F1D3E3] text-[#BE1E72] text-xs font-bold shadow-2xs">
            <BookOpenIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
            <span>Pusat Bantuan &amp; Panduan</span>
          </div>

          <span className="text-[11px] font-semibold text-[#68586B]">
            Versi Usahawan Mikro
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading leading-tight">
            Mudahnya Urus Niaga dengan Wanita Niaga AI
          </h2>
          <p className="text-xs sm:text-sm text-[#68586B] font-body mt-1.5 leading-relaxed">
            Panduan lengkap langkah demi langkah dari memasukkan rekod jualan harian, mengira keuntungan dengan tepat, hingga menjana laporan PDF dan bertanya nasihat perniagaan.
          </p>
        </div>

        {/* 3 Quick Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-2.5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-white text-[#BE1E72] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              ⚡
            </span>
            <div className="leading-tight">
              <span className="text-xs font-bold text-[#28152F] block">Tanpa Perakaunan</span>
              <span className="text-[10px] text-[#68586B]">Mudah untuk pemula</span>
            </div>
          </div>

          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-2.5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-white text-[#0D9488] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              🔒
            </span>
            <div className="leading-tight">
              <span className="text-xs font-bold text-[#28152F] block">Privasi Terjamin</span>
              <span className="text-[10px] text-[#68586B]">Data kekal selamat</span>
            </div>
          </div>

          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-2.5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-white text-[#7C3AED] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              📱
            </span>
            <div className="leading-tight">
              <span className="text-xs font-bold text-[#28152F] block">Mesra Telefon</span>
              <span className="text-[10px] text-[#68586B]">Sentuhan lancar</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Topic Filter Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#28152F] flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
            <span>Pilih Topik Pantas:</span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-[#BE1E72] hover:underline font-bold cursor-pointer"
            >
              Buka Semua
            </button>
            <span className="text-[#F1D3E3]">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-[#68586B] hover:underline font-semibold cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap shrink-0 text-xs font-bold px-3.5 py-2 min-h-[42px] rounded-full border transition-all cursor-pointer shadow-2xs ${
              activeTab === 'all'
                ? 'bg-[#BE1E72] text-white border-[#BE1E72]'
                : 'bg-white text-[#68586B] border-[#F1D3E3] hover:bg-pink-50 hover:text-[#BE1E72]'
            }`}
          >
            Semua (5 Topik)
          </button>
          {GUIDE_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveTab(sec.id)
                setOpenSections((prev) => ({ ...prev, [sec.id]: true }))
              }}
              className={`whitespace-nowrap shrink-0 text-xs font-bold px-3.5 py-2 min-h-[42px] rounded-full border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                activeTab === sec.id
                  ? 'bg-[#BE1E72] text-white border-[#BE1E72]'
                  : 'bg-white text-[#28152F] border-[#F1D3E3] hover:bg-pink-50 hover:text-[#BE1E72]'
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.title.split('. ')[1] || sec.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Guide Accordion Sections */}
      <div className="space-y-3">
        {filteredSections.map((sec) => {
          const isOpen = openSections[sec.id] ?? false
          return (
            <div
              key={sec.id}
              className={`bg-white rounded-3xl border transition-all duration-200 shadow-2xs overflow-hidden ${
                isOpen ? 'border-[#BE1E72] ring-1 ring-[#BE1E72]/20' : 'border-[#F1D3E3]'
              }`}
            >
              {/* Accordion Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer focus:outline-none hover:bg-[#FFF5FA]/50 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF5FA] border border-[#F1D3E3] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    {sec.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#28152F] font-heading leading-tight">
                      {sec.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${sec.badgeColor}`}
                      >
                        {sec.badge}
                      </span>
                      <span className="text-[11px] text-[#68586B] hidden sm:inline">
                        {sec.steps.length} panduan langkah
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full border border-[#F1D3E3] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-[#FCE7F3] text-[#BE1E72] rotate-180' : 'bg-white text-[#68586B]'
                  }`}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </button>

              {/* Accordion Body Content */}
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3 border-t border-[#F1D3E3]/60 bg-[#FFFDFE]">
                  <p className="text-xs text-[#68586B] font-medium pt-1">
                    {sec.summary}
                  </p>

                  {/* Formula Box for Financial Section */}
                  {sec.formula && (
                    <div className="bg-[#FFF5FA] rounded-2xl border border-[#F1D3E3] p-3.5 space-y-2 shadow-2xs">
                      <span className="text-xs font-bold text-[#BE1E72] flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Formula Asas Kewangan Mudah:</span>
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-pink-200 text-[#0D9488] font-bold">
                          {sec.formula.grossProfit}
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-pink-200 text-[#7C3AED] font-bold">
                          {sec.formula.netProfit}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Cards */}
                  <div className="space-y-2.5">
                    {sec.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white rounded-2xl p-3.5 border border-[#F1D3E3] shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#BE1E72] text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                            {sIdx + 1}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
                              {st.title}
                            </h4>
                            {st.badge && (
                              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                {st.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#68586B] leading-relaxed pl-8 whitespace-pre-line font-body">
                          {st.description}
                        </p>

                        {st.tip && (
                          <div className="ml-8 mt-2 p-2.5 bg-[#FFF0F7] border border-[#F1D3E3] rounded-xl text-xs text-[#28152F] flex items-start gap-2 shadow-2xs">
                            <LightBulbIcon className="w-4 h-4 text-[#BE1E72] shrink-0 mt-0.5" />
                            <span className="leading-snug">{st.tip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 4. SULAM Community & Trust Note Card */}
      <div className="bg-[#FFF0F7] rounded-3xl border border-[#F1D3E3] p-4 sm:p-5 text-center space-y-2 shadow-2xs">
        <div className="flex items-center justify-center gap-2 text-[#BE1E72]">
          <StorefrontIcon className="w-5 h-5 text-[#BE1E72]" />
          <span className="text-xs sm:text-sm font-bold font-heading">
            Inisiatif Komuniti SULAM Universiti &amp; Wanita Niaga AI
          </span>
        </div>
        <p className="text-xs text-[#68586B] max-w-md mx-auto leading-relaxed">
          Dibina khusus untuk memperkasakan peniaga wanita mikro di Malaysia melalui pengurusan kewangan digital yang jujur, ringkas, dan selamat.
        </p>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#68586B] font-medium bg-white px-3 py-1 rounded-full border border-[#F1D3E3]">
          <LockIcon className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Privasi dijamin tanpa simpanan akaun atau maklumat peribadi.</span>
        </div>
      </div>

      {/* 5. Bottom Action Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full min-h-[48px] bg-[#BE1E72] hover:bg-[#9B1258] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-full shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <CheckCircleIcon className="w-5 h-5 text-white" />
        <span>Faham, Kembali ke Aplikasi 👍</span>
      </button>
    </div>
  )
}
