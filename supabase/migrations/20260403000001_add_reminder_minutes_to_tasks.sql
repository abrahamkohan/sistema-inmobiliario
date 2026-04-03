ALTER TABLE tasks
ADD COLUMN reminder_minutes integer;

COMMENT ON COLUMN tasks.reminder_minutes IS
'Minutos antes del evento para el recordatorio de Google Calendar. NULL = usar default de Google Calendar.';
