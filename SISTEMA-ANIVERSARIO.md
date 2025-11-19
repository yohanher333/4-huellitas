# Sistema de Aniversario con Ruleta de Premios
**4 Huellitas - Centro Veterinario**

## 📋 Resumen del Sistema

El sistema de aniversario incluye una ruleta de premios interactiva y atractiva que puede activarse para celebraciones especiales. Solo el administrador puede acceder a la configuración y visualizar la ruleta en modo pantalla completa.

## 🎯 Características Principales

### 1. **Panel de Configuración del Aniversario**
- **Ubicación**: Panel Admin → Configuración → Aniversario
- **Funcionalidades**:
  - Toggle para activar/desactivar el sistema
  - Configuración de título y descripción
  - Fechas de inicio y fin del evento
  - Gestión completa de premios

### 2. **Gestión de Premios**
- **Crear premios personalizados** con:
  - Nombre del premio
  - Descripción opcional
  - Probabilidad (0-100%)
  - Color personalizable (8 opciones)
  - Estado activo/inactivo
  
- **Validación automática**: El sistema verifica que la suma de probabilidades sea exactamente 100%

### 3. **Ruleta Interactiva**
- **Ubicación**: `/admin/anniversary-wheel` (solo admin)
- **Características**:
  - Diseño de pantalla completa
  - Animaciones suaves y profesionales
  - Efectos visuales con partículas flotantes
  - Confetti al ganar
  - Selección aleatoria basada en probabilidades
  - Botón "Intentar de Nuevo" para múltiples giros

## 📊 Base de Datos

### Tablas Creadas

#### 1. `anniversary_config`
```sql
- id (UUID)
- enabled (boolean) - Estado del sistema
- start_date (timestamptz)
- end_date (timestamptz)
- title (text)
- description (text)
```

#### 2. `anniversary_prizes`
```sql
- id (UUID)
- name (text) - Nombre del premio
- description (text) - Descripción opcional
- probability (decimal) - 0 a 100%
- color (text) - Color hexadecimal
- is_active (boolean)
- order_position (integer)
```

#### 3. `anniversary_winners`
```sql
- id (UUID)
- user_id (UUID) - Referencia al usuario
- prize_id (UUID) - Referencia al premio
- prize_name (text) - Nombre del premio ganado
- won_at (timestamptz)
- is_claimed (boolean)
```

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Script SQL
```bash
# Ejecuta el script en tu base de datos Supabase
database-anniversary-system.sql
```

Este script crea:
- Las 3 tablas necesarias
- Políticas RLS (Row Level Security)
- Índices para optimización
- Datos de ejemplo (6 premios predefinidos)

### Paso 2: Activar el Sistema
1. Inicia sesión como **administrador**
2. Ve a **Configuración → Aniversario**
3. Activa el toggle principal
4. Configura fechas y premios
5. Asegúrate que las probabilidades sumen **100%**

### Paso 3: Acceder a la Ruleta
- URL: `http://tu-dominio.com/admin/anniversary-wheel`
- Solo accesible por usuarios con rol `admin`

## 🎨 Personalización de Premios

### Colores Disponibles
1. **Azul Principal** - #0378A6
2. **Naranja Principal** - #F26513
3. **Verde** - #10B981
4. **Púrpura** - #8B5CF6
5. **Rosa** - #EC4899
6. **Amarillo** - #F59E0B
7. **Rojo** - #EF4444
8. **Gris** - #6B7280

### Ejemplo de Premio
```javascript
{
  name: "Baño Gratis",
  description: "Un baño completo gratis para tu mascota",
  probability: 15.00, // 15%
  color: "#0378A6",
  is_active: true
}
```

## 📱 Interfaz de Usuario

### Panel de Configuración
- **Pestaña General**: Título, descripción y fechas
- **Pestaña Premios**: Lista de premios con:
  - Vista previa del color
  - Nombre y probabilidad
  - Indicador de estado (activo/inactivo)
  - Botones de edición y eliminación
  - Validación visual de probabilidades

### Página de la Ruleta
- **Fondo**: Gradiente animado (azul → púrpura → naranja)
- **Partículas**: Estrellas flotantes en el fondo
- **Ruleta**: Segmentos de colores según premios configurados
- **Indicador**: Flecha dorada en la parte superior
- **Botón Girar**: Grande, dorado, con animación hover
- **Modal de Resultado**: Aparece automáticamente al ganar

## 🔧 Componentes Técnicos

### Archivos Creados
```
database-anniversary-system.sql              # Script SQL
src/components/admin/AnniversaryConfig.jsx   # Panel de configuración
src/pages/AnniversaryWheelPage.jsx          # Página de la ruleta
```

### Archivos Modificados
```
src/App.jsx                                  # Ruta /admin/anniversary-wheel
src/pages/AdminDashboard.jsx                # Menú y ruta de configuración
package.json                                 # canvas-confetti añadido
```

### Dependencias Instaladas
```json
{
  "canvas-confetti": "^1.9.3"  // Efectos de confetti
}
```

## 🎯 Algoritmo de Selección de Premios

El sistema utiliza un **algoritmo de selección ponderada**:

```javascript
// Genera número aleatorio 0-100
const random = Math.random() * 100;
let cumulative = 0;

// Itera sobre premios acumulando probabilidades
for (const prize of prizes) {
  cumulative += parseFloat(prize.probability);
  if (random <= cumulative) {
    return prize; // Premio seleccionado
  }
}
```

### Ejemplo Práctico
Con estos premios:
- Premio A: 30%
- Premio B: 50%
- Premio C: 20%

Si random = 45:
- cumulative = 30 → 45 > 30, continúa
- cumulative = 80 (30+50) → 45 ≤ 80 → **Selecciona Premio B**

## 🔐 Seguridad

### Políticas RLS Implementadas
```sql
-- Configuración: Todos leen, solo admin modifica
-- Premios: Todos ven activos, solo admin gestiona
-- Ganadores: Usuarios ven sus premios, admin ve todos
```

### Protección de Rutas
```javascript
// Solo administradores pueden acceder
session && profile?.role === 'admin' ? 
  <AnniversaryWheelPage /> : 
  <Navigate to="/login" />
```

## 📈 Historial de Ganadores

Cada vez que un usuario gana, se registra en `anniversary_winners`:
- ID del usuario
- Premio ganado
- Fecha y hora
- Estado de reclamación

Los administradores pueden ver este historial para gestionar premios.

## 🎉 Efectos Visuales

### Animaciones Implementadas
1. **Giro de ruleta**: Transición suave 4 segundos
2. **Confetti**: 5 disparos escalonados con diferentes ángulos
3. **Modal de resultado**: Entrada con rotación y escala
4. **Partículas de fondo**: Movimiento continuo vertical
5. **Trofeo**: Rotación periódica en el modal

### Timing
- Duración del giro: 4 segundos
- Delay confetti: Al terminar el giro
- Modal: Aparece después del confetti

## 💡 Casos de Uso

### 1. Aniversario de la Veterinaria
```
Título: "5 Años de 4 Huellitas"
Duración: 1 semana
Premios: Descuentos escalonados y servicios gratis
```

### 2. Promoción Especial
```
Título: "Mes de las Mascotas"
Duración: 1 mes
Premios: Productos y servicios con descuento
```

### 3. Día del Veterinario
```
Título: "Celebra con tu Mascota"
Duración: 1 día
Premios: Sorpresas y regalos instantáneos
```

## ⚠️ Consideraciones Importantes

1. **Probabilidades**: Deben sumar exactamente 100%
2. **Premios activos**: Solo los premios con `is_active = true` aparecen en la ruleta
3. **Acceso**: Solo administradores pueden ver la ruleta
4. **Historial**: Se guarda automáticamente cada giro
5. **Fechas**: El sistema no bloquea por fechas, solo es informativo

## 🔄 Flujo de Uso

```mermaid
1. Admin activa el sistema
2. Admin configura premios (100% total)
3. Admin accede a /admin/anniversary-wheel
4. Admin hace clic en "¡GIRAR!"
5. Ruleta gira 4 segundos
6. Se dispara confetti
7. Aparece modal con premio ganado
8. Se guarda en historial
9. Admin puede "Intentar de Nuevo"
```

## 📞 Soporte

Si tienes dudas o problemas:
- Verifica que las tablas estén creadas correctamente
- Asegúrate de tener rol `admin` en la tabla `profiles`
- Revisa que las probabilidades sumen 100%
- Comprueba que hay al menos un premio activo

---

**Sistema creado para**: 4 Huellitas - Centro Veterinario  
**Versión**: 1.0.0  
**Fecha**: Noviembre 2025
