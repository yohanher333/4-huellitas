-- PASO 5: Ejecutar al final
-- Insertar datos de ejemplo

INSERT INTO custom_time_slots (day_of_week, start_time, end_time) VALUES
-- Lunes (ejemplos)
(1, '09:00:00', '09:30:00'),
(1, '09:30:00', '10:00:00'),
(1, '10:00:00', '10:30:00'),
(1, '14:00:00', '14:30:00'),
(1, '14:30:00', '15:00:00'),
-- Miércoles (franjas variables como ejemplo)
(3, '09:00:00', '09:15:00'), -- 15 minutos
(3, '09:30:00', '10:30:00'), -- 1 hora
(3, '14:00:00', '14:20:00'), -- 20 minutos
-- Viernes
(5, '09:00:00', '09:30:00'),
(5, '10:00:00', '10:30:00'),
(5, '14:00:00', '14:30:00')
ON CONFLICT DO NOTHING;

SELECT 'Paso 5 completado - Datos de ejemplo insertados' as status;
SELECT 'Sistema configurado exitosamente!' as message;