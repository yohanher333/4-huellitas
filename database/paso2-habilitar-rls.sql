-- PASO 2: Ejecutar después del paso 1
-- Configurar seguridad RLS

ALTER TABLE custom_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_slot_availability ENABLE ROW LEVEL SECURITY;

SELECT 'Paso 2 completado - RLS habilitado' as status;