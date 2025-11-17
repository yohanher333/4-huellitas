-- SOLUCION: Asignar profesionales a franjas personalizadas
-- Este script resuelve el error "no hay profesionales disponibles"

-- PASO 1: Verificar profesionales existentes
DO $$
BEGIN
    RAISE NOTICE 'Profesionales en el sistema:';
END $$;

SELECT id, name FROM professionals;

-- PASO 2: Verificar franjas sin profesionales asignados
DO $$
BEGIN
    RAISE NOTICE 'Franjas sin profesionales asignados:';
END $$;

SELECT 
    cts.id,
    cts.day_of_week,
    cts.start_time,
    cts.end_time,
    COUNT(csa.professional_id) as profesionales_asignados
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id
GROUP BY cts.id, cts.day_of_week, cts.start_time, cts.end_time
HAVING COUNT(csa.professional_id) = 0;

-- PASO 3: Asignar el primer profesional disponible a todas las franjas
-- (Esto asegura que todas las franjas tengan al menos un profesional)
INSERT INTO custom_slot_availability (slot_id, professional_id, is_available)
SELECT 
    cts.id,
    (SELECT id FROM professionals LIMIT 1) as professional_id,
    true
FROM custom_time_slots cts
WHERE NOT EXISTS (
    SELECT 1 FROM custom_slot_availability csa 
    WHERE csa.slot_id = cts.id
)
ON CONFLICT DO NOTHING;

-- PASO 4: Verificar que todas las franjas tienen profesionales
DO $$
BEGIN
    RAISE NOTICE 'Estado final - Franjas con profesionales:';
END $$;

SELECT 
    cts.day_of_week,
    CASE cts.day_of_week
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia_nombre,
    cts.start_time,
    cts.end_time,
    COUNT(csa.professional_id) as profesionales_disponibles,
    STRING_AGG(p.name, ', ') as nombres_profesionales
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id AND csa.is_available = true
LEFT JOIN professionals p ON csa.professional_id = p.id
GROUP BY cts.id, cts.day_of_week, cts.start_time, cts.end_time
ORDER BY cts.day_of_week, cts.start_time;

-- Mensaje de confirmación
SELECT 'Profesionales asignados correctamente a las franjas personalizadas' as resultado;