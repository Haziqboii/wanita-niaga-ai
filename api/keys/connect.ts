// Vercel Serverless Function: POST /api/keys/connect

import {
  handleConnectKey,
  parseSessionCookie,
  buildSessionCookie,
  checkConnectionRateLimit,
  validateOrigin,
} from '../../server/keyHandlers.ts'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!validateOrigin(origin, host)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Permintaan ditolak: Asal permintaan tidak sah.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const rateCheck = checkConnectionRateLimit(clientIp)
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Terlalu banyak percubaan sambungan. Sila tunggu ${rateCheck.waitSeconds} saat sebelum mencuba lagi.`,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Format permintaan JSON tidak sah.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const existingToken = parseSessionCookie(request.headers.get('cookie'))
  const result = await handleConnectKey(body.apiKey, existingToken)

  if (!result.success || !result.sessionToken) {
    return new Response(
      JSON.stringify({ success: false, error: result.error }),
      { status: result.status || 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const isSecure =
    request.headers.get('x-forwarded-proto') === 'https' ||
    (process.env.NODE_ENV === 'production' && !host?.includes('localhost'))

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': buildSessionCookie(result.sessionToken, isSecure),
  })

  return new Response(
    JSON.stringify({ success: true, maskedPreview: result.maskedPreview }),
    { status: 200, headers }
  )
}
