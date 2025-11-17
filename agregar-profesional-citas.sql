-- Agregar columna assigned_professional_id a la tabla appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_professional_id TEXT;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_professional 
ON appointments(assigned_professional_id);

-- Verificar la estructura actualizada
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name LIKE '%professional%';