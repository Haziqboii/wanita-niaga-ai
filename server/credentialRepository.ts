/**
 * WANITA NIAGA AI — Credential Repository Interface & In-Memory Implementation
 *
 * Provides participant-scoped credential storage.
 * Designed as a clean abstraction so that Task 7C can swap in Supabase PostgreSQL
 * without changing backend route handlers or business logic.
 */

import { SupabaseCredentialRepository } from './supabaseCredentialRepository.ts'

export interface ParticipantCredential {
  id: string
  sessionHash: string
  encryptedKey: string
  keyIv: string
  keyTag: string
  maskedPreview: string
  status: 'active' | 'revoked' | 'quota_exhausted'
  createdAt: string
  expiresAt: string
  lastUsedAt?: string
}

export interface CredentialRepository {
  saveCredential(cred: Omit<ParticipantCredential, 'id' | 'createdAt'>): Promise<ParticipantCredential>
  findBySessionHash(sessionHash: string): Promise<ParticipantCredential | null>
  revokeBySessionHash(sessionHash: string): Promise<boolean>
  deleteBySessionHash(sessionHash: string): Promise<boolean>
  clearAll(): Promise<void>
}

/**
 * In-memory implementation of CredentialRepository for local testing and Task 7B/7C.
 */
export class InMemoryCredentialRepository implements CredentialRepository {
  private store = new Map<string, ParticipantCredential>()

  public async saveCredential(
    cred: Omit<ParticipantCredential, 'id' | 'createdAt'>
  ): Promise<ParticipantCredential> {
    const id = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const record: ParticipantCredential = {
      ...cred,
      id,
      createdAt: new Date().toISOString(),
    }
    this.store.set(cred.sessionHash, record)
    return record
  }

  public async findBySessionHash(sessionHash: string): Promise<ParticipantCredential | null> {
    const record = this.store.get(sessionHash)
    if (!record) return null

    // Check expiration
    const expiresAt = new Date(record.expiresAt).getTime()
    if (Date.now() > expiresAt) {
      return null
    }

    if (record.status !== 'active') {
      return null
    }

    return record
  }

  public async revokeBySessionHash(sessionHash: string): Promise<boolean> {
    const record = this.store.get(sessionHash)
    if (!record) return false

    record.status = 'revoked'
    this.store.set(sessionHash, record)
    return true
  }

  public async deleteBySessionHash(sessionHash: string): Promise<boolean> {
    return this.store.delete(sessionHash)
  }

  public async clearAll(): Promise<void> {
    this.store.clear()
  }
}

// Global in-memory repository instance for local development and tests
export const globalCredentialRepo = new InMemoryCredentialRepository()

/**
 * Resolves the active credential repository based on environment configuration.
 * Uses Supabase when SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY are set;
 * otherwise uses in-memory repository.
 */
export function getActiveCredentialRepository(): CredentialRepository {
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (process.env.SUPABASE_URL && secretKey) {
    return new SupabaseCredentialRepository({
      supabaseUrl: process.env.SUPABASE_URL,
      serviceRoleKey: secretKey,
    })
  }
  return globalCredentialRepo
}
