-- Script para crear la tabla de clientes de la tienda
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la tabla de clientes si no existe
CREATE TABLE IF NOT EXISTS store_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información personal
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_type TEXT DEFAULT 'CC' CHECK (document_type IN ('CC', 'CE', 'NIT', 'TI', 'PP', 'OTRO')),
  document_number TEXT,
  birth_date DATE,
  
  -- Dirección
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  
  -- Información comercial
  customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'mayorista', 'vip', 'empresa')),
  source TEXT DEFAULT 'pos' CHECK (source IN ('pos', 'web', 'whatsapp', 'referido', 'otro')),
  
  -- Estadísticas (se actualizan automáticamente)
  total_purchases DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  
  -- Puntos y fidelización
  loyalty_points INTEGER DEFAULT 0,
  
  -- Notas y observaciones
  notes TEXT,
  tags TEXT[], -- Para etiquetas personalizadas: {'frecuente', 'mayorista', 'moroso'}
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_store_customers_name ON store_customers(name);
CREATE INDEX IF NOT EXISTS idx_store_customers_email ON store_customers(email);
CREATE INDEX IF NOT EXISTS idx_store_customers_phone ON store_customers(phone);
CREATE INDEX IF NOT EXISTS idx_store_customers_document ON store_customers(document_number);
CREATE INDEX IF NOT EXISTS idx_store_customers_source ON store_customers(source);
CREATE INDEX IF NOT EXISTS idx_store_customers_type ON store_customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_store_customers_created_at ON store_customers(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad
-- Política para permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated read store_customers" ON store_customers;
CREATE POLICY "Allow authenticated read store_customers" ON store_customers
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated insert store_customers" ON store_customers;
CREATE POLICY "Allow authenticated insert store_customers" ON store_customers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated update store_customers" ON store_customers;
CREATE POLICY "Allow authenticated update store_customers" ON store_customers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir eliminación a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated delete store_customers" ON store_customers;
CREATE POLICY "Allow authenticated delete store_customers" ON store_customers
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_store_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_store_customers_updated_at ON store_customers;
CREATE TRIGGER trigger_store_customers_updated_at
  BEFORE UPDATE ON store_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_store_customers_updated_at();

-- 7. Función para actualizar estadísticas del cliente cuando se crea un pedido
CREATE OR REPLACE FUNCTION update_customer_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si el pedido tiene un user_id vinculado a store_customers
  IF NEW.user_id IS NOT NULL THEN
    UPDATE store_customers
    SET 
      total_purchases = total_purchases + NEW.total_amount,
      total_orders = total_orders + 1,
      last_purchase_date = NEW.created_at
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentarios en las columnas
COMMENT ON TABLE store_customers IS 'Tabla de clientes de la tienda (POS y web)';
COMMENT ON COLUMN store_customers.document_type IS 'Tipo de documento: CC (Cédula), CE (Cédula Extranjería), NIT, TI (Tarjeta Identidad), PP (Pasaporte)';
COMMENT ON COLUMN store_customers.customer_type IS 'Tipo de cliente: regular, mayorista, vip, empresa';
COMMENT ON COLUMN store_customers.source IS 'Origen del cliente: pos (tienda física), web, whatsapp, referido';
COMMENT ON COLUMN store_customers.tags IS 'Etiquetas personalizadas para clasificar clientes';
COMMENT ON COLUMN store_customers.loyalty_points IS 'Puntos acumulados del programa de fidelización';
