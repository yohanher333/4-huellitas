-- Sistema de Aniversario con Ruleta de Premios
-- Este script crea las tablas necesarias para el sistema de aniversario

-- 1. Tabla de configuración del aniversario
CREATE TABLE IF NOT EXISTS anniversary_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  title TEXT DEFAULT 'Aniversario 4 Huellitas',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de premios de la ruleta
CREATE TABLE IF NOT EXISTS anniversary_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  color TEXT DEFAULT '#F26513',
  icon TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de historial de premios ganados
CREATE TABLE IF NOT EXISTS anniversary_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES anniversary_prizes(id) ON DELETE SET NULL,
  prize_name TEXT NOT NULL,
  won_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ
);

-- Insertar configuración inicial
INSERT INTO anniversary_config (enabled, start_date, end_date, title, description)
VALUES (
  false,
  NOW(),
  NOW() + INTERVAL '7 days',
  'Aniversario 4 Huellitas',
  'Celebra con nosotros nuestro aniversario y gana increíbles premios'
) ON CONFLICT (id) DO NOTHING;

-- Insertar premios de ejemplo
INSERT INTO anniversary_prizes (name, description, probability, color, order_position)
VALUES 
  ('Baño Gratis', 'Un baño completo gratis para tu mascota', 15.00, '#0378A6', 1),
  ('Descuento 20%', '20% de descuento en tu próximo servicio', 25.00, '#F26513', 2),
  ('Corte de Uñas Gratis', 'Corte de uñas cortesía', 20.00, '#10B981', 3),
  ('Descuento 10%', '10% de descuento en tu próxima visita', 30.00, '#8B5CF6', 4),
  ('Producto Sorpresa', 'Un producto para tu mascota', 8.00, '#EC4899', 5),
  ('Intenta de Nuevo', 'Vuelve a girar la ruleta', 2.00, '#6B7280', 6)
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE anniversary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_winners ENABLE ROW LEVEL SECURITY;

-- Políticas para anniversary_config
CREATE POLICY "Todos pueden leer configuración de aniversario"
  ON anniversary_config FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Solo admin puede modificar configuración de aniversario"
  ON anniversary_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para anniversary_prizes
CREATE POLICY "Todos pueden leer premios activos"
  ON anniversary_prizes FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Solo admin puede gestionar premios"
  ON anniversary_prizes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para anniversary_winners
CREATE POLICY "Usuarios pueden ver sus propios premios"
  ON anniversary_winners FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin puede ver todos los ganadores"
  ON anniversary_winners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuarios autenticados pueden registrar premios ganados"
  ON anniversary_winners FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_anniversary_winners_user_id ON anniversary_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_anniversary_winners_won_at ON anniversary_winners(won_at DESC);
CREATE INDEX IF NOT EXISTS idx_anniversary_prizes_active ON anniversary_prizes(is_active);
CREATE INDEX IF NOT EXISTS idx_anniversary_prizes_order ON anniversary_prizes(order_position);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_anniversary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER anniversary_config_updated_at
  BEFORE UPDATE ON anniversary_config
  FOR EACH ROW
  EXECUTE FUNCTION update_anniversary_updated_at();

CREATE TRIGGER anniversary_prizes_updated_at
  BEFORE UPDATE ON anniversary_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_anniversary_updated_at();
