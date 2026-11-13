/**
 * WANITA NIAGA AI — Supabase Credential Repository
 *
 * Implements the CredentialRepository interface using direct HTTPS calls to
 * the Supabase PostgREST API with privileged service_role authentication.
 *
 * SECURITY INVARIANTS:
 * 1. ONLY uses the server-side service_role key; this file is strictly server-only.
 * 2. ONLY stores and retrieves AES-256-GCM encrypted values.
 * 3. Never throws unhandled exceptions that could crash serverless runtimes.
 * 4. Zero external dependencies: uses native standard `fetch`.
 */

import type {
  CredentialRepository,
  ParticipantCredential,
} from './credentialRepository.ts'

export interface SupabaseClientConfig {
  supabaseUrl?: string
  serviceRoleKey?: string
  fetchFn?: typeof fetch
}

export class SupabaseCredentialRepository implements CredentialRepository {
  private url: string
  private serviceKey: string
  private customFetch: typeof fetch

  constructor(config: SupabaseClientConfig = {}) {
    this.url = (config.supabaseUrl || process.env.SUPABASE_URL || '').replace(/\/$/, '')
    this.serviceKey =
      config.serviceRoleKey ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ''
    this.customFetch = config.fetchFn || fetch
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.serviceKey)
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      Prefer: 'return=representation',
    }
  }

  public async saveCredential(
    cred: Omit<ParticipantCredential, 'id' | 'createdAt'>
  ): Promise<ParticipantCredential> {
    if (!this.isConfigured()) {
      throw new Error('Supabase credential storage is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).')
    }

    const payload = {
      session_hash: cred.sessionHash,
      encrypted_key: cred.encryptedKey,
      key_iv: cred.keyIv,
      key_tag: cred.keyTag,
      masked_preview: cred.maskedPreview,
      status: cred.status,
      expires_at: cred.expiresAt,
    }

    const endpoint = `${this.url}/rest/v1/participant_credentials?on_conflict=session_hash`
    const res = await this.customFetch(endpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Failed to save credential in Supabase: ${res.status} ${errText}`)
    }

    const rows = await res.json()
    const row = Array.isArray(rows) ? rows[0] : rows

    return {
      id: row.id,
      sessionHash: row.session_hash,
      encryptedKey: row.encrypted_key,
      keyIv: row.key_iv,
      keyTag: row.key_tag,
      maskedPreview: row.masked_preview,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
    }
  }

  public async findBySessionHash(sessionHash: string): Promise<ParticipantCredential | null> {
    if (!this.isConfigured()) {
      return null
    }

    const endpoint = `${this.url}/rest/v1/participant_credentials?session_hash=eq.${encodeURIComponent(sessionHash)}&select=*`
    const res = await this.customFetch(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!res.ok) {
      return null
    }

    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return null
    }

    const row = rows[0]

    // Verify expiration
    const expiresAt = new Date(row.expires_at).getTime()
    if (Date.now() > expiresAt) {
      return null
    }

    if (row.status !== 'active') {
      return null
    }

    return {
      id: row.id,
      sessionHash: row.session_hash,
      encryptedKey: row.encrypted_key,
      keyIv: row.key_iv,
      keyTag: row.key_tag,
      maskedPreview: row.masked_preview,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
    }
  }

  public async revokeBySessionHash(sessionHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    const endpoint = `${this.url}/rest/v1/participant_credentials?session_hash=eq.${encodeURIComponent(sessionHash)}`
    const res = await this.customFetch(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: 'revoked' }),
    })

    return res.ok
  }

  public async deleteBySessionHash(sessionHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    const endpoint = `${this.url}/rest/v1/participant_credentials?session_hash=eq.${encodeURIComponent(sessionHash)}`
    const res = await this.customFetch(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return res.ok
  }

  public async clearAll(): Promise<void> {
    if (!this.isConfigured()) {
      return
    }

    const endpoint = `${this.url}/rest/v1/participant_credentials?id=neq.00000000-0000-0000-0000-000000000000`
    await this.customFetch(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
  }
}
