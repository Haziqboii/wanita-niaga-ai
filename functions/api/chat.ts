// Cloudflare Pages Function: POST /api/chat

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    return new Response(
      JSON.stringify({
        success: false,
        status: 503,
        error:
          'Kunci API Gemini belum dikonfigurasi di pelayan Cloudflare. Sila tetapkan pembolehubah GEMINI_API_KEY di papan pemuka Cloudflare Pages.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: any = {}
  try {
    body = await context.request.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, status: 400, error: 'Format permintaan JSON tidak sah.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const userMessage = (body.message || '').trim()
  if (!userMessage) {
    return new Response(
      JSON.stringify({ success: false, status: 400, error: 'Sila masukkan soalan anda.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // System instruction with grounded business context
  let ctxSummary = 'Tiada data jualan aktif dimuat naik buat masa ini.'

  if (body.context && body.context.recordCount > 0) {
    const c = body.context
    const lines: string[] = []
    if (c.isFilteredPeriod && c.selectedPeriod) {
      lines.push(`TEMPOH LAPORAN DIPILIH: ${c.selectedPeriod} (Pengguna sedang meneliti data khusus bagi bulan ${c.selectedPeriod})`)
      if (c.allTimeRevenue !== null && c.allTimeRevenue !== undefined) {
        lines.push(`Jumlah Jualan Keseluruhan (Semua Bulan): RM${Number(c.allTimeRevenue).toFixed(2)}`)
      }
      if (c.monthlyComparison?.summaryText) {
        lines.push(`Perbandingan Prestasi Bulanan: ${c.monthlyComparison.summaryText}`)
      }
    }
    const periodTag = c.selectedPeriod ? ` (${c.selectedPeriod})` : ''
    lines.push(`Jumlah Jualan${periodTag}: RM${c.totalRevenue?.toFixed(2) || '0.00'}, Kuantiti Terjual: ${c.totalKuantiti || 0} unit, Transaksi: ${c.recordCount} rekod, Jenis Produk: ${c.products?.length || 0}`)

    if (c.hasCostData && c.costComplete && c.grossProfit !== null && c.grossProfit !== undefined) {
      lines.push(`Untung Kasar Keseluruhan: RM${c.grossProfit.toFixed(2)}`)
      if (c.operatingExpenses !== null && c.operatingExpenses !== undefined && c.estimatedNetProfit !== null && c.estimatedNetProfit !== undefined) {
        lines.push(`Perbelanjaan Operasi (Opex): RM${c.operatingExpenses.toFixed(2)}, Anggaran Untung Bersih: RM${c.estimatedNetProfit.toFixed(2)}`)
      }
    } else {
      lines.push('Maklumat Kos: Tidak lengkap atau tidak disediakan untuk semua produk.')
    }

    if (c.products && Array.isArray(c.products) && c.products.length > 0) {
      lines.push('\nSENARAI PRODUK DISAHKAN:')
      c.products.forEach((p: any) => {
        const unitPrice = p.avgPrice ?? (p.kuantiti > 0 ? p.revenue / p.kuantiti : null)
        const unitCost = p.avgCost ?? (p.cost !== null && p.cost !== undefined && p.kuantiti > 0 ? p.cost / p.kuantiti : null)
        const priceStr = unitPrice !== null ? ` (RM${unitPrice.toFixed(2)} seunit)` : ''
        const costStr =
          p.cost !== null && p.cost !== undefined && unitCost !== null
            ? `, Kos: RM${p.cost.toFixed(2)} (RM${unitCost.toFixed(2)} seunit), Untung Kasar: RM${(p.grossProfit ?? 0).toFixed(2)}${p.profitMarginPercent !== null && p.profitMarginPercent !== undefined ? ` (Margin ${p.profitMarginPercent.toFixed(1)}%)` : ''}`
            : ', Kos: Tidak direkodkan'
        lines.push(`- ${p.produk}: ${p.kuantiti} unit, Jualan: RM${p.revenue?.toFixed(2) || '0.00'}${priceStr}${costStr}`)
      })
    }

    if (c.channels && Array.isArray(c.channels) && c.channels.length > 0) {
      lines.push('\nSALURAN JUALAN:')
      c.channels.forEach((chan: any) => {
        lines.push(`- ${chan.saluran}: ${chan.kuantiti} unit, RM${chan.revenue?.toFixed(2) || '0.00'} (${chan.percentage?.toFixed(0) || 0}%)`)
      })
    }

    if (c.categories && Array.isArray(c.categories) && c.categories.length > 0) {
      lines.push('\nKATEGORI PRODUK:')
      c.categories.forEach((cat: any) => {
        lines.push(`- ${cat.kategori}: ${cat.kuantiti} unit, RM${cat.revenue?.toFixed(2) || '0.00'} (${cat.percentage?.toFixed(0) || 0}%)`)
      })
    }

    if (c.paymentMethods && Array.isArray(c.paymentMethods) && c.paymentMethods.length > 0) {
      lines.push('\nKAEDAH BAYARAN:')
      c.paymentMethods.forEach((pm: any) => {
        lines.push(`- ${pm.kaedah}: ${pm.transaksi} transaksi, RM${pm.revenue?.toFixed(2) || '0.00'} (${pm.percentage?.toFixed(0) || 0}%)`)
      })
    }

    if (c.multiMonthBreakdown && Array.isArray(c.multiMonthBreakdown) && c.multiMonthBreakdown.length > 0) {
      lines.push('\nPECAHAN PRESTASI MENGIKUT BULAN (SEMUA BULAN DALAM DATASET):')
      c.multiMonthBreakdown.forEach((m: any) => {
        const profitStr = m.grossProfit !== null && m.grossProfit !== undefined ? `, Untung Kasar: RM${Number(m.grossProfit).toFixed(2)}` : ''
        const bestQtyStr = m.bestSellerQty ? `, Terlaris (Kuantiti): ${m.bestSellerQty.produk} (${m.bestSellerQty.kuantiti} unit)` : ''
        const bestRevStr = m.bestSellerRev ? `, Hasil Tertinggi: ${m.bestSellerRev.produk} (RM${Number(m.bestSellerRev.revenue).toFixed(2)})` : ''
        lines.push(`- ${m.fullName} (${m.key}): RM${Number(m.revenue).toFixed(2)}, ${m.kuantiti} unit, ${m.recordCount} rekod${profitStr}${bestQtyStr}${bestRevStr}`)
      })
    }

    if (c.weekdayAnalytics && c.weekdayAnalytics.days && Array.isArray(c.weekdayAnalytics.days) && c.weekdayAnalytics.days.length > 0) {
      const w = c.weekdayAnalytics
      lines.push('\nANALISIS HARI & HUJUNG MINGGU (WEEKDAY INTELLIGENCE):')
      if (w.highestRevenueDay) {
        lines.push(`- Hari Hasil Tertinggi: ${w.highestRevenueDay.nameMY} (Jumlah RM${Number(w.highestRevenueDay.revenue).toFixed(2)}, Purata RM${Number(w.highestRevenueDay.avgRevenuePerDate).toFixed(2)}/hari daripada ${w.highestRevenueDay.distinctDatesCount} tarikh)`)
      }
      if (w.highestAvgDay && w.highestAvgDay.nameMY !== w.highestRevenueDay?.nameMY) {
        lines.push(`- Hari Purata Jualan Tertinggi: ${w.highestAvgDay.nameMY} (Purata RM${Number(w.highestAvgDay.avgRevenuePerDate).toFixed(2)}/hari)`)
      }
      if (w.weekendRevenue !== undefined && w.weekdayRevenue !== undefined) {
        lines.push(`- Hujung Minggu vs Hari Bekerja: Hujung Minggu RM${Number(w.weekendRevenue).toFixed(2)} (Purata RM${Number(w.avgWeekendDailyRevenue ?? 0).toFixed(2)}/hari) vs Hari Bekerja RM${Number(w.weekdayRevenue).toFixed(2)} (Purata RM${Number(w.avgWeekdayDailyRevenue ?? 0).toFixed(2)}/hari). ${w.isWeekendMoreProfitable ? 'Hujung minggu mencatatkan purata jualan harian lebih tinggi.' : 'Hari bekerja mencatatkan purata jualan harian lebih tinggi atau setara.'}`)
      }
      lines.push('- Pecahan Setiap Hari: ' + w.days.map((d: any) => `${d.nameMY}: RM${Number(d.revenue).toFixed(2)} (purata RM${Number(d.avgRevenuePerDate).toFixed(2)}/hari)`).join(', '))
    }

    if (c.dailyAnalytics && c.dailyAnalytics.totalRecordedDates) {
      const d = c.dailyAnalytics
      lines.push('\nANALISIS TARIKH & TREND HARIAN:')
      lines.push(`- Jumlah Hari Direkodkan: ${d.totalRecordedDates} hari unik`)
      if (d.dateRange?.start && d.dateRange?.end) {
        lines.push(`- Julat Tarikh: ${d.dateRange.start} hingga ${d.dateRange.end}`)
      }
      if (d.highestRevenueDate) {
        lines.push(`- Tarikh Jualan Tertinggi: ${d.highestRevenueDate.displayTarikh} (${d.highestRevenueDate.tarikh}) dengan jualan RM${Number(d.highestRevenueDate.revenue).toFixed(2)} (${d.highestRevenueDate.kuantiti} unit)`)
      }
      if (d.lowestRevenueDate) {
        lines.push(`- Tarikh Jualan Terendah: ${d.lowestRevenueDate.displayTarikh} (${d.lowestRevenueDate.tarikh}) dengan jualan RM${Number(d.lowestRevenueDate.revenue).toFixed(2)} (${d.lowestRevenueDate.kuantiti} unit)`)
      }
      if (d.avgDailyRevenue) {
        lines.push(`- Purata Jualan Sehari: RM${Number(d.avgDailyRevenue).toFixed(2)}`)
      }
    }

    ctxSummary = lines.join('\n')
  }

  const systemInstruction = `Anda adalah Pembantu AI Wanita Niaga, pembantu perniagaan mesra, bijak, dan berfakta untuk usahawan wanita Malaysia dalam program SULAM 'Wanita with AI'.

DATA PERNIAGAAN DISAHKAN (SUMBER REKOD JUALAN SEMASA):
======================================================
${ctxSummary}
======================================================

PANDUAN & PERATURAN JAWAPAN (SANGAT PENTING):

1. PENJELASAN PENGIRAAN KEWANGAN:
   - Apabila pengguna bertanya bagaimana sesuatu angka dikira (cth: "Macam mana kamu kira untung kasar [produk]?"):
     Jelaskan langkah demi langkah menggunakan formula:
     * Untung Kasar = Hasil Jualan − Jumlah Kos Produk
     * Tunjukkan kiraan: Jualan (Kuantiti × Harga seunit) ditolak Kos Produk (Kuantiti × Kos seunit).
   - Bezakan dengan jelas antara Untung Kasar (sebelum tolak opex) dan Untung Bersih (selepas tolak opex).
   - Jangan sekali-kali menggantikan angka yang telah dikira dengan andaian sendiri.

2. PENERANGAN ASAL USUL DATA & SUMBER KIRAAN (DATA PROVENANCE):
   - Apabila ditanya "Data apa yang kamu gunakan?", "Dari mana data ini?", atau "Sumber kiraan dari mana?":
     * Semak sejarah mesej sebelumnya (history): Jika perbualan sebelumnya membincangkan sesuatu produk atau kiraan (contohnya Brownies):
       JELASKAN SUMBER DATA SPESIFIK PRODUK TERSEBUT SECARA NYATA daripada rekod yang disahkan di atas:
       - Nama produk yang dirujuk (cth: Brownies)
       - Kuantiti terjual yang direkodkan (cth: 616 unit)
       - Harga jualan seunit (cth: RM8.00)
       - Kos seunit (cth: RM3.85) dan jumlah kos produk (cth: RM2,371.60)
       - Jumlah hasil jualan yang terhasil (cth: RM4,928.00)
       - Untung kasar yang dikira (cth: RM2,556.40)
     * Nyatakan bahawa data ini diperoleh terus daripada rekod jualan aktif semasa yang dimasukkan/dimuat naik ke dalam sistem Wanita Niaga AI. Jangan mereka-reka sumber luar atau mendedahkan data sulit pelanggan.

3. SENARIO ANDAIAN / HYPOTHETICAL (PERUBAHAN HARGA):
   - Apabila pengguna bertanya senario andaian "Kalau..." (cth: "Kalau saya naikkan harga [produk] RM1, apa jadi?"):
     * Kenal pasti harga asal seunit produk tersebut daripada DATA PERNIAGAAN DISAHKAN (cth: RM8.00 seunit).
     * Kira harga baharu dengan tepat (Harga Asal + Kenaikan = cth: RM8.00 + RM1.00 = RM9.00 seunit). JANGAN sesekali menyebut angka bercanggah atau keliru (seperti "jadi RM9.50 RM9.00").
     * Bentangkan kiraan secara konsisten dan teratur:
       1. Harga Baharu: Harga Asal + Kenaikan (cth: RM8.00 + RM1.00 = RM9.00 seunit).
       2. Anggaran Jualan Baharu: Kuantiti Asal × Harga Baharu (cth: 616 unit × RM9.00 = RM5,544.00, pertambahan hasil RM616.00).
       3. Anggaran Untung Kasar Baharu: Jualan Baharu − Kos Produk Asal (cth: RM5,544.00 − RM2,371.60 = RM3,172.40, pertambahan untung RM616.00).
     * Wajib nyatakan andaian: "Kiraan ini adalah anggaran andaian dengan andaian kuantiti jualan kekal (cth: 616 unit) dan kos produk tidak berubah. Permintaan pasaran sebenar pelanggan mungkin terkesan akibat kenaikan harga."

4. KESEDARAN KESELURUHAN DATASET & TEMPOH BULANAN (COMPLETE BUSINESS DATA AWARENESS):
   - Anda mempunyai akses penuh kepada SEMUA data jualan perniagaan yang disahkan, termasuk semua bulan dalam dataset (lihat PECAHAN PRESTASI MENGIKUT BULAN), analisis hari/tarikh (lihat ANALISIS HARI & HUJUNG MINGGU dan ANALISIS TARIKH).
   - JANGAN SESEKALI mengatakan anda "hanya tahu satu bulan" atau "tiada data bulan lain" jika rekod bulan lain wujud dalam PECAHAN PRESTASI MENGIKUT BULAN.
   - Jika pengguna bertanya tentang bulan lain (cth: "Berapa jualan September?" walaupun papan pemuka sedang memaparkan Oktober), jawab terus menggunakan angka bulan September yang disahkan.
   - Jika pengguna bertanya mengenai kedua-dua bulan atau meminta perbandingan (cth: "Bandingkan Sep dan Okt" atau "Do you have data for both months?"), terangkan kedua-dua bulan dan bezakan prestasi mereka dengan tepat (cth: Okt meningkat RM6,514.70 / 37.4% berbanding Sep).
   - Jika pengguna bertanya mengenai hari terlaris atau tarikh tertinggi, rujuk data ANALISIS HARI & HUJUNG MINGGU atau ANALISIS TARIKH. JANGAN SESEKALI mereka-reka corak hari jika tiada data tarikh (maklumkan tiada tarikh direkodkan).
   - Jaga privasi perniagaan: Jangan sebut nombor telefon, ID transaksi mentah, atau nota sulit peribadi.

5. KONTEKS PERBUALAN & SOALAN SUSULAN (FOLLOW-UPS):
   - Fahami rujukan perbualan sebelumnya. Jika pengguna baru sahaja bertanyakan tentang satu produk (contoh: Brownies), soalan susulan seperti "Macam mana kamu kira?", "Kenapa macam tu?", atau "Kalau naik RM1?" merujuk kepada produk tersebut.

6. PERATURAN ANTI-HALUSINASI KETAT (GROUNDING):
   - JANGAN SESEKALI mencipta nama produk atau menu yang tiada dalam DATA PERNIAGAAN DISAHKAN di atas.
   - JANGAN mereka-reka data, nombor jualan, kos, atau keuntungan yang tiada.
   - Jika maklumat tiada dalam rekod (cth: tiada kos atau tiada rekod perbelanjaan operasi), maklumkan secara sopan dan jujur kepada Puan bahawa data tersebut tidak disediakan.
   - Cadangan perniagaan mestilah jelas dibezakan sebagai nasihat/strategi, bukan fakta jualan masa lalu.

7. GAYA, NADA & BAHASA:
   - Sapa pengguna dengan sopan sebagai "Puan".
   - Mulakan terus dengan jawapan langsung (direct answer).
   - Gunakan Bahasa Melayu yang santai, mesra, mudah difahami, bebas jargon teknikal. (Jika pengguna bertanya dalam Bahasa Inggeris atau Manglish, jawab dengan bahasa yang sesuai dan mesra).
   - Sasarkan 50–90 patah perkataan untuk soalan lazim. Jika pengguna meminta "Terangkan lagi" / penjelasan panjang, berikan huraian berbutir yang terperinci dan jelas.
   - Akhiri dengan MAKSIMUM SATU soalan susulan yang membina jika sesuai.`

  const candidateModels = [
    context.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
  ]
  const modelsToTry = Array.from(new Set(candidateModels))

  // Build Gemini contents
  const contents: any[] = []
  if (body.history && Array.isArray(body.history)) {
    for (const h of body.history.slice(-6)) {
      if (h.text && h.text.trim()) {
        contents.push({
          role: h.role === 'model' || h.role === 'bot' ? 'model' : 'user',
          parts: [{ text: h.text.trim() }],
        })
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  let lastError: any = null

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 450,
          },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        lastError = new Error(`HTTP ${res.status}: ${errText}`)
        if (res.status === 404 || res.status === 503) {
          continue
        }
        break
      }

      const json: any = await res.json()
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        return new Response(
          JSON.stringify({ success: true, answer: text, model }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (err: any) {
      lastError = err
    }
  }

  const errStr = String(lastError?.message || lastError).toLowerCase()
  const is429 = errStr.includes('429') || errStr.includes('quota')

  return new Response(
    JSON.stringify({
      success: false,
      status: is429 ? 429 : 500,
      error: is429
        ? 'Had penggunaan AI semasa telah dicapai buat seketika. Sila tunggu 1 minit sebelum mencuba semula.'
        : 'Maaf, perkhidmatan AI mengalami masalah sementara. Sila cuba lagi sebentar lagi.',
    }),
    { status: is429 ? 429 : 500, headers: { 'Content-Type': 'application/json' } }
  )
}
