-- Sistema de Puntos para Propietarios
-- Los puntos se asignan por servicios y tienen fecha de expiración de 1 año

-- Tabla para almacenar los puntos individuales con expiración
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points > 0),
    service_type VARCHAR(50), -- 'corte_unas', 'limpieza_oidos', 'spa', 'desparasitante_interno', 'desparasitante_completo', 'manual'
    description TEXT, -- Para puntos manuales o descripción del servicio
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
    created_by UUID REFERENCES profiles(id), -- Admin que asignó los puntos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_expires_at ON user_points(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_points_service_type ON user_points(service_type);

-- Función para calcular puntos activos de un usuario
CREATE OR REPLACE FUNCTION calculate_active_points(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(points) 
         FROM user_points 
         WHERE user_id = user_uuid 
         AND expires_at > NOW()
        ), 0
    );
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar puntos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_points()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_points WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el campo points en la tabla profiles
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar puntos en la tabla profiles cuando se modifica user_points
    UPDATE profiles 
    SET points = calculate_active_points(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.user_id
            ELSE NEW.user_id
        END
    )
    WHERE id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
    END;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta cuando se insertan, actualizan o eliminan puntos
DROP TRIGGER IF EXISTS trigger_update_user_points ON user_points;
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT OR UPDATE OR DELETE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_points();

-- Vista para obtener el historial de puntos de un usuario con información detallada
CREATE OR REPLACE VIEW user_points_history AS
SELECT 
    up.id,
    up.user_id,
    p.name as user_name,
    p.email as user_email,
    up.points,
    up.service_type,
    up.description,
    up.assigned_at,
    up.expires_at,
    up.expires_at > NOW() as is_active,
    admin.name as assigned_by,
    CASE up.service_type
        WHEN 'corte_unas' THEN 'Corte de Uñas'
        WHEN 'limpieza_oidos' THEN 'Limpieza de Oídos'
        WHEN 'spa' THEN 'SPA'
        WHEN 'desparasitante_interno' THEN 'Desparasitante Interno'
        WHEN 'desparasitante_completo' THEN 'Desparasitante Interno y Externo'
        WHEN 'manual' THEN 'Asignación Manual'
        ELSE 'Otro'
    END as service_display_name
FROM user_points up
JOIN profiles p ON up.user_id = p.id
LEFT JOIN profiles admin ON up.created_by = admin.id
ORDER BY up.assigned_at DESC;

-- Política RLS para user_points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Política para que los admins puedan ver y modificar todos los puntos
CREATE POLICY "Admins can manage all user points" ON user_points
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para que los usuarios solo puedan ver sus propios puntos
CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (user_id = auth.uid());

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO user_points (user_id, points, service_type, description, created_by) VALUES
-- ('user-uuid-ejemplo', 500, 'corte_unas', 'Corte de uñas - Servicio estándar', 'admin-uuid-ejemplo');

COMMENT ON TABLE user_points IS 'Almacena los puntos individuales asignados a usuarios con fecha de expiración';
COMMENT ON FUNCTION calculate_active_points IS 'Calcula la suma de puntos activos (no expirados) de un usuario';
COMMENT ON FUNCTION cleanup_expired_points IS 'Elimina automáticamente los puntos que han expirado';