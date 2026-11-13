import http from 'node:http'
import { handleChatMessage } from './chatHandler.ts'
import { handleExtraction } from './extractionHandler.ts'

const PORT = process.env.PORT || 3001

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(
      JSON.stringify({
        status: 'ok',
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      })
    )
    return
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let bodyRaw = ''
    req.on('data', (chunk) => {
      bodyRaw += chunk
    })

    req.on('end', async () => {
      try {
        const body = bodyRaw ? JSON.parse(bodyRaw) : {}
        const clientId =
          (req.headers['x-session-id'])?.trim() ||
          body.sessionId ||
          (req.headers['x-forwarded-for'])?.split(',')[0]?.trim() ||
          req.socket.remoteAddress ||
          '127.0.0.1'

        const result = await handleChatMessage(body, clientId)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = result.status || (result.success ? 200 : 500)
        res.end(JSON.stringify(result))
      } catch {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: 'Format permintaan JSON tidak sah.' }))
      }
    })
    return
  }

  if (req.url === '/api/extract' && req.method === 'POST') {
    let bodyRaw = ''
    req.on('data', (chunk) => {
      bodyRaw += chunk
    })

    req.on('end', async () => {
      try {
        const body = bodyRaw ? JSON.parse(bodyRaw) : {}
        const clientId =
          (req.headers['x-session-id'])?.trim() ||
          body.sessionId ||
          (req.headers['x-forwarded-for'])?.split(',')[0]?.trim() ||
          req.socket.remoteAddress ||
          '127.0.0.1'

        const result = await handleExtraction(body.story || '', clientId)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = result.status || (result.success ? 200 : 500)
        res.end(JSON.stringify(result))
      } catch {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: 'Format permintaan JSON tidak sah.' }))
      }
    })
    return
  }

  res.statusCode = 404
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`Wanita Niaga AI Backend berjalan di port ${PORT}`)
})
