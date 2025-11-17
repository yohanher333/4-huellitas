# 🎯 INSTRUCCIONES: Sistema de Puntos Automáticos

## 📋 ¿Qué hace este sistema?

El sistema ahora asigna puntos automáticamente en las siguientes situaciones:

### 🎁 **Puntos por Registro** (100 puntos)
- Se asignan automáticamente cuando un nuevo usuario completa su registro
- Tipo: `registration` 
- Descripción: "¡Bienvenido a la Manada! - Registro en plataforma"

### 📅 **Puntos por Cita Agendada** (200 puntos)  
- Se asignan automáticamente cuando un usuario agenda una nueva cita
- **IMPORTANTE**: NO se asignan al reagendar una cita existente
- Tipo: `appointment_scheduled`
- Descripción: "Cita Agendada - Gracias por confiar en nosotros"

### ⚙️ **Puntos Manuales del Administrador**
- Los administradores pueden seguir asignando puntos manualmente como antes:
  - Corte de Uñas (500 pts)
  - Limpieza de Oídos (1000 pts) 
  - SPA (2000 pts)
  - Desparasitantes (3000-5000 pts)
  - Puntos personalizados

## 🗄️ Base de Datos Requerida

**DEBES ejecutar el siguiente script SQL** en tu panel de Supabase para que funcione:

### Archivo a ejecutar: `puntos-simple.sql`

1. Ve al **SQL Editor** en tu panel de Supabase
2. Copia y pega el contenido completo del archivo `puntos-simple.sql`
3. Haz clic en **"Run"** para ejecutar el script

## ✅ ¿Qué incluye el script?

- ✅ Tabla `user_points_history` para historial de puntos
- ✅ Función `calculate_current_points()` para calcular puntos vigentes
- ✅ Triggers automáticos para actualizar puntos en `profiles`
- ✅ Políticas de seguridad RLS
- ✅ Expiración automática de puntos (1 año)
- ✅ Vista de rankings de usuarios

## 🔧 Funcionamiento Automático

### En el Registro:
```javascript
// Se ejecuta automáticamente después del registro exitoso
await assignWelcomePoints(userId);
```

### Al Agendar Cita:
```javascript  
// Se ejecuta automáticamente después de crear la cita
if (!isRescheduleMode) {
  await assignAppointmentPoints(user.id);
}
```

## 🎨 Visualización en la App

- **Dashboard del Usuario**: Muestra puntos totales vigentes
- **Historial de Logros**: Lista todos los puntos con colores por tipo
- **Panel Admin**: Ranking de usuarios + asignación manual

## ⚠️ Notas Importantes

1. **Los puntos expiran automáticamente después de 1 año**
2. **Los puntos se calculan dinámicamente** (solo se cuentan los vigentes)
3. **Los errores de puntos no afectan** las operaciones principales (registro/citas)
4. **El administrador mantiene control total** sobre asignaciones manuales

## 🚀 ¡Listo para usar!

Una vez ejecutes el script SQL, el sistema funcionará automáticamente sin necesidad de configuración adicional.