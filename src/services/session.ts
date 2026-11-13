/**
 * Client Session Identifier for Workshop Isolation
 * 
 * Ensures each participant's smartphone is uniquely identified even when
 * all 40 participants share the exact same university Wi-Fi network IP.
 */

const SESSION_STORAGE_KEY = 'wn_workshop_session_id'

export function getClientSessionId(): string {
  try {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return 'srv-' + Math.random().toString(36).substring(2, 10)
    }

    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionId || sessionId.trim() === '') {
      // Generate clean random session ID
      const randomStr = Math.random().toString(36).substring(2, 9)
      const timeStr = Date.now().toString(36)
      sessionId = `usr-${timeStr}-${randomStr}`
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    }

    return sessionId
  } catch {
    return 'fallback-' + Date.now().toString(36)
  }
}
