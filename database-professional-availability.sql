-- VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA
-- Ejecuta primero este SELECT para ver qué columnas tiene la tabla:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'professional_availability';

-- Si la tabla ya existe, modifícala en lugar de crearla
-- ALTER TABLE professional_availability ADD COLUMN IF NOT EXISTS professional_name TEXT;

-- Crear tabla de disponibilidad de profesionales (solo si no existe)
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id TEXT NOT NULL,
  schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_availability_schedule 
ON professional_availability(schedule_id);

CREATE INDEX IF NOT EXISTS idx_professional_availability_professional 
ON professional_availability(professional_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos puedan leer
CREATE POLICY "Allow public read access" ON professional_availability
FOR SELECT USING (true);

-- Política para permitir que usuarios autenticados puedan insertar/actualizar/eliminar
CREATE POLICY "Allow authenticated users full access" ON professional_availability
FOR ALL USING (auth.role() = 'authenticated');

-- Insertar profesionales de ejemplo si no existen
-- Para cada horario de trabajo existente, insertar ambos profesionales

-- PRIMERO: Verificar si existe tabla professionals
-- SELECT id, name FROM professionals LIMIT 5;

-- OPCIÓN 1: Si existe tabla professionals, usa sus IDs reales
-- Reemplaza estos UUIDs con los IDs reales de tu tabla professionals:
-- INSERT INTO professional_availability (professional_id, schedule_id)
-- SELECT 
--   'UUID_DEL_PROFESIONAL_1_AQUI',  -- Reemplaza con UUID real
--   ws.id
-- FROM work_schedules ws
-- WHERE NOT EXISTS (
--   SELECT 1 FROM professional_availability 
--   WHERE professional_id = 'UUID_DEL_PROFESIONAL_1_AQUI' AND schedule_id = ws.id
-- );

-- OPCIÓN MEJORADA: Usar profesionales reales de la tabla professionals
-- Este script funciona después de ejecutar database-professionals-enhanced.sql

-- Insertar disponibilidad para todos los profesionales activos en todos los horarios
INSERT INTO professional_availability (professional_id, schedule_id)
SELECT 
    p.id as professional_id,
    ws.id as schedule_id
FROM professionals p
CROSS JOIN work_schedules ws
WHERE p.is_active = true 
AND ws.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM professional_availability pa 
    WHERE pa.professional_id = p.id 
    AND pa.schedule_id = ws.id
)
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron correctamente
DO $$
DECLARE
    total_professionals INTEGER;
    total_schedules INTEGER;
    total_availability INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_professionals FROM professionals WHERE is_active = true;
    SELECT COUNT(*) INTO total_schedules FROM work_schedules WHERE is_active = true;
    SELECT COUNT(*) INTO total_availability FROM professional_availability;
    
    RAISE NOTICE 'Profesionales activos: %', total_professionals;
    RAISE NOTICE 'Horarios activos: %', total_schedules;
    RAISE NOTICE 'Registros de disponibilidad: %', total_availability;
    RAISE NOTICE 'Disponibilidad esperada: %', (total_professionals * total_schedules);
END $$;

-- Script de prueba para eliminar un profesional de un día específico
-- Para probar con solo 1 profesional disponible en lunes (day_of_week = 1), descomenta:
-- DELETE FROM professional_availability 
-- WHERE professional_id = 'prof_002' 
-- AND schedule_id IN (
--   SELECT id FROM work_schedules WHERE day_of_week = 1
-- );