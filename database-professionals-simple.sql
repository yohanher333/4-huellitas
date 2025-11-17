-- SCRIPT SIMPLIFICADO PARA PROFESIONALES - SIN PROBLEMAS DE TIPOS
-- Este script evita los JOINs problemáticos y se enfoca en crear la estructura

-- 1. CREAR O ACTUALIZAR TABLA PROFESSIONALS
CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialties TEXT[], 
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agregar columnas que falten
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_name ON professionals(name);
CREATE INDEX IF NOT EXISTS idx_professionals_specialties ON professionals USING GIN(specialties);

-- 3. RLS Y POLÍTICAS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON professionals;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON professionals;

CREATE POLICY "Allow public read access" ON professionals
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access" ON professionals
FOR ALL USING (auth.role() = 'authenticated');

-- 4. FUNCIÓN Y TRIGGER PARA updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. INSERTAR DATOS DE EJEMPLO
DO $$
BEGIN
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

        RAISE NOTICE '✅ Se insertaron 3 profesionales de ejemplo en la tabla professionals';
    ELSE
        RAISE NOTICE '⚠️ La tabla professionals ya contiene datos, no se insertaron ejemplos';
    END IF;
END $$;

-- 6. VERIFICACIÓN SIMPLE SIN JOINS PROBLEMÁTICOS
DO $$
DECLARE
    total_professionals INTEGER;
    total_schedules INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_professionals FROM professionals WHERE is_active = true;
    SELECT COUNT(*) INTO total_schedules FROM work_schedules WHERE is_active = true;
    
    RAISE NOTICE '📊 Profesionales activos: %', total_professionals;
    RAISE NOTICE '📅 Horarios de trabajo activos: %', total_schedules;
    RAISE NOTICE '🎯 Ejecuta database-availability-final.sql para conectar profesionales con horarios';
END $$;

-- 7. MOSTRAR ESTRUCTURA FINAL
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'professionals'
ORDER BY ordinal_position;

-- 8. MOSTRAR PROFESIONALES INSERTADOS
SELECT 
    id, 
    name, 
    array_length(specialties, 1) as num_especialidades,
    phone, 
    email, 
    years_experience, 
    is_active 
FROM professionals 
ORDER BY name;

-- MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '🎉 Tabla professionals creada y configurada correctamente';
    RAISE NOTICE '📋 Ahora ejecuta database-availability-final.sql para completar la configuración';
END $$;