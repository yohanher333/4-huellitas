-- Verificar si las tablas existen y crear si es necesario
-- Script de reparación para sistema de franjas personalizadas

-- 1. Verificar tablas existentes
DO $$
BEGIN
    -- Crear tabla custom_time_slots si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_time_slots') THEN
        CREATE TABLE custom_time_slots (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        RAISE NOTICE 'Tabla custom_time_slots creada';
    ELSE
        RAISE NOTICE 'Tabla custom_time_slots ya existe';
    END IF;

    -- Crear tabla custom_slot_availability si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_slot_availability') THEN
        CREATE TABLE custom_slot_availability (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            slot_id UUID REFERENCES custom_time_slots(id) ON DELETE CASCADE,
            professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
            is_available BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(slot_id, professional_id)
        );
        
        RAISE NOTICE 'Tabla custom_slot_availability creada';
    ELSE
        RAISE NOTICE 'Tabla custom_slot_availability ya existe';
    END IF;
END
$$;