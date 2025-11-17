-- SCRIPT SÚPER SIMPLE - Ejecutar TODO de una vez
-- Copia y pega esto completo en Supabase SQL Editor

-- Crear tablas
CREATE TABLE IF NOT EXISTS custom_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_slot_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES custom_time_slots(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slot_id, professional_id)
);

-- Datos de ejemplo
INSERT INTO custom_time_slots (day_of_week, start_time, end_time) VALUES
(1, '09:00:00', '09:30:00'),
(1, '09:30:00', '10:00:00'),
(1, '10:00:00', '10:30:00'),
(3, '09:00:00', '09:15:00'),
(3, '09:30:00', '10:30:00'),
(5, '09:00:00', '09:30:00'),
(5, '14:00:00', '14:30:00')
ON CONFLICT DO NOTHING;

SELECT 'Sistema básico configurado. Ahora prueba la aplicación!' as mensaje;