// Cloudflare Pages Function: POST /api/extract

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
          'Kunci API Gemini belum dikonfigurasi di pelayan Cloudflare. Sila tetapkan GEMINI_API_KEY di papan pemuka Cloudflare.',
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

  const story = (body.story || '').trim()
  if (!story) {
    return new Response(
      JSON.stringify({
        success: false,
        hasSufficientData: false,
        clarificationMessage: 'Sila ceritakan sedikit mengenai jualan produk atau perkhidmatan anda.',
        records: [],
        operatingExpenses: null,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const candidateModels = [
    context.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
  ]
  const modelsToTry = Array.from(new Set(candidateModels))

  const promptText = `Anda adalah pembantu pengekstrakan data perniagaan usahawan wanita 'Wanita Niaga AI'.
Ekstrak maklumat jualan berikut kepada format JSON SAHAJA:
Teks: "${story}"

Format JSON yang MESTI dipatuhi:
{
  "hasSufficientData": true/false (true jika ada nama produk, kuantiti dan harga seunit),
  "clarificationMessage": "" (soalan mesra jika data tidak lengkap),
  "operatingExpenses": null atau nombor (hanya jika ada sewa/bil/pengangkutan disebut. JANGAN letak 0 jika tidak disebut),
  "records": [
    {
      "produk": "Nama Produk",
      "kuantiti": 50,
      "harga": 2.0,
      "kos": 0.8 (atau null jika kos tidak dinyatakan),
      "tarikh": null,
      "saluran": null
    }
  ]
}`

  let lastError: any = null

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      })

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        if (res.status === 404 || res.status === 503) continue
        break
      }

      const json: any = await res.json()
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText) {
        const parsed = JSON.parse(rawText)
        let opex = parsed.operatingExpenses !== undefined ? parsed.operatingExpenses : null
        if (opex === 0) {
          const lower = story.toLowerCase()
          const keywords = ['sewa', 'bil', 'utiliti', 'minyak', 'gaji', 'upah', 'kos operasi', 'tiada kos operasi']
          if (!keywords.some((k) => lower.includes(k))) {
            opex = null
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            hasSufficientData: Boolean(parsed.hasSufficientData && parsed.records?.length > 0),
            clarificationMessage: parsed.clarificationMessage || '',
            operatingExpenses: opex,
            records: parsed.records || [],
            originalStory: story,
            model,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (err) {
      lastError = err
    }
  }

  const errorMsg = lastError ? `Ralat: ${lastError.message || lastError}` : 'Maaf, berlaku masalah memproses teks jualan. Sila cuba lagi sebentar lagi.'
  return new Response(
    JSON.stringify({
      success: false,
      hasSufficientData: false,
      clarificationMessage: '',
      operatingExpenses: null,
      records: [],
      error: errorMsg,
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
