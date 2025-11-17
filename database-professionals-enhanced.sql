-- SCRIPT PARA CREAR/ACTUALIZAR TABLA PROFESSIONALS CON FUNCIONALIDADES MEJORADAS
-- Ejecutar este script en Supabase SQL Editor

-- 1. VERIFICAR SI LA TABLA PROFESSIONALS EXISTE
-- Ejecuta primero este query para ver si existe:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'professionals';

-- 2. CREAR O ACTUALIZAR TABLA PROFESSIONALS
-- Si la tabla no existe, la creamos completa
CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialties TEXT[], -- Array de especialidades
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existe, agregar las columnas que falten
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_name ON professionals(name);
CREATE INDEX IF NOT EXISTS idx_professionals_specialties ON professionals USING GIN(specialties);

-- 4. HABILITAR RLS (Row Level Security)
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS DE SEGURIDAD
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow public read access" ON professionals;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON professionals;

-- Política para permitir que todos puedan leer profesionales activos
CREATE POLICY "Allow public read access" ON professionals
FOR SELECT USING (is_active = true);

-- Política para permitir que usuarios autenticados puedan gestionar profesionales
CREATE POLICY "Allow authenticated users full access" ON professionals
FOR ALL USING (auth.role() = 'authenticated');

-- 6. CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. CREAR TRIGGER PARA ACTUALIZAR updated_at
DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. INSERTAR DATOS DE EJEMPLO (solo si no existen profesionales)
-- Verificar si hay profesionales existentes
DO $$
BEGIN
    -- Solo insertar si la tabla está vacía
    IF NOT EXISTS (SELECT 1 FROM professionals LIMIT 1) THEN
        
        INSERT INTO professionals (id, name, specialties, phone, email, photo_url, bio, years_experience, is_active) 
        VALUES 
        (
            'prof_001', 
            'Dr. María González',
            ARRAY['Corte', 'Baño', 'Desparasitación', 'Vacunación'],
            '+57 300 123 4567',
            'maria.gonzalez@4huellitas.com',
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
            'Veterinaria especializada en cuidado integral de mascotas con más de 8 años de experiencia. Especialista en medicina preventiva y tratamientos de bienestar animal.',
            8,
            true
        ),
        (
            'prof_002', 
            'Dr. Carlos Ramírez',
            ARRAY['Corte', 'Baño', 'Limpieza Dental', 'Consulta Médica'],
            '+57 301 987 6543',
            'carlos.ramirez@4huellitas.com',
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
            'Veterinario con especialización en odontología veterinaria y cuidado estético. Comprometido con el bienestar y la salud integral de las mascotas.',
            5,
            true
        ),
        (
            'prof_003', 
            'Dra. Ana Martínez',
            ARRAY['Baño', 'Desparasitación', 'Vacunación', 'Consulta Médica'],
            '+57 302 456 7890',
            'ana.martinez@4huellitas.com',
            'https://images.unsplash.com/photo-1594824369926-d0289b7ad93b?w=400&h=400&fit=crop&crop=face',
            'Médica veterinaria especializada en medicina preventiva y cuidados básicos. Apasionada por la educación en salud animal y el bienestar de las mascotas.',
            6,
            true
        );

        RAISE NOTICE 'Se insertaron 3 profesionales de ejemplo en la tabla professionals';
    ELSE
        RAISE NOTICE 'La tabla professionals ya contiene datos, no se insertaron ejemplos';
    END IF;
END $$;

-- 9. VERIFICAR Y ACTUALIZAR TABLA professional_availability
-- Asegurar que todos los profesionales estén disponibles en todos los horarios

-- Insertar en professional_availability para cada profesional y horario
-- Manejo de compatibilidad de tipos UUID/TEXT
INSERT INTO professional_availability (professional_id, schedule_id)
SELECT 
    p.id::text as professional_id,
    ws.id as schedule_id
FROM professionals p
CROSS JOIN work_schedules ws
WHERE p.is_active = true 
AND ws.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM professional_availability pa 
    WHERE pa.professional_id = p.id::text 
    AND pa.schedule_id = ws.id
)
ON CONFLICT DO NOTHING;

-- 10. VERIFICAR RESULTADOS
-- Ejecutar estos queries para verificar que todo está correcto:

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professionals'
ORDER BY ordinal_position;

-- Ver profesionales insertados
SELECT id, name, specialties, phone, email, years_experience, is_active 
FROM professionals 
ORDER BY name;

-- Ver disponibilidad de profesionales
SELECT 
    p.name as profesional,
    ws.day_of_week,
    ws.start_time,
    ws.end_time
FROM professional_availability pa
JOIN professionals p ON p.id::text = pa.professional_id
JOIN work_schedules ws ON ws.id = pa.schedule_id
WHERE p.is_active = true AND ws.is_active = true
ORDER BY ws.day_of_week, ws.start_time, p.name;

-- NOTAS:
-- 1. Este script es seguro de ejecutar múltiples veces
-- 2. No sobrescribe datos existentes
-- 3. Solo agrega las columnas que faltan
-- 4. Inserta profesionales ejemplo solo si la tabla está vacía
-- 5. Actualiza professional_availability automáticamente

-- MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '🎉 Script ejecutado correctamente. Tabla professionals mejorada y lista para usar.';
END $$;