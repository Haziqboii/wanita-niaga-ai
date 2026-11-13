// Cloudflare Pages Function: GET /api/health

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hasKey = Boolean(context.env.GEMINI_API_KEY && context.env.GEMINI_API_KEY.trim() !== '')

  return new Response(
    JSON.stringify({
      status: 'ok',
      hasGeminiKey: hasKey,
      model: context.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      runtime: 'cloudflare-pages-edge',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  )
}
