-- Script para implementar el sistema de puntos con expiración anual
-- Ejecutar en la base de datos de Supabase

-- 1. Crear tabla para el historial de puntos con expiración
CREATE TABLE IF NOT EXISTS user_points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 0),
    service_type TEXT NOT NULL, -- 'corte_unas', 'limpieza_oidos', 'spa', etc.
    description TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (assigned_at + INTERVAL '1 year') STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_points_history_user_id ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_history_assigned_at ON user_points_history(assigned_at);
CREATE INDEX IF NOT EXISTS idx_user_points_history_expires_at ON user_points_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_points_history_service_type ON user_points_history(service_type);

-- 3. Crear función para calcular puntos actuales (no vencidos)
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

-- 4. Crear función para actualizar automáticamente los puntos del usuario
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar los puntos del usuario cuando se inserte un nuevo registro
    UPDATE profiles 
    SET points = calculate_current_points(NEW.user_id)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear trigger para actualizar automáticamente los puntos
DROP TRIGGER IF EXISTS trigger_update_user_points ON user_points_history;
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT ON user_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points();

-- 6. Crear función para limpiar puntos vencidos (ejecutar periódicamente)
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

-- 7. Establecer políticas RLS (Row Level Security)
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propio historial
CREATE POLICY "Users can view own points history" ON user_points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los administradores puedan ver todo
CREATE POLICY "Admins can view all points history" ON user_points_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para que solo los administradores puedan insertar
CREATE POLICY "Only admins can insert points" ON user_points_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 8. Migrar puntos existentes (si los hay)
-- Nota: Este paso es opcional si ya hay usuarios con puntos
-- Comentado para evitar duplicaciones, ejecutar manualmente si es necesario
/*
INSERT INTO user_points_history (user_id, points, service_type, description, assigned_at)
SELECT 
    id as user_id,
    COALESCE(points, 0) as points,
    'migration' as service_type,
    'Migracion de puntos existentes' as description,
    created_at as assigned_at
FROM profiles 
WHERE role = 'user' AND COALESCE(points, 0) > 0;
*/

-- 9. Crear vista para facilitar consultas de ranking
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

-- Comentarios sobre el sistema:
-- - Los puntos expiran automaticamente despues de 1 ano
-- - La tabla user_points_history mantiene un registro completo
-- - Los puntos se calculan dinamicamente excluyendo los vencidos
-- - El trigger actualiza automaticamente los puntos en la tabla profiles
-- - La funcion cleanup_expired_points() puede ejecutarse periodicamente para limpiar

-- Fin del script