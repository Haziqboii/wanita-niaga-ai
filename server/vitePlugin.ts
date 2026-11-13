import type { Plugin, ViteDevServer, PreviewServer } from 'vite'
import { handleChatMessage, getGeminiApiKey, getGeminiModel } from './chatHandler.ts'
import { handleExtraction } from './extractionHandler.ts'
import { handleGenerateInsights } from './insightsHandler.ts'
import {
  handleConnectKey,
  handleCheckKeyStatus,
  handleDisconnectKey,
  resolveParticipantKey,
  parseSessionCookie,
  buildSessionCookie,
  buildClearSessionCookie,
  checkConnectionRateLimit,
  validateOrigin,
  isParticipantFlowEnabled,
} from './keyHandlers.ts'

export function geminiApiPlugin(): Plugin {
  function setupMiddleware(server: ViteDevServer | PreviewServer) {
    server.middlewares.use(async (req, res, next) => {
      const clientIp =
        (req.headers['x-session-id'] as string)?.trim() ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1'

      const isSecure =
        req.headers['x-forwarded-proto'] === 'https' ||
        (process.env.NODE_ENV === 'production' && !req.headers.host?.includes('localhost'))

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

      // 2. Participant Gemini Key Connection endpoint (POST /api/keys/connect)
      if (req.url === '/api/keys/connect' && req.method === 'POST') {
        if (!validateOrigin(req.headers.origin as string, req.headers.host as string)) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, error: 'Permintaan ditolak: Asal permintaan tidak sah.' }))
          return
        }

        const rateCheck = checkConnectionRateLimit(clientIp)
        if (!rateCheck.allowed) {
          res.statusCode = 429
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: false,
              error: `Terlalu banyak percubaan sambungan. Sila tunggu ${rateCheck.waitSeconds} saat sebelum mencuba lagi.`,
            })
          )
          return
        }

        let bodyRaw = ''
        req.on('data', (chunk) => {
          bodyRaw += chunk
          if (bodyRaw.length > 10000) {
            res.statusCode = 413
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Saiz data terlalu besar.' }))
            req.destroy()
          }
        })

        req.on('end', async () => {
          try {
            const body = bodyRaw ? JSON.parse(bodyRaw) : {}
            const existingToken = parseSessionCookie(req.headers.cookie)
            const result = await handleConnectKey(body.apiKey, existingToken)

            res.setHeader('Content-Type', 'application/json')
            if (result.success && result.sessionToken) {
              res.setHeader('Set-Cookie', buildSessionCookie(result.sessionToken, isSecure))
              res.statusCode = 200
              res.end(JSON.stringify({ success: true, maskedPreview: result.maskedPreview }))
            } else {
              res.statusCode = result.status || 400
              res.end(JSON.stringify({ success: false, error: result.error }))
            }
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({ success: false, error: 'Format permintaan JSON tidak sah.' }))
          }
        })
        return
      }

      // 3. Participant Gemini Key Status endpoint (GET /api/keys/status)
      if (req.url === '/api/keys/status' && req.method === 'GET') {
        const sessionToken = parseSessionCookie(req.headers.cookie)
        const status = await handleCheckKeyStatus(sessionToken)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify(status))
        return
      }

      // 4. Participant Gemini Key Disconnect endpoint (POST /api/keys/disconnect)
      if (req.url === '/api/keys/disconnect' && req.method === 'POST') {
        if (!validateOrigin(req.headers.origin as string, req.headers.host as string)) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, error: 'Permintaan ditolak: Asal permintaan tidak sah.' }))
          return
        }

        const sessionToken = parseSessionCookie(req.headers.cookie)
        const discResult = await handleDisconnectKey(sessionToken)
        res.setHeader('Set-Cookie', buildClearSessionCookie(isSecure))
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify(discResult))
        return
      }

      // 5. Chat API endpoint (POST /api/chat)
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
              clientIp

            // Resolve credential with participant priority
            const sessionToken = parseSessionCookie(req.headers.cookie)
            const legacyHeaderKey = req.headers['x-gemini-api-key'] as string
            const resolved = await resolveParticipantKey(sessionToken, legacyHeaderKey)

            if (isParticipantFlowEnabled() && !resolved.key) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 401
              res.end(
                JSON.stringify({
                  success: false,
                  status: 401,
                  error:
                    'Sesi sambungan Gemini anda telah tamat atau belum disambungkan. Sila sambungkan kunci API Gemini anda di menu keselamatan.',
                })
              )
              return
            }

            const result = await handleChatMessage(body, clientId, resolved.key)
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

      // 6. Natural Language Story Extraction endpoint (POST /api/extract)
      if ((req.url === '/api/extract' || req.url === '/api/extract-story') && req.method === 'POST') {
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
              clientIp

            // Resolve credential with participant priority
            const sessionToken = parseSessionCookie(req.headers.cookie)
            const legacyHeaderKey = req.headers['x-gemini-api-key'] as string
            const resolved = await resolveParticipantKey(sessionToken, legacyHeaderKey)

            if (isParticipantFlowEnabled() && !resolved.key) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 401
              res.end(
                JSON.stringify({
                  success: false,
                  hasSufficientData: false,
                  status: 401,
                  error:
                    'Sesi sambungan Gemini anda telah tamat atau belum disambungkan. Sila sambungkan kunci API Gemini anda di menu keselamatan.',
                })
              )
              return
            }

            const result = await handleExtraction(body.story || '', clientId, resolved.key)
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

      // 7. Intelligent Business Insights endpoint (POST /api/insights)
      if (req.url === '/api/insights' && req.method === 'POST') {
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
            const sessionToken = parseSessionCookie(req.headers.cookie)
            const legacyHeaderKey = req.headers['x-gemini-api-key'] as string
            const resolved = await resolveParticipantKey(sessionToken, legacyHeaderKey)

            const candidates = Array.isArray(body.candidates) ? body.candidates : []
            const result = await handleGenerateInsights(candidates, clientIp, resolved.key)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify(result))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({ success: false, isAI: false, insights: [] }))
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
