-- PASO 4A: Ejecutar después del paso 3B
-- Política de administrador para custom_time_slots

DROP POLICY IF EXISTS "Admin full access custom_time_slots" ON custom_time_slots;
CREATE POLICY "Admin full access custom_time_slots" ON custom_time_slots
    FOR ALL USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

SELECT 'Política admin 1 creada' as status;