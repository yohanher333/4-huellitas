-- =====================================================
-- SISTEMA DE TIENDA - PRODUCTOS Y CATEGORÍAS
-- Script seguro para producción (no borra datos existentes)
-- =====================================================

-- =====================================================
-- 1. TABLA DE CATEGORÍAS DE PRODUCTOS (Jerárquica)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- =====================================================
-- 2. TABLA DE PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    compare_at_price DECIMAL(12, 2), -- Precio de comparación (antes/descuento)
    cost_price DECIMAL(12, 2), -- Precio de costo
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    main_image_url TEXT,
    features JSONB DEFAULT '[]'::jsonb, -- Características del producto como array JSON
    tags TEXT[], -- Etiquetas para búsqueda
    weight DECIMAL(10, 3), -- Peso en kg
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions JSONB, -- {length, width, height, unit}
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- =====================================================
-- 3. TABLA DE GALERÍA DE IMÁGENES DEL PRODUCTO
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para imágenes
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- =====================================================
-- 4. TABLA DE ATRIBUTOS/VARIANTES (Tipos de variación)
-- Ejemplo: "Color", "Tamaño", "Peso", "Sabor"
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) DEFAULT 'select', -- select, color, size, text
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA DE VALORES DE ATRIBUTOS
-- Ejemplo: Para "Color" -> "Rojo", "Azul", "Verde"
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    color_hex VARCHAR(7), -- Para atributos de tipo color (#FF0000)
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attribute_id, slug)
);

-- Índice para valores de atributos
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attr ON product_attribute_values(attribute_id);

-- =====================================================
-- 6. TABLA DE VARIANTES DEL PRODUCTO
-- Combinación específica de atributos con su propio precio/SKU
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    price DECIMAL(12, 2), -- NULL = usa precio del producto padre
    compare_at_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    weight DECIMAL(10, 3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para variantes
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);

-- =====================================================
-- 7. TABLA DE RELACIÓN VARIANTE-ATRIBUTO
-- Cada variante tiene uno o más valores de atributo
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variant_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    attribute_value_id UUID NOT NULL REFERENCES product_attribute_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, attribute_id)
);

-- Índices para relación variante-atributo
CREATE INDEX IF NOT EXISTS idx_variant_attributes_variant ON product_variant_attributes(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attributes_value ON product_variant_attributes(attribute_value_id);

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para product_categories
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_variants
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. FUNCIÓN PARA GENERAR SLUG
-- =====================================================
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    TRANSLATE(input_text, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'),
                    '[^a-zA-Z0-9\s-]', '', 'g'
                ),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 10. VISTA PARA PRODUCTOS CON INFORMACIÓN COMPLETA
-- =====================================================
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
    p.*,
    pc.name as category_name,
    pc.slug as category_slug,
    (
        SELECT json_agg(
            json_build_object(
                'id', pi.id,
                'url', pi.image_url,
                'alt', pi.alt_text,
                'order', pi.sort_order
            ) ORDER BY pi.sort_order
        )
        FROM product_images pi
        WHERE pi.product_id = p.id
    ) as gallery_images,
    (
        SELECT COUNT(*)::int
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = true
    ) as variants_count,
    (
        SELECT MIN(COALESCE(pv.price, p.price))
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = true
    ) as min_variant_price,
    (
        SELECT MAX(COALESCE(pv.price, p.price))
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = true
    ) as max_variant_price
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- =====================================================
-- 11. VISTA PARA CATEGORÍAS CON JERARQUÍA
-- =====================================================
CREATE OR REPLACE VIEW categories_with_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Categorías raíz (sin padre)
    SELECT 
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        sort_order,
        is_active,
        name::TEXT as full_path,
        0 as depth,
        ARRAY[id] as path_ids
    FROM product_categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Categorías hijas
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.parent_id,
        c.sort_order,
        c.is_active,
        (ct.full_path || ' > ' || c.name)::TEXT as full_path,
        ct.depth + 1 as depth,
        ct.path_ids || c.id as path_ids
    FROM product_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT 
    ct.*,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = ct.id) as products_count,
    (SELECT COUNT(*) FROM product_categories pc WHERE pc.parent_id = ct.id) as children_count
FROM category_tree ct
ORDER BY ct.full_path;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
