// Vercel Serverless Function: POST /api/insights

import { handleGenerateInsights } from '../server/insightsHandler.ts'
import {
  parseSessionCookie,
  resolveParticipantKey,
} from '../server/keyHandlers.ts'

export async function POST(request: Request) {
  const sessionToken = parseSessionCookie(request.headers.get('cookie'))
  const legacyHeaderKey = request.headers.get('x-gemini-api-key')
  const resolved = await resolveParticipantKey(sessionToken, legacyHeaderKey)

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, isAI: false, insights: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const candidates = Array.isArray(body.candidates) ? body.candidates : []
  const result = await handleGenerateInsights(candidates, clientIp, resolved.key)

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
