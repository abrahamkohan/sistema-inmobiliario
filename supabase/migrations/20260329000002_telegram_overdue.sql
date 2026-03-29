-- telegram_chat_id en profiles para comandos del bot
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- overdue_notified en tasks para no repetir alertas de vencimiento
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS overdue_notified boolean NOT NULL DEFAULT false;
