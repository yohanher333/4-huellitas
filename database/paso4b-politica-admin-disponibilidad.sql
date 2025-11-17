-- PASO 4B: Ejecutar después del paso 4A
-- Política de administrador para custom_slot_availability

DROP POLICY IF EXISTS "Admin full access custom_slot_availability" ON custom_slot_availability;
CREATE POLICY "Admin full access custom_slot_availability" ON custom_slot_availability
    FOR ALL USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

SELECT 'Política admin 2 creada' as status;