-- Custom Time Slots System for 4HUELLITAS
-- This script creates the infrastructure for flexible time slot management

-- Create table for custom time slots
CREATE TABLE IF NOT EXISTS custom_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_day_of_week ON custom_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_active ON custom_time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_time_slots_time_range ON custom_time_slots(start_time, end_time);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at management
DROP TRIGGER IF EXISTS update_custom_time_slots_updated_at ON custom_time_slots;
CREATE TRIGGER update_custom_time_slots_updated_at
    BEFORE UPDATE ON custom_time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table for professional availability in custom slots
CREATE TABLE IF NOT EXISTS custom_slot_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES custom_time_slots(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(slot_id, professional_id)
);

-- Create indexes for professional availability
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_slot ON custom_slot_availability(slot_id);
CREATE INDEX IF NOT EXISTS idx_custom_slot_availability_professional ON custom_slot_availability(professional_id);

-- RLS Policies for security
ALTER TABLE custom_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_slot_availability ENABLE ROW LEVEL SECURITY;

-- Allow public read access to schedules
CREATE POLICY "Allow public read access to custom_time_slots" ON custom_time_slots
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to custom_slot_availability" ON custom_slot_availability
    FOR SELECT USING (true);

-- Admin policies for custom_time_slots
CREATE POLICY "Admin full access to custom_time_slots" ON custom_time_slots
    USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

CREATE POLICY "Admin full access to custom_slot_availability" ON custom_slot_availability
    USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');

-- Function to get available custom slots for a specific day
CREATE OR REPLACE FUNCTION get_available_custom_slots(target_date DATE)
RETURNS TABLE (
    slot_id UUID,
    start_time TIME,
    end_time TIME,
    available_professionals_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cts.id as slot_id,
        cts.start_time,
        cts.end_time,
        COALESCE(COUNT(csa.professional_id), 0)::INTEGER as available_professionals_count
    FROM custom_time_slots cts
    LEFT JOIN custom_slot_availability csa ON (
        cts.id = csa.slot_id 
        AND csa.is_available = true
    )
    WHERE 
        cts.day_of_week = EXTRACT(DOW FROM target_date)
        AND cts.is_active = true
    GROUP BY cts.id, cts.start_time, cts.end_time
    ORDER BY cts.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check slot availability for booking
CREATE OR REPLACE FUNCTION check_custom_slot_availability(
    target_date DATE,
    slot_start TIME,
    slot_end TIME
)
RETURNS TABLE (
    can_book BOOLEAN,
    available_count INTEGER,
    booked_count INTEGER,
    message TEXT
) AS $$
DECLARE
    day_of_week_num INTEGER;
    slot_record RECORD;
    appointments_count INTEGER;
BEGIN
    -- Get day of week (0=Sunday, 1=Monday, etc.)
    day_of_week_num := EXTRACT(DOW FROM target_date);
    
    -- Find the custom slot
    SELECT cts.id, COUNT(csa.professional_id) as total_professionals
    INTO slot_record
    FROM custom_time_slots cts
    LEFT JOIN custom_slot_availability csa ON (
        cts.id = csa.slot_id 
        AND csa.is_available = true
    )
    WHERE 
        cts.day_of_week = day_of_week_num
        AND cts.start_time = slot_start
        AND cts.end_time = slot_end
        AND cts.is_active = true
    GROUP BY cts.id;
    
    -- If no slot found, return false
    IF slot_record.id IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 'Horario no disponible';
        RETURN;
    END IF;
    
    -- Count existing appointments for this time slot
    SELECT COUNT(*)::INTEGER
    INTO appointments_count
    FROM appointments a
    WHERE 
        a.status = 'scheduled'
        AND DATE(a.appointment_time) = target_date
        AND TIME(a.appointment_time) >= slot_start
        AND TIME(a.appointment_time) < slot_end;
    
    -- Check if we can book (appointments < available professionals)
    RETURN QUERY SELECT 
        (appointments_count < slot_record.total_professionals), 
        slot_record.total_professionals::INTEGER,
        appointments_count,
        CASE 
            WHEN appointments_count < slot_record.total_professionals THEN 'Disponible'
            ELSE 'Completo'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default time slots (these can be customized by admin)
INSERT INTO custom_time_slots (day_of_week, start_time, end_time) VALUES
-- Lunes
(1, '09:00:00', '09:30:00'),
(1, '09:30:00', '10:00:00'),
(1, '10:00:00', '10:30:00'),
(1, '10:30:00', '11:00:00'),
(1, '11:00:00', '11:30:00'),
(1, '14:00:00', '14:30:00'),
(1, '14:30:00', '15:00:00'),
(1, '15:00:00', '15:30:00'),
(1, '15:30:00', '16:00:00'),
-- Martes
(2, '09:00:00', '09:30:00'),
(2, '09:30:00', '10:00:00'),
(2, '10:00:00', '10:30:00'),
(2, '14:00:00', '14:30:00'),
(2, '14:30:00', '15:00:00'),
-- Miércoles
(3, '09:00:00', '09:10:00'), -- Slot personalizado de 10 minutos como ejemplo
(3, '09:15:00', '09:45:00'), -- Slot de 30 minutos
(3, '10:00:00', '11:00:00'), -- Slot de 1 hora
(3, '14:00:00', '14:20:00'), -- Slot de 20 minutos
-- Viernes
(5, '09:00:00', '09:30:00'),
(5, '09:30:00', '10:00:00'),
(5, '14:00:00', '14:30:00'),
(5, '14:30:00', '15:00:00'),
(5, '15:00:00', '15:30:00')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE custom_time_slots IS 'Gestiona las franjas horarias personalizadas por día de la semana';
COMMENT ON TABLE custom_slot_availability IS 'Gestiona la disponibilidad de profesionales en cada franja horaria personalizada';
COMMENT ON FUNCTION get_available_custom_slots IS 'Obtiene las franjas horarias disponibles para una fecha específica';
COMMENT ON FUNCTION check_custom_slot_availability IS 'Verifica si una franja horaria específica está disponible para reservar';