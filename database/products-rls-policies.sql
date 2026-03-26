-- =====================================================
-- POLÍTICAS RLS PARA SISTEMA DE TIENDA
-- Script seguro para producción (no borra políticas existentes)
-- =====================================================

-- =====================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE IF EXISTS product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variant_attributes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLÍTICAS PARA product_categories
-- =====================================================

-- Lectura pública (todos pueden ver categorías activas)
DROP POLICY IF EXISTS "Lectura pública de categorías" ON product_categories;
CREATE POLICY "Lectura pública de categorías"
ON product_categories FOR SELECT
TO public
USING (is_active = true);

-- Lectura completa para administradores
DROP POLICY IF EXISTS "Admin puede ver todas las categorías" ON product_categories;
CREATE POLICY "Admin puede ver todas las categorías"
ON product_categories FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- CRUD completo para administradores
DROP POLICY IF EXISTS "Admin puede insertar categorías" ON product_categories;
CREATE POLICY "Admin puede insertar categorías"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin puede actualizar categorías" ON product_categories;
CREATE POLICY "Admin puede actualizar categorías"
ON product_categories FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin puede eliminar categorías" ON product_categories;
CREATE POLICY "Admin puede eliminar categorías"
ON product_categories FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 3. POLÍTICAS PARA products
-- =====================================================

-- Lectura pública (todos pueden ver productos activos)
DROP POLICY IF EXISTS "Lectura pública de productos" ON products;
CREATE POLICY "Lectura pública de productos"
ON products FOR SELECT
TO public
USING (is_active = true);

-- Lectura completa para administradores
DROP POLICY IF EXISTS "Admin puede ver todos los productos" ON products;
CREATE POLICY "Admin puede ver todos los productos"
ON products FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- CRUD completo para administradores
DROP POLICY IF EXISTS "Admin puede insertar productos" ON products;
CREATE POLICY "Admin puede insertar productos"
ON products FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin puede actualizar productos" ON products;
CREATE POLICY "Admin puede actualizar productos"
ON products FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin puede eliminar productos" ON products;
CREATE POLICY "Admin puede eliminar productos"
ON products FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 4. POLÍTICAS PARA product_images
-- =====================================================

-- Lectura pública de imágenes de productos activos
DROP POLICY IF EXISTS "Lectura pública de imágenes" ON product_images;
CREATE POLICY "Lectura pública de imágenes"
ON product_images FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_images.product_id 
        AND products.is_active = true
    )
);

-- Admin puede ver todas las imágenes
DROP POLICY IF EXISTS "Admin puede ver todas las imágenes" ON product_images;
CREATE POLICY "Admin puede ver todas las imágenes"
ON product_images FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- CRUD para admin
DROP POLICY IF EXISTS "Admin puede gestionar imágenes" ON product_images;
CREATE POLICY "Admin puede gestionar imágenes"
ON product_images FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 5. POLÍTICAS PARA product_attributes
-- =====================================================

-- Lectura pública de atributos activos
DROP POLICY IF EXISTS "Lectura pública de atributos" ON product_attributes;
CREATE POLICY "Lectura pública de atributos"
ON product_attributes FOR SELECT
TO public
USING (is_active = true);

-- Admin tiene acceso completo
DROP POLICY IF EXISTS "Admin puede gestionar atributos" ON product_attributes;
CREATE POLICY "Admin puede gestionar atributos"
ON product_attributes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 6. POLÍTICAS PARA product_attribute_values
-- =====================================================

-- Lectura pública de valores de atributos activos
DROP POLICY IF EXISTS "Lectura pública de valores de atributos" ON product_attribute_values;
CREATE POLICY "Lectura pública de valores de atributos"
ON product_attribute_values FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM product_attributes 
        WHERE product_attributes.id = product_attribute_values.attribute_id 
        AND product_attributes.is_active = true
    )
);

-- Admin tiene acceso completo
DROP POLICY IF EXISTS "Admin puede gestionar valores de atributos" ON product_attribute_values;
CREATE POLICY "Admin puede gestionar valores de atributos"
ON product_attribute_values FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 7. POLÍTICAS PARA product_variants
-- =====================================================

-- Lectura pública de variantes de productos activos
DROP POLICY IF EXISTS "Lectura pública de variantes" ON product_variants;
CREATE POLICY "Lectura pública de variantes"
ON product_variants FOR SELECT
TO public
USING (
    is_active = true AND
    EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_variants.product_id 
        AND products.is_active = true
    )
);

-- Admin tiene acceso completo
DROP POLICY IF EXISTS "Admin puede gestionar variantes" ON product_variants;
CREATE POLICY "Admin puede gestionar variantes"
ON product_variants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- 8. POLÍTICAS PARA product_variant_attributes
-- =====================================================

-- Lectura pública
DROP POLICY IF EXISTS "Lectura pública de atributos de variantes" ON product_variant_attributes;
CREATE POLICY "Lectura pública de atributos de variantes"
ON product_variant_attributes FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id = product_variant_attributes.variant_id 
        AND pv.is_active = true
        AND p.is_active = true
    )
);

-- Admin tiene acceso completo
DROP POLICY IF EXISTS "Admin puede gestionar atributos de variantes" ON product_variant_attributes;
CREATE POLICY "Admin puede gestionar atributos de variantes"
ON product_variant_attributes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- FIN DE POLÍTICAS RLS
-- =====================================================
