-- Script limpio para implementar el sistema de puntos con expiracion anual
-- Ejecutar paso a paso en la base de datos de Supabase

-- PASO 1: Crear tabla para el historial de puntos
CREATE TABLE IF NOT EXISTS user_points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 0),
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Crear indices
CREATE INDEX IF NOT EXISTS idx_user_points_history_user_id ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_history_assigned_at ON user_points_history(assigned_at);
CREATE INDEX IF NOT EXISTS idx_user_points_history_expires_at ON user_points_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_points_history_service_type ON user_points_history(service_type);

-- PASO 3: Crear funcion para calcular puntos actuales
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

-- PASO 4: Crear funcion para calcular fecha de expiracion
CREATE OR REPLACE FUNCTION set_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at = NEW.assigned_at + INTERVAL '1 year';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 4B: Crear funcion para actualizar puntos del usuario
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET points = calculate_current_points(NEW.user_id)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear triggers
DROP TRIGGER IF EXISTS trigger_set_expiration ON user_points_history;
CREATE TRIGGER trigger_set_expiration
    BEFORE INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION set_expiration_date();

DROP TRIGGER IF EXISTS trigger_update_user_points ON user_points_history;
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points();

-- PASO 6: Activar RLS
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

-- PASO 7: Crear politicas de seguridad
CREATE POLICY "Users can view own points history" ON user_points_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points history" ON user_points_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can insert points" ON user_points_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- PASO 8: Crear vista de rankings
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.created_at,
    calculate_current_points(p.id) as current_points,
    COUNT(ua.id) as achievements_count
FROM profiles p
LEFT JOIN user_achievements ua ON ua.user_id = p.id
WHERE p.role = 'user'
GROUP BY p.id, p.name, p.email, p.created_at
ORDER BY current_points DESC NULLS LAST;

-- FIN DEL SCRIPT