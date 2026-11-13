import React, { useState } from 'react'
import { ProductBarChart, AdvancedCharts } from './Charts'
import {
  DownloadIcon,
  ChatBubbleIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CakeIcon,
  CalendarIcon,
  ShoppingBagIcon,
  TrophyIcon,
  TrendingUpIcon,
  LightBulbIcon,
  ReceiptIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from './ui/Icons'
import { formatRM } from '../data/validate'
import { exportDashboardToPDF } from '../services/pdfExport'
import type { SalesResult } from '../types'

export interface DashboardProps {
  result: SalesResult
  operatingExpenses: number | null
  onUpdateOperatingExpenses: (val: number | null) => void
  onEdit: () => void
  onAsk: () => void
  onReset: () => void
  isSampleData?: boolean
}

export function Dashboard({
  result,
  operatingExpenses,
  onUpdateOperatingExpenses,
  onEdit,
  onAsk,
  onReset,
  isSampleData = false,
}: DashboardProps) {
  const [opexInput, setOpexInput] = useState<string>(
    operatingExpenses !== null ? String(operatingExpenses) : ''
  )
  const [showOpexForm, setShowOpexForm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false)
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null)

  const {
    totalRevenue,
    totalKuantiti,
    grossProfit,
    estimatedNetProfit,
    costComplete,
    hasDateData,
    hasChannelData,
    products,
    bestSeller,
    highestRevenue,
    channels,
    trends,
  } = result

  const handleSaveOpex = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = opexInput.trim()
    if (trimmed === '') {
      onUpdateOperatingExpenses(null)
      setShowOpexForm(false)
    } else {
      const parsed = Number(trimmed)
      if (Number.isFinite(parsed) && parsed >= 0) {
        onUpdateOperatingExpenses(parsed)
        setShowOpexForm(false)
      } else {
        alert('Sila masukkan nombor perbelanjaan yang sah (0 atau lebih).')
      }
    }
  }

  const handleExportPDF = async () => {
    if (isGeneratingPDF) return
    setIsGeneratingPDF(true)
    setPdfSuccessMessage(null)

    const wasAdvancedOpen = showAdvanced
    if (!showAdvanced) {
      setShowAdvanced(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    const success = await exportDashboardToPDF({
      result,
      operatingExpenses,
      barChartCanvasId: 'chart-product-bar',
      doughnutChartCanvasId: 'chart-product-doughnut',
    })

    if (!wasAdvancedOpen) {
      setShowAdvanced(false)
    }

    setIsGeneratingPDF(false)
    if (success) {
      setPdfSuccessMessage('Laporan PDF berjaya dimuat turun ke peranti anda!')
      setTimeout(() => setPdfSuccessMessage(null), 4500)
    } else {
      alert('Maaf, tidak dapat menjana fail PDF buat masa ini. Sila cuba lagi.')
    }
  }

  // Generate concise, deterministic insights ("Apa yang Puan boleh pelajari?")
  const insightBullets: string[] = []

  if (bestSeller && highestRevenue) {
    if (bestSeller.produk === highestRevenue.produk) {
      insightBullets.push(
        `${bestSeller.produk} adalah produk juara — paling banyak terjual (${bestSeller.kuantiti.toLocaleString()} unit) dan menjana hasil tertinggi (${formatRM(highestRevenue.revenue)}).`
      )
    } else {
      insightBullets.push(
        `${bestSeller.produk} paling banyak terjual. ${highestRevenue.produk} pula menghasilkan jumlah jualan tertinggi.`
      )
    }
  } else if (bestSeller) {
    insightBullets.push(
      `${bestSeller.produk} paling banyak terjual dengan ${bestSeller.kuantiti.toLocaleString()} unit terjual.`
    )
  }

  if (hasChannelData && channels.length > 0) {
    const topChannel = channels[0]
    insightBullets.push(
      `Saluran jualan utama ialah ${topChannel.saluran} (${formatRM(topChannel.revenue)}, ${topChannel.percentage.toFixed(0)}% jualan).`
    )
  }

  if (costComplete && grossProfit !== null) {
    if (operatingExpenses !== null && estimatedNetProfit !== null) {
      if (estimatedNetProfit >= 0) {
        insightBullets.push(
          `Anggaran untung bersih perniagaan adalah ${formatRM(estimatedNetProfit)} setelah menolak kos operasi ${formatRM(operatingExpenses)}.`
        )
      } else {
        insightBullets.push(
          `Perhatian: Perniagaan mencatat anggaran kerugian bersih sebanyak ${formatRM(Math.abs(estimatedNetProfit))} selepas kos operasi.`
        )
      }
    } else {
      insightBullets.push(
        `Jumlah untung kasar perniagaan anda adalah ${formatRM(grossProfit)}.`
      )
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Mod Demonstrasi Notice (if active) */}
      {isSampleData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <CakeIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">
              <strong>Mod Demonstrasi:</strong> Menggunakan data contoh simulasi perniagaan makanan.
            </span>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-bold text-amber-950 underline hover:no-underline whitespace-nowrap cursor-pointer shrink-0"
          >
            Tukar Data
          </button>
        </div>
      )}

      {/* 2. Main Page Heading & Subtitle */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading tracking-tight leading-tight">
          Prestasi perniagaan Puan
        </h2>
        <p className="text-sm sm:text-base text-[#68586B] font-body leading-relaxed">
          Lihat jualan, keuntungan dan produk paling laris.
        </p>
      </div>

      {/* 3. PDF Success Notification Toast */}
      {pdfSuccessMessage && (
        <div
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs animate-fadeIn"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup pemberitahuan"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Financial Summary: 4 KPI Cards (Matching Reference Mockup 2) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Jumlah Jualan (Top-Left) */}
        <div className="bg-white border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#BE1E72]">
            <CalendarIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B]">
              Jumlah Jualan
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#28152F] font-heading tabular-nums leading-tight">
            {formatRM(totalRevenue)}
          </div>
          <p className="text-[11px] sm:text-xs text-[#68586B] truncate">
            Jumlah hasil jualan
          </p>
        </div>

        {/* Card 2: Produk Terjual (Top-Right) */}
        <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#7C3AED]">
            <ShoppingBagIcon className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B]">
              Produk Terjual
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#28152F] font-heading tabular-nums leading-tight">
            {totalKuantiti.toLocaleString()}{' '}
            <span className="text-xs sm:text-sm font-bold text-[#7C3AED]">unit</span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#68586B] truncate">
            Daripada {products.length} produk
          </p>
        </div>

        {/* Card 3: Paling Laris (Bottom-Left) */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#D97706]">
            <TrophyIcon className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B]">
              Paling Laris
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-[#28152F] font-heading truncate leading-tight">
            {bestSeller ? bestSeller.produk : '-'}
          </div>
          <p className="text-[11px] sm:text-xs text-[#68586B] truncate">
            {bestSeller ? `${bestSeller.kuantiti.toLocaleString()} unit terjual` : 'Tiada data'}
          </p>
        </div>

        {/* Card 4: Untung Kasar / Anggaran Untung Bersih (Bottom-Right) */}
        <div
          className={`rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs border ${
            costComplete
              ? (estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                ? 'bg-[#E6F4F1] border-[#A7D7CD]'
                : 'bg-[#FFF1F2] border-[#FECDD3]'
              : 'bg-white border-[#F1D3E3]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUpIcon
              className={`w-4 h-4 shrink-0 ${
                costComplete
                  ? (estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                    ? 'text-[#0D9488]'
                    : 'text-rose-600'
                  : 'text-gray-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B] truncate">
              {costComplete
                ? estimatedNetProfit !== null
                  ? 'Untung Bersih'
                  : 'Untung Kasar'
                : 'Untung Kasar'}
            </span>
          </div>

          <div
            className={`text-lg sm:text-2xl font-black font-heading tabular-nums leading-tight truncate ${
              costComplete
                ? (estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                  ? 'text-[#0D9488]'
                  : 'text-rose-700'
                : 'text-gray-400 text-sm sm:text-base font-bold'
            }`}
          >
            {costComplete ? (
              estimatedNetProfit !== null ? (
                formatRM(estimatedNetProfit)
              ) : (
                formatRM(grossProfit!)
              )
            ) : (
              'Kos Diperlukan'
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-[#68586B] truncate">
            {costComplete ? (
              estimatedNetProfit !== null ? (
                <span>Tolak kos operasi</span>
              ) : (
                <span>Belum tolak kos operasi</span>
              )
            ) : (
              <span>Isi kos seunit untuk kira</span>
            )}
          </p>
        </div>
      </div>

      {/* 5. Primary Chart: "Jualan Mengikut Produk" (Matching Reference Mockup 1) */}
      <ProductBarChart products={products} />

      {/* 6. Business Insights Card: "Apa yang Puan boleh pelajari?" */}
      <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[#BE1E72] font-bold text-xs sm:text-sm">
          <LightBulbIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
          <span>Apa yang Puan boleh pelajari?</span>
        </div>
        <div className="text-xs sm:text-sm text-[#28152F] leading-relaxed space-y-1">
          {insightBullets.map((text, idx) => (
            <p key={idx}>{text}</p>
          ))}
        </div>
      </div>

      {/* 7. Operating Expenses: "Perbelanjaan Operasi" (Collapsible) */}
      <div className="bg-white border border-[#F1D3E3] rounded-2xl shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowOpexForm(!showOpexForm)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-pink-50/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#BE1E72] shrink-0">
              <ReceiptIcon className="w-4 h-4 text-[#BE1E72]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
                Perbelanjaan Operasi
              </h3>
              <p className="text-[11px] sm:text-xs text-[#68586B]">
                {operatingExpenses !== null
                  ? `Disahkan: ${formatRM(operatingExpenses)} (Sewa, utiliti, lain-lain)`
                  : 'Tambah sewa, bil dan kos lain'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {operatingExpenses !== null && !showOpexForm && (
              <span className="text-xs font-bold text-[#BE1E72] bg-pink-100 px-2 py-0.5 rounded-full">
                {formatRM(operatingExpenses)}
              </span>
            )}
            {showOpexForm ? (
              <ChevronUpIcon className="w-4 h-4 text-[#BE1E72]" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-[#BE1E72]" />
            )}
          </div>
        </button>

        {showOpexForm && (
          <form
            onSubmit={handleSaveOpex}
            className="p-3.5 sm:p-4 pt-0 border-t border-gray-100 space-y-3 bg-[#FFF5FA]/30 animate-fadeIn"
          >
            <div>
              <label className="block text-xs font-bold text-[#28152F] mb-1">
                Jumlah Perbelanjaan Operasi (RM)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="cth. 150.00"
                value={opexInput}
                onChange={(e) => setOpexInput(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
              />
              <p className="text-[11px] text-[#68586B] mt-1">
                Diperlukan bersama kos produk untuk mengira anggaran untung bersih perniagaan.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 min-h-[44px] bg-[#BE1E72] hover:bg-[#A3165F] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Simpan Perbelanjaan
              </button>
              {operatingExpenses !== null && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateOperatingExpenses(null)
                    setOpexInput('')
                    setShowOpexForm(false)
                  }}
                  className="min-h-[44px] px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Padam
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 8. Advanced Analytics: "Analisis Lanjut" (Collapsible) */}
      <div className="bg-white border border-[#F1D3E3] rounded-2xl shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-pink-50/30 transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
              Analisis Lanjut
            </h3>
            <p className="text-[11px] sm:text-xs text-[#68586B]">
              Trend harian, saluran jualan dan pecahan produk.
            </p>
          </div>
          {showAdvanced ? (
            <ChevronUpIcon className="w-4 h-4 text-[#BE1E72]" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-[#BE1E72]" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-3.5 sm:p-4 pt-1 border-t border-gray-100 space-y-4 animate-fadeIn">
            {/* Advanced Charts (Doughnut, Line, Channels) */}
            <AdvancedCharts
              products={products}
              channels={channels}
              trends={trends}
              hasDateData={hasDateData}
              hasChannelData={hasChannelData}
            />

            {/* Products Detail Table */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
                Pecahan Jualan Mengikut Produk ({products.length})
              </h4>
              <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-[#FFF5FA] text-[#68586B] border-b border-[#F1D3E3]">
                      <th className="py-2.5 px-3 font-bold">Produk</th>
                      <th className="py-2.5 px-3 font-bold text-right">Kuantiti</th>
                      <th className="py-2.5 px-3 font-bold text-right">Jualan</th>
                      <th className="py-2.5 px-3 font-bold text-right">Untung Kasar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#28152F] truncate max-w-[120px]">
                          {p.produk}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#28152F]">
                          {p.kuantiti.toLocaleString()} unit
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#28152F]">
                          {formatRM(p.revenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.grossProfit !== null ? (
                            <span className="font-bold text-[#0D9488]">
                              {formatRM(p.grossProfit)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Tiada kos</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Primary Action Buttons (Matching Reference Mockup 1) */}
      <div className="space-y-2.5 pt-2">
        {/* Primary CTA: Tanya Pembantu AI */}
        <button
          type="button"
          onClick={onAsk}
          className="w-full min-h-[48px] sm:min-h-[52px] bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-pink-300/40"
        >
          <ChatBubbleIcon className="w-5 h-5 text-white" />
          <span>Tanya Pembantu AI</span>
        </button>

        {/* Secondary Action: Simpan Laporan PDF */}
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="w-full min-h-[44px] sm:min-h-[46px] border border-pink-200 hover:bg-pink-50 text-[#BE1E72] font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <DownloadIcon className="w-4 h-4 text-[#BE1E72]" />
          <span>{isGeneratingPDF ? 'Menjana Laporan PDF...' : 'Simpan Laporan PDF'}</span>
        </button>

        {/* Utility Actions: Kemaskini Data & Mula Semula */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs sm:text-sm text-[#68586B]">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 hover:text-[#BE1E72] transition-colors cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            <span>Kemaskini Data</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Mula Semula</span>
          </button>
        </div>
      </div>
    </div>
  )
}
