-- PASO 1: Ejecutar este script primero
-- Crear tablas básicas

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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_day ON custom_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_active ON custom_time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_slot ON custom_slot_availability(slot_id);
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_professional ON custom_slot_availability(professional_id);

SELECT 'Paso 1 completado - Tablas creadas' as status;