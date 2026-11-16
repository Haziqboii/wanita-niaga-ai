/**
 * MEKARA — High-Resolution Canvas Chart Renderer for PDF Export
 * Renders dedicated, crisp 300DPI charts matching Mekara's Burgundy & Cream design system.
 */

import type { ProductStats, ChannelStats, TrendPoint } from '../types'
import { formatRM } from '../data/validate'

const BURGUNDY = '#800020'
const WARM_BORDER = '#EBE1D7'
const DARK_TEXT = '#171317'
const SECONDARY_TEXT = '#6B6069'

const MEKARA_PALETTE = [
  '#800020', // Burgundy
  '#0D7355', // Emerald
  '#C97A14', // Warm Amber
  '#70193D', // Deep Wine
  '#9B284D', // Rose Wine
  '#8C5338', // Warm Brown
  '#596275', // Slate Warm
  '#D48842', // Copper Gold
]

function getCanvas(
  width: number,
  height: number,
  dpr = 2
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.scale(dpr, dpr)
    return { canvas, ctx }
  } catch {
    return null
  }
}

/**
 * 1. Product Sales Horizontal Bar Chart
 * Horizontal Burgundy bars with rounded caps, clear product names, RM values & dashed gridlines.
 */
export function renderPdfProductBarChart(
  products: ProductStats[],
  width = 600,
  height = 180,
  maxProducts = 10
): string | null {
  const setup = getCanvas(width, height)
  if (!setup) return null
  const { canvas, ctx } = setup

  const sorted = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, maxProducts)
  if (sorted.length === 0) return null

  const maxRevenue = Math.max(...sorted.map((p) => p.revenue), 1)

  // Chart padding
  const paddingLeft = 135
  const paddingRight = 95
  const paddingTop = 12
  const paddingBottom = 26
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Vertical gridlines & x-axis labels
  const gridSteps = 4
  ctx.font = '9.5px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = SECONDARY_TEXT
  ctx.strokeStyle = WARM_BORDER
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])

  for (let i = 0; i <= gridSteps; i++) {
    const val = (maxRevenue / gridSteps) * i
    const x = paddingLeft + (chartWidth / gridSteps) * i
    ctx.beginPath()
    ctx.moveTo(x, paddingTop)
    ctx.lineTo(x, height - paddingBottom)
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.fillText(`RM${Math.round(val).toLocaleString()}`, x, height - paddingBottom + 16)
  }
  ctx.setLineDash([])

  // Draw Horizontal Bars
  const barCount = sorted.length
  const rowHeight = chartHeight / barCount
  const barHeight = Math.min(13, rowHeight * 0.62)

  sorted.forEach((p, idx) => {
    const y = paddingTop + idx * rowHeight + (rowHeight - barHeight) / 2
    const barWidth = Math.max(4, (p.revenue / maxRevenue) * chartWidth)

    // Product Name Label
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = DARK_TEXT
    ctx.textAlign = 'right'
    const name = p.produk.length > 22 ? p.produk.substring(0, 20) + '..' : p.produk
    ctx.fillText(name, paddingLeft - 8, y + barHeight / 2 + 3.5)

    // Rounded Burgundy Bar
    ctx.fillStyle = BURGUNDY
    ctx.beginPath()
    const radius = Math.min(barHeight / 2, 3.5)
    ctx.roundRect(paddingLeft, y, barWidth, barHeight, [0, radius, radius, 0])
    ctx.fill()

    // Value Label at end of bar
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = BURGUNDY
    ctx.textAlign = 'left'
    ctx.fillText(formatRM(p.revenue), paddingLeft + barWidth + 6, y + barHeight / 2 + 3.5)
  })

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * 2. Daily Sales Trend Line Graph
 * Smooth burgundy line with soft area fill, data points, and non-colliding date labels.
 */
export function renderPdfDailyTrendChart(
  trends: TrendPoint[],
  width = 600,
  height = 160
): string | null {
  const setup = getCanvas(width, height)
  if (!setup) return null
  const { canvas, ctx } = setup

  if (!trends || trends.length === 0) return null

  const maxRevenue = Math.max(...trends.map((t) => t.revenue), 1)

  const paddingLeft = 65
  const paddingRight = 30
  const paddingTop = 15
  const paddingBottom = 28
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Horizontal Gridlines
  const gridSteps = 4
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillStyle = SECONDARY_TEXT
  ctx.strokeStyle = WARM_BORDER
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])

  for (let i = 0; i <= gridSteps; i++) {
    const val = (maxRevenue / gridSteps) * i
    const y = height - paddingBottom - (chartHeight / gridSteps) * i
    ctx.beginPath()
    ctx.moveTo(paddingLeft, y)
    ctx.lineTo(width - paddingRight, y)
    ctx.stroke()

    ctx.textAlign = 'right'
    ctx.fillText(`RM${Math.round(val).toLocaleString()}`, paddingLeft - 8, y + 3)
  }
  ctx.setLineDash([])

  // Calculate coordinates for points
  const points: { x: number; y: number; rawDate: string; rev: number }[] = []
  const stepX = trends.length > 1 ? chartWidth / (trends.length - 1) : chartWidth / 2

  trends.forEach((t, i) => {
    const x = paddingLeft + i * stepX
    const y = height - paddingBottom - (t.revenue / maxRevenue) * chartHeight
    points.push({
      x,
      y,
      rawDate: t.displayTarikh || t.tarikh || '',
      rev: t.revenue,
    })
  })

  // Area Fill under line
  if (points.length > 0) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, height - paddingBottom)
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y))
    ctx.lineTo(points[points.length - 1].x, height - paddingBottom)
    ctx.closePath()
    ctx.fillStyle = 'rgba(128, 0, 32, 0.08)'
    ctx.fill()

    // Line Path
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = BURGUNDY
    ctx.lineWidth = 2.4
    ctx.stroke()

    // Data Points
    const peakIndex = points.reduce(
      (maxIdx, pt, curIdx) => (pt.rev > points[maxIdx].rev ? curIdx : maxIdx),
      0
    )

    points.forEach((pt, idx) => {
      ctx.beginPath()
      const isPeak = idx === peakIndex
      const dotRadius = isPeak ? 4.5 : 3
      ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = BURGUNDY
      ctx.fill()
      ctx.lineWidth = isPeak ? 2 : 1.5
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()
    })

/**
 * Helper to select sensible, non-colliding X-axis date ticks.
 * - Single month (e.g. 30/31 points): 5 evenly spaced ticks (0%, 25%, 50%, 75%, 100%).
 * - Two months (e.g. Sep + Oct, ~60 points): ~7 ticks with clear month transition (1 Sep, 11 Sep, 21 Sep, 1 Okt, 11 Okt, 21 Okt, 31 Okt).
 * - Multi-month / long periods: 6-8 evenly spaced ticks aligned to month boundaries.
 */
function selectSensibleDateTicks(
  points: { x: number; y: number; rawDate: string; rev: number }[]
): number[] {
  const total = points.length
  if (total <= 6) {
    return points.map((_, i) => i)
  }

  // Detect month transitions
  const monthBoundaries: number[] = [0]
  for (let i = 1; i < total; i++) {
    const prev = points[i - 1].rawDate
    const curr = points[i].rawDate
    // Match month name e.g. "Sep" vs "Okt"
    const prevM = prev.match(/[A-Za-z]{3,}/i)?.[0]?.toLowerCase() || ''
    const currM = curr.match(/[A-Za-z]{3,}/i)?.[0]?.toLowerCase() || ''
    if (prevM && currM && prevM !== currM) {
      monthBoundaries.push(i)
    }
  }

  // Two months detected (e.g. Sep + Oct)
  if (monthBoundaries.length === 2) {
    const bIdx = monthBoundaries[1] // Start of month 2 (e.g. 1 Okt)
    const m1Mid1 = Math.round(bIdx * 0.33) // ~11 Sep
    const m1Mid2 = Math.round(bIdx * 0.67) // ~21 Sep
    const m2Remaining = total - 1 - bIdx
    const m2Mid1 = bIdx + Math.round(m2Remaining * 0.33) // ~11 Okt
    const m2Mid2 = bIdx + Math.round(m2Remaining * 0.67) // ~21 Okt

    const candidate = [0, m1Mid1, m1Mid2, bIdx, m2Mid1, m2Mid2, total - 1]
    return Array.from(new Set(candidate)).sort((a, b) => a - b)
  }

  // Single month (<= 35 days)
  if (monthBoundaries.length <= 1) {
    const candidate = [
      0,
      Math.round((total - 1) * 0.25),
      Math.round((total - 1) * 0.5),
      Math.round((total - 1) * 0.75),
      total - 1,
    ]
    return Array.from(new Set(candidate)).sort((a, b) => a - b)
  }

  // 3+ months: 6-8 evenly spaced ticks
  const count = 7
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round(((total - 1) / (count - 1)) * i))
  }
  return Array.from(new Set(ticks)).sort((a, b) => a - b)
}

    const tickIndices = selectSensibleDateTicks(points)
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = SECONDARY_TEXT

    tickIndices.forEach((idx, tOrder) => {
      const pt = points[idx]
      // Format as compact date (strip redundant year e.g. "1 Okt 2026" -> "1 Okt")
      const compactDate = pt.rawDate.replace(/\s+\d{4}$/, '')
      if (tOrder === 0) {
        ctx.textAlign = 'left'
      } else if (tOrder === tickIndices.length - 1) {
        ctx.textAlign = 'right'
      } else {
        ctx.textAlign = 'center'
      }
      ctx.fillText(compactDate, pt.x, height - paddingBottom + 16)
    })
  }

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * 3. Product Contribution Donut Chart (Top 5 + Lain-lain)
 * Eliminates crowded 16-item legend for pristine A4 readability.
 * True circle (1:1 aspect ratio), wide right legend with zero text clipping.
 */
export function renderPdfTop5DonutChart(
  products: ProductStats[],
  totalRevenue: number,
  width = 480,
  height = 280
): string | null {
  const setup = getCanvas(width, height)
  if (!setup) return null
  const { canvas, ctx } = setup

  const effectiveTotal =
    totalRevenue > 0
      ? totalRevenue
      : products.reduce((sum, p) => sum + p.revenue, 0)
  if (!products || products.length === 0 || effectiveTotal <= 0) return null

  const sorted = [...products].sort((a, b) => b.revenue - a.revenue)
  const top5 = sorted.slice(0, 5)
  const remainder = sorted.slice(5)

  interface Slice {
    label: string
    revenue: number
    percentage: number
    color: string
  }

  const slices: Slice[] = top5.map((p, idx) => ({
    label: p.produk,
    revenue: p.revenue,
    percentage: (p.revenue / effectiveTotal) * 100,
    color: MEKARA_PALETTE[idx % MEKARA_PALETTE.length],
  }))

  if (remainder.length > 0) {
    const remainderRev = remainder.reduce((sum, p) => sum + p.revenue, 0)
    slices.push({
      label: `Lain-lain (${remainder.length})`,
      revenue: remainderRev,
      percentage: (remainderRev / effectiveTotal) * 100,
      color: '#8C828A',
    })
  }

  // Draw True Circular Donut (Centered on left)
  const centerX = 95
  const centerY = 140
  const outerRadius = 78
  const innerRadius = 48

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  let startAngle = -Math.PI / 2
  slices.forEach((slice) => {
    const sliceAngle = (slice.revenue / effectiveTotal) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = slice.color
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    startAngle = endAngle
  })

  // Center text inside donut
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = DARK_TEXT
  ctx.fillText('TOP 5', centerX, centerY - 2)
  ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillStyle = SECONDARY_TEXT
  ctx.fillText('PRODUK', centerX, centerY + 11)

  // Legend on right (285px of available width guarantees ZERO text clipping)
  const legendX = 195
  const itemRowHeight = slices.length > 5 ? 38 : 42
  const totalLegendHeight = slices.length * itemRowHeight
  const legendStartY = Math.max(12, (height - totalLegendHeight) / 2)

  slices.forEach((slice, idx) => {
    const y = legendStartY + idx * itemRowHeight

    // Color dot
    ctx.fillStyle = slice.color
    ctx.beginPath()
    ctx.arc(legendX + 6, y + 8, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.stroke()

    // Product name
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = DARK_TEXT
    ctx.textAlign = 'left'
    const name = slice.label.length > 22 ? slice.label.substring(0, 20) + '..' : slice.label
    ctx.fillText(name, legendX + 18, y + 7)

    // Revenue and %
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = BURGUNDY
    const rmStr = formatRM(slice.revenue)
    const rmWidth = ctx.measureText(rmStr).width
    ctx.fillText(rmStr, legendX + 18, y + 21)

    ctx.font = 'normal 9.5px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = SECONDARY_TEXT
    ctx.fillText(` (${slice.percentage.toFixed(1)}%)`, legendX + 18 + rmWidth + 3, y + 21)
  })

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * 4. Sales Channel Donut Chart
 * Clean visual comparison of sales channels (Gerai, WhatsApp, Booth, etc.).
 * True circle (1:1 aspect ratio), wide right legend with zero text clipping.
 */
export function renderPdfChannelChart(
  channels: ChannelStats[],
  totalRevenue: number,
  width = 480,
  height = 280
): string | null {
  const setup = getCanvas(width, height)
  if (!setup) return null
  const { canvas, ctx } = setup

  const effectiveTotal =
    totalRevenue > 0
      ? totalRevenue
      : channels.reduce((sum, c) => sum + c.revenue, 0)
  if (!channels || channels.length === 0 || effectiveTotal <= 0) return null

  // Ensure channels are sorted descending by revenue
  const sortedChannels = [...channels].sort((a, b) => b.revenue - a.revenue)

  const centerX = 95
  const centerY = 140
  const outerRadius = 78
  const innerRadius = 48

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  let startAngle = -Math.PI / 2
  sortedChannels.forEach((c, idx) => {
    const sliceAngle = (c.revenue / effectiveTotal) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = MEKARA_PALETTE[idx % MEKARA_PALETTE.length]
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    startAngle = endAngle
  })

  // Center text inside donut
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = DARK_TEXT
  ctx.fillText('SALURAN', centerX, centerY - 2)
  ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
  ctx.fillStyle = SECONDARY_TEXT
  ctx.fillText('JUALAN', centerX, centerY + 11)

  // Legend on right (285px of available width guarantees ZERO text clipping)
  const legendX = 195
  const itemRowHeight = sortedChannels.length > 5 ? Math.min(42, Math.floor((height - 24) / sortedChannels.length)) : 44
  const totalLegendHeight = sortedChannels.length * itemRowHeight
  const legendStartY = Math.max(12, (height - totalLegendHeight) / 2)

  sortedChannels.forEach((c, idx) => {
    const y = legendStartY + idx * itemRowHeight
    const color = MEKARA_PALETTE[idx % MEKARA_PALETTE.length]

    // Color dot
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(legendX + 6, y + 8, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.stroke()

    // Channel name
    ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = DARK_TEXT
    ctx.textAlign = 'left'
    const name = c.saluran || 'Tidak dinyatakan'
    ctx.fillText(name, legendX + 18, y + 7)

    // Revenue and %
    ctx.font = 'bold 10.5px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = BURGUNDY
    const rmStr = formatRM(c.revenue)
    const rmWidth = ctx.measureText(rmStr).width
    ctx.fillText(rmStr, legendX + 18, y + 21)

    ctx.font = 'normal 10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    ctx.fillStyle = SECONDARY_TEXT
    const pct =
      typeof c.percentage === 'number' && !isNaN(c.percentage)
        ? c.percentage
        : effectiveTotal > 0
        ? (c.revenue / effectiveTotal) * 100
        : 0
    ctx.fillText(` (${pct.toFixed(1)}%)`, legendX + 18 + rmWidth + 3, y + 21)
  })

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
