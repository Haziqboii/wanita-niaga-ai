import { jsPDF } from 'jspdf'
import type {
  SalesResult,
  ValidatedSale,
  MonthOption,
  MonthlyComparison,
} from '../types'
import { formatRM } from '../data/validate'
import { MEKARA_SYMBOL_BASE64 } from './pdfAssets'
import {
  renderPdfProductBarChart,
  renderPdfDailyTrendChart,
  renderPdfTop5DonutChart,
  renderPdfChannelChart,
} from './pdfChartRenderer'
import {
  generateDeterministicInsights,
  type InsightItem,
} from '../calc/insights'
import { calculateMonthlyComparison, extractAvailableMonths } from '../calc/monthly'

export interface PDFExportOptions {
  result: SalesResult
  operatingExpenses: number | null
  barChartCanvasId?: string
  doughnutChartCanvasId?: string
  periodLabel?: string
  monthlyComparison?: MonthlyComparison | null
  allRecords?: ValidatedSale[]
  allResult?: SalesResult
  insights?: InsightItem[]
  selectedMonth?: string
  availableMonths?: MonthOption[]
  isSampleData?: boolean
}

// Mekara Palette (RGB Tuples for jsPDF)
const C_BURGUNDY: [number, number, number] = [128, 0, 32] // #800020
const C_WARM_CANVAS: [number, number, number] = [250, 247, 242] // #FAF7F2
const C_CHAMPAGNE: [number, number, number] = [250, 244, 234] // #FAF4EA
const C_WHITE: [number, number, number] = [255, 255, 255] // #FFFFFF
const C_BORDER: [number, number, number] = [235, 225, 215] // #EBE1D7
const C_TEXT_DARK: [number, number, number] = [23, 19, 23] // #171317
const C_TEXT_MUTED: [number, number, number] = [107, 96, 105] // #6B6069
const C_EMERALD: [number, number, number] = [13, 115, 85] // #0D7355
const C_ROSE: [number, number, number] = [190, 18, 60] // #BE123C

/**
 * Generates and downloads a refined, multi-page, Apple-inspired, premium A4 business report
 * for Malaysian women microentrepreneurs, respecting Mekara's Burgundy & Cream identity.
 * Displays essential + high-value financial information only.
 */
export async function exportDashboardToPDF({
  result,
  operatingExpenses,
  periodLabel = 'Semua',
  monthlyComparison = null,
  allRecords = [],
  allResult,
  insights,
  selectedMonth = 'ALL',
  availableMonths = [],
  isSampleData = false,
}: PDFExportOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 12
    const contentWidth = pageWidth - margin * 2

    // Date formatting (Malay locale)
    const now = new Date()
    const dateFormatted = new Intl.DateTimeFormat('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now)

    // Compute or reuse Monthly Comparison for the selected period
    let comparison = monthlyComparison
    if (!comparison && allRecords && allRecords.length > 0) {
      const months =
        availableMonths && availableMonths.length > 0
          ? availableMonths
          : extractAvailableMonths(allRecords)
      comparison = calculateMonthlyComparison(allRecords, selectedMonth, months)
    }

    // EXACT Dashboard Penemuan Pintar insights
    const executiveInsights: InsightItem[] =
      insights && insights.length > 0
        ? insights
        : generateDeterministicInsights({
            currentResult: result,
            allResult,
            allRecords,
            selectedPeriod: selectedMonth,
            availableMonths,
            monthlyComparison: comparison,
          })

    // Helper: Draw Section Header with prominent typography
    const drawSectionHeader = (title: string, subtitle?: string, yPos?: number) => {
      const y = yPos !== undefined ? yPos : 32
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
      doc.text(title, margin, y)

      if (subtitle) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
        doc.text(subtitle, margin, y + 4.5)
        return y + 8.5
      }
      return y + 6
    }

    // Dynamic derivation of reporting period from actual trend dates
    const cleanPeriod =
      periodLabel && periodLabel !== 'ALL' && periodLabel !== 'Semua' ? periodLabel : 'Semua'
    let dynamicPeriod = ''
    if (result.trends && result.trends.length > 0) {
      const firstPt = result.trends[0]
      const lastPt = result.trends[result.trends.length - 1]
      const sDate = firstPt.displayTarikh || firstPt.tarikh
      const eDate = lastPt.displayTarikh || lastPt.tarikh
      dynamicPeriod = sDate === eDate ? sDate : `${sDate} – ${eDate}`
    } else {
      dynamicPeriod = periodLabel && periodLabel !== 'ALL' && periodLabel !== 'Semua' ? periodLabel : 'Semua Rekod'
    }

    const headerPeriodDisplay =
      selectedMonth && selectedMonth !== 'ALL' && selectedMonth !== 'Semua'
        ? `${periodLabel || selectedMonth} (${dynamicPeriod})`
        : dynamicPeriod

    // Helper: Draw Running Header on Subsequent Pages
    const drawRunningHeader = (pageTitle: string) => {
      try {
        doc.addImage(MEKARA_SYMBOL_BASE64, 'PNG', margin, 9, 6.5, 6.5)
      } catch {
        // Fallback
      }

      doc.setFont('times', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
      doc.text('Mekara', margin + 8.5, 14)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(`•  ${pageTitle}`, margin + 23, 14)

      doc.text(
        `Tempoh: ${headerPeriodDisplay}  |  ${result.recordCount} Rekod`,
        pageWidth - margin,
        14,
        { align: 'right' }
      )

      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.3)
      doc.line(margin, 17, pageWidth - margin, 17)
    }

    // =========================================================================
    // PAGE 1: RINGKASAN PERNIAGAAN
    // =========================================================================

    // 1.1 REPORT HERO HEADER
    try {
      doc.addImage(MEKARA_SYMBOL_BASE64, 'PNG', margin, 12, 11, 11)
    } catch {
      // Fallback
    }

    doc.setFont('times', 'bold')
    doc.setFontSize(23)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('Mekara', margin + 14, 19.5)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text('"Urus Jualan. Lebih Mudah."', margin + 14, 25)

    // Right-aligned Document Title & Metadata
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('LAPORAN PRESTASI JUALAN', pageWidth - margin, 15.5, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    doc.text('Ringkasan Prestasi Perniagaan Puan', pageWidth - margin, 19.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text(
      `Tempoh: ${headerPeriodDisplay}  |  ${result.recordCount} Rekod`,
      pageWidth - margin,
      23.5,
      { align: 'right' }
    )

    doc.setFontSize(7.5)
    doc.text(
      `Tarikh Dijana: ${dateFormatted}`,
      pageWidth - margin,
      27.5,
      { align: 'right' }
    )

    // Data Simulasi Indication (ONLY when isSampleData is explicitly true)
    if (isSampleData) {
      doc.setFillColor(254, 243, 199)
      doc.setDrawColor(251, 191, 36)
      doc.setLineWidth(0.2)
      doc.roundedRect(pageWidth - margin - 44, 29, 44, 4.5, 1, 1, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(180, 83, 9)
      doc.text('Data Contoh Simulasi', pageWidth - margin - 22, 32.2, { align: 'center' })
    }

    // Header Divider
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.4)
    doc.line(margin, 30.5, pageWidth - margin, 30.5)

    // 1.2 FINANCIAL KPI SUMMARY CARDS
    let secNum = 1
    let curY = 35.5
    curY = drawSectionHeader(`${secNum++}. Ringkasan Kewangan Utama`, 'Pencapaian jualan, keuntungan kasar, dan jumlah unit terjual.', curY)

    const hasOpex = operatingExpenses !== null && Number.isFinite(operatingExpenses)
    const cardGap = 3.5
    const numCards = hasOpex ? 4 : 3
    const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards
    const cardHeight = 28

    // Margin Pct String
    const marginPctStr =
      result.grossProfit !== null && result.totalRevenue > 0
        ? `${((result.grossProfit / result.totalRevenue) * 100).toFixed(1)}%`
        : null

    const kpiCards: Array<{
      label: string
      value: string
      sub: string
      badge?: string
      valueColor: [number, number, number]
    }> = [
      {
        label: 'JUMLAH JUALAN',
        value: formatRM(result.totalRevenue),
        sub: 'Hasil jualan kasar',
        valueColor: C_BURGUNDY,
      },
      {
        label: 'UNTUNG KASAR',
        value: result.grossProfit !== null ? formatRM(result.grossProfit) : 'Belum Lengkap',
        sub: 'Sebelum tolak kos operasi',
        badge: marginPctStr ? `Margin ${marginPctStr}` : undefined,
        valueColor: C_EMERALD,
      },
      {
        label: 'UNIT TERJUAL',
        value: `${result.totalKuantiti.toLocaleString()} unit`,
        sub: `Daripada ${result.products.length} produk`,
        valueColor: C_TEXT_DARK,
      },
    ]

    // Only add Net Profit card if Operating Expenses have actually been entered
    if (hasOpex) {
      const netProfitVal =
        result.estimatedNetProfit !== null
          ? result.estimatedNetProfit
          : (result.grossProfit ?? 0) - operatingExpenses!
      kpiCards.push({
        label: 'ANGGARAN UNTUNG BERSIH',
        value: formatRM(netProfitVal),
        sub: `Tolak kos operasi ${formatRM(operatingExpenses!)}`,
        valueColor: netProfitVal >= 0 ? C_EMERALD : C_ROSE,
      })
    }

    kpiCards.forEach((card, idx) => {
      const cx = margin + idx * (cardWidth + cardGap)

      // Card Background (White Floating Bento with subtle warm shadow border)
      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.35)
      doc.roundedRect(cx, curY, cardWidth, cardHeight, 2, 2, 'FD')

      // Card Label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(card.label, cx + 3, curY + 6)

      // Optional Margin Badge
      if (card.badge) {
        doc.setFillColor(232, 245, 233)
        doc.setDrawColor(200, 230, 201)
        doc.setLineWidth(0.2)
        doc.roundedRect(cx + cardWidth - 24, curY + 2.5, 21.5, 5, 1, 1, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2])
        doc.text(card.badge, cx + cardWidth - 13.2, curY + 6, { align: 'center' })
      }

      // Card Value (Prominent, High-Contrast)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(card.valueColor[0], card.valueColor[1], card.valueColor[2])
      doc.text(card.value, cx + 3, curY + 16)

      // Card Subtitle
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.8)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(card.sub, cx + 3, curY + 23)
    })

    curY += cardHeight + 3.5

    // Brief contextual note if operating expenses or cost data is incomplete
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    if (!hasOpex) {
      doc.text(
        '*Nota: Perbelanjaan operasi belum dimasukkan. Anggaran keuntungan di atas mewakili Untung Kasar (sebelum mengambil kira sewa, bil dan gaji).',
        margin,
        curY
      )
      curY += 5
    } else {
      doc.text(
        `*Nota: Anggaran Untung Bersih mengambil kira pemotongan perbelanjaan operasi ${formatRM(operatingExpenses!)}.`,
        margin,
        curY
      )
      curY += 5
    }

    if (!result.costComplete) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(C_ROSE[0], C_ROSE[1], C_ROSE[2])
      doc.text(
        '*Perhatian: Kos modal bagi sesetengah produk tidak lengkap dalam rekod; angka keuntungan adalah anggaran minimum berasaskan produk berkos.',
        margin,
        curY
      )
      curY += 5
    }

    curY += 2

    // 1.3 MONTHLY PERFORMANCE COMPARISON (IF AVAILABLE)
    if (comparison && comparison.trend !== 'none') {
      curY = drawSectionHeader(`${secNum++}. Perbandingan Jualan Bulanan`, 'Analisis perubahan hasil jualan dari bulan ke bulan.', curY)

      const compHeight = 25
      doc.setFillColor(C_CHAMPAGNE[0], C_CHAMPAGNE[1], C_CHAMPAGNE[2])
      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.35)
      doc.roundedRect(margin, curY, contentWidth, compHeight, 2, 2, 'FD')

      const isInc = comparison.trend === 'increase'
      const iconBg = isInc ? [232, 245, 233] : [255, 241, 242]
      const iconBorder = isInc ? [200, 230, 201] : [254, 205, 211]
      const iconColor = isInc ? C_EMERALD : C_ROSE

      doc.setFillColor(iconBg[0], iconBg[1], iconBg[2])
      doc.setDrawColor(iconBorder[0], iconBorder[1], iconBorder[2])
      doc.setLineWidth(0.2)
      doc.roundedRect(margin + 3.5, curY + 4.5, 10, 10, 1.5, 1.5, 'FD')

      // Vector trend triangle (avoids Helvetica unicode encoding glitches)
      doc.setFillColor(iconColor[0], iconColor[1], iconColor[2])
      if (isInc) {
        doc.triangle(
          margin + 8.5, curY + 7,
          margin + 5.8, curY + 11.7,
          margin + 11.2, curY + 11.7,
          'F'
        )
      } else {
        doc.triangle(
          margin + 5.8, curY + 7.7,
          margin + 11.2, curY + 7.7,
          margin + 8.5, curY + 12.3,
          'F'
        )
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      doc.text(comparison.summaryText, margin + 17, curY + 8)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      const detailStr = comparison.previousMonthLabel
        ? `Hasil ${comparison.currentMonthLabel}: ${formatRM(comparison.currentRevenue)} (${comparison.currentKuantiti.toLocaleString()} unit)  •  Hasil ${comparison.previousMonthLabel}: ${formatRM(comparison.previousRevenue || 0)} (${(comparison.previousKuantiti || 0).toLocaleString()} unit)`
        : `Hasil Jualan ${comparison.currentMonthLabel}: ${formatRM(comparison.currentRevenue)}`
      doc.text(detailStr, margin + 17, curY + 14)

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(
        '*Perhatian: Perubahan ini mengukur perbezaan hasil jualan yang direkodkan, bukan pertumbuhan keuntungan bersih.',
        margin + 17,
        curY + 20
      )

      curY += compHeight + 6
    }

    // 1.4 TWO DISTINCT PRODUCT CHAMPIONS
    curY = drawSectionHeader(`${secNum++}. Produk Terlaris & Jualan Tertinggi`, 'Pencapaian produk terbaik dari segi kuantiti dan jumlah hasil jualan.', curY)

    const champWidth = (contentWidth - 4) / 2
    const champHeight = 28

    // Best Seller (Quantity Champion)
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin, curY, champWidth, champHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2])
    doc.text('PRODUK PALING LARIS (UNIT TERBANYAK)', margin + 3.5, curY + 6.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    const bName = result.bestSeller ? result.bestSeller.produk : 'Tiada Data'
    doc.text(bName.length > 25 ? bName.substring(0, 24) + '...' : bName, margin + 3.5, curY + 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.2)
    doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2])
    const bQtyStr = result.bestSeller
      ? `${result.bestSeller.kuantiti.toLocaleString()} unit terjual (${formatRM(result.bestSeller.revenue)})`
      : '-'
    doc.text(bQtyStr, margin + 3.5, curY + 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text('Menjana volum pesanan dan permintaan pelanggan tertinggi.', margin + 3.5, curY + 25)

    // Highest Revenue Champion
    const rX = margin + champWidth + 4
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(rX, curY, champWidth, champHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('JUALAN TERTINGGI (NILAI TERBESAR)', rX + 3.5, curY + 6.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    const rName = result.highestRevenue ? result.highestRevenue.produk : 'Tiada Data'
    doc.text(rName.length > 25 ? rName.substring(0, 24) + '...' : rName, rX + 3.5, curY + 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.2)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    const rRevStr = result.highestRevenue
      ? `${formatRM(result.highestRevenue.revenue)} (${result.highestRevenue.kuantiti.toLocaleString()} unit)`
      : '-'
    doc.text(rRevStr, rX + 3.5, curY + 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text('Penyumbang nilai hasil jualan terbesar kepada perniagaan.', rX + 3.5, curY + 25)

    curY += champHeight + 6

    // 1.5 INFO JUALAN (EXACT DASHBOARD CONTENT)
    curY = drawSectionHeader(`${secNum++}. Info Jualan`, 'Peluang dan tips daripada rekod jualan Puan.', curY)

    const insightsToShow = executiveInsights.slice(0, 3)
    if (insightsToShow.length > 0) {
      insightsToShow.forEach((item, idx) => {
        const cleanTitle = item.title.replace(/\b[Aa]kak\b/g, 'Puan').replace(/\b[Kk]ak\b/g, 'Puan')
        const cleanText = item.text
          .replace(/\*\*/g, '')
          .replace(/\b[Aa]kak\b/g, 'Puan')
          .replace(/\b[Kk]ak\b/g, 'Puan')
        const cleanAction = (item as any).action
          ? String((item as any).action).replace(/\b[Aa]kak\b/g, 'Puan').replace(/\b[Kk]ak\b/g, 'Puan')
          : null

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        const textLines = doc.splitTextToSize(cleanText, contentWidth - 17)

        let actionLines: string[] = []
        if (cleanAction) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          actionLines = doc.splitTextToSize(`Cadangan: ${cleanAction}`, contentWidth - 17)
        }

        const calculatedHeight = Math.max(
          20,
          10 + textLines.length * 4.2 + (actionLines.length > 0 ? actionLines.length * 3.8 + 2 : 0)
        )

        doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
        doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
        doc.setLineWidth(0.35)
        doc.roundedRect(margin, curY, contentWidth, calculatedHeight, 2, 2, 'FD')

        // Numbered indicator badge (1, 2, 3) in Champagne pill
        doc.setFillColor(C_CHAMPAGNE[0], C_CHAMPAGNE[1], C_CHAMPAGNE[2])
        doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
        doc.setLineWidth(0.2)
        doc.roundedRect(margin + 3, curY + 3.5, 7.5, 7.5, 1.2, 1.2, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
        doc.text(String(idx + 1), margin + 6.75, curY + 8.5, { align: 'center' })

        // Title
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
        doc.text(cleanTitle, margin + 14, curY + 8)

        // Text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
        let textY = curY + 13
        doc.text(textLines, margin + 14, textY)
        textY += textLines.length * 4.2

        // Action
        if (actionLines.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
          doc.text(actionLines, margin + 14, textY + 1)
        }

        curY += calculatedHeight + 3.5
      })
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text('Tiada info khusus bagi tempoh jualan ini.', margin, curY + 5)
      curY += 8
    }

    // =========================================================================
    // PAGE 2: ANALISIS JUALAN & TREND PASARAN
    // =========================================================================
    doc.addPage()
    drawRunningHeader('Analisis Jualan & Prestasi Pasaran')

    curY = 23

    // 2.1 PRIMARY PRODUCT SALES BAR GRAPH
    curY = drawSectionHeader(
      '1. Jualan Ikut Produk (Hasil Jualan Kasar)',
      `Perbandingan hasil jualan mengikut produk teratas. Senarai penuh ${result.products.length} produk terperinci pada Muka Surat 3.`,
      curY
    )

    // Render Crisp 300DPI Horizontal Bar Chart inside White Bento Card
    const barCardHeight = 58
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin, curY, contentWidth, barCardHeight, 2.5, 2.5, 'FD')

    const barChartImg = renderPdfProductBarChart(result.products, 600, 180)
    if (barChartImg) {
      // 600:180 = 3.333 ratio. Image width: contentWidth - 6 = 180mm -> height = 54mm
      doc.addImage(barChartImg, 'PNG', margin + 3, curY + 2, contentWidth - 6, 54)
    }
    curY += barCardHeight + 5

    // 2.2 DAILY SALES TREND
    const dailyPoints = result.trends || []
    curY = drawSectionHeader(
      '2. Trend Jualan Harian (Prestasi Harian)',
      `Pantauan corak jualan harian (${dailyPoints.length} rekod hari direkodkan).`,
      curY
    )

    // Render Daily Sales Trend Line Graph inside White Bento Card
    const trendCardHeight = 58
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin, curY, contentWidth, trendCardHeight, 2.5, 2.5, 'FD')

    const trendChartImg = renderPdfDailyTrendChart(dailyPoints, 600, 160)
    if (trendChartImg) {
      // 600:160 = 3.75 ratio. Image width: contentWidth - 6 = 180mm -> height = 48mm
      doc.addImage(trendChartImg, 'PNG', margin + 3, curY + 2, contentWidth - 6, 48)

      // Observation Note inside the card at bottom
      if (dailyPoints.length > 0) {
        const peakDay = [...dailyPoints].sort((a, b) => b.revenue - a.revenue)[0]
        if (peakDay) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(7.8)
          doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
          const peakDate = (peakDay as any).displayTarikh || (peakDay as any).tarikh || (peakDay as any).date || ''
          doc.text(
            `*Pemerhatian Harian: Hari jualan tertinggi dicatatkan pada ${peakDate} dengan hasil ${formatRM(peakDay.revenue)} (${peakDay.kuantiti.toLocaleString()} unit).`,
            margin + 4.5,
            curY + 53.5
          )
        }
      }
    }
    curY += trendCardHeight + 5

    // 2.3 SALES CHANNELS & PRODUCT CONTRIBUTION (SIDE BY SIDE BENTO CARDS)
    curY = drawSectionHeader(
      '3. Saluran Jualan & Sumbangan Produk',
      'Pecahan saluran pemasaran dan sumbangan hasil mengikut kategori produk utama.',
      curY
    )

    const halfWidth = (contentWidth - 4) / 2 // 91mm
    const donutCardHeight = 72

    // Left Bento Card: Channels
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin, curY, halfWidth, donutCardHeight, 2.5, 2.5, 'FD')

    // Mini Card Header - Channels
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('Jualan Ikut Saluran', margin + 4, curY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text('Pecahan hasil jualan mengikut medium transaksi', margin + 4, curY + 10)

    // Right Bento Card: Top 5 Products
    doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin + halfWidth + 4, curY, halfWidth, donutCardHeight, 2.5, 2.5, 'FD')

    // Mini Card Header - Top 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('Sumbangan Produk (Top 5)', margin + halfWidth + 8, curY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
    doc.text('Peratus sumbangan produk kepada jumlah jualan', margin + halfWidth + 8, curY + 10)

    // Render Donut Charts (Aspect ratio 480:280 = 1.714 : 1)
    // Image dimensions: 84mm width x 49mm height (84 / 49 = 1.714 exact, zero distortion!)
    const chartW = 84
    const chartH = 49
    const channelImg = renderPdfChannelChart(result.channels || [], result.totalRevenue, 480, 280)
    if (channelImg) {
      doc.addImage(channelImg, 'PNG', margin + (halfWidth - chartW) / 2, curY + 14, chartW, chartH)
    }

    const top5Img = renderPdfTop5DonutChart(result.products, result.totalRevenue, 480, 280)
    if (top5Img) {
      doc.addImage(top5Img, 'PNG', margin + halfWidth + 4 + (halfWidth - chartW) / 2, curY + 14, chartW, chartH)
    }

    curY += donutCardHeight + 6

    // =========================================================================
    // PAGE 3: BUTIRAN JUALAN & UNTUNG PRODUK LENGKAP SETIAP PRODUK
    // =========================================================================
    doc.addPage()
    drawRunningHeader('Butiran Jualan & Untung Produk')

    curY = 23

    // 3.1 COMPLETE PRODUCT FINANCIAL BREAKDOWN TABLE
    curY = drawSectionHeader(
      '1. Jadual Penuh Prestasi Jualan & Keuntungan Produk',
      `Menyenaraikan semua ${result.products.length} produk yang direkodkan dalam tempoh ini.`,
      curY
    )

    // Table Column Definitions (Total: 186mm = contentWidth)
    const tableCols = [
      { name: '#', width: 8, align: 'center' },
      { name: 'Nama Produk', width: 48, align: 'left' },
      { name: 'Kuantiti', width: 22, align: 'right' },
      { name: 'Hasil Jualan', width: 28, align: 'right' },
      { name: 'Kos Modal', width: 26, align: 'right' },
      { name: 'Untung Kasar', width: 28, align: 'right' },
      { name: 'Margin (%)', width: 26, align: 'right' },
    ]

    const rowHeight = 7.0

    // Helper: Draw Table Header
    const drawTableHeader = (y: number) => {
      doc.setFillColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
      doc.rect(margin, y, contentWidth, rowHeight + 0.6, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])

      let colX = margin
      tableCols.forEach((col) => {
        if (col.align === 'center') {
          doc.text(col.name, colX + col.width / 2, y + 5.2, { align: 'center' })
        } else if (col.align === 'right') {
          doc.text(col.name, colX + col.width - 2.5, y + 5.2, { align: 'right' })
        } else {
          doc.text(col.name, colX + 2.5, y + 5.2)
        }
        colX += col.width
      })
      return y + rowHeight + 0.6
    }

    curY = drawTableHeader(curY)

    // Render Table Rows (Sorted by Revenue Descending)
    result.products.forEach((p, idx) => {
      // Dynamic Pagination if table overflows
      if (curY + rowHeight > pageHeight - 22) {
        doc.addPage()
        drawRunningHeader('Butiran Jualan & Untung Produk (Sambungan)')
        curY = 24
        curY = drawTableHeader(curY)
      }

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(C_WARM_CANVAS[0], C_WARM_CANVAS[1], C_WARM_CANVAS[2])
        doc.rect(margin, curY, contentWidth, rowHeight, 'F')
      }

      doc.setFontSize(9)
      let colX = margin

      // 1. Index
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(String(idx + 1), colX + tableCols[0].width / 2, curY + 5.0, { align: 'center' })
      colX += tableCols[0].width

      // 2. Product Name
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      const pName = p.produk.length > 24 ? p.produk.substring(0, 23) + '..' : p.produk
      doc.text(pName, colX + 2.5, curY + 5.0)
      colX += tableCols[1].width

      // 3. Kuantiti
      doc.setFont('helvetica', 'normal')
      doc.text(`${p.kuantiti.toLocaleString()} unit`, colX + tableCols[2].width - 2.5, curY + 5.0, {
        align: 'right',
      })
      colX += tableCols[2].width

      // 4. Hasil Jualan
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
      doc.text(formatRM(p.revenue), colX + tableCols[3].width - 2.5, curY + 5.0, { align: 'right' })
      colX += tableCols[3].width

      // 5. Kos Modal
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      const costStr = p.cost !== null ? formatRM(p.cost) : '-'
      doc.text(costStr, colX + tableCols[4].width - 2.5, curY + 5.0, { align: 'right' })
      colX += tableCols[4].width

      // 6. Untung Kasar
      if (p.grossProfit !== null) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(
          p.grossProfit >= 0 ? C_EMERALD[0] : C_ROSE[0],
          p.grossProfit >= 0 ? C_EMERALD[1] : C_ROSE[1],
          p.grossProfit >= 0 ? C_EMERALD[2] : C_ROSE[2]
        )
        doc.text(formatRM(p.grossProfit), colX + tableCols[5].width - 2.5, curY + 5.0, {
          align: 'right',
        })
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      } else {
        doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
        doc.text('-', colX + tableCols[5].width - 2.5, curY + 5.0, { align: 'right' })
        doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      }
      colX += tableCols[5].width

      // 7. Margin (%)
      const mStr =
        typeof p.profitMarginPercent === 'number' ? `${p.profitMarginPercent.toFixed(1)}%` : '-'
      doc.text(mStr, colX + tableCols[6].width - 2.5, curY + 5.0, { align: 'right' })

      // Row separator
      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.15)
      doc.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight)

      curY += rowHeight
    })

    // TOTAL SUMMARY ROW
    if (curY + rowHeight > pageHeight - 20) {
      doc.addPage()
      drawRunningHeader('Butiran Jualan & Untung Produk (Sambungan)')
      curY = 24
    }

    doc.setFillColor(C_CHAMPAGNE[0], C_CHAMPAGNE[1], C_CHAMPAGNE[2])
    doc.rect(margin, curY, contentWidth, rowHeight + 0.6, 'F')

    doc.setDrawColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.setLineWidth(0.4)
    doc.line(margin, curY, margin + contentWidth, curY)
    doc.line(margin, curY + rowHeight + 0.6, margin + contentWidth, curY + rowHeight + 0.6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.2)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])

    let colX = margin
    colX += tableCols[0].width
    doc.text('JUMLAH KESELURUHAN', colX + 2.5, curY + 5.4)
    colX += tableCols[1].width

    doc.text(`${result.totalKuantiti.toLocaleString()} unit`, colX + tableCols[2].width - 2.5, curY + 5.4, {
      align: 'right',
    })
    colX += tableCols[2].width

    doc.text(formatRM(result.totalRevenue), colX + tableCols[3].width - 2.5, curY + 5.4, {
      align: 'right',
    })
    colX += tableCols[3].width

    const totalCostStr = result.totalCost !== null ? formatRM(result.totalCost) : '-'
    doc.text(totalCostStr, colX + tableCols[4].width - 2.5, curY + 5.4, { align: 'right' })
    colX += tableCols[4].width

    const totalGrossProfitStr =
      result.grossProfit !== null ? formatRM(result.grossProfit) : 'Tidak Lengkap'
    doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2])
    doc.text(totalGrossProfitStr, colX + tableCols[5].width - 2.5, curY + 5.4, { align: 'right' })
    colX += tableCols[5].width

    const overallMargin =
      result.grossProfit !== null && result.totalRevenue > 0
        ? `${((result.grossProfit / result.totalRevenue) * 100).toFixed(1)}%`
        : '-'
    doc.text(overallMargin, colX + tableCols[6].width - 2.5, curY + 5.4, { align: 'right' })

    curY += rowHeight + 7

    // 3.2 PRODUCT PROFITABILITY HIGHLIGHTS (DYNAMICALLY DERIVED - 2x2 GRID)
    if (curY + 44 > pageHeight - 20) {
      doc.addPage()
      drawRunningHeader('Analisis & Glosari Kewangan')
      curY = 24
    }

    curY = drawSectionHeader(
      '2. Rumusan Keuntungan Produk & Pilihan Terbaik',
      'Perbandingan produk mengikut potensi margin dan nilai jualan.',
      curY
    )

    // Dynamic derivation of 4 key product benchmarks
    // 1. Highest Margin (%): max(profitMarginPercent)
    const highestMarginProd = [...result.products]
      .filter(
        (p) => typeof p.profitMarginPercent === 'number' && Number.isFinite(p.profitMarginPercent)
      )
      .sort((a, b) => (b.profitMarginPercent ?? 0) - (a.profitMarginPercent ?? 0))[0]

    // 2. Highest Gross Profit per Unit (RM / unit): max(grossProfit / kuantiti)
    const highestUnitProfitProd = [...result.products]
      .filter((p) => typeof p.grossProfit === 'number' && p.kuantiti > 0)
      .map((p) => ({
        ...p,
        unitGrossProfit: (p.grossProfit ?? 0) / p.kuantiti,
      }))
      .sort((a, b) => b.unitGrossProfit - a.unitGrossProfit)[0]

    // 3. Highest Total Gross Profit (RM): max(grossProfit)
    const highestTotalProfitProd = [...result.products]
      .filter((p) => typeof p.grossProfit === 'number')
      .sort((a, b) => (b.grossProfit ?? 0) - (a.grossProfit ?? 0))[0]

    // 4. Highest Sales Revenue (RM): max(revenue)
    const highestRevenueProd =
      result.highestRevenue || [...result.products].sort((a, b) => b.revenue - a.revenue)[0]

    const profGridCols = 2
    const profCardWidth = (contentWidth - 4) / profGridCols
    const profCardHeight = 20

    const profCards = [
      {
        badge: 'MARGIN TERTINGGI (%)',
        badgeColor: C_EMERALD,
        name: highestMarginProd ? highestMarginProd.produk : 'Tiada Data',
        val: highestMarginProd
          ? `${highestMarginProd.profitMarginPercent?.toFixed(1)}% margin`
          : '-',
        sub: highestMarginProd
          ? `Untung Kasar ${formatRM(highestMarginProd.grossProfit ?? 0)} (${highestMarginProd.kuantiti.toLocaleString()} unit)`
          : 'Tiada data kos',
      },
      {
        badge: 'UNTUNG KASAR SEUNIT TERTINGGI',
        badgeColor: C_BURGUNDY,
        name: highestUnitProfitProd ? highestUnitProfitProd.produk : 'Tiada Data',
        val: highestUnitProfitProd
          ? `${formatRM(highestUnitProfitProd.unitGrossProfit)} / unit`
          : '-',
        sub: highestUnitProfitProd
          ? `Baki untung seunit terjual (${highestUnitProfitProd.kuantiti.toLocaleString()} unit)`
          : 'Tiada data kos',
      },
      {
        badge: 'UNTUNG KASAR TERTINGGI',
        badgeColor: C_EMERALD,
        name: highestTotalProfitProd ? highestTotalProfitProd.produk : 'Tiada Data',
        val: highestTotalProfitProd ? formatRM(highestTotalProfitProd.grossProfit ?? 0) : '-',
        sub: highestTotalProfitProd
          ? `Sumbangan jumlah untung kasar terbesar (${highestTotalProfitProd.profitMarginPercent?.toFixed(1)}% margin)`
          : 'Tiada data kos',
      },
      {
        badge: 'HASIL JUALAN TERTINGGI',
        badgeColor: C_BURGUNDY,
        name: highestRevenueProd ? highestRevenueProd.produk : 'Tiada Data',
        val: highestRevenueProd ? formatRM(highestRevenueProd.revenue) : '-',
        sub: highestRevenueProd
          ? `Jumlah hasil jualan terbesar (${highestRevenueProd.kuantiti.toLocaleString()} unit)`
          : '-',
      },
    ]

    profCards.forEach((card, idx) => {
      const colIdx = idx % profGridCols
      const rowIdx = Math.floor(idx / profGridCols)
      const cx = margin + colIdx * (profCardWidth + 4)
      const cy = curY + rowIdx * (profCardHeight + 3.5)

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.35)
      doc.roundedRect(cx, cy, profCardWidth, profCardHeight, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(card.badgeColor[0], card.badgeColor[1], card.badgeColor[2])
      doc.text(card.badge, cx + 3.5, cy + 5.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
      const cName = card.name.length > 25 ? card.name.substring(0, 24) + '...' : card.name
      doc.text(cName, cx + 3.5, cy + 12)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(card.badgeColor[0], card.badgeColor[1], card.badgeColor[2])
      doc.text(card.val, cx + profCardWidth - 3.5, cy + 12, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.8)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(card.sub, cx + 3.5, cy + 17)
    })

    curY += 2 * (profCardHeight + 3.5) + 3

    // 3.3 SHORT FINANCIAL GLOSSARY
    if (curY + 28 > pageHeight - 20) {
      doc.addPage()
      drawRunningHeader('Glosari Istilah Kewangan')
      curY = 24
    }

    curY = drawSectionHeader(
      '3. Panduan & Glosari Istilah Kewangan',
      'Rujukan istilah rasmi bagi pemerkasaan celik kewangan Program SULAM.',
      curY
    )

    const glossBoxHeight = 26
    doc.setFillColor(C_CHAMPAGNE[0], C_CHAMPAGNE[1], C_CHAMPAGNE[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margin, curY, contentWidth, glossBoxHeight, 2, 2, 'FD')

    const gColWidth = (contentWidth - 6) / 3

    // 1. Jumlah Jualan (Revenue)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.8)
    doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
    doc.text('Jumlah Jualan (Revenue)', margin + 3.5, curY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    const rDesc =
      'Jumlah nilai jualan kasar daripada semua transaksi produk yang direkodkan sebelum sebarang potongan kos.'
    doc.text(doc.splitTextToSize(rDesc, gColWidth - 5), margin + 3.5, curY + 11)

    // 2. Untung Kasar (Gross Profit)
    const g2X = margin + gColWidth + 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.8)
    doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2])
    doc.text('Untung Kasar (Gross Profit)', g2X, curY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    const gpDesc =
      'Hasil jualan ditolak kos modal bahan produk langsung. Menunjukkan baki jualan sebelum tolak belanja operasi.'
    doc.text(doc.splitTextToSize(gpDesc, gColWidth - 5), g2X, curY + 11)

    // 3. Untung Bersih (Net Profit)
    const g3X = margin + gColWidth * 2 + 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.8)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    doc.text('Untung Bersih (Net Profit)', g3X, curY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(C_TEXT_DARK[0], C_TEXT_DARK[1], C_TEXT_DARK[2])
    const npDesc =
      'Untung kasar ditolak perbelanjaan operasi (sewa, utiliti, gaji). Peringatan: Untung bersih bukan tunai di tangan jika ada transaksi belum dikutip.'
    doc.text(doc.splitTextToSize(npDesc, gColWidth - 5), g3X, curY + 11)

    // =========================================================================
    // RUNNING FOOTERS ON ALL PAGES
    // =========================================================================
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
      doc.setLineWidth(0.3)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(
        'Mekara • Program Khidmat Komuniti SULAM Universiti • "Urus Jualan. Lebih Mudah."',
        margin,
        pageHeight - 8.5
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(C_BURGUNDY[0], C_BURGUNDY[1], C_BURGUNDY[2])
      doc.text(
        `Muka Surat ${i} daripada ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8.5,
        { align: 'right' }
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2])
      doc.text(
        'Laporan ini dijana secara automatik daripada rekod jualan tempatan peranti untuk kegunaan pengurusan perniagaan.',
        margin,
        pageHeight - 4.8
      )
    }

    // Save and Trigger Browser Download
    const fileName = `Mekara_Laporan_Jualan_${cleanPeriod.replace(/\s+/g, '_')}.pdf`
    doc.save(fileName)

    return true
  } catch (err) {
    console.error('[PDF Export Error]', err)
    return false
  }
}
