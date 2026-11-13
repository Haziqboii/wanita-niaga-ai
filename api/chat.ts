// Vercel Serverless Function: POST /api/chat

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    return new Response(
      JSON.stringify({
        success: false,
        status: 503,
        error:
          'Kunci API Gemini belum dikonfigurasi. Sila tetapkan pembolehubah GEMINI_API_KEY di papan pemuka Vercel (Settings > Environment Variables).',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: any = {}
  try {
    body = await request.json()
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

  // System instruction
  let systemInstruction = `Anda adalah Pembantu Perniagaan AI 'Wanita Niaga AI' untuk usahawan wanita program SULAM.
Jawab soalan perniagaan secara ringkas, mesra, sopan, dan berfakta dalam Bahasa Melayu mudah.
Sasarkan 50–90 patah perkataan. Elakkan bahasa teknikal dan panggil pengguna sebagai 'Puan'.`

  if (body.context && body.context.recordCount > 0) {
    const c = body.context
    systemInstruction += `\n\nFakta Jualan Disahkan:\n- Jumlah Jualan: RM${c.totalRevenue?.toFixed(2) || '0.00'}\n- Kuantiti: ${c.totalKuantiti || 0} unit`
    if (c.grossProfit !== null && c.grossProfit !== undefined) {
      systemInstruction += `\n- Untung Kasar: RM${c.grossProfit.toFixed(2)}`
    }
    if (c.operatingExpenses !== null && c.estimatedNetProfit !== null) {
      systemInstruction += `\n- Kos Operasi: RM${c.operatingExpenses.toFixed(2)}, Anggaran Untung Bersih: RM${c.estimatedNetProfit.toFixed(2)}`
    }
  }

  const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    'gemini-1.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
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
