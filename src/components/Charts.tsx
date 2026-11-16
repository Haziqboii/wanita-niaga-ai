import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import type { ProductStats, ChannelStats, TrendPoint } from '../types'
import { formatRM } from '../data/validate'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PieChartIcon,
  TrendingUpIcon,
  ShoppingBagIcon,
} from './ui/Icons'

// Register valid Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
)

// Configure global HiDPI / Retina sharpness defaults
if (typeof window !== 'undefined') {
  ChartJS.defaults.devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2)
  ChartJS.defaults.font.family =
    "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', Roboto, sans-serif"
}

const MEKARA_BURGUNDY_PALETTE = [
  '#800020', // Primary Burgundy
  '#70193D', // Deep Wine
  '#0D7355', // Emerald
  '#C97A14', // Warm Amber
  '#9B284D', // Rose Wine
  '#8C5338', // Warm Brown
  '#596275', // Slate Warm
  '#D48842', // Copper Gold
  '#1B634B', // Pine Green
  '#5D2548', // Plum
  '#B86B77', // Muted Berry
  '#2C5D63', // Deep Teal
]

export interface ChartsProps {
  products: ProductStats[]
  channels: ChannelStats[]
  trends: TrendPoint[]
  hasDateData: boolean
  hasChannelData: boolean
}

/**
 * Primary Visualisation: "Jualan Mengikut Produk"
 * Horizontal Bar Chart for pristine mobile readability.
 * Solves the narrow-screen clipping issue for 16+ products.
 * Maintains container id="chart-product-bar" for PDF export compatibility.
 */
function formatChartLabel(label: string, maxLen: number = 14): string | string[] {
  if (!label || label.length <= maxLen) return label
  const words = label.split(' ')
  if (words.length <= 1) return label
  const lines: string[] = []
  let currentLine = words[0]
  for (let i = 1; i < words.length; i++) {
    if ((currentLine + ' ' + words[i]).length <= maxLen) {
      currentLine += ' ' + words[i]
    } else {
      lines.push(currentLine)
      currentLine = words[i]
    }
  }
  lines.push(currentLine)
  return lines
}

export function ProductBarChart({ products }: { products: ProductStats[] }) {
  const [showAll, setShowAll] = useState<boolean>(false)

  // Sort products by revenue descending
  const sorted = [...products].sort((a, b) => b.revenue - a.revenue)
  const isExpandable = sorted.length > 5
  const visibleProducts = isExpandable && !showAll ? sorted.slice(0, 5) : sorted

  const productLabels = visibleProducts.map((p) => p.produk)
  const productRevenues = visibleProducts.map((p) => p.revenue)

  const barChartData = {
    labels: productLabels,
    datasets: [
      {
        label: 'Jumlah Jualan (RM)',
        data: productRevenues,
        backgroundColor: '#800020',
        hoverBackgroundColor: '#70193D',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 16,
      },
    ],
  }

  const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const barOptions = {
    indexAxis: 'y' as const, // Horizontal layout for natural mobile label reading
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    animation: prefersReducedMotion ? (false as const) : { duration: 400 },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#171317',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        titleFont: {
          size: 12,
          weight: 'bold' as const,
          family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
        },
        bodyFont: {
          size: 12,
          weight: 'normal' as const,
          family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        },
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const raw = context.raw as number
            const prod = visibleProducts[context.dataIndex]
            const qtyStr = prod ? ` • ${prod.kuantiti.toLocaleString()} unit` : ''
            return `Jualan: ${formatRM(raw)}${qtyStr}`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `RM${Number(value).toLocaleString()}`,
          font: {
            size: 12,
            weight: 'normal' as const,
            family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
          },
          color: '#7A6E77',
          maxTicksLimit: 5,
        },
        grid: {
          color: '#EBE1D7',
          lineWidth: 1,
        },
        border: {
          dash: [4, 4],
        },
      },
      y: {
        ticks: {
          callback: (_value: string | number, index: number): string | string[] => {
            const rawLabel = visibleProducts[index]?.produk || ''
            return formatChartLabel(rawLabel, 14)
          },
          font: {
            size: 12,
            weight: 'bold' as const,
            family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
          },
          color: '#171317',
          padding: 6,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  // Dynamic height ensuring each horizontal bar has generous vertical breathing room
  const chartHeight = visibleProducts.length <= 5
    ? Math.max(220, visibleProducts.length * 44)
    : Math.max(260, visibleProducts.length * 36)

  return (
    <div
      id="chart-product-bar"
      className="bg-white border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 space-y-3 shadow-[0_8px_24px_rgba(34,18,24,0.06),0_2px_8px_rgba(34,18,24,0.035)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#171317] font-heading">
            Jualan Mengikut Produk
          </h3>
          <p className="text-xs sm:text-sm text-[#7A6E77] mt-0.5">
            {isExpandable && !showAll
              ? `Menunjukkan 5 produk terlaris daripada ${products.length} keseluruhan`
              : `Semua ${products.length} produk disusun mengikut hasil jualan tertinggi`}
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F8EAE8] text-[#800020] border border-[#EED7D5] shrink-0">
          RM
        </span>
      </div>

      <div
        className="relative w-full pt-1 transition-all duration-300"
        style={{ height: `${chartHeight}px` }}
      >
        <Bar data={barChartData} options={barOptions} />
      </div>

      {isExpandable && (
        <div className="pt-2 border-t border-[#EBE1D7] flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#800020] hover:text-[#70193D] bg-[#FAF7F2] hover:bg-[#F4ECE3] px-4 py-2 rounded-full border border-[#DFD3C7] transition-all cursor-pointer min-h-[38px] active:scale-[0.98]"
          >
            <span>
              {showAll
                ? 'Tunjukkan 5 Teratas Sahaja'
                : `Lihat Semua Produk (${products.length})`}
            </span>
            {showAll ? (
              <ChevronUpIcon className="w-3.5 h-3.5 text-[#800020]" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#800020]" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Advanced Visualisations:
 * - Product Contribution (Doughnut) [id="chart-product-doughnut"]
 * - Sales Trends over Time (Line)
 * - Sales Channels Comparison (Doughnut)
 */
export function AdvancedCharts({
  products,
  channels,
  trends,
  hasDateData,
  hasChannelData,
}: ChartsProps) {
  const productLabels = products.map((p) => p.produk)
  const productRevenues = products.map((p) => p.revenue)
  const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 1. Data for Doughnut Chart: Product contribution
  const doughnutChartData = {
    labels: productLabels,
    datasets: [
      {
        data: productRevenues,
        backgroundColor: MEKARA_BURGUNDY_PALETTE.slice(0, products.length),
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    animation: prefersReducedMotion ? (false as const) : { duration: 400 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#171317',
        },
      },
      tooltip: {
        backgroundColor: '#171317',
        padding: 10,
        cornerRadius: 10,
        titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" },
        bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const val = context.raw as number
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return ` ${context.label}: ${formatRM(val)} (${pct}%)`
          },
        },
      },
    },
    cutout: '68%',
  }

  // 2. Data for Line Chart: Trends over time
  const trendLabels = trends.map((t) => t.displayTarikh)
  const trendRevenues = trends.map((t) => t.revenue)

  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Jualan Harian (RM)',
        data: trendRevenues,
        borderColor: '#800020',
        backgroundColor: 'rgba(128, 0, 32, 0.08)',
        fill: true,
        tension: 0.28,
        pointBackgroundColor: '#800020',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    animation: prefersReducedMotion ? (false as const) : { duration: 400 },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#171317',
        padding: 10,
        cornerRadius: 10,
        titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" },
        bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const raw = context.raw as number
            return `Jualan: ${formatRM(raw)}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `RM${Number(value).toLocaleString()}`,
          font: { size: 10, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#7A6E77',
          maxTicksLimit: 5,
        },
        grid: {
          color: '#EBE1D7',
        },
      },
      x: {
        ticks: {
          font: { size: 10, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#7A6E77',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  // 3. Data for Channel Chart
  const channelLabels = channels.map((c) => c.saluran)
  const channelRevenues = channels.map((c) => c.revenue)

  const channelChartData = {
    labels: channelLabels,
    datasets: [
      {
        data: channelRevenues,
        backgroundColor: MEKARA_BURGUNDY_PALETTE.slice(0, channels.length),
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  }

  const channelOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    animation: prefersReducedMotion ? (false as const) : { duration: 400 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#171317',
        },
      },
      tooltip: {
        backgroundColor: '#171317',
        padding: 10,
        cornerRadius: 10,
        titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" },
        bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const val = context.raw as number
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return ` ${context.label}: ${formatRM(val)} (${pct}%)`
          },
        },
      },
    },
    cutout: '68%',
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Chart 2: Doughnut Chart (Product contribution) */}
      <div
        id="chart-product-doughnut"
        className="bg-white border border-[#EBE1D7] rounded-[20px] p-4 sm:p-5 space-y-2.5 shadow-[0_4px_16px_rgba(34,18,24,0.03)]"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-[#171317] flex items-center gap-2 font-heading">
            <div className="w-7 h-7 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
              <PieChartIcon className="w-3.5 h-3.5 text-[#800020]" />
            </div>
            <span>Sumbangan Produk kepada Jualan</span>
          </h4>
          <span className="text-[11px] text-[#7A6E77] font-medium">Peratus (%)</span>
        </div>
        <div className="relative h-60 w-full pt-1">
          <Doughnut data={doughnutChartData} options={doughnutOptions} />
        </div>
      </div>

      {/* Chart 3: Line Chart (Trends over time - only if dates exist) */}
      {hasDateData && trends.length > 0 && (
        <div className="bg-white border border-[#EBE1D7] rounded-[20px] p-4 sm:p-5 space-y-2.5 shadow-[0_4px_16px_rgba(34,18,24,0.03)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#171317] flex items-center gap-2 font-heading">
              <div className="w-7 h-7 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
                <TrendingUpIcon className="w-3.5 h-3.5 text-[#800020]" />
              </div>
              <span>Trend Jualan Harian</span>
            </h4>
            <span className="text-[11px] text-[#800020] font-semibold bg-[#F8EAE8] px-2 py-0.5 rounded-full border border-[#EED7D5]">
              {trends.length} rekod hari
            </span>
          </div>
          <div className="relative h-56 w-full pt-1">
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>
      )}

      {/* Chart 4: Channel Comparison (only if channels exist) */}
      {hasChannelData && channels.length > 0 && (
        <div className="bg-white border border-[#EBE1D7] rounded-[20px] p-4 sm:p-5 space-y-2.5 shadow-[0_4px_16px_rgba(34,18,24,0.03)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#171317] flex items-center gap-2 font-heading">
              <div className="w-7 h-7 rounded-xl bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0">
                <ShoppingBagIcon className="w-3.5 h-3.5 text-[#800020]" />
              </div>
              <span>Perbandingan Saluran Jualan</span>
            </h4>
            <span className="text-[11px] text-[#0D7355] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#C8E6C9]">
              {channels.length} saluran
            </span>
          </div>
          <div className="relative h-60 w-full pt-1">
            <Doughnut data={channelChartData} options={channelOptions} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Unified Charts Component (Kept for compatibility)
 */
export function Charts(props: ChartsProps) {
  return (
    <div className="space-y-4">
      <ProductBarChart products={props.products} />
      <AdvancedCharts {...props} />
    </div>
  )
}
