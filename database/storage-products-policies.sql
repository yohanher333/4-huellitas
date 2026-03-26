-- =====================================================
-- CONFIGURACIÓN DE STORAGE PARA PRODUCTOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear bucket si no existe (ejecutar en Dashboard > Storage)
-- El bucket 'site-assets' debe existir y ser PÚBLICO

-- 2. Política para permitir lectura pública de archivos
DROP POLICY IF EXISTS "Lectura pública de site-assets" ON storage.objects;
CREATE POLICY "Lectura pública de site-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');

-- 3. Política para permitir que usuarios autenticados suban archivos
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir a site-assets" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir a site-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- 4. Política para permitir que admins actualicen archivos
DROP POLICY IF EXISTS "Admin puede actualizar en site-assets" ON storage.objects;
CREATE POLICY "Admin puede actualizar en site-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'site-assets' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 5. Política para permitir que admins eliminen archivos
DROP POLICY IF EXISTS "Admin puede eliminar de site-assets" ON storage.objects;
CREATE POLICY "Admin puede eliminar de site-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'site-assets' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- NOTA IMPORTANTE:
-- Para quitar restricciones de tamaño de archivo,
-- ve a Dashboard > Storage > site-assets > Settings
-- y configura:
-- - File size limit: Sin límite o el máximo permitido
-- - Allowed MIME types: image/* (o dejar vacío para todos)
-- =====================================================
