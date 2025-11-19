-- Script para insertar premios de ejemplo si no existen
-- Ejecutar en Supabase SQL Editor

-- Verificar si existen premios activos
DO $$
BEGIN
  -- Solo insertar si no hay premios activos
  IF NOT EXISTS (SELECT 1 FROM anniversary_prizes WHERE is_active = true) THEN
    
    INSERT INTO anniversary_prizes (name, description, probability, color, order_position, is_active)
    VALUES
      ('10% de Descuento', 'Descuento del 10% en tu próxima consulta', 20, '#FF6B6B', 1, true),
      ('Baño Gratis', 'Un baño gratis para tu mascota', 15, '#4ECDC4', 2, true),
      ('Desparasitación', 'Desparasitación interna gratuita', 25, '#FFD93D', 3, true),
      ('Consulta Gratis', 'Una consulta veterinaria sin costo', 10, '#95E1D3', 4, true),
      ('Vacuna Gratis', 'Una vacuna gratuita para tu mascota', 15, '#A8E6CF', 5, true),
      ('20% de Descuento', 'Descuento del 20% en cualquier servicio', 15, '#FF8B94', 6, true);
    
    RAISE NOTICE 'Premios insertados correctamente';
  ELSE
    RAISE NOTICE 'Ya existen premios activos en la base de datos';
  END IF;
END $$;

-- Verificar los premios insertados
SELECT * FROM anniversary_prizes WHERE is_active = true ORDER BY order_position;
