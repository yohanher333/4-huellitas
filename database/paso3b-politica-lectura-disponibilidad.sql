-- PASO 3B: Ejecutar después del paso 3A
-- Política de lectura pública para custom_slot_availability

DROP POLICY IF EXISTS "Allow public read custom_slot_availability" ON custom_slot_availability;
CREATE POLICY "Allow public read custom_slot_availability" ON custom_slot_availability
    FOR SELECT USING (true);

SELECT 'Política 2 creada' as status;