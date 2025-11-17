-- DEPURACIÓN ESPECÍFICA: Problema de "2 cupos disponibles" vs "no hay profesionales"
-- Este script identifica exactamente donde está la desconexión

-- Simular lo que hace getAvailableTimes() - obtener franjas de un día específico (ejemplo: Lunes = 1)
SELECT 'SIMULANDO getAvailableTimes() - Franjas del Lunes:' as seccion;

SELECT 
    cts.id,
    cts.start_time,
    cts.end_time,
    COUNT(csa.professional_id) as profesionales_count,
    STRING_AGG(csa.professional_id::text, ', ') as professional_ids,
    STRING_AGG(p.name, ', ') as professional_names
FROM custom_time_slots cts
INNER JOIN custom_slot_availability csa ON cts.id = csa.slot_id
INNER JOIN professionals p ON csa.professional_id = p.id
WHERE cts.day_of_week = 1  -- Lunes
  AND cts.is_active = true
  AND csa.is_available = true
GROUP BY cts.id, cts.start_time, cts.end_time
ORDER BY cts.start_time;

-- Simular lo que hace findAvailableProfessional() - buscar franja específica por tiempo
SELECT 'SIMULANDO findAvailableProfessional() - Franja específica 09:00:' as seccion;

SELECT 
    cts.id,
    cts.start_time,
    cts.end_time,
    csa.professional_id,
    csa.is_available,
    p.name as professional_name
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id
LEFT JOIN professionals p ON csa.professional_id = p.id
WHERE cts.day_of_week = 1      -- Lunes
  AND cts.start_time = '09:00:00'  -- Tiempo específico
  AND cts.is_active = true;

-- Verificar formatos de tiempo en la base de datos
SELECT 'VERIFICAR FORMATOS DE TIEMPO:' as seccion;
SELECT 
    start_time,
    end_time,
    start_time::text as start_time_text,
    LENGTH(start_time::text) as start_time_length
FROM custom_time_slots 
WHERE day_of_week = 1
ORDER BY start_time;

-- Verificar si hay diferencia entre las consultas
SELECT 'COMPARACIÓN DE CONSULTAS:' as seccion;

-- Consulta tipo getAvailableTimes (con INNER JOIN)
SELECT 'Tipo getAvailableTimes:' as tipo, COUNT(*) as franjas_encontradas
FROM custom_time_slots cts
INNER JOIN custom_slot_availability csa ON cts.id = csa.slot_id
WHERE cts.day_of_week = 1 AND cts.is_active = true AND csa.is_available = true

UNION ALL

-- Consulta tipo findAvailableProfessional (con LEFT JOIN)
SELECT 'Tipo findAvailableProfessional:' as tipo, COUNT(*) as franjas_encontradas
FROM custom_time_slots cts
LEFT JOIN custom_slot_availability csa ON cts.id = csa.slot_id
WHERE cts.day_of_week = 1 AND cts.start_time = '09:00:00' AND cts.is_active = true;