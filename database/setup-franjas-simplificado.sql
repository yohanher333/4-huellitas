-- Script Simplificado para Franjas Personalizadas
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla de franjas horarias personalizadas
CREATE TABLE IF NOT EXISTS custom_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Lunes, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de disponibilidad de profesionales por franja
CREATE TABLE IF NOT EXISTS custom_slot_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES custom_time_slots(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slot_id, professional_id)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_day ON custom_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_active ON custom_time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_slot ON custom_slot_availability(slot_id);
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_professional ON custom_slot_availability(professional_id);

-- 4. Configurar seguridad RLS
ALTER TABLE custom_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_slot_availability ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acceso público (solo lectura)
DROP POLICY IF EXISTS "Allow public read custom_time_slots" ON custom_time_slots;
CREATE POLICY "Allow public read custom_time_slots" ON custom_time_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read custom_slot_availability" ON custom_slot_availability;
CREATE POLICY "Allow public read custom_slot_availability" ON custom_slot_availability
    FOR SELECT USING (true);

-- 6. Políticas de administrador (acceso completo)
DROP POLICY IF EXISTS "Admin full access custom_time_slots" ON custom_time_slots;
CREATE POLICY "Admin full access custom_time_slots" ON custom_time_slots
    USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

DROP POLICY IF EXISTS "Admin full access custom_slot_availability" ON custom_slot_availability;
CREATE POLICY "Admin full access custom_slot_availability" ON custom_slot_availability
    USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

-- 7. Insertar datos de ejemplo (opcional)
INSERT INTO custom_time_slots (day_of_week, start_time, end_time) VALUES
-- Lunes (ejemplos)
(1, '09:00:00', '09:30:00'),
(1, '09:30:00', '10:00:00'),
(1, '10:00:00', '10:30:00'),
(1, '14:00:00', '14:30:00'),
(1, '14:30:00', '15:00:00'),
-- Miércoles (franjas variables como ejemplo)
(3, '09:00:00', '09:15:00'), -- 15 minutos
(3, '09:30:00', '10:30:00'), -- 1 hora
(3, '14:00:00', '14:20:00'), -- 20 minutos
-- Viernes
(5, '09:00:00', '09:30:00'),
(5, '10:00:00', '10:30:00'),
(5, '14:00:00', '14:30:00')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
SELECT 'Sistema de franjas personalizadas configurado exitosamente!' as message;