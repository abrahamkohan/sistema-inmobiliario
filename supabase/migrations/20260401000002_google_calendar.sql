-- ── Google Calendar: tokens cifrados + columna en tasks ──────────────────────
-- Tokens almacenados cifrados con AES-256-GCM en Edge Functions.
-- La clave de cifrado vive únicamente en Supabase Edge Function Secrets (GCAL_ENCRYPTION_KEY).
-- RLS DENY ALL: solo service_role (Edge Functions) puede leer/escribir esta tabla.

CREATE TABLE consultora_google_tokens (
  id                integer     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token_enc  text        NOT NULL,
  refresh_token_enc text        NOT NULL,
  expires_at        timestamptz NOT NULL,
  calendar_id       text        NOT NULL DEFAULT 'primary',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Sin políticas = DENY ALL para anon y authenticated.
-- Solo service_role accede (vía Edge Functions).
ALTER TABLE consultora_google_tokens ENABLE ROW LEVEL SECURITY;

-- ID del evento creado en Google Calendar (null si no fue sincronizado)
ALTER TABLE tasks ADD COLUMN google_event_id text;
