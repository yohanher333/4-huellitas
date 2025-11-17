-- VERIFICACIÓN RÁPIDA: ¿Se ejecutaron los datos correctamente?
-- Ejecutar para verificar el estado actual del sistema

-- 1. Verificar franjas existentes
SELECT 'FRANJAS EXISTENTES:' as seccion;
SELECT 
    id,
    day_of_week,
    CASE day_of_week
        WHEN 1 THEN 'Lunes'
        WHEN 3 THEN 'Miércoles' 
        WHEN 5 THEN 'Viernes'
        ELSE 'Otro día'
    END as dia_nombre,
    start_time,
    end_time,
    is_active
FROM custom_time_slots 
ORDER BY day_of_week, start_time;

-- 2. Verificar profesionales existentes
SELECT 'PROFESIONALES EXISTENTES:' as seccion;
SELECT id, name, is_active FROM professionals;

-- 3. Verificar asignaciones de disponibilidad (CRÍTICO)
SELECT 'ASIGNACIONES DE DISPONIBILIDAD:' as seccion;
SELECT 
    cts.day_of_week,
    cts.start_time,
    cts.end_time,
    csa.professional_id,
    csa.is_available,
    p.name as professional_name
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id
LEFT JOIN professionals p ON csa.professional_id = p.id
ORDER BY cts.day_of_week, cts.start_time, csa.professional_id;

-- 4. Contar cuántas asignaciones tiene cada franja
SELECT 'RESUMEN POR FRANJA:' as seccion;
SELECT 
    cts.id as slot_id,
    cts.day_of_week,
    cts.start_time,
    cts.end_time,
    COUNT(csa.professional_id) as profesionales_asignados,
    STRING_AGG(p.name, ', ') as nombres_profesionales
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id AND csa.is_available = true
LEFT JOIN professionals p ON csa.professional_id = p.id
GROUP BY cts.id, cts.day_of_week, cts.start_time, cts.end_time
ORDER BY cts.day_of_week, cts.start_time;