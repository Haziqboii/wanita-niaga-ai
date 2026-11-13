/**
 * WANITA NIAGA AI — Local Persistence Engine (IndexedDB)
 *
 * Implements durable, privacy-safe local storage for participant sales records,
 * dashboard filter state, and AI chat history on the same device.
 *
 * CRITICAL PRIVACY & SECURITY RULES:
 * 1. NEVER persist Gemini API keys, passwords, or tokens.
 * 2. NEVER upload local storage data to external cloud services.
 * 3. Gracefully handle corrupted or unavailable storage (incognito, quota, errors)
 *    without crashing the application.
 */

import type { RawSale, ChatMessage } from '../types'

export const DB_NAME = 'WanitaNiagaAI_DB'
export const DB_VERSION = 1
export const STORE_NAME = 'app_state'
export const CURRENT_REPORT_KEY = 'active_report'

export interface SavedReportState {
  version: number
  reportId: string
  updatedAt: string
  records: RawSale[]
  operatingExpenses: number | null
  selectedMonth: string
  isSampleData: boolean
  page: 'home' | 'story' | 'upload' | 'manual' | 'dashboard' | 'chat' | 'guide'
  chatMessages: ChatMessage[]
  storyDraft?: {
    storyText?: string
    isStoryReview?: boolean
  }
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Fallback in-memory storage for environments where IndexedDB is unavailable or disabled
let inMemoryFallback: SavedReportState | null = null

/**
 * Checks whether IndexedDB is available in the current execution environment.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false
    return typeof window.indexedDB !== 'undefined' && window.indexedDB !== null
  } catch {
    return false
  }
}

/**
 * Generates a stable unique report identifier.
 */
export function generateReportId(): string {
  const ts = Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return `rpt_${ts}_${rand}`
}

/**
 * Opens connection to IndexedDB with automatic schema creation.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is not available'))
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'))
      request.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'))
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Sanitizes state before persisting to guarantee no API keys or credentials can ever be saved.
 */
export function sanitizeStateForPersistence(state: SavedReportState): SavedReportState {
  // Deep clone to prevent mutating original in-memory objects
  const copy: any = JSON.parse(JSON.stringify(state))

  // Explicit safety checks
  delete copy.apiKey
  delete copy.geminiApiKey
  delete copy.token
  delete copy.secret
  delete copy.password

  // Ensure chat messages do not contain embedded keys
  if (Array.isArray(copy.chatMessages)) {
    copy.chatMessages = copy.chatMessages.map((m: any) => {
      const clean = { ...m }
      delete clean.apiKey
      delete clean.token
      return clean
    })
  }

  return copy as SavedReportState
}

/**
 * Saves report state to IndexedDB (with in-memory fallback).
 */
export async function saveReportToStorage(state: SavedReportState): Promise<boolean> {
  const sanitized = sanitizeStateForPersistence({
    ...state,
    updatedAt: new Date().toISOString(),
  })

  // Always update in-memory fallback
  inMemoryFallback = sanitized

  if (!isIndexedDBAvailable()) {
    return true
  }

  try {
    const db = await openDB()
    return await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(sanitized, CURRENT_REPORT_KEY)

        req.onsuccess = () => resolve(true)
        req.onerror = () => {
          console.warn('IndexedDB put error:', req.error)
          resolve(false)
        }
        tx.onabort = () => resolve(false)
      } catch (txErr) {
        console.warn('IndexedDB transaction error:', txErr)
        resolve(false)
      }
    })
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback active:', err)
    return false
  }
}

/**
 * Retrieves the currently saved report from IndexedDB (or fallback).
 */
export async function getSavedReportFromStorage(): Promise<SavedReportState | null> {
  if (!isIndexedDBAvailable()) {
    return inMemoryFallback
  }

  try {
    const db = await openDB()
    return await new Promise<SavedReportState | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(CURRENT_REPORT_KEY)

        req.onsuccess = () => {
          const val = req.result as SavedReportState | undefined
          if (val && Array.isArray(val.records)) {
            inMemoryFallback = val
            resolve(val)
          } else {
            resolve(inMemoryFallback)
          }
        }
        req.onerror = () => {
          console.warn('IndexedDB get error:', req.error)
          resolve(inMemoryFallback)
        }
      } catch (txErr) {
        console.warn('IndexedDB transaction error:', txErr)
        resolve(inMemoryFallback)
      }
    })
  } catch (err) {
    console.warn('Failed to load from IndexedDB, using fallback:', err)
    return inMemoryFallback
  }
}

/**
 * Deletes the saved report from IndexedDB and clears memory fallback.
 */
export async function clearSavedReportFromStorage(): Promise<boolean> {
  inMemoryFallback = null

  if (!isIndexedDBAvailable()) {
    return true
  }

  try {
    const db = await openDB()
    return await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.delete(CURRENT_REPORT_KEY)

        req.onsuccess = () => resolve(true)
        req.onerror = () => {
          console.warn('IndexedDB delete error:', req.error)
          resolve(false)
        }
      } catch (txErr) {
        console.warn('IndexedDB delete transaction error:', txErr)
        resolve(false)
      }
    })
  } catch (err) {
    console.warn('Failed to clear from IndexedDB:', err)
    return false
  }
}

/**
 * Resets in-memory storage (primarily for automated test isolation).
 */
export function resetInMemoryStorage(): void {
  inMemoryFallback = null
}
