-- Estados OAuth pendientes para validar el callback sin depender de la sesión del navegador.
-- Solo service_role accede vía Edge Functions.

CREATE TABLE consultora_google_oauth_states (
  state      text PRIMARY KEY,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE consultora_google_oauth_states ENABLE ROW LEVEL SECURITY;
