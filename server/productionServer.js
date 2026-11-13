import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { handleChatMessage } from './chatHandler.ts'
import { handleExtraction } from './extractionHandler.ts'
import { getGeminiApiKey, getGeminiModel } from './chatHandler.ts'
import { globalGeminiQueue } from './queueManager.ts'

const PORT = process.env.PORT || 8080
const DIST_DIR = path.resolve(process.cwd(), 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = (req.url || '/').split('?')[0]

  // 1. Health check endpoint
  if (url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(
      JSON.stringify({
        status: 'ok',
        hasGeminiKey: Boolean(getGeminiApiKey()),
        model: getGeminiModel(),
        queue: globalGeminiQueue.getStats(),
      })
    )
    return
  }

  // 2. Chat API endpoint
  if (url === '/api/chat' && req.method === 'POST') {
    let bodyRaw = ''
    req.on('data', (chunk) => {
      bodyRaw += chunk
      if (bodyRaw.length > 500000) {
        res.statusCode = 413
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Saiz data terlalu besar.' }))
        req.destroy()
      }
    })

    req.on('end', async () => {
      try {
        const body = bodyRaw ? JSON.parse(bodyRaw) : {}
        const clientId =
          (req.headers['x-session-id']) ||
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

  // 3. Extraction API endpoint
  if (url === '/api/extract' && req.method === 'POST') {
    let bodyRaw = ''
    req.on('data', (chunk) => {
      bodyRaw += chunk
      if (bodyRaw.length > 500000) {
        res.statusCode = 413
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Saiz data terlalu besar.' }))
        req.destroy()
      }
    })

    req.on('end', async () => {
      try {
        const body = bodyRaw ? JSON.parse(bodyRaw) : {}
        const clientId =
          (req.headers['x-session-id']) ||
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

  // 4. Static Asset Serving from dist/
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html') // SPA fallback
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    try {
      const data = fs.readFileSync(filePath)
      res.setHeader('Content-Type', contentType)
      if (ext !== '.html') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'no-cache')
      }
      res.statusCode = 200
      res.end(data)
      return
    } catch {
      // fallback
    }
  }

  res.statusCode = 404
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`[Wanita Niaga AI Production Server] Berjalan di port ${PORT}`)
  console.log(`Serving dist folder: ${fs.existsSync(DIST_DIR) ? 'YES' : 'NO (run npm run build)'}`)
})
