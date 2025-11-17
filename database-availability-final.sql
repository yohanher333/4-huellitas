-- SCRIPT FINAL PARA EJECUTAR - MANEJA POLÍTICAS EXISTENTES
-- Este script es seguro ejecutar múltiples veces

-- 1. ELIMINAR POLÍTICAS EXISTENTES SI EXISTEN (evita el error)
DROP POLICY IF EXISTS "Allow public read access" ON professional_availability;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON professional_availability;

-- 2. CREAR TABLA DE DISPONIBILIDAD (si no existe)
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id TEXT NOT NULL,
  schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREAR ÍNDICES (si no existen)
CREATE INDEX IF NOT EXISTS idx_professional_availability_schedule 
ON professional_availability(schedule_id);

CREATE INDEX IF NOT EXISTS idx_professional_availability_professional 
ON professional_availability(professional_id);

-- 4. HABILITAR RLS
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS NUEVAS (después de eliminar las existentes)
CREATE POLICY "Allow public read access" ON professional_availability
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access" ON professional_availability
FOR ALL USING (auth.role() = 'authenticated');

-- 6. INSERTAR DISPONIBILIDAD PARA PROFESIONALES REALES
-- Se adapta según las columnas disponibles en la tabla professionals
DO $$
DECLARE
    has_is_active_column BOOLEAN := false;
BEGIN
    -- Verificar si existe la columna is_active en professionals
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'professionals' AND column_name = 'is_active'
    ) INTO has_is_active_column;
    
    IF has_is_active_column THEN
        -- Si tiene is_active, usar esa condición
        INSERT INTO professional_availability (professional_id, schedule_id)
        SELECT 
            p.id::text as professional_id,
            ws.id as schedule_id
        FROM professionals p
        CROSS JOIN work_schedules ws
        WHERE p.is_active = true 
        AND ws.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM professional_availability pa 
            WHERE pa.professional_id = p.id::text 
            AND pa.schedule_id = ws.id
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Usando profesionales con is_active = true';
    ELSE
        -- Si no tiene is_active, usar todos los profesionales
        INSERT INTO professional_availability (professional_id, schedule_id)
        SELECT 
            p.id::text as professional_id,
            ws.id as schedule_id
        FROM professionals p
        CROSS JOIN work_schedules ws
        WHERE ws.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM professional_availability pa 
            WHERE pa.professional_id = p.id::text 
            AND pa.schedule_id = ws.id
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '⚠️ Tabla professionals básica detectada - usando todos los profesionales';
        RAISE NOTICE '📝 Recomendación: Ejecutar database-professionals-enhanced.sql para funcionalidad completa';
    END IF;
END $$;

-- 7. VERIFICAR RESULTADOS
DO $$
DECLARE
    total_professionals INTEGER;
    total_schedules INTEGER;
    total_availability INTEGER;
    professionals_exist BOOLEAN := false;
    has_is_active_column BOOLEAN := false;
BEGIN
    -- Verificar si existe la tabla professionals
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'professionals'
    ) INTO professionals_exist;
    
    IF professionals_exist THEN
        -- Verificar si existe la columna is_active
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'professionals' AND column_name = 'is_active'
        ) INTO has_is_active_column;
        
        IF has_is_active_column THEN
            SELECT COUNT(*) INTO total_professionals FROM professionals WHERE is_active = true;
        ELSE
            SELECT COUNT(*) INTO total_professionals FROM professionals;
        END IF;
        
        SELECT COUNT(*) INTO total_schedules FROM work_schedules WHERE is_active = true;
        SELECT COUNT(*) INTO total_availability FROM professional_availability;
        
        RAISE NOTICE '✅ Tabla professionals encontrada';
        RAISE NOTICE '📊 Profesionales: % (is_active: %)', total_professionals, has_is_active_column;
        RAISE NOTICE '📅 Horarios activos: %', total_schedules;
        RAISE NOTICE '🔗 Registros de disponibilidad: %', total_availability;
        RAISE NOTICE '📈 Disponibilidad esperada: %', (total_professionals * total_schedules);
        
        IF total_availability >= total_professionals THEN
            RAISE NOTICE '✅ ÉXITO: Disponibilidad configurada correctamente';
        ELSE
            RAISE NOTICE '⚠️  La disponibilidad puede necesitar ajustes';
        END IF;
    ELSE
        RAISE NOTICE '❌ Tabla professionals no encontrada';
        RAISE NOTICE '📝 EJECUTA PRIMERO: database-professionals-enhanced.sql';
    END IF;
END $$;

-- 8. MOSTRAR DATOS FINALES PARA VERIFICACIÓN
DO $$
DECLARE
    avail_count INTEGER;
    prof_count INTEGER;
    sched_count INTEGER;
    has_is_active BOOLEAN := false;
BEGIN
    -- Contar availability
    SELECT COUNT(*) INTO avail_count FROM professional_availability;
    
    -- Verificar si existe columna is_active en professionals
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'professionals' AND column_name = 'is_active'
    ) INTO has_is_active;
    
    -- Contar professionals
    IF has_is_active THEN
        SELECT COUNT(*) INTO prof_count FROM professionals WHERE is_active = true;
    ELSE
        SELECT COUNT(*) INTO prof_count FROM professionals;
    END IF;
    
    -- Contar work_schedules
    SELECT COUNT(*) INTO sched_count FROM work_schedules WHERE is_active = true;
    
    -- Mostrar resultados
    RAISE NOTICE '📋 RESUMEN DE TABLAS:';
    RAISE NOTICE '  • professional_availability: % registros', avail_count;
    RAISE NOTICE '  • professionals: % registros', prof_count;
    RAISE NOTICE '  • work_schedules: % registros', sched_count;
END $$;

-- 9. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '🎉 Script de disponibilidad completado exitosamente';
END $$;