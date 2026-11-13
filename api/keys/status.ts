// Vercel Serverless Function: GET /api/keys/status

import {
  handleCheckKeyStatus,
  parseSessionCookie,
} from '../../server/keyHandlers.ts'

export async function GET(request: Request) {
  const sessionToken = parseSessionCookie(request.headers.get('cookie'))
  const status = await handleCheckKeyStatus(sessionToken)

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
