# Configuración del Sistema de Profesionales - 4HUELLITAS

## 📋 Estado Actual
El sistema ahora soporta la asignación inteligente de citas basada en la disponibilidad de profesionales:

- **Si hay 1 profesional disponible**: máximo 1 cita por franja horaria
- **Si hay 2 profesionales disponibles**: máximo 2 citas por franja horaria
- **Duración fija**: Todas las citas son de 2 horas + 30 minutos de limpieza
- **Intervalos**: Franjas cada 30 minutos

## 🗄️ Base de Datos Requerida

### 1. Ejecutar el script SQL
Ejecuta este script en Supabase para crear la tabla necesaria:

```sql
-- Crear tabla de disponibilidad de profesionales
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  work_schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_availability_schedule 
ON professional_availability(work_schedule_id);

CREATE INDEX IF NOT EXISTS idx_professional_availability_professional 
ON professional_availability(professional_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos puedan leer
CREATE POLICY "Allow public read access" ON professional_availability
FOR SELECT USING (true);

-- Política para permitir que usuarios autenticados puedan insertar/actualizar/eliminar
CREATE POLICY "Allow authenticated users full access" ON professional_availability
FOR ALL USING (auth.role() = 'authenticated');

-- Insertar profesionales de ejemplo para todos los horarios
INSERT INTO professional_availability (professional_id, professional_name, work_schedule_id)
SELECT 
  'prof_001',
  'Dr. García',
  ws.id
FROM work_schedules ws
WHERE NOT EXISTS (
  SELECT 1 FROM professional_availability 
  WHERE professional_id = 'prof_001' AND work_schedule_id = ws.id
);

INSERT INTO professional_availability (professional_id, professional_name, work_schedule_id)
SELECT 
  'prof_002',
  'Dra. Martínez',
  ws.id
FROM work_schedules ws
WHERE NOT EXISTS (
  SELECT 1 FROM professional_availability 
  WHERE professional_id = 'prof_002' AND work_schedule_id = ws.id
);
```

## 🛠️ Configuración del Administrador

### 1. Acceder al Panel de Disponibilidad
1. Inicia sesión como administrador
2. Ve a **Configuración → Disponibilidad**
3. Aquí puedes gestionar qué profesionales están disponibles por día y horario

### 2. Gestionar Profesionales
- **Agregar nuevo profesional**: Completa ID y nombre, se agregará a todos los horarios
- **Activar/Desactivar**: Usa los switches para controlar disponibilidad por día
- **Ver resumen**: El badge muestra cuántos profesionales están disponibles por día

### 3. Configurar Disponibilidad por Día
Para configurar diferentes disponibilidades:

**Ejemplo 1 - Solo 1 profesional los lunes:**
- Desactiva uno de los profesionales para todos los horarios del lunes
- Resultado: máximo 1 cita por franja los lunes

**Ejemplo 2 - 2 profesionales los viernes:**
- Mantén ambos profesionales activos para todos los horarios del viernes  
- Resultado: máximo 2 citas por franja los viernes

## 🔧 Funcionamiento Técnico

### Archivos Modificados:
- `src/pages/AppointmentPage.jsx` - Booking principal con lógica de profesionales
- `src/pages/UserDashboard.jsx` - Reagendado desde dashboard de usuario
- `src/pages/CheckAppointmentPage.jsx` - Reagendado público sin sesión
- `src/components/admin/ProfessionalAvailabilityManager.jsx` - Panel de gestión

### Lógica de Reserva:
1. El sistema cuenta profesionales disponibles por día
2. Para cada franja horaria, cuenta citas existentes
3. Permite la reserva solo si: `citas_existentes < profesionales_disponibles`
4. El reagendado usa la misma lógica que el booking principal

## ✅ Testing del Sistema

### Pruebas Básicas:
1. **Con 2 profesionales**: Intenta agendar 3 citas en la misma franja → debe fallar la 3ra
2. **Con 1 profesional**: Intenta agendar 2 citas en la misma franja → debe fallar la 2da
3. **Reagendado**: Debe respetar las mismas reglas de disponibilidad

### Estados de Profesionales:
- **Badge Verde**: 2 o más profesionales disponibles
- **Badge Amarillo**: 1 profesional disponible  
- **Badge Rojo**: 0 profesionales disponibles (no se pueden agendar citas)

## 🚀 Próximos Pasos
1. Ejecutar el script SQL en Supabase
2. Configurar profesionales iniciales en el panel de administración
3. Probar el sistema de reservas con diferentes configuraciones
4. Ajustar disponibilidad según necesidades del negocio

## 📞 Soporte
Si encuentras algún problema:
1. Verifica que la tabla `professional_availability` existe
2. Confirma que hay al menos un profesional por horario
3. Revisa la consola del navegador para errores
4. Prueba con diferentes configuraciones de profesionales

---
**Nota**: El sistema mantiene toda la funcionalidad existente, solo agrega la lógica de profesionales para evitar sobrereservas.