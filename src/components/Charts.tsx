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

const BERRY_POP_PALETTE = [
  '#7C3AED', // Electric Violet
  '#BE1E72', // Raspberry Pink
  '#0D9488', // Teal
  '#FACC60', // Butter Yellow
  '#F472B6', // Bubblegum Pink
  '#3B82F6', // Sky Blue
  '#10B981', // Emerald
  '#6366F1', // Indigo
]

export interface ChartsProps {
  products: ProductStats[]
  channels: ChannelStats[]
  trends: TrendPoint[]
  hasDateData: boolean
  hasChannelData: boolean
}

/**
 * Primary Visualisation: "Jualan Mengikut Produk" Bar Chart
 * Razor-sharp 2x Retina rendering matching Reference Mockup 1
 */
export function ProductBarChart({ products }: { products: ProductStats[] }) {
  const productLabels = products.map((p) => p.produk)
  const productRevenues = products.map((p) => p.revenue)

  const barChartData = {
    labels: productLabels,
    datasets: [
      {
        label: 'Jumlah Jualan (RM)',
        data: productRevenues,
        backgroundColor: '#7C3AED',
        hoverBackgroundColor: '#6D28D9',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#28152F',
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
          font: {
            size: 11,
            weight: 'normal' as const,
            family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
          },
          color: '#68586B',
          maxTicksLimit: 6,
          padding: 6,
        },
        grid: {
          color: '#F1D3E3',
          lineWidth: 1,
        },
        border: {
          dash: [4, 4],
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 'bold' as const,
            family: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
          },
          color: '#28152F',
          padding: 6,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div
      id="chart-product-bar"
      className="bg-white rounded-3xl border border-[#F1D3E3] p-4 sm:p-5 shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading">
          Jualan Mengikut Produk
        </h3>
        <span className="text-xs text-[#68586B] font-bold">RM</span>
      </div>
      <div className="relative h-64 sm:h-72 w-full pt-1">
        <Bar data={barChartData} options={barOptions} />
      </div>
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

  // 1. Data for Doughnut Chart: Product contribution
  const doughnutChartData = {
    labels: productLabels,
    datasets: [
      {
        data: productRevenues,
        backgroundColor: BERRY_POP_PALETTE.slice(0, products.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#28152F',
        },
      },
      tooltip: {
        backgroundColor: '#28152F',
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
    cutout: '62%',
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
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.25,
        pointBackgroundColor: '#BE1E72',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#28152F',
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
          color: '#68586B',
          maxTicksLimit: 5,
        },
        grid: {
          color: '#F1D3E3',
        },
      },
      x: {
        ticks: {
          font: { size: 10, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#68586B',
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
        backgroundColor: [
          '#0D9488',
          '#7C3AED',
          '#EC4899',
          '#F59E0B',
          '#3B82F6',
          '#10B981',
          '#8B5CF6',
          '#F43F5E',
        ].slice(0, channels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const channelOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
          color: '#28152F',
        },
      },
      tooltip: {
        backgroundColor: '#28152F',
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
    cutout: '58%',
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Chart 2: Doughnut Chart (Product contribution) */}
      <div
        id="chart-product-doughnut"
        className="bg-white rounded-2xl border border-[#F1D3E3] p-4 shadow-2xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-[#28152F] flex items-center gap-1.5">
            <span>🥧</span>
            <span>Sumbangan Produk kepada Jualan</span>
          </h4>
          <span className="text-[11px] text-[#68586B] font-medium">Peratus (%)</span>
        </div>
        <div className="relative h-60 w-full pt-1">
          <Doughnut data={doughnutChartData} options={doughnutOptions} />
        </div>
      </div>

      {/* Chart 3: Line Chart (Trends over time - only if dates exist) */}
      {hasDateData && trends.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#F1D3E3] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#28152F] flex items-center gap-1.5">
              <span>📈</span>
              <span>Trend Jualan Mengikut Tarikh</span>
            </h4>
            <span className="text-[11px] text-[#7C3AED] font-semibold">
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
        <div className="bg-white rounded-2xl border border-[#F1D3E3] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#28152F] flex items-center gap-1.5">
              <span>🛒</span>
              <span>Perbandingan Saluran Jualan</span>
            </h4>
            <span className="text-[11px] text-[#0D9488] font-semibold">
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
