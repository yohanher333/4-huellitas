# Sistema de Franjas Horarias Personalizadas - 4HUELLITAS

## 📋 Descripción General
El nuevo sistema de franjas horarias personalizadas permite al administrador configurar slots de tiempo flexibles por día de la semana, eliminando la restricción fija de 2 horas por cita.

## 🔧 Características Principales

### ✅ **Flexibilidad Total**
- **Duración Variable**: Franjas de cualquier duración (5min, 10min, 30min, 1h, 2h, etc.)
- **Horarios Personalizados**: Configure diferentes horarios por día
- **Ejemplo**: Lunes 9:00-9:10am (10 minutos), Martes 14:00-15:30 (1.5 horas)

### ✅ **Gestión por Profesionales**
- **Disponibilidad Individual**: Cada franja puede tener diferentes profesionales disponibles
- **Capacidad Dinámica**: Si 2 profesionales están disponibles = 2 citas simultáneas
- **Control Granular**: Activar/desactivar profesionales por franja específica

### ✅ **Interfaz de Administración**
- **Panel Intuitivo**: Gestión visual de franjas por día
- **Indicadores Claros**: Muestra duración y profesionales disponibles
- **Configuración Rápida**: Agregar/eliminar franjas fácilmente

## 🛠️ Componentes Técnicos

### **Base de Datos**
```sql
-- Nueva tabla para franjas personalizadas
custom_time_slots (
    id, day_of_week, start_time, end_time, is_active
)

-- Disponibilidad de profesionales por franja
custom_slot_availability (
    slot_id, professional_id, is_available
)
```

### **Funciones SQL**
- `get_available_custom_slots()`: Obtiene franjas disponibles para una fecha
- `check_custom_slot_availability()`: Verifica disponibilidad para reserva

### **Componentes React**
- `CustomTimeSlotManager.jsx`: Panel de administración de franjas
- Actualizaciones en `AppointmentPage.jsx` y `UserDashboard.jsx`

## 📅 Configuración Paso a Paso

### **1. Acceder a la Configuración**
```
Admin Dashboard → Configuración → Franjas Personalizadas
```

### **2. Configurar Franjas por Día**
```
1. Seleccionar día de la semana
2. Hacer clic en "Agregar Franja"
3. Configurar hora inicio/fin
4. Asignar profesionales disponibles
5. Guardar cambios
```

### **3. Ejemplos de Configuración**

#### **Lunes - Servicios Rápidos**
```
09:00 - 09:10 (10min) → 1 profesional
09:15 - 09:25 (10min) → 1 profesional
09:30 - 09:40 (10min) → 1 profesional
```

#### **Miércoles - Servicios Completos**
```
09:00 - 10:30 (1.5h) → 2 profesionales
11:00 - 12:30 (1.5h) → 2 profesionales
14:00 - 16:00 (2h)   → 1 profesional
```

#### **Viernes - Mixto**
```
09:00 - 09:20 (20min) → 1 profesional
09:30 - 11:00 (1.5h)  → 2 profesionales
14:00 - 14:15 (15min) → 1 profesional
```

## 💡 Ventajas del Nuevo Sistema

### **Para el Administrador**
- **Control Total**: Define exactamente cuándo y por cuánto tiempo
- **Optimización**: Maximiza la utilización del tiempo y recursos
- **Flexibilidad**: Adapta horarios según demanda y servicios

### **Para los Usuarios**
- **Más Opciones**: Mayor disponibilidad de horarios
- **Tiempos Reales**: Saben exactamente cuánto durará su cita
- **Eficiencia**: Menos tiempo de espera con franjas optimizadas

### **Para el Negocio**
- **Mayor Capacidad**: Más citas por día con tiempos optimizados
- **Mejor Servicio**: Asignación precisa de recursos
- **Análisis**: Datos granulares sobre utilización de franjas

## 🔄 Migración del Sistema Anterior

### **Datos Existentes**
- Las citas existentes no se ven afectadas
- El sistema anterior sigue funcionando para citas ya agendadas
- Nuevas reservas usan el sistema de franjas personalizadas

### **Configuración Inicial**
El sistema viene con franjas de ejemplo:
```sql
-- Lunes: Franjas de 30min
09:00 - 09:30, 09:30 - 10:00, 10:00 - 10:30...

-- Miércoles: Franjas variables (ejemplo)
09:00 - 09:10 (10min)
09:15 - 09:45 (30min)
10:00 - 11:00 (1h)
```

## 🚀 Casos de Uso Comunes

### **Caso 1: Servicios Express**
```
Lunes a Miércoles: Franjas de 15-20 minutos
- Ideal para servicios rápidos
- Mayor rotación de clientes
- Optimización de recursos
```

### **Caso 2: Servicios Premium**
```
Jueves a Sábados: Franjas de 1-2 horas
- Servicios completos de spa
- Atención personalizada
- Mayor valor por servicio
```

### **Caso 3: Horarios Mixtos**
```
Por día:
- Mañana: Servicios express (15-30min)
- Tarde: Servicios completos (1-2h)
- Maximiza aprovechamiento del día
```

## 🔧 Mantenimiento y Monitoreo

### **Métricas Importantes**
- **Utilización por Franja**: Qué horarios son más populares
- **Eficiencia de Profesionales**: Distribución de trabajo
- **Satisfacción del Cliente**: Tiempos de servicio vs. expectativas

### **Ajustes Recomendados**
- Revisar franjas semanalmente
- Ajustar según demanda histórica
- Considerar temporadas altas/bajas

## 🛡️ Seguridad y Validaciones

### **Validaciones Automáticas**
- No permite solapamiento de franjas
- Verifica disponibilidad de profesionales
- Previene doble reserva del mismo recurso

### **Controles de Acceso**
- Solo administradores pueden configurar franjas
- Usuarios solo ven horarios disponibles
- Auditoría de cambios en configuración

## 📞 Soporte

Para dudas sobre configuración o uso del sistema:
1. Revisar ejemplos incluidos en el panel
2. Contactar soporte técnico si es necesario
3. La documentación se actualiza con nuevos casos de uso

---

**Fecha de Implementación**: 11 de noviembre de 2025  
**Versión**: 2.0  
**Estado**: ✅ Activo y Funcional