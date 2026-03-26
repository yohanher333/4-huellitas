# Sistema de Tienda - Productos y Categorías

## Resumen de la Implementación

Se ha creado un sistema completo de gestión de productos para la tienda del sitio 4HUELLITAS.

## Archivos Creados

### Scripts SQL (ejecutar en orden)
1. **database/products-store-setup.sql** - Crea las tablas del sistema de tienda
2. **database/products-rls-policies.sql** - Configura las políticas de seguridad RLS

### Componentes de Administración
- **src/components/admin/ProductCategoriesManager.jsx** - Gestión de categorías jerárquicas
- **src/components/admin/ProductsManager.jsx** - CRUD completo de productos
- **src/components/admin/ProductAttributesManager.jsx** - Gestión de atributos para variantes

## Instrucciones de Instalación

### Paso 1: Ejecutar los scripts SQL en Supabase

1. Ir a tu proyecto de Supabase → SQL Editor
2. Ejecutar primero `products-store-setup.sql`
3. Luego ejecutar `products-rls-policies.sql`

**IMPORTANTE:** Estos scripts son seguros para producción:
- Usan `CREATE TABLE IF NOT EXISTS` (no sobrescriben tablas existentes)
- Usan `DROP POLICY IF EXISTS` antes de crear políticas (previene errores)
- NO eliminan ninguna tabla o dato existente

### Paso 2: Verificar la instalación

Después de ejecutar los scripts, verifica que las tablas se crearon:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'product%';
```

## Estructura de la Base de Datos

### Tablas Principales
- `product_categories` - Categorías jerárquicas (soporta categorías padre/hijo)
- `products` - Productos con toda su información
- `product_images` - Galería de imágenes por producto
- `product_attributes` - Tipos de atributos (Color, Talla, Sabor, etc.)
- `product_attribute_values` - Valores de cada atributo
- `product_variants` - Variantes de productos con SKU/precio propio
- `product_variant_attributes` - Relación variante-atributo

### Vistas
- `products_with_details` - Productos con categoría, galería y conteo de variantes
- `categories_with_hierarchy` - Categorías con ruta completa y productos asociados

## Funcionalidades Implementadas

### Productos
- ✅ Nombre, descripción corta y larga
- ✅ Precio de venta, precio anterior (comparación), costo
- ✅ SKU único para identificación
- ✅ Código de barras para lector de código de barras
- ✅ Imagen principal y galería de imágenes
- ✅ Características del producto (lista editable)
- ✅ Categoría asignada
- ✅ Control de inventario (stock, alerta de stock bajo)
- ✅ Peso para envíos
- ✅ Estados: activo/inactivo, destacado
- ✅ Duplicar productos
- ✅ Búsqueda por nombre, SKU o código de barras
- ✅ Filtros por categoría y estado

### Categorías
- ✅ Estructura jerárquica (categorías padre/hijo)
- ✅ Nombre, slug (URL), descripción
- ✅ Imagen de categoría
- ✅ Orden de visualización
- ✅ Activar/desactivar categorías
- ✅ Vista en árbol expandible
- ✅ Búsqueda de categorías
- ✅ Contador de productos por categoría

### Variantes de Producto
- ✅ SKU y código de barras únicos por variante
- ✅ Precio propio o heredado del producto padre
- ✅ Stock individual por variante
- ✅ Asignación de atributos (color, talla, etc.)

### Atributos
- ✅ Tipos: Selección, Color, Talla, Texto
- ✅ Valores múltiples por atributo
- ✅ Selector de color con código hexadecimal
- ✅ Orden personalizable

## Acceso desde el Panel de Administración

En el menú lateral del panel de administración:
- **Productos** → Ver todos los productos
  - **Todos los Productos** → Lista y CRUD de productos
  - **Categorías** → Gestión de categorías jerárquicas
  - **Atributos** → Configurar atributos para variantes

## Notas Técnicas

- El sistema utiliza las mismas librerías UI del proyecto (Radix UI, Tailwind)
- Diseño responsivo consistente con el resto del panel admin
- Soporta código de barras - el campo de código enfoca automáticamente para lectores USB
- Las políticas RLS permiten lectura pública de productos activos y CRUD para administradores
