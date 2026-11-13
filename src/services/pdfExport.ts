import { jsPDF } from 'jspdf'
import type { SalesResult } from '../types'
import { formatRM } from '../data/validate'

export interface PDFExportOptions {
  result: SalesResult
  operatingExpenses: number | null
  barChartCanvasId?: string
  doughnutChartCanvasId?: string
}

/**
 * Generates and downloads a clean, professional, mobile-friendly A4 PDF report
 * containing verified business metrics, charts, and product sales breakdown.
 */
export async function exportDashboardToPDF({
  result,
  operatingExpenses,
  barChartCanvasId = 'chart-product-bar',
  doughnutChartCanvasId = 'chart-product-doughnut',
}: PDFExportOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 14
    const contentWidth = pageWidth - margin * 2 // 182mm

    const now = new Date()
    const dateFormatted = new Intl.DateTimeFormat('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now)

    // ==========================================
    // 1. HEADER BANNER
    // ==========================================
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(91, 33, 182) // Soft deep purple
    doc.text('Wanita Niaga AI', margin, 18)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(107, 114, 128)
    doc.text('"Kenali Jualan, Rancang Keuntungan"', margin, 23)

    // Right-aligned report title and date
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.text('LAPORAN PRESTASI JUALAN', pageWidth - margin, 17, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(`Tarikh: ${dateFormatted}`, pageWidth - margin, 22, { align: 'right' })

    // Header divider line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.4)
    doc.line(margin, 26, pageWidth - margin, 26)

    // ==========================================
    // 2. 4 BUSINESS SUMMARY CARDS (4 Columns)
    // ==========================================
    const cardY = 30
    const cardHeight = 22
    const gap = 3
    const cardWidth = (contentWidth - gap * 3) / 4

    // Profit Card Logic
    let profitLabel = 'UNTUNG KASAR'
    let profitValue = 'Kos Diperlukan'
    let profitSub = 'Kos seunit belum lengkap'

    if (result.costComplete && result.grossProfit !== null) {
      if (operatingExpenses !== null && result.estimatedNetProfit !== null) {
        profitLabel = 'UNTUNG BERSIH'
        profitValue = formatRM(result.estimatedNetProfit)
        profitSub = `Tolak Kos Operasi ${formatRM(operatingExpenses)}`
      } else {
        profitLabel = 'UNTUNG KASAR'
        profitValue = formatRM(result.grossProfit)
        profitSub = 'Belum tolak kos operasi'
      }
    }

    const cardsData = [
      {
        label: 'JUMLAH JUALAN',
        value: formatRM(result.totalRevenue),
        sub: 'Hasil keseluruhan',
        bg: [245, 243, 255] as [number, number, number],
        border: [221, 214, 254] as [number, number, number],
        titleColor: [109, 40, 217] as [number, number, number],
      },
      {
        label: 'PRODUK TERJUAL',
        value: `${result.totalKuantiti.toLocaleString()} unit`,
        sub: `Daripada ${result.products.length} produk`,
        bg: [240, 253, 250] as [number, number, number],
        border: [204, 251, 241] as [number, number, number],
        titleColor: [13, 148, 136] as [number, number, number],
      },
      {
        label: 'PALING LARIS',
        value: result.bestSeller ? result.bestSeller.produk : '-',
        sub: result.bestSeller ? `${result.bestSeller.kuantiti} unit terjual` : 'Tiada data',
        bg: [255, 251, 235] as [number, number, number],
        border: [254, 243, 199] as [number, number, number],
        titleColor: [180, 83, 9] as [number, number, number],
      },
      {
        label: profitLabel,
        value: profitValue,
        sub: profitSub,
        bg: [236, 253, 245] as [number, number, number],
        border: [209, 250, 229] as [number, number, number],
        titleColor: [4, 120, 87] as [number, number, number],
      },
    ]

    cardsData.forEach((c, idx) => {
      const x = margin + idx * (cardWidth + gap)

      // Card Background & Border
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2])
      doc.setDrawColor(c.border[0], c.border[1], c.border[2])
      doc.setLineWidth(0.3)
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.8, 1.8, 'FD')

      // Label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(c.titleColor[0], c.titleColor[1], c.titleColor[2])
      doc.text(c.label, x + 2.5, cardY + 5)

      // Value
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(17, 24, 39)
      // Truncate if too long
      const displayVal = c.value.length > 15 ? c.value.substring(0, 14) + '...' : c.value
      doc.text(displayVal, x + 2.5, cardY + 12)

      // Sub
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(107, 114, 128)
      doc.text(c.sub, x + 2.5, cardY + 18)
    })

    // ==========================================
    // 3. OPERATING EXPENSES STATUS CALLOUT
    // ==========================================
    const calloutY = 56
    doc.setLineWidth(0.2)
    if (operatingExpenses !== null && Number.isFinite(operatingExpenses)) {
      doc.setFillColor(245, 243, 255)
      doc.setDrawColor(221, 214, 254)
      doc.roundedRect(margin, calloutY, contentWidth, 8, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(91, 33, 182)
      doc.text(
        `• Perbelanjaan Operasi Disahkan: ${formatRM(operatingExpenses)} (Sewa tapak, bil utiliti, pengangkutan) telah ditolak untuk mengira Untung Bersih.`,
        margin + 3,
        calloutY + 5.2
      )
    } else {
      doc.setFillColor(249, 250, 251)
      doc.setDrawColor(229, 231, 235)
      doc.roundedRect(margin, calloutY, contentWidth, 8, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(75, 85, 99)
      doc.text(
        '• Perbelanjaan operasi tidak dimasukkan: Angka keuntungan di atas mewakili Untung Kasar (Hasil Jualan - Kos Modal Produk).',
        margin + 3,
        calloutY + 5.2
      )
    }

    // ==========================================
    // 4. CHARTS SECTION
    // ==========================================
    let currentY = 68
    const barEl = typeof document !== 'undefined' ? document.getElementById(barChartCanvasId) : null
    const doughnutEl = typeof document !== 'undefined' ? document.getElementById(doughnutChartCanvasId) : null

    const barCanvas = barEl?.querySelector('canvas') as HTMLCanvasElement | null
    const doughnutCanvas = doughnutEl?.querySelector('canvas') as HTMLCanvasElement | null

    if (barCanvas || doughnutCanvas) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(31, 41, 55)
      doc.text('Visual Prestasi Jualan', margin, currentY)
      currentY += 3.5

      const chartY = currentY
      const chartHeight = 44

      if (barCanvas && doughnutCanvas) {
        // Both charts side-by-side
        const barWidth = 104
        const doughnutWidth = 72
        const chartGap = 6

        try {
          const barImg = barCanvas.toDataURL('image/png')
          doc.addImage(barImg, 'PNG', margin, chartY, barWidth, chartHeight)
        } catch {
          // Ignore canvas read error if tainted
        }

        try {
          const doughnutImg = doughnutCanvas.toDataURL('image/png')
          doc.addImage(
            doughnutImg,
            'PNG',
            margin + barWidth + chartGap,
            chartY,
            doughnutWidth,
            chartHeight
          )
        } catch {
          // Ignore
        }

        currentY += chartHeight + 6
      } else if (barCanvas) {
        // Bar canvas only
        try {
          const barImg = barCanvas.toDataURL('image/png')
          doc.addImage(barImg, 'PNG', margin, chartY, 130, chartHeight)
          currentY += chartHeight + 6
        } catch {
          currentY += 4
        }
      }
    }

    // ==========================================
    // 5. PRODUCT BREAKDOWN TABLE
    // ==========================================
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(31, 41, 55)
    doc.text('Pecahan Jualan Mengikut Produk', margin, currentY)
    currentY += 4

    // Table Column Layout (Total: 182mm)
    const cols = [
      { header: '#', width: 8, align: 'center' as const },
      { header: 'Nama Produk', width: 56, align: 'left' as const },
      { header: 'Kuantiti', width: 26, align: 'right' as const },
      { header: 'Jualan (RM)', width: 32, align: 'right' as const },
      { header: 'Untung Kasar (RM)', width: 34, align: 'right' as const },
      { header: 'Margin (%)', width: 26, align: 'right' as const },
    ]

    // Render Table Header
    const renderTableHeader = (y: number) => {
      doc.setFillColor(243, 244, 246)
      doc.rect(margin, y, contentWidth, 6.5, 'F')
      doc.setDrawColor(209, 213, 219)
      doc.setLineWidth(0.2)
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(55, 65, 81)

      let colX = margin
      cols.forEach((col) => {
        const textX =
          col.align === 'right'
            ? colX + col.width - 2
            : col.align === 'center'
            ? colX + col.width / 2
            : colX + 2
        doc.text(col.header, textX, y + 4.5, { align: col.align })
        colX += col.width
      })
    }

    renderTableHeader(currentY)
    currentY += 6.5

    // Render Product Rows
    const rowHeight = 6.2
    result.products.forEach((p, idx) => {
      // Check page overflow
      if (currentY + rowHeight > pageHeight - 16) {
        doc.addPage()
        currentY = margin
        renderTableHeader(currentY)
        currentY += 6.5
      }

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(31, 41, 55)

      let colX = margin

      // 1. Index
      doc.text(String(idx + 1), colX + cols[0].width / 2, currentY + 4.2, { align: 'center' })
      colX += cols[0].width

      // 2. Product Name (Truncated if too long)
      const pName = p.produk.length > 32 ? p.produk.substring(0, 30) + '...' : p.produk
      doc.text(pName, colX + 2, currentY + 4.2)
      colX += cols[1].width

      // 3. Quantity
      doc.text(`${p.kuantiti.toLocaleString()} unit`, colX + cols[2].width - 2, currentY + 4.2, {
        align: 'right',
      })
      colX += cols[2].width

      // 4. Revenue
      doc.text(formatRM(p.revenue), colX + cols[3].width - 2, currentY + 4.2, { align: 'right' })
      colX += cols[3].width

      // 5. Gross Profit
      const profitStr = p.grossProfit !== null ? formatRM(p.grossProfit) : 'Tiada kos'
      doc.text(profitStr, colX + cols[4].width - 2, currentY + 4.2, { align: 'right' })
      colX += cols[4].width

      // 6. Margin
      const marginStr = p.profitMarginPercent !== null ? `${p.profitMarginPercent.toFixed(1)}%` : '-'
      doc.text(marginStr, colX + cols[5].width - 2, currentY + 4.2, { align: 'right' })

      // Bottom row divider
      doc.setDrawColor(243, 244, 246)
      doc.setLineWidth(0.15)
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight)

      currentY += rowHeight
    })

    // Total Summary Row
    if (currentY + rowHeight > pageHeight - 16) {
      doc.addPage()
      currentY = margin
    }

    doc.setFillColor(245, 243, 255)
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F')
    doc.setDrawColor(221, 214, 254)
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(91, 33, 182)

    let colX = margin
    colX += cols[0].width
    doc.text('JUMLAH KESELURUHAN', colX + 2, currentY + 4.3)
    colX += cols[1].width

    doc.text(`${result.totalKuantiti.toLocaleString()} unit`, colX + cols[2].width - 2, currentY + 4.3, {
      align: 'right',
    })
    colX += cols[2].width

    doc.text(formatRM(result.totalRevenue), colX + cols[3].width - 2, currentY + 4.3, {
      align: 'right',
    })
    colX += cols[3].width

    const totalGrossProfitStr =
      result.grossProfit !== null ? formatRM(result.grossProfit) : 'Tidak lengkap'
    doc.text(totalGrossProfitStr, colX + cols[4].width - 2, currentY + 4.3, { align: 'right' })
    colX += cols[4].width

    const overallMargin =
      result.grossProfit !== null && result.totalRevenue > 0
        ? `${((result.grossProfit / result.totalRevenue) * 100).toFixed(1)}%`
        : '-'
    doc.text(overallMargin, colX + cols[5].width - 2, currentY + 4.3, { align: 'right' })

    // ==========================================
    // 6. FOOTER ON ALL PAGES
    // ==========================================
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.3)
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(156, 163, 175)
      doc.text(
        'Laporan rasmi dijana oleh Wanita Niaga AI • Program SULAM "Wanita with AI"',
        margin,
        pageHeight - 7
      )
      doc.text(`Muka Surat ${i} daripada ${totalPages}`, pageWidth - margin, pageHeight - 7, {
        align: 'right',
      })
    }

    // Save PDF file
    const dateSlug = now.toISOString().split('T')[0]
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      doc.save(`Laporan_Jualan_WanitaNiagaAI_${dateSlug}.pdf`)
    } else {
      doc.output('arraybuffer')
    }
    return true
  } catch (err) {
    console.error('[PDF Export Error]', err)
    return false
  }
}
