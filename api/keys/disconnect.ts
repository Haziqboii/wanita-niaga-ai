// Vercel Serverless Function: POST /api/keys/disconnect

import {
  handleDisconnectKey,
  parseSessionCookie,
  buildClearSessionCookie,
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

  const sessionToken = parseSessionCookie(request.headers.get('cookie'))
  const discResult = await handleDisconnectKey(sessionToken)

  const isSecure =
    request.headers.get('x-forwarded-proto') === 'https' ||
    (process.env.NODE_ENV === 'production' && !host?.includes('localhost'))

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': buildClearSessionCookie(isSecure),
  })

  return new Response(JSON.stringify(discResult), {
    status: 200,
    headers,
  })
}
