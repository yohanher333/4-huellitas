-- SCRIPT SUPER SIMPLE PARA PROFESSIONAL_AVAILABILITY
-- Ejecuta línea por línea para diagnosticar el problema

-- 1. Verificar estructura de la tabla professional_availability
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professional_availability'
ORDER BY ordinal_position;

-- 2. Verificar si existe tabla professionals
SELECT COUNT(*) as professionals_table_exists 
FROM information_schema.tables 
WHERE table_name = 'professionals';

-- 3. Si existe tabla professionals, ver su contenido
-- SELECT id, name FROM professionals LIMIT 10;

-- 4. Ver contenido actual de professional_availability
-- SELECT * FROM professional_availability LIMIT 10;

-- 5. Ver horarios existentes
-- SELECT id, day_of_week, start_time, end_time FROM work_schedules LIMIT 10;