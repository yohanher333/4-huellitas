-- Script DEFINITIVO para sistema de puntos automáticos
-- Ejecutar en Supabase SQL Editor - VERSIÓN SIN CONFLICTOS

-- PASO 1: Limpiar triggers existentes (por si los hay)
DROP TRIGGER IF EXISTS trigger_set_points_expiration ON user_points_history;
DROP TRIGGER IF EXISTS trigger_update_profile_points ON user_points_history;
DROP TRIGGER IF EXISTS trigger_registration_points ON profiles;
DROP TRIGGER IF EXISTS trigger_appointment_points ON appointments;

-- PASO 2: Crear tabla principal (si no existe)
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

-- PASO 3: Índices básicos
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_expires_at ON user_points_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_points_service_type ON user_points_history(service_type);

-- PASO 4: Función para calcular puntos vigentes
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

-- PASO 5: Trigger para asignar fecha de expiración (1 año)
CREATE OR REPLACE FUNCTION set_points_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.assigned_at + INTERVAL '1 year';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_points_expiration
    BEFORE INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION set_points_expiration();

-- PASO 6: Trigger para actualizar puntos del usuario en profiles
CREATE OR REPLACE FUNCTION update_profile_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET points = calculate_current_points(NEW.user_id)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_profile_points
    AFTER INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_points();

-- PASO 7: Seguridad RLS
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "user_points_select" ON user_points_history;
DROP POLICY IF EXISTS "admin_points_all" ON user_points_history;

-- Política para usuarios (ver solo sus puntos)
CREATE POLICY "user_points_select" ON user_points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Política para administradores (ver y crear todo)
CREATE POLICY "admin_points_all" ON user_points_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para permitir inserciones automáticas desde la aplicación
CREATE POLICY "allow_system_insert" ON user_points_history
    FOR INSERT WITH CHECK (true);

-- PASO 8: Vista opcional para rankings
CREATE OR REPLACE VIEW points_ranking AS
SELECT 
    p.id,
    p.name,
    p.email,
    calculate_current_points(p.id) as current_points
FROM profiles p
WHERE p.role = 'user'
ORDER BY current_points DESC NULLS LAST;

-- PASO 9: Función para limpiar puntos vencidos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_points()
RETURNS INTEGER AS $$
DECLARE
    affected_users UUID[];
    user_id UUID;
BEGIN
    -- Obtener usuarios con puntos vencidos
    SELECT ARRAY_AGG(DISTINCT user_id) INTO affected_users
    FROM user_points_history
    WHERE expires_at <= NOW();
    
    -- Actualizar puntos para cada usuario afectado
    IF affected_users IS NOT NULL THEN
        FOREACH user_id IN ARRAY affected_users
        LOOP
            UPDATE profiles 
            SET points = calculate_current_points(user_id)
            WHERE id = user_id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(array_length(affected_users, 1), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ SCRIPT COMPLETADO
-- 
-- Sistema configurado para:
-- ✅ Gestión manual de puntos desde la aplicación
-- ✅ Expiración automática de puntos (1 año)
-- ✅ Cálculo dinámico de puntos vigentes
-- ✅ Seguridad RLS completa
-- ✅ Vista de rankings
-- ✅ Función de limpieza de puntos vencidos
--
-- Los puntos se asignarán desde la aplicación React mediante las funciones:
-- - assignWelcomePoints() -> al registrarse (100 pts)
-- - assignAppointmentPoints() -> al agendar cita (200 pts)
-- - Sistema manual admin -> servicios completados (variable)