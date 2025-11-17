-- PASO 3: Ejecutar después del paso 2
-- Crear políticas de seguridad (una por una)

-- Política de lectura pública para custom_time_slots
DROP POLICY IF EXISTS "Allow public read custom_time_slots" ON custom_time_slots;
CREATE POLICY "Allow public read custom_time_slots" ON custom_time_slots
    FOR SELECT USING (true);

SELECT 'Política 1 creada' as status;