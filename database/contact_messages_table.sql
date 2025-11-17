-- Script SQL para crear la tabla de mensajes de contacto
-- Ejecuta este script en el SQL Editor de tu panel de Supabase

-- Crear la tabla contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'leido', 'respondido', 'archivado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_messages_updated_at_trigger
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar mensajes (desde el formulario de contacto)
-- Cualquiera puede insertar un mensaje
CREATE POLICY "Permitir insertar mensajes de contacto" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Política para que solo usuarios autenticados puedan ver los mensajes
-- (solo administradores en tu caso)
CREATE POLICY "Solo admins pueden ver mensajes" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para que solo administradores puedan actualizar mensajes
CREATE POLICY "Solo admins pueden actualizar mensajes" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para que solo administradores puedan eliminar mensajes
CREATE POLICY "Solo admins pueden eliminar mensajes" ON contact_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insertar algunos datos de prueba (opcional)
INSERT INTO contact_messages (name, email, message, status) VALUES 
    ('Juan Pérez', 'juan@email.com', '¡Hola! Me gustaría saber más sobre sus servicios de peluquería para mi perro Golden Retriever. ¿Cuáles son sus precios?', 'nuevo'),
    ('María García', 'maria@email.com', 'Necesito agendar una cita urgente para mi gata. ¿Tienen disponibilidad para esta semana?', 'leido'),
    ('Carlos Rodriguez', 'carlos@email.com', 'Excelente servicio el que recibió mi mascota la semana pasada. ¡Muchas gracias por el cuidado!', 'respondido');

-- Comentarios sobre el uso:
-- 1. Copia y pega este script completo en el SQL Editor de Supabase
-- 2. Ejecuta el script haciendo clic en "Run"
-- 3. La tabla se creará con todas las políticas de seguridad
-- 4. Los datos de prueba te ayudarán a probar la funcionalidad

COMMENT ON TABLE contact_messages IS 'Tabla para almacenar mensajes de contacto del sitio web';
COMMENT ON COLUMN contact_messages.id IS 'Identificador único del mensaje';
COMMENT ON COLUMN contact_messages.name IS 'Nombre del remitente';
COMMENT ON COLUMN contact_messages.email IS 'Email del remitente';
COMMENT ON COLUMN contact_messages.message IS 'Contenido del mensaje';
COMMENT ON COLUMN contact_messages.status IS 'Estado del mensaje: nuevo, leido, respondido, archivado';
COMMENT ON COLUMN contact_messages.created_at IS 'Fecha y hora de creación del mensaje';
COMMENT ON COLUMN contact_messages.updated_at IS 'Fecha y hora de última actualización del mensaje';