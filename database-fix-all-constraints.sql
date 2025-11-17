-- Script para arreglar el constraint de gender que está causando el error

-- Ver el constraint actual de gender
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass
AND conname LIKE '%gender%';

-- Eliminar el constraint problemático de gender
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_gender_check;

-- Crear un nuevo constraint que permita NULL o los valores válidos
-- Acepta tanto 'male'/'female' como 'Macho'/'Hembra' y NULL
ALTER TABLE pets ADD CONSTRAINT pets_gender_check 
CHECK (gender IS NULL OR gender != '' AND gender IN ('male', 'female', 'Macho', 'Hembra'));

-- También arreglar species por si acaso
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_species_check;
ALTER TABLE pets ADD CONSTRAINT pets_species_check 
CHECK (species IS NULL OR species != '' AND species IN ('Perro', 'Gato'));

-- Verificar que los constraints se actualizaron correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass
AND contype = 'c'
ORDER BY conname;
