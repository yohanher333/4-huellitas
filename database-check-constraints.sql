-- Verificar el constraint de age_category
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass 
AND conname LIKE '%age_category%';

-- Ver todos los constraints de la tabla pets
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'pets'::regclass;

-- Ver la estructura completa de la tabla pets
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pets'
ORDER BY ordinal_position;
