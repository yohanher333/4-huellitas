-- Script para agregar la columna weight (peso) a la tabla pets
-- Solo el administrador puede editar este campo, los usuarios solo pueden verlo

-- Agregar columna weight si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pets' 
        AND column_name = 'weight'
    ) THEN
        ALTER TABLE pets ADD COLUMN weight DECIMAL(5,2);
        COMMENT ON COLUMN pets.weight IS 'Peso de la mascota en kilogramos';
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pets' 
AND column_name = 'weight';
