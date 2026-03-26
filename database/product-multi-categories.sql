-- Script para habilitar múltiples categorías por producto
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de relación productos-categorías (muchos a muchos)
CREATE TABLE IF NOT EXISTS product_category_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Evitar duplicados
  UNIQUE(product_id, category_id)
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_product_category_relations_product ON product_category_relations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_relations_category ON product_category_relations(category_id);

-- 3. Habilitar RLS
ALTER TABLE product_category_relations ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad
DROP POLICY IF EXISTS "Allow public read product_category_relations" ON product_category_relations;
CREATE POLICY "Allow public read product_category_relations" ON product_category_relations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert product_category_relations" ON product_category_relations;
CREATE POLICY "Allow authenticated insert product_category_relations" ON product_category_relations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete product_category_relations" ON product_category_relations;
CREATE POLICY "Allow authenticated delete product_category_relations" ON product_category_relations
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Migrar datos existentes (de category_id a la nueva tabla)
INSERT INTO product_category_relations (product_id, category_id)
SELECT id, category_id FROM products 
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- 6. Comentarios
COMMENT ON TABLE product_category_relations IS 'Tabla de relación muchos-a-muchos entre productos y categorías';
