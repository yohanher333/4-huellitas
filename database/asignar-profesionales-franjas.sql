-- Script para asignar profesionales a las franjas personalizadas
-- Ejecutar este script para solucionar el problema de "no hay profesionales disponibles"

-- Primero, verificar qué profesionales existen
SELECT id, name FROM professionals ORDER BY name;

-- Insertar disponibilidad de profesionales para todas las franjas existentes
-- (Asignar todos los profesionales a todas las franjas como ejemplo)
INSERT INTO custom_slot_availability (slot_id, professional_id, is_available)
SELECT 
    cts.id as slot_id,
    p.id as professional_id,
    true as is_available
FROM custom_time_slots cts
CROSS JOIN professionals p
WHERE NOT EXISTS (
    SELECT 1 
    FROM custom_slot_availability csa 
    WHERE csa.slot_id = cts.id 
    AND csa.professional_id = p.id
)
ON CONFLICT DO NOTHING;

-- Verificar que se asignaron correctamente
SELECT 
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