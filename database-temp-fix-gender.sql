-- SOLUCIÓN TEMPORAL: Permitir cadenas vacías en gender
-- Esto permitirá que funcione mientras el código del navegador se actualiza

-- Eliminar el constraint actual de gender
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_gender_check;

-- Crear un constraint más permisivo que acepte NULL, cadenas vacías O los valores válidos
ALTER TABLE pets ADD CONSTRAINT pets_gender_check 
CHECK (
  gender IS NULL OR 
  gender = '' OR 
  gender IN ('male', 'female', 'Macho', 'Hembra')
);

-- Verificar el nuevo constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass
AND conname = 'pets_gender_check';
