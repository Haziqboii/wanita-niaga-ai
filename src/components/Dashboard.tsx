import React, { useState, useEffect, useMemo } from 'react'
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
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from './ui/Icons'
import { formatRM } from '../data/validate'
import { exportDashboardToPDF } from '../services/pdfExport'
import type { SalesResult, MonthOption, MonthlyComparison, ValidatedSale } from '../types'
import { generateDeterministicInsights, type InsightItem } from '../calc/insights'

export interface DashboardProps {
  result: SalesResult
  allResult?: SalesResult
  allRecords?: ValidatedSale[]
  reportId?: string | null
  operatingExpenses: number | null
  onUpdateOperatingExpenses: (val: number | null) => void
  onEdit: () => void
  onAsk: () => void
  onReset: () => void
  isSampleData?: boolean
  selectedMonth?: string
  onSelectMonth?: (month: string) => void
  availableMonths?: MonthOption[]
  monthlyComparison?: MonthlyComparison | null
}

function renderFormattedInsight(text: string) {
  // Respectful Malaysian entrepreneur honorific: ensure 'Puan' is used instead of informal 'akak'
  const normalized = text
    .replace(/\bAkak\b/g, 'Puan')
    .replace(/\bakak\b/g, 'Puan')
    .replace(/\bKak\b/g, 'Puan')
    .replace(/\bkak\b/g, 'Puan')

  const parts = normalized.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-[#28152F]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function renderInsightIcon(category: string, _iconType?: string) {
  if (category === 'month_change') {
    return <TrendingUpIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0D9488] shrink-0" />
  }
  if (category === 'margin') {
    return <ChartBarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#BE1E72] shrink-0" />
  }
  if (category === 'concentration') {
    return <ExclamationTriangleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
  }
  if (category === 'channel') {
    return <ShoppingBagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0D9488] shrink-0" />
  }
  if (category === 'timing') {
    return <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
  }
  return <LightBulbIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C3AED] shrink-0" />
}

export function Dashboard({
  result,
  allResult,
  allRecords = [],
  reportId = null,
  operatingExpenses,
  onUpdateOperatingExpenses,
  onEdit,
  onAsk,
  onReset,
  isSampleData = false,
  selectedMonth = 'ALL',
  onSelectMonth = () => {},
  availableMonths = [],
  monthlyComparison = null,
}: DashboardProps) {
  const [opexInput, setOpexInput] = useState<string>(
    operatingExpenses !== null ? String(operatingExpenses) : ''
  )
  const [showOpexForm, setShowOpexForm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false)
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null)

  const isFilteredMonth = selectedMonth !== 'ALL' && selectedMonth !== 'semua'
  const currentMonthOpt = availableMonths.find((m) => m.key === selectedMonth)
  const currentMonthLabel = currentMonthOpt ? currentMonthOpt.label : selectedMonth

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
    categories = [],
    paymentMethods = [],
    hasCategoryData = false,
    hasPaymentData = false,
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

    const currentMonthOpt = availableMonths.find((m) => m.key === selectedMonth)
    const periodLabel = selectedMonth === 'ALL' ? 'Semua' : currentMonthOpt?.label || selectedMonth

    const success = await exportDashboardToPDF({
      result,
      operatingExpenses,
      periodLabel,
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

  // Intelligent Business Insights: Deterministic Candidate Generation
  const deterministicCandidates = useMemo(() => {
    return generateDeterministicInsights({
      currentResult: result,
      allResult,
      allRecords,
      selectedPeriod: selectedMonth,
      availableMonths,
      monthlyComparison,
    })
  }, [result, allResult, allRecords, selectedMonth, availableMonths, monthlyComparison])

  const [displayedInsights, setDisplayedInsights] = useState<InsightItem[]>(deterministicCandidates)
  const [isAIInsights, setIsAIInsights] = useState<boolean>(false)

  const insightsCacheKey = `wn_insights_${reportId || 'default'}_${selectedMonth}_${result.recordCount}_${Math.round(result.totalRevenue)}`

  useEffect(() => {
    if (deterministicCandidates.length === 0) {
      setDisplayedInsights([])
      setIsAIInsights(false)
      return
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(insightsCacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
          setDisplayedInsights(parsed.insights)
          setIsAIInsights(Boolean(parsed.isAI))
          return
        }
      }
    } catch {
      // Storage unavailable or disabled
    }

    // Default to deterministic candidates while fetching or if fetch fails
    setDisplayedInsights(deterministicCandidates)
    setIsAIInsights(false)

    let isMounted = true
    const abortController = new AbortController()

    async function fetchAIInsights() {
      try {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ candidates: deterministicCandidates }),
          signal: abortController.signal,
        })

        if (!res.ok) return

        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.insights) && data.insights.length > 0) {
          setDisplayedInsights(data.insights)
          setIsAIInsights(Boolean(data.isAI))
          try {
            sessionStorage.setItem(
              insightsCacheKey,
              JSON.stringify({ insights: data.insights, isAI: data.isAI })
            )
          } catch {
            // Storage quota or disabled
          }
        }
      } catch {
        // Fallback remains deterministic candidates
      }
    }

    fetchAIInsights()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [insightsCacheKey, deterministicCandidates])

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

      {/* 2b. Monthly Filter Selector (Compact Berry Pop design) */}
      {availableMonths.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFF5FA] p-2 sm:p-2.5 rounded-2xl border border-[#F1D3E3] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#68586B] px-1">
            <CalendarIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
            <span>Pilih Bulan:</span>
          </div>

          {availableMonths.length <= 4 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectMonth('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedMonth === 'ALL' || selectedMonth === 'semua'
                    ? 'bg-[#BE1E72] text-white shadow-xs'
                    : 'text-[#68586B] bg-white border border-[#F1D3E3] hover:text-[#BE1E72] hover:bg-pink-50'
                }`}
              >
                Semua
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelectMonth(m.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedMonth === m.key
                      ? 'bg-[#BE1E72] text-white shadow-xs'
                      : 'text-[#68586B] bg-white border border-[#F1D3E3] hover:text-[#BE1E72] hover:bg-pink-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="text-xs font-bold text-[#28152F] bg-white border border-[#F1D3E3] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 cursor-pointer"
            >
              <option value="ALL">Semua Tempoh</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 2c. Monthly Performance Comparison Card */}
      {monthlyComparison && monthlyComparison.trend !== 'none' && (
        <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                monthlyComparison.trend === 'increase'
                  ? 'bg-emerald-100 text-emerald-700'
                  : monthlyComparison.trend === 'decrease'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-purple-100 text-[#7C3AED]'
              }`}
            >
              {monthlyComparison.trend === 'increase' ? (
                <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
              ) : monthlyComparison.trend === 'decrease' ? (
                <TrendingUpIcon className="w-4 h-4 text-rose-600 rotate-180" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-[#7C3AED]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#28152F] leading-snug">
                {monthlyComparison.summaryText}
              </p>
              {monthlyComparison.previousMonthLabel && monthlyComparison.previousRevenue !== null && (
                <p className="text-[11px] text-[#68586B] mt-0.5">
                  {monthlyComparison.currentMonthLabel}: {formatRM(monthlyComparison.currentRevenue)} &bull; {monthlyComparison.previousMonthLabel}: {formatRM(monthlyComparison.previousRevenue)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {monthlyComparison && monthlyComparison.trend === 'none' && (
        <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-2.5 sm:p-3 text-xs text-[#68586B] flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CalendarIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
          <span>{monthlyComparison.summaryText}</span>
        </div>
      )}

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

        {/* Card 3: Paling Laris / Juara Produk (Bottom-Left) */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#D97706]">
            <TrophyIcon className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B]">
              Paling Banyak Terjual
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-[#28152F] font-heading truncate leading-tight">
            {bestSeller ? bestSeller.produk : '-'}
          </div>
          <p className="text-[11px] sm:text-xs text-[#68586B] truncate">
            {bestSeller ? `${bestSeller.kuantiti.toLocaleString()} unit terjual` : 'Tiada data'}
          </p>

          {/* Supplementary highlight: Hasil Jualan Tertinggi (RM) */}
          {highestRevenue && (
            <div className="pt-1.5 border-t border-amber-200/70 mt-1">
              <p className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider">
                Hasil Jualan Tertinggi
              </p>
              <div className="flex items-baseline justify-between gap-1 text-[11px] sm:text-xs font-bold text-[#28152F] mt-0.5">
                <span className="truncate">{highestRevenue.produk}</span>
                <span className="text-[#BE1E72] shrink-0">{formatRM(highestRevenue.revenue)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Untung Kasar / Anggaran Untung Bersih (Bottom-Right) */}
        <div
          className={`rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs border ${
            costComplete
              ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                ? 'bg-[#E6F4F1] border-[#A7D7CD]'
                : 'bg-[#FFF1F2] border-[#FECDD3]'
              : 'bg-white border-[#F1D3E3]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUpIcon
              className={`w-4 h-4 shrink-0 ${
                costComplete
                  ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                    ? 'text-[#0D9488]'
                    : 'text-rose-600'
                  : 'text-gray-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-semibold text-[#68586B] truncate">
              {costComplete
                ? !isFilteredMonth && estimatedNetProfit !== null
                  ? 'Untung Bersih'
                  : 'Untung Kasar'
                : 'Untung Kasar'}
            </span>
          </div>

          <div
            className={`text-lg sm:text-2xl font-black font-heading tabular-nums leading-tight truncate ${
              costComplete
                ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                  ? 'text-[#0D9488]'
                  : 'text-rose-700'
                : 'text-gray-400 text-sm sm:text-base font-bold'
            }`}
          >
            {costComplete ? (
              !isFilteredMonth && estimatedNetProfit !== null ? (
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
              !isFilteredMonth && estimatedNetProfit !== null ? (
                <span>Tolak kos operasi</span>
              ) : isFilteredMonth && operatingExpenses !== null ? (
                <span>Opex belum diagihkan bulanan</span>
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

      {/* 6. Intelligent Business Insights Card: "Penemuan Pintar" */}
      {displayedInsights.length > 0 && (
        <div className="bg-white border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
              <h3 className="font-bold text-[#28152F] text-sm sm:text-base">Penemuan Pintar</h3>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${
                isAIInsights
                  ? 'bg-[#FCE7F3] text-[#BE1E72] border-[#FBCFE8]'
                  : 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]'
              }`}
            >
              {isAIInsights ? 'Analisis AI' : 'Analisis Data'}
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-[#68586B] -mt-1.5">
            Peluang dan corak tersembunyi daripada rekod jualan Puan.
          </p>

          <div className="divide-y divide-[#F1D3E3]/50">
            {displayedInsights.slice(0, 3).map((item, idx) => (
              <div key={item.id || idx} className={idx === 0 ? 'pt-0.5' : 'pt-2 mt-2'}>
                <div className="flex items-center gap-1.5">
                  {renderInsightIcon(item.category, item.icon)}
                  <h4 className="font-bold text-[#28152F] text-xs sm:text-sm">
                    {item.title.replace(/\b[Aa]kak\b/g, 'Puan').replace(/\b[Kk]ak\b/g, 'Puan')}
                  </h4>
                </div>
                <p className="text-xs text-[#4A3B4E] leading-relaxed mt-0.5 pl-5 sm:pl-5.5">
                  {renderFormattedInsight(item.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {isFilteredMonth && operatingExpenses !== null && (
                <p className="text-[11px] text-[#BE1E72] font-semibold bg-pink-50 p-2 rounded-lg border border-pink-100 mt-2">
                  Nota: Perbelanjaan operasi direkodkan secara keseluruhan ({formatRM(operatingExpenses)}) dan tidak diagihkan bagi bulan {currentMonthLabel} sahaja. Pilih 'Semua' untuk paparan untung bersih keseluruhan.
                </p>
              )}
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

            {/* Priority A — Sales by Category (Lightweight Summary Table) */}
            {hasCategoryData && categories && categories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
                    Pecahan Jualan Mengikut Kategori ({categories.length})
                  </h4>
                  <span className="text-[11px] text-[#0D9488] font-semibold bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                    Kategori Dikesan
                  </span>
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs border-collapse min-w-[280px]">
                    <thead>
                      <tr className="bg-[#FFF5FA] text-[#68586B] border-b border-[#F1D3E3]">
                        <th className="py-2.5 px-3 font-bold">Kategori</th>
                        <th className="py-2.5 px-3 font-bold text-right">Kuantiti</th>
                        <th className="py-2.5 px-3 font-bold text-right">Jumlah Jualan</th>
                        <th className="py-2.5 px-3 font-bold text-right">% Jualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.map((c, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#28152F]">
                            {c.kategori}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#28152F]">
                            {c.kuantiti.toLocaleString()} unit
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#28152F]">
                            {formatRM(c.revenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#68586B]">
                            {c.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Priority B — Sales by Payment Method (Lightweight Summary Table) */}
            {hasPaymentData && paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#28152F] font-heading">
                    Pecahan Jualan Mengikut Kaedah Bayaran ({paymentMethods.length})
                  </h4>
                  <span className="text-[11px] text-[#0D9488] font-semibold bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                    Bayaran Dikesan
                  </span>
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs border-collapse min-w-[280px]">
                    <thead>
                      <tr className="bg-[#FFF5FA] text-[#68586B] border-b border-[#F1D3E3]">
                        <th className="py-2.5 px-3 font-bold">Kaedah Bayaran</th>
                        <th className="py-2.5 px-3 font-bold text-right">Transaksi</th>
                        <th className="py-2.5 px-3 font-bold text-right">Jumlah Jualan</th>
                        <th className="py-2.5 px-3 font-bold text-right">% Jualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentMethods.map((pm, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#28152F]">
                            {pm.kaedah}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#28152F]">
                            {pm.transaksi.toLocaleString()} rekod
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#28152F]">
                            {formatRM(pm.revenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#68586B]">
                            {pm.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

        {/* Data Privacy & Storage Notice */}
        <div className="pt-3 pb-1 border-t border-pink-100 flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[11px] text-[#68586B] max-w-md">
            🔒 <span className="font-semibold text-[#28152F]">Privasi Tempatan:</span> Data jualan dan perbualan disimpan di pelayar peranti ini sahaja. Membersihkan cache atau data tapak pelayar akan memadam rekod ini.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-rose-600 hover:text-rose-700 underline font-medium cursor-pointer"
          >
            Padam Data Tersimpan
          </button>
        </div>
      </div>
    </div>
  )
}
