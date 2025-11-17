-- Script para ELIMINAR el check constraint problemático de age_category
-- Este constraint está causando problemas porque no acepta NULL

-- Ver el constraint actual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass 
AND conname LIKE '%age_category%';

-- Si el constraint no permite NULL, lo eliminamos y creamos uno nuevo que sí lo permita
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_age_category_check;

-- Crear un nuevo constraint que permita NULL o los valores válidos
ALTER TABLE pets ADD CONSTRAINT pets_age_category_check 
CHECK (age_category IS NULL OR age_category IN ('cachorro', 'joven', 'adulto', 'senior'));

-- Verificar que el constraint se actualizó
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass 
AND conname = 'pets_age_category_check';
