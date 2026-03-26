-- Script para crear la tabla de movimientos de inventario
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referencia al producto
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Tipo de movimiento
  type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'set', 'sale', 'return', 'adjustment')),
  
  -- Cantidades
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  
  -- Información adicional
  reason TEXT,
  reference_id UUID, -- Puede ser order_id, purchase_id, etc.
  reference_type TEXT, -- 'order', 'purchase', 'manual', etc.
  
  -- Usuario que realizó el movimiento
  user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_id, reference_type);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad
-- Política para permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated read inventory_movements" ON inventory_movements;
CREATE POLICY "Allow authenticated read inventory_movements" ON inventory_movements
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated insert inventory_movements" ON inventory_movements;
CREATE POLICY "Allow authenticated insert inventory_movements" ON inventory_movements
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Comentarios en las columnas
COMMENT ON TABLE inventory_movements IS 'Tabla de movimientos de inventario para tracking de cambios de stock';
COMMENT ON COLUMN inventory_movements.type IS 'Tipo de movimiento: add (entrada), remove (salida), set (ajuste), sale (venta), return (devolución), adjustment (ajuste por inventario)';
COMMENT ON COLUMN inventory_movements.reference_id IS 'ID de referencia a otra tabla (order, purchase, etc.)';
COMMENT ON COLUMN inventory_movements.reference_type IS 'Tipo de referencia: order, purchase, manual';

-- 6. Vista para reportes de inventario
CREATE OR REPLACE VIEW inventory_movements_report AS
SELECT 
  im.*,
  p.name as product_name,
  p.sku as product_sku,
  p.barcode as product_barcode,
  CASE 
    WHEN im.type = 'add' THEN 'Entrada'
    WHEN im.type = 'remove' THEN 'Salida'
    WHEN im.type = 'set' THEN 'Ajuste'
    WHEN im.type = 'sale' THEN 'Venta'
    WHEN im.type = 'return' THEN 'Devolución'
    WHEN im.type = 'adjustment' THEN 'Ajuste inventario'
    ELSE im.type
  END as type_label
FROM inventory_movements im
JOIN products p ON p.id = im.product_id
ORDER BY im.created_at DESC;
