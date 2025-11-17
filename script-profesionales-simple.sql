-- SCRIPT SIMPLIFICADO PARA PROFESSIONAL_AVAILABILITY
-- Ejecuta SOLO las líneas que necesites basándote en la estructura de tu tabla

-- 1. PRIMERO: Verifica qué columnas tiene tu tabla
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'professional_availability';

-- 2. Si la tabla NO existe, créala con esta estructura básica:
-- CREATE TABLE professional_availability (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   professional_id TEXT NOT NULL,
--   schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 3. Habilitar RLS si no está habilitado:
-- ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas si no existen:
-- DROP POLICY IF EXISTS "Allow public read access" ON professional_availability;
-- CREATE POLICY "Allow public read access" ON professional_availability FOR SELECT USING (true);

-- DROP POLICY IF EXISTS "Allow authenticated users full access" ON professional_availability;  
-- CREATE POLICY "Allow authenticated users full access" ON professional_availability FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insertar profesionales (SIN professional_name):
INSERT INTO professional_availability (professional_id, schedule_id)
SELECT 
  'prof_001',
  ws.id
FROM work_schedules ws
WHERE NOT EXISTS (
  SELECT 1 FROM professional_availability 
  WHERE professional_id = 'prof_001' AND schedule_id = ws.id
);

INSERT INTO professional_availability (professional_id, schedule_id)
SELECT 
  'prof_002',
  ws.id
FROM work_schedules ws
WHERE NOT EXISTS (
  SELECT 1 FROM professional_availability 
  WHERE professional_id = 'prof_002' AND schedule_id = ws.id
);

-- 6. Verificar que se insertaron correctamente:
-- SELECT pa.professional_id, ws.day_of_week, ws.start_time, ws.end_time 
-- FROM professional_availability pa
-- JOIN work_schedules ws ON pa.schedule_id = ws.id
-- ORDER BY ws.day_of_week, ws.start_time;