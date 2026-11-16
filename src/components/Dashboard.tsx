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
        <strong key={index} className="font-bold text-[#171317]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function renderInsightIcon(category: string, _iconType?: string) {
  if (category === 'month_change') {
    return (
      <div className="w-7 h-7 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#0D7355] shrink-0">
        <TrendingUpIcon className="w-3.5 h-3.5" />
      </div>
    )
  }
  if (category === 'margin') {
    return (
      <div className="w-7 h-7 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#0D7355] shrink-0">
        <ChartBarIcon className="w-3.5 h-3.5" />
      </div>
    )
  }
  if (category === 'concentration') {
    return (
      <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
      </div>
    )
  }
  if (category === 'channel') {
    return (
      <div className="w-7 h-7 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
        <ShoppingBagIcon className="w-3.5 h-3.5" />
      </div>
    )
  }
  if (category === 'timing') {
    return (
      <div className="w-7 h-7 rounded-xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020] shrink-0">
        <CalendarIcon className="w-3.5 h-3.5" />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020] shrink-0">
      <LightBulbIcon className="w-3.5 h-3.5" />
    </div>
  )
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
      monthlyComparison,
      allRecords,
      allResult,
      insights: displayedInsights,
      selectedMonth,
      availableMonths,
      isSampleData,
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

  // Gross profit margin calculation (if costs exist)
  const grossMarginPct =
    totalRevenue > 0 && grossProfit !== null
      ? ((grossProfit / totalRevenue) * 100).toFixed(1)
      : null

  return (
    <div className="space-y-4 sm:space-y-5 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto pb-3 sm:pb-6">
      {/* 1. Mod Demonstrasi Notice (if active) */}
      {isSampleData && (
        <div
          className="apple-reveal-card bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-xs"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CakeIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">
              <strong>Mod Demonstrasi:</strong> Menggunakan data contoh simulasi perniagaan makanan.
            </span>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-bold text-amber-950 underline hover:no-underline whitespace-nowrap min-h-[36px] flex items-center cursor-pointer shrink-0"
          >
            Tukar Data
          </button>
        </div>
      )}

      {/* 2. Main Page Heading & Subtitle */}
      <div className="apple-reveal-card" style={{ animationDelay: '0ms' }}>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#171317] font-heading tracking-tight leading-tight">
          Prestasi perniagaan Puan
        </h2>
        <div
          className="w-[68px] h-[3px] bg-[#800020] rounded-full mt-2 mb-2"
          aria-hidden="true"
        />
        <p className="text-sm sm:text-base text-[#6B6069] font-body leading-relaxed">
          Lihat jumlah jualan, keuntungan dan produk paling laris secara tersusun.
        </p>
      </div>

      {/* 2b. Reporting Period Selector (Monthly Filter) */}
      {availableMonths.length > 0 && (
        <div
          className="apple-reveal-card bg-white p-2 sm:p-2.5 rounded-2xl border border-[#EBE1D7] flex flex-wrap items-center justify-between gap-2 shadow-[0_4px_16px_rgba(34,18,24,0.035)]"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#171317] px-1">
            <CalendarIcon className="w-4 h-4 text-[#800020] shrink-0" />
            <span>Pilih Tempoh:</span>
          </div>

          {availableMonths.length <= 4 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectMonth('ALL')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[36px] ${
                  selectedMonth === 'ALL' || selectedMonth === 'semua'
                    ? 'bg-[#800020] text-white shadow-[0_2px_8px_rgba(128,0,32,0.25)]'
                    : 'text-[#6B6069] bg-[#FAF7F2] border border-[#EBE1D7] hover:border-[#800020]/40 hover:text-[#800020]'
                }`}
              >
                Semua
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelectMonth(m.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[36px] ${
                    selectedMonth === m.key
                      ? 'bg-[#800020] text-white shadow-[0_2px_8px_rgba(128,0,32,0.25)]'
                      : 'text-[#6B6069] bg-[#FAF7F2] border border-[#EBE1D7] hover:border-[#800020]/40 hover:text-[#800020]'
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
              className="text-base sm:text-xs font-bold text-[#171317] bg-[#FAF7F2] border border-[#EBE1D7] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] cursor-pointer min-h-[38px]"
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
        <div
          className="apple-reveal-card bg-[#FAF4EA] border border-[#E8DCD0] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_4px_16px_rgba(34,18,24,0.03)]"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                monthlyComparison.trend === 'increase'
                  ? 'bg-[#E8F5E9] text-[#0D7355] border border-[#C8E6C9]'
                  : monthlyComparison.trend === 'decrease'
                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                  : 'bg-white text-[#800020] border border-[#EBE1D7]'
              }`}
            >
              {monthlyComparison.trend === 'increase' ? (
                <TrendingUpIcon className="w-4 h-4 text-[#0D7355]" />
              ) : monthlyComparison.trend === 'decrease' ? (
                <TrendingUpIcon className="w-4 h-4 text-rose-600 rotate-180" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-[#800020]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#171317] leading-snug">
                {monthlyComparison.summaryText}
              </p>
              {monthlyComparison.previousMonthLabel && monthlyComparison.previousRevenue !== null && (
                <p className="text-[11px] text-[#7A6E77] mt-0.5">
                  {monthlyComparison.currentMonthLabel}: {formatRM(monthlyComparison.currentRevenue)} &bull; {monthlyComparison.previousMonthLabel}: {formatRM(monthlyComparison.previousRevenue)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {monthlyComparison && monthlyComparison.trend === 'none' && (
        <div
          className="apple-reveal-card bg-[#FAF4EA] border border-[#E8DCD0] rounded-2xl p-3 text-xs text-[#6B6069] flex items-center gap-2 shadow-[0_4px_16px_rgba(34,18,24,0.03)]"
          style={{ animationDelay: '80ms' }}
        >
          <CalendarIcon className="w-4 h-4 text-[#800020] shrink-0" />
          <span>{monthlyComparison.summaryText}</span>
        </div>
      )}

      {/* 3. PDF Success Notification Toast */}
      {pdfSuccessMessage && (
        <div
          className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#0D7355] rounded-2xl p-3.5 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs animate-fadeIn"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-[#0D7355] shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(null)}
            className="text-[#0D7355] hover:text-[#09503B] text-xs font-bold min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup pemberitahuan"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Financial Summary KPI Section */}
      {/* 4A. Mobile View (< 768px): Compact, Icon-Free 2x2 Grid */}
      <div
        className="apple-reveal-card md:hidden grid grid-cols-2 gap-2 sm:gap-2.5"
        style={{ animationDelay: '160ms' }}
      >
        {/* Mobile Card 1: Jumlah Jualan */}
        <div
          className={`bg-white border border-[#EBE1D7] rounded-[22px] p-3.5 space-y-1 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex flex-col justify-between transition-all hover:border-[#800020]/20 ${
            totalRevenue >= 1000000 ? 'col-span-2' : ''
          }`}
        >
          <span className="text-xs font-semibold text-[#6B6069] leading-none">
            Jumlah Jualan
          </span>
          <div className="text-lg sm:text-xl font-black text-[#800020] font-heading tabular-nums tracking-tight leading-tight py-0.5">
            {formatRM(totalRevenue)}
          </div>
          <p className="text-xs text-[#7A6E77] leading-tight">
            Hasil jualan kasar
          </p>
        </div>

        {/* Mobile Card 2: Untung Kasar / Untung Bersih */}
        <div
          className={`rounded-[22px] p-3.5 space-y-1 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex flex-col justify-between border transition-all ${
            (grossProfit && grossProfit >= 1000000) || (estimatedNetProfit && estimatedNetProfit >= 1000000)
              ? 'col-span-2'
              : ''
          } ${
            costComplete
              ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                ? 'bg-white border-[#C8E6C9]'
                : 'bg-rose-50/40 border-rose-200/80'
              : 'bg-white border-[#EBE1D7]'
          }`}
        >
          <div className="flex items-center justify-between gap-1 leading-none">
            <span className="text-xs font-semibold text-[#6B6069]">
              {costComplete
                ? !isFilteredMonth && estimatedNetProfit !== null
                  ? 'Untung Bersih'
                  : 'Untung Kasar'
                : 'Untung Kasar'}
            </span>
            {grossMarginPct && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#0D7355] border border-[#C8E6C9] shrink-0 tabular-nums">
                {grossMarginPct}%
              </span>
            )}
          </div>

          <div
            className={`text-lg sm:text-xl font-black font-heading tabular-nums tracking-tight leading-tight py-0.5 ${
              costComplete
                ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                  ? 'text-[#0D7355]'
                  : 'text-rose-700'
                : 'text-gray-400 text-sm font-bold'
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

          <p className="text-xs text-[#7A6E77] leading-tight">
            {costComplete ? (
              !isFilteredMonth && estimatedNetProfit !== null ? (
                <span>Tolak kos operasi</span>
              ) : (
                <span>Sebelum kos operasi</span>
              )
            ) : (
              <span>Isi kos seunit</span>
            )}
          </p>
        </div>

        {/* Mobile Card 3: Unit Terjual */}
        <div className="bg-white border border-[#EBE1D7] rounded-[22px] p-3.5 space-y-1 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex flex-col justify-between transition-all hover:border-[#800020]/20">
          <span className="text-xs font-semibold text-[#6B6069] leading-none">
            Unit Terjual
          </span>
          <div className="text-lg sm:text-xl font-black text-[#171317] font-heading tabular-nums tracking-tight leading-tight py-0.5">
            {totalKuantiti.toLocaleString()}{' '}
            <span className="text-xs font-bold text-[#800020]">unit</span>
          </div>
          <p className="text-xs text-[#7A6E77] leading-tight">
            Daripada {products.length} produk
          </p>
        </div>

        {/* Mobile Card 4: Produk Terlaris (Dual Champions) */}
        <div className="bg-white border border-[#EBE1D7] rounded-[22px] p-3.5 space-y-1.5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex flex-col justify-between transition-all hover:border-[#800020]/20">
          <span className="text-xs font-semibold text-[#6B6069] leading-none">
            Produk Terlaris
          </span>

          <div className="space-y-0.5 leading-tight">
            <div className="text-xs font-bold text-[#171317] break-words">
              {bestSeller ? bestSeller.produk : '-'}
            </div>
            <span className="text-xs text-[#7A6E77]">
              {bestSeller ? `${bestSeller.kuantiti.toLocaleString()} unit terjual` : ''}
            </span>
          </div>

          {highestRevenue && (
            <div className="pt-1.5 border-t border-[#EBE1D7] text-xs leading-tight space-y-0.5">
              <div className="text-xs text-[#7A6E77] font-semibold">Hasil Tertinggi:</div>
              <div className="font-bold text-[#171317] flex items-baseline justify-between gap-1">
                <span className="break-words">{highestRevenue.produk}</span>
                <span className="text-[#800020] font-black tabular-nums shrink-0">
                  {formatRM(highestRevenue.revenue)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4B. Tablet & Desktop View (>= 768px): Premium Apple-inspired Bento 1+3 Layout */}
      <div
        className="apple-reveal-card hidden md:grid md:grid-cols-12 md:gap-4"
        style={{ animationDelay: '160ms' }}
      >
        {/* Bento Left: Hero Jumlah Jualan Card (Spans full height) */}
        <div className="md:col-span-5 lg:col-span-5 bg-white border border-[#EBE1D7] rounded-[24px] p-6 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex flex-col justify-between transition-all hover:border-[#800020]/20">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#6B6069]">Jumlah Jualan</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F8EAE8] text-[#800020] border border-[#EED7D5]">
                {currentMonthLabel === 'ALL' || currentMonthLabel === 'semua' ? 'Semua' : currentMonthLabel}
              </span>
            </div>
            <p className="text-xs text-[#7A6E77]">Hasil jualan kasar perniagaan Puan</p>
          </div>

          <div className="my-auto py-6">
            <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-[#800020] font-heading tabular-nums tracking-tight">
              {formatRM(totalRevenue)}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EBE1D7] text-xs text-[#7A6E77] flex items-center justify-between">
            <span>Prestasi Keseluruhan</span>
            <span className="font-semibold text-[#171317]">{products.length} produk tersenarai</span>
          </div>
        </div>

        {/* Bento Right: 3 Stacked Cards */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col gap-3">
          {/* Bento Right 1: Untung Kasar / Untung Bersih */}
          <div
            className={`rounded-[22px] p-4 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] border transition-all ${
              costComplete
                ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                  ? 'bg-white border-[#C8E6C9]'
                  : 'bg-rose-50/40 border-rose-200/80'
                : 'bg-white border-[#EBE1D7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#6B6069]">
                  {costComplete
                    ? !isFilteredMonth && estimatedNetProfit !== null
                      ? 'Untung Bersih'
                      : 'Untung Kasar'
                    : 'Untung Kasar'}
                </span>
                {grossMarginPct && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#0D7355] border border-[#C8E6C9]">
                    Margin {grossMarginPct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6E77]">
                {costComplete ? (
                  !isFilteredMonth && estimatedNetProfit !== null ? (
                    'Tolak kos operasi'
                  ) : (
                    'Sebelum tolak kos operasi'
                  )
                ) : (
                  'Isi kos seunit'
                )}
              </p>
            </div>

            <div
              className={`text-2xl font-black font-heading tabular-nums leading-tight mt-1 ${
                costComplete
                  ? (!isFilteredMonth && estimatedNetProfit !== null ? estimatedNetProfit : grossProfit!) >= 0
                    ? 'text-[#0D7355]'
                    : 'text-rose-700'
                  : 'text-gray-400 text-lg font-bold'
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
          </div>

          {/* Bento Right 2: Unit Terjual */}
          <div className="bg-white border border-[#EBE1D7] rounded-[22px] p-4 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] flex items-center justify-between transition-all hover:border-[#800020]/20">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-[#6B6069]">Produk Terjual</span>
              <p className="text-xs text-[#7A6E77] mt-0.5">Jumlah kuantiti unit laku</p>
            </div>
            <div className="text-2xl font-black text-[#171317] font-heading tabular-nums">
              {totalKuantiti.toLocaleString()}{' '}
              <span className="text-sm font-bold text-[#800020]">unit</span>
            </div>
          </div>

          {/* Bento Right 3: Produk Terlaris (Dual Champions) */}
          <div className="bg-white border border-[#EBE1D7] rounded-[22px] p-4 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] space-y-2 transition-all hover:border-[#800020]/20">
            <span className="text-xs sm:text-sm font-semibold text-[#6B6069]">Produk Terlaris</span>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#EBE1D7]">
              <div>
                <span className="text-xs font-bold text-[#800020] uppercase tracking-wider block">
                  Produk Paling Laris
                </span>
                <p className="font-bold text-xs sm:text-sm text-[#171317] truncate mt-0.5">
                  {bestSeller ? bestSeller.produk : '-'}
                </p>
                <p className="text-xs text-[#7A6E77]">
                  {bestSeller ? `${bestSeller.kuantiti.toLocaleString()} unit` : ''}
                </p>
              </div>

              {highestRevenue && (
                <div>
                  <span className="text-xs font-bold text-[#800020] uppercase tracking-wider block">
                    Jualan Tertinggi
                  </span>
                  <p className="font-bold text-xs sm:text-sm text-[#171317] truncate mt-0.5">
                    {highestRevenue.produk}
                  </p>
                  <p className="text-xs font-bold text-[#800020] tabular-nums">
                    {formatRM(highestRevenue.revenue)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Primary Chart: "Jualan Mengikut Produk" (Horizontal, Accessible, Responsive) */}
      <div className="apple-reveal-card" style={{ animationDelay: '240ms' }}>
        <ProductBarChart products={products} />
      </div>

      {/* 6. Intelligent Business Insights: "Info Jualan" */}
      {displayedInsights.length > 0 && (
        <div
          className="apple-reveal-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] space-y-3"
          style={{ animationDelay: '320ms' }}
        >
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
                <SparklesIcon className="w-4 h-4 text-[#800020]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#171317] text-sm sm:text-base font-heading">
                  Info Jualan
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6E77]">
                  Peluang dan tips daripada rekod jualan Puan.
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 whitespace-nowrap self-start sm:self-center ${
                isAIInsights
                  ? 'bg-[#F8EAE8] text-[#800020] border-[#EED7D5]'
                  : 'bg-[#FAF4EA] text-[#800020] border-[#EBE1D7]'
              }`}
            >
              {isAIInsights ? 'Analisis AI' : 'Analisis Data'}
            </span>
          </div>

          <div className="divide-y divide-[#EBE1D7] pt-1">
            {displayedInsights.slice(0, 3).map((item, idx) => (
              <div key={item.id || idx} className={idx === 0 ? 'pb-3' : 'py-3'}>
                <div className="flex items-start gap-2.5">
                  {renderInsightIcon(item.category, item.icon)}
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="font-bold text-[#171317] text-sm sm:text-base">
                      {item.title.replace(/\b[Aa]kak\b/g, 'Puan').replace(/\b[Kk]ak\b/g, 'Puan')}
                    </h4>
                    <p className="text-sm text-[#6B6069] leading-relaxed">
                      {renderFormattedInsight(item.text)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Operating Expenses: "Perbelanjaan Operasi" (Collapsible) */}
      <div
        className="apple-reveal-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] overflow-hidden transition-all"
        style={{ animationDelay: '400ms' }}
      >
        <button
          type="button"
          onClick={() => setShowOpexForm(!showOpexForm)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
              <ReceiptIcon className="w-4 h-4 text-[#800020]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#171317] font-heading">
                Perbelanjaan Operasi
              </h3>
              <p className="text-[11px] sm:text-xs text-[#7A6E77]">
                {operatingExpenses !== null
                  ? `Disahkan: ${formatRM(operatingExpenses)} (Sewa, bil utiliti, gaji)`
                  : 'Tambah sewa, bil dan kos lain'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {operatingExpenses !== null && !showOpexForm && (
              <span className="text-xs font-bold text-[#800020] bg-[#F8EAE8] border border-[#EED7D5] px-2.5 py-0.5 rounded-full">
                {formatRM(operatingExpenses)}
              </span>
            )}
            {showOpexForm ? (
              <ChevronUpIcon className="w-4 h-4 text-[#800020]" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-[#800020]" />
            )}
          </div>
        </button>

        {showOpexForm && (
          <form
            onSubmit={handleSaveOpex}
            className="p-4 pt-1 border-t border-[#EBE1D7] space-y-3 bg-[#FAF4EA]/40 animate-fadeIn"
          >
            <div>
              <label className="block text-xs font-bold text-[#171317] mb-1.5">
                Jumlah Perbelanjaan Operasi (RM)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="cth. 150.00"
                value={opexInput}
                onChange={(e) => setOpexInput(e.target.value)}
                className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-colors"
              />
              <p className="text-xs text-[#7A6E77] mt-1">
                Perlu diisi bersama kos modal untuk kira anggaran untung bersih.
              </p>
              {isFilteredMonth && operatingExpenses !== null && (
                <p className="text-xs sm:text-sm text-[#800020] font-semibold bg-[#F8EAE8] p-2.5 rounded-xl border border-[#EED7D5] mt-2">
                  Nota: Perbelanjaan operasi direkodkan secara keseluruhan ({formatRM(operatingExpenses)}) dan tidak diagihkan bagi bulan {currentMonthLabel} sahaja. Pilih 'Semua' untuk paparan untung bersih keseluruhan.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary-burgundy flex-1 min-h-[44px] text-white font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-[0_2px_8px_rgba(128,0,32,0.22)]"
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
                  className="min-h-[44px] px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-full transition-all cursor-pointer"
                >
                  Padam
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 8. Advanced Analytics: "Analisis Lanjut" (Collapsible) */}
      <div
        className="apple-reveal-card bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)] overflow-hidden transition-all"
        style={{ animationDelay: '480ms' }}
      >
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#171317] font-heading">
              Analisis Lanjut
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6E77]">
              Trend harian, saluran jualan dan pecahan terperinci setiap produk.
            </p>
          </div>
          {showAdvanced ? (
            <ChevronUpIcon className="w-4 h-4 text-[#800020]" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-[#800020]" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-3.5 sm:p-5 pt-1 border-t border-[#EBE1D7] space-y-5 animate-fadeIn">
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
              <h4 className="text-xs sm:text-sm font-bold text-[#171317] font-heading">
                Jualan Ikut Produk ({products.length})
              </h4>
              <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-2xl border border-[#EBE1D7] bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#6B6069] border-b border-[#EBE1D7]">
                      <th className="py-2.5 px-3.5 font-bold">Produk</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Kuantiti</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Jualan</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Untung Kasar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE1D7]">
                    {products.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-[#171317] truncate max-w-[120px]">
                          {p.produk}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-[#171317] tabular-nums">
                          {p.kuantiti.toLocaleString()} unit
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-[#800020] tabular-nums">
                          {formatRM(p.revenue)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right tabular-nums">
                          {p.grossProfit !== null ? (
                            <span className="font-bold text-[#0D7355]">
                              {formatRM(p.grossProfit)}
                            </span>
                          ) : (
                            <span className="text-[#7A6E77] italic">Tiada kos</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales by Category (Lightweight Summary Table) */}
            {hasCategoryData && categories && categories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EBE1D7]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#171317] font-heading">
                    Pecahan Jualan Mengikut Kategori ({categories.length})
                  </h4>
                  <span className="text-xs text-[#0D7355] font-semibold bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full">
                    Kategori Dikesan
                  </span>
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-2xl border border-[#EBE1D7] bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[280px]">
                    <thead>
                      <tr className="bg-[#FAF7F2] text-[#6B6069] border-b border-[#EBE1D7]">
                        <th className="py-2.5 px-3.5 font-bold">Kategori</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Kuantiti</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Jumlah Jualan</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">% Jualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE1D7]">
                      {categories.map((c, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-[#171317]">
                            {c.kategori}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-[#171317] tabular-nums">
                            {c.kuantiti.toLocaleString()} unit
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-[#800020] tabular-nums">
                            {formatRM(c.revenue)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-[#7A6E77] tabular-nums">
                            {c.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales by Payment Method (Lightweight Summary Table) */}
            {hasPaymentData && paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EBE1D7]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#171317] font-heading">
                    Pecahan Jualan Mengikut Kaedah Bayaran ({paymentMethods.length})
                  </h4>
                  <span className="text-xs text-[#0D7355] font-semibold bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full">
                    Bayaran Dikesan
                  </span>
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-2xl border border-[#EBE1D7] bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[280px]">
                    <thead>
                      <tr className="bg-[#FAF7F2] text-[#6B6069] border-b border-[#EBE1D7]">
                        <th className="py-2.5 px-3.5 font-bold">Kaedah Bayaran</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Transaksi</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Jumlah Jualan</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">% Jualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE1D7]">
                      {paymentMethods.map((pm, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-[#171317]">
                            {pm.kaedah}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-[#171317] tabular-nums">
                            {pm.transaksi.toLocaleString()} rekod
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-[#800020] tabular-nums">
                            {formatRM(pm.revenue)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-[#7A6E77] tabular-nums">
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

      {/* 9. Primary Action Buttons */}
      <div
        className="apple-reveal-card space-y-2.5 pt-2"
        style={{ animationDelay: '560ms' }}
      >
        {/* Primary CTA: Tanya Pembantu AI */}
        <button
          type="button"
          onClick={onAsk}
          className="btn-primary-burgundy apple-hover-card w-full min-h-[48px] sm:min-h-[52px] text-white font-bold text-base rounded-full shadow-[0_4px_14px_rgba(128,0,32,0.28)] hover:shadow-[0_6px_20px_rgba(128,0,32,0.36)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <ChatBubbleIcon className="w-5 h-5 text-white" />
          <span>Tanya Mekara (AI)</span>
        </button>

        {/* Secondary Action: Simpan Laporan PDF */}
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="btn-secondary-neutral apple-hover-card w-full min-h-[44px] sm:min-h-[48px] border-[#DFD3C7] hover:border-[#800020] bg-white hover:bg-[#FAF4EA] text-[#800020] font-bold text-sm sm:text-base rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <DownloadIcon className="w-4 h-4 text-[#800020]" />
          <span>{isGeneratingPDF ? 'Menjana Laporan PDF...' : 'Simpan Laporan PDF'}</span>
        </button>

        {/* Compact Secondary Actions: Kemaskini Data & Mula Semula */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 pb-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-1.5 rounded-full border border-[#DFD3C7] bg-white hover:bg-[#FAF4EA] hover:border-[#800020] text-[#171317] hover:text-[#800020] text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98 cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5 text-[#7A6E77]" />
            <span>Kemaskini Data</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-1.5 rounded-full border border-[#DFD3C7] bg-white hover:bg-rose-50 hover:border-rose-300 text-[#171317] hover:text-rose-700 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98 cursor-pointer"
          >
            <ArrowPathIcon className="w-3.5 h-3.5 text-[#7A6E77]" />
            <span>Mula Semula</span>
          </button>
        </div>
      </div>
    </div>
  )
}
