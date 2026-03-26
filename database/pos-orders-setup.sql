-- Script para crear la tabla de pedidos (orders) para el sistema POS
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la tabla de pedidos si no existe
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'processing', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'awaiting_payment' CHECK (payment_status IN ('awaiting_payment', 'partial', 'paid', 'refunded')),
  source TEXT DEFAULT 'pos' CHECK (source IN ('pos', 'web', 'whatsapp')),
  created_by_user_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES profiles(id),
  shipping_details JSONB DEFAULT '{}'::jsonb,
  products JSONB DEFAULT '[]'::jsonb,
  liquidation JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad
-- Política para permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated read orders" ON orders;
CREATE POLICY "Allow authenticated read orders" ON orders
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated insert orders" ON orders;
CREATE POLICY "Allow authenticated insert orders" ON orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
CREATE POLICY "Allow authenticated update orders" ON orders
FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir eliminación a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated delete orders" ON orders;
CREATE POLICY "Allow authenticated delete orders" ON orders
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 7. Añadir columnas a products si no existen (para el POS)
DO $$
BEGIN
  -- track_inventory para controlar si el producto maneja inventario
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'track_inventory') THEN
    ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 8. Comentarios en las columnas
COMMENT ON TABLE orders IS 'Tabla de pedidos del sistema POS y tienda web';
COMMENT ON COLUMN orders.source IS 'Origen del pedido: pos (tienda física), web (tienda online), whatsapp';
COMMENT ON COLUMN orders.shipping_details IS 'Información de envío y cliente en formato JSON';
COMMENT ON COLUMN orders.products IS 'Lista de productos del pedido en formato JSON';
COMMENT ON COLUMN orders.liquidation IS 'Información de pagos y liquidación en formato JSON';
