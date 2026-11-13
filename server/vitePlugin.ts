import type { Plugin, ViteDevServer, PreviewServer } from 'vite'
import { handleChatMessage, getGeminiApiKey, getGeminiModel } from './chatHandler.ts'
import { handleExtraction } from './extractionHandler.ts'

export function geminiApiPlugin(): Plugin {
  function setupMiddleware(server: ViteDevServer | PreviewServer) {
    server.middlewares.use(async (req, res, next) => {
      // 1. Health check endpoint
      if (req.url === '/api/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json')
        const apiKey = getGeminiApiKey()
        const hasKey = Boolean(apiKey && apiKey.trim() !== '')
        res.statusCode = 200
        res.end(
          JSON.stringify({
            status: 'ok',
            hasGeminiKey: hasKey,
            model: getGeminiModel(),
          })
        )
        return
      }

      // 2. Chat API endpoint
      if (req.url === '/api/chat' && req.method === 'POST') {
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
              (req.headers['x-session-id'] as string)?.trim() ||
              body.sessionId ||
              (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
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

      // 3. Natural Language Story Extraction endpoint (Phase 2B)
      if (req.url === '/api/extract' && req.method === 'POST') {
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
              (req.headers['x-session-id'] as string)?.trim() ||
              body.sessionId ||
              (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
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

      next()
    })
  }

  return {
    name: 'wanita-niaga-gemini-api',
    configureServer(server: ViteDevServer) {
      setupMiddleware(server)
    },
    configurePreviewServer(server: PreviewServer) {
      setupMiddleware(server)
    },
  }
}
