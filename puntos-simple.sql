-- Script simple y funcional para sistema de puntos
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Crear tabla principal
CREATE TABLE IF NOT EXISTS user_points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 0),
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Indices basicos
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_expires_at ON user_points_history(expires_at);

-- PASO 3: Funcion para calcular puntos vigentes
CREATE OR REPLACE FUNCTION calculate_current_points(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(points) 
         FROM user_points_history 
         WHERE user_id = target_user_id 
         AND expires_at > NOW()),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Trigger para asignar fecha de expiracion
CREATE OR REPLACE FUNCTION set_points_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.assigned_at + INTERVAL '1 year';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_points_expiration ON user_points_history;
CREATE TRIGGER trigger_set_points_expiration
    BEFORE INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION set_points_expiration();

-- PASO 5: Trigger para actualizar puntos del usuario
CREATE OR REPLACE FUNCTION update_profile_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET points = calculate_current_points(NEW.user_id)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_profile_points ON user_points_history;
CREATE TRIGGER trigger_update_profile_points
    AFTER INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_points();

-- PASO 6: Seguridad RLS
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

-- Politica para usuarios (ver solo sus puntos)
DROP POLICY IF EXISTS "user_points_select" ON user_points_history;
CREATE POLICY "user_points_select" ON user_points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Politica para administradores (ver y crear todo)
DROP POLICY IF EXISTS "admin_points_all" ON user_points_history;
CREATE POLICY "admin_points_all" ON user_points_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- PASO 7: Funcion para asignar puntos automaticos por registro
CREATE OR REPLACE FUNCTION assign_registration_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo asignar puntos si es un usuario regular (no admin)
    IF NEW.role = 'user' THEN
        INSERT INTO user_points_history (user_id, points, service_type, description)
        VALUES (NEW.id, 100, 'registration', 'Puntos de bienvenida por registrarse');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para puntos por registro
DROP TRIGGER IF EXISTS trigger_registration_points ON profiles;
CREATE TRIGGER trigger_registration_points
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_registration_points();

-- PASO 8: Funcion para asignar puntos por cita agendada
CREATE OR REPLACE FUNCTION assign_appointment_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo asignar puntos cuando se crea una cita (INSERT) con status 'scheduled'
    IF TG_OP = 'INSERT' AND NEW.status = 'scheduled' THEN
        INSERT INTO user_points_history (user_id, points, service_type, description)
        VALUES (NEW.owner_id, 200, 'appointment_scheduled', 'Puntos por agendar cita médica');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para puntos por cita agendada
DROP TRIGGER IF EXISTS trigger_appointment_points ON appointments;
CREATE TRIGGER trigger_appointment_points
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION assign_appointment_points();

-- PASO 9: Vista opcional para rankings
CREATE OR REPLACE VIEW points_ranking AS
SELECT 
    p.id,
    p.name,
    p.email,
    calculate_current_points(p.id) as current_points
FROM profiles p
WHERE p.role = 'user'
ORDER BY current_points DESC NULLS LAST;

-- PASO 10: Funcion opcional para verificar puntos de bienvenida (no usada actualmente)
-- CREATE OR REPLACE FUNCTION has_welcome_points(target_user_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN EXISTS (
--         SELECT 1 FROM user_points_history 
--         WHERE user_id = target_user_id 
--         AND service_type = 'registration'
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Listo para usar!
-- Ahora los usuarios reciben:
-- - 100 puntos al registrarse automaticamente
-- - 200 puntos por cada cita que agendan
-- - Los puntos manuales del administrador (corte uñas, spa, etc.)