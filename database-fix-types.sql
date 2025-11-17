-- SCRIPT DE CORRECCIÓN DE TIPOS DE DATOS
-- Ejecutar ANTES de los otros scripts si hay problemas de tipos UUID/TEXT

-- 1. VERIFICAR TIPOS ACTUALES
DO $$
DECLARE
    professionals_id_type TEXT;
    availability_professional_id_type TEXT;
BEGIN
    -- Obtener tipo de professionals.id
    SELECT data_type INTO professionals_id_type
    FROM information_schema.columns 
    WHERE table_name = 'professionals' AND column_name = 'id';
    
    -- Obtener tipo de professional_availability.professional_id
    SELECT data_type INTO availability_professional_id_type
    FROM information_schema.columns 
    WHERE table_name = 'professional_availability' AND column_name = 'professional_id';
    
    RAISE NOTICE 'Tipo professionals.id: %', COALESCE(professionals_id_type, 'Tabla no existe');
    RAISE NOTICE 'Tipo professional_availability.professional_id: %', COALESCE(availability_professional_id_type, 'Tabla no existe');
    
    -- Si hay incompatibilidad, mostrar sugerencias
    IF professionals_id_type IS NOT NULL AND availability_professional_id_type IS NOT NULL THEN
        IF professionals_id_type != availability_professional_id_type THEN
            RAISE NOTICE '⚠️ INCOMPATIBILIDAD DE TIPOS DETECTADA';
            RAISE NOTICE '📝 professionals.id es: %', professionals_id_type;
            RAISE NOTICE '📝 professional_availability.professional_id es: %', availability_professional_id_type;
            RAISE NOTICE '🔧 Los scripts han sido corregidos para manejar esta incompatibilidad automáticamente';
        ELSE
            RAISE NOTICE '✅ Tipos compatibles - no se requiere conversión';
        END IF;
    END IF;
END $$;

-- 2. OPCIÓN A: CONVERTIR professional_availability.professional_id de TEXT a UUID
-- Solo ejecutar si professionals.id es UUID y quieres uniformidad completa
-- DESCOMENTA las siguientes líneas si quieres hacer la conversión:

/*
-- Respaldar datos existentes
CREATE TABLE IF NOT EXISTS professional_availability_backup AS 
SELECT * FROM professional_availability;

-- Eliminar constraint de foreign key temporalmente si existe
-- ALTER TABLE professional_availability DROP CONSTRAINT IF EXISTS professional_availability_professional_id_fkey;

-- Actualizar el tipo de columna
ALTER TABLE professional_availability 
ALTER COLUMN professional_id TYPE UUID USING professional_id::uuid;

-- Restaurar foreign key si es necesario
-- ALTER TABLE professional_availability 
-- ADD CONSTRAINT professional_availability_professional_id_fkey 
-- FOREIGN KEY (professional_id) REFERENCES professionals(id);

RAISE NOTICE '✅ Convertido professional_availability.professional_id a UUID';
*/

-- 3. OPCIÓN B: CONVERTIR professionals.id de UUID a TEXT
-- Solo ejecutar si prefieres usar TEXT en todo el sistema
-- DESCOMENTA las siguientes líneas si quieres hacer la conversión:

/*
-- Respaldar datos existentes
CREATE TABLE IF NOT EXISTS professionals_backup AS 
SELECT * FROM professionals;

-- Actualizar appointments si tiene foreign key a professionals
UPDATE appointments 
SET assigned_professional_id = assigned_professional_id::text::text
WHERE assigned_professional_id IS NOT NULL;

-- Actualizar el tipo de columna en professionals
ALTER TABLE professionals 
ALTER COLUMN id TYPE TEXT USING id::text;

RAISE NOTICE '✅ Convertido professionals.id a TEXT';
*/

-- 4. VERIFICACIÓN FINAL
SELECT 
    'professionals' as tabla,
    'id' as columna,
    data_type,
    CASE 
        WHEN data_type IN ('uuid', 'text', 'character varying') THEN '✅'
        ELSE '⚠️'
    END as status
FROM information_schema.columns 
WHERE table_name = 'professionals' AND column_name = 'id'

UNION ALL

SELECT 
    'professional_availability' as tabla,
    'professional_id' as columna,
    data_type,
    CASE 
        WHEN data_type IN ('uuid', 'text', 'character varying') THEN '✅'
        ELSE '⚠️'
    END as status
FROM information_schema.columns 
WHERE table_name = 'professional_availability' AND column_name = 'professional_id';

-- MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '🎯 Script de corrección de tipos completado';
    RAISE NOTICE '📋 Los demás scripts ahora usan conversión automática (::text)';
    RAISE NOTICE '🚀 Puedes ejecutar database-professionals-enhanced.sql y database-availability-final.sql';
END $$;