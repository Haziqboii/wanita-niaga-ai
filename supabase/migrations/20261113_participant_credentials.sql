-- ==============================================================================
-- WANITA NIAGA AI — Participant Credentials Schema Migration
-- Location: supabase/migrations/20261113_participant_credentials.sql
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.participant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_hash CHAR(64) NOT NULL UNIQUE,
    encrypted_key TEXT NOT NULL,
    key_iv VARCHAR(32) NOT NULL,
    key_tag VARCHAR(32) NOT NULL,
    masked_preview VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    last_used_at TIMESTAMPTZ,
    CONSTRAINT check_status_valid CHECK (status IN ('active', 'revoked', 'quota_exhausted'))
);

-- 2. Cleanup index for expired sessions
-- (Note: UNIQUE on session_hash already automatically creates the lookup index)
CREATE INDEX IF NOT EXISTS idx_participant_credentials_expires_at 
    ON public.participant_credentials(expires_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.participant_credentials ENABLE ROW LEVEL SECURITY;

-- 4. Revoke all permissions from PUBLIC, anon and authenticated
REVOKE ALL ON public.participant_credentials FROM PUBLIC;
REVOKE ALL ON public.participant_credentials FROM anon;
REVOKE ALL ON public.participant_credentials FROM authenticated;

-- 5. Grant restricted full access ONLY to trusted backend service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participant_credentials TO service_role;

COMMENT ON TABLE public.participant_credentials IS 
    'Encrypted credentials for SULAM workshop participants. Managed exclusively by backend API handlers.';
