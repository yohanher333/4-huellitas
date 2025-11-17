-- Agregar columna reminder_sent a la tabla appointments
-- Esta columna indica si ya se envió un recordatorio para la cita

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Comentario sobre la columna
COMMENT ON COLUMN appointments.reminder_sent IS 'Indica si ya se envió un recordatorio por WhatsApp para esta cita';

-- Actualizar citas existentes a reminder_sent = false por defecto
UPDATE appointments 
SET reminder_sent = FALSE 
WHERE reminder_sent IS NULL;

-- Crear un índice para mejorar el performance de las consultas
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent 
ON appointments(reminder_sent, appointment_time, status);