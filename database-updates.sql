-- Script para añadir el campo assigned_professional_id a la tabla appointments
-- Este script debe ejecutarse en Supabase SQL Editor

-- 1. Añadir la columna assigned_professional_id a la tabla appointments
ALTER TABLE appointments 
ADD COLUMN assigned_professional_id UUID REFERENCES professionals(id);

-- 2. Crear un índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_appointments_assigned_professional 
ON appointments(assigned_professional_id);

-- 3. Comentario en la columna para documentación
COMMENT ON COLUMN appointments.assigned_professional_id 
IS 'ID del profesional asignado a esta cita';

-- 4. Función mejorada para obtener slots disponibles considerando profesionales
-- Esta función reemplaza la anterior get_available_slots
CREATE OR REPLACE FUNCTION get_available_slots_with_professionals(
    selected_date DATE,
    service_duration INTEGER DEFAULT 120,
    cleanup_duration INTEGER DEFAULT 30
)
RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    available_professionals INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    day_of_week INTEGER;
    total_duration INTEGER;
    current_time TIME;
    slot_start TIME;
    slot_end TIME;
    available_count INTEGER;
BEGIN
    -- Obtener el día de la semana (0=domingo, 1=lunes, etc.)
    day_of_week := EXTRACT(DOW FROM selected_date);
    total_duration := service_duration + cleanup_duration;
    
    -- Obtener horarios de trabajo para este día
    FOR current_time IN 
        SELECT DISTINCT ws.start_time
        FROM work_schedules ws
        WHERE ws.day_of_week = day_of_week 
        AND ws.is_active = true
        ORDER BY ws.start_time
    LOOP
        -- Generar slots cada 30 minutos
        slot_start := current_time;
        
        -- Verificar que el slot completo quepa en algún horario de trabajo
        WHILE EXISTS (
            SELECT 1 FROM work_schedules ws 
            WHERE ws.day_of_week = day_of_week 
            AND ws.is_active = true
            AND slot_start >= ws.start_time 
            AND (slot_start + (total_duration || ' minutes')::INTERVAL)::TIME <= ws.end_time
        ) LOOP
            slot_end := (slot_start + (service_duration || ' minutes')::INTERVAL)::TIME;
            
            -- Contar profesionales disponibles para este slot
            SELECT COUNT(*) INTO available_count
            FROM (
                SELECT DISTINCT pa.professional_id
                FROM work_schedules ws
                JOIN professional_availability pa ON ws.id = pa.schedule_id
                WHERE ws.day_of_week = day_of_week 
                AND ws.is_active = true
                AND slot_start >= ws.start_time 
                AND (slot_start + (total_duration || ' minutes')::INTERVAL)::TIME <= ws.end_time
                AND NOT EXISTS (
                    -- Verificar que el profesional no esté ocupado
                    SELECT 1 FROM appointments a
                    JOIN services s ON a.service_id = s.id
                    WHERE a.assigned_professional_id = pa.professional_id
                    AND a.status = 'scheduled'
                    AND DATE(a.appointment_time) = selected_date
                    AND (
                        (a.appointment_time::TIME, 
                         (a.appointment_time + ((COALESCE(s.duration_minutes, 120) + COALESCE(s.cleanup_duration_minutes, 30)) || ' minutes')::INTERVAL)::TIME)
                        OVERLAPS 
                        (slot_start, (slot_start + (total_duration || ' minutes')::INTERVAL)::TIME)
                    )
                )
            ) available_professionals;
            
            -- Solo devolver slots con al menos un profesional disponible
            -- y que no sean en el pasado
            IF available_count > 0 AND 
               (selected_date > CURRENT_DATE OR 
                (selected_date = CURRENT_DATE AND slot_start > CURRENT_TIME)) THEN
                start_time := slot_start;
                end_time := slot_end;
                available_professionals := available_count;
                RETURN NEXT;
            END IF;
            
            -- Incrementar a la siguiente ranura de 30 minutos
            slot_start := slot_start + INTERVAL '30 minutes';
        END LOOP;
    END LOOP;
    
    RETURN;
END;
$$;

-- 5. Función para asignar automáticamente un profesional disponible
CREATE OR REPLACE FUNCTION assign_available_professional(
    appointment_datetime TIMESTAMP,
    service_duration INTEGER DEFAULT 120,
    cleanup_duration INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    day_of_week INTEGER;
    total_duration INTEGER;
    professional_id UUID;
    appointment_time TIME;
    appointment_date DATE;
BEGIN
    appointment_date := DATE(appointment_datetime);
    appointment_time := appointment_datetime::TIME;
    day_of_week := EXTRACT(DOW FROM appointment_date);
    total_duration := service_duration + cleanup_duration;
    
    -- Buscar el primer profesional disponible
    SELECT pa.professional_id INTO professional_id
    FROM work_schedules ws
    JOIN professional_availability pa ON ws.id = pa.schedule_id
    WHERE ws.day_of_week = day_of_week 
    AND ws.is_active = true
    AND appointment_time >= ws.start_time 
    AND (appointment_time + (total_duration || ' minutes')::INTERVAL)::TIME <= ws.end_time
    AND NOT EXISTS (
        -- Verificar que el profesional no esté ocupado
        SELECT 1 FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.assigned_professional_id = pa.professional_id
        AND a.status = 'scheduled'
        AND DATE(a.appointment_time) = appointment_date
        AND (
            (a.appointment_time::TIME, 
             (a.appointment_time + ((COALESCE(s.duration_minutes, 120) + COALESCE(s.cleanup_duration_minutes, 30)) || ' minutes')::INTERVAL)::TIME)
            OVERLAPS 
            (appointment_time, (appointment_time + (total_duration || ' minutes')::INTERVAL)::TIME)
        )
    )
    ORDER BY pa.professional_id -- Para consistencia en la asignación
    LIMIT 1;
    
    RETURN professional_id;
END;
$$;

-- 6. Trigger para asignar automáticamente profesional al insertar cita (opcional)
CREATE OR REPLACE FUNCTION auto_assign_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    service_duration INTEGER;
    cleanup_duration INTEGER;
BEGIN
    -- Solo asignar si no se especificó profesional
    IF NEW.assigned_professional_id IS NULL THEN
        -- Obtener duraciones del servicio
        SELECT duration_minutes, cleanup_duration_minutes 
        INTO service_duration, cleanup_duration
        FROM services 
        WHERE id = NEW.service_id;
        
        -- Asignar profesional disponible
        NEW.assigned_professional_id := assign_available_professional(
            NEW.appointment_time,
            COALESCE(service_duration, 120),
            COALESCE(cleanup_duration, 30)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. Crear el trigger (descomenta si quieres asignación automática en BD)
-- CREATE TRIGGER trigger_auto_assign_professional
--     BEFORE INSERT ON appointments
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_assign_professional();

-- 8. Política de seguridad para el campo assigned_professional_id
-- (Adapta según tus políticas RLS existentes)

-- Permitir lectura del campo assigned_professional_id a usuarios autenticados
-- CREATE POLICY "Users can view assigned professional" ON appointments
--     FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir a administradores modificar assigned_professional_id
-- CREATE POLICY "Admins can manage assigned professional" ON appointments
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     );