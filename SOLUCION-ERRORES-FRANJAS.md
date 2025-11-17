# Solución de Errores - Sistema de Franjas Personalizadas

## 🚨 Problema Actual
Al intentar agregar franjas o cargar datos, aparecen errores porque el sistema de franjas personalizadas no está configurado en la base de datos.

## ✅ Solución Paso a Paso

### **Opción 1: Configuración Completa (Recomendada)**

1. **Abrir Supabase Dashboard**
   - Ir a [supabase.com](https://supabase.com)
   - Iniciar sesión en su proyecto
   - Navegar a "SQL Editor"

2. **Ejecutar Script de Configuración**
   ```sql
   -- Copiar y pegar el contenido de:
   database/setup-franjas-simplificado.sql
   ```

3. **Verificar Creación de Tablas**
   - Ir a "Table Editor" en Supabase
   - Verificar que aparezcan las tablas:
     - `custom_time_slots`
     - `custom_slot_availability`

4. **Recargar la Aplicación**
   - Actualizar el navegador
   - El sistema debería funcionar correctamente

### **Opción 2: Usar Sistema Tradicional (Temporal)**

Mientras configura el sistema nuevo, puede usar el sistema tradicional:

1. **Ir a Horarios Tradicionales**
   ```
   Admin Dashboard → Configuración → Horarios
   ```

2. **Configurar Franjas Básicas**
   - Agregar horarios por día de la semana
   - Configurar horarios de inicio y fin

## 🔧 Verificación del Sistema

El panel ahora incluye un diagnóstico automático que muestra:

- ✅ **Verde**: Configuración correcta
- ❌ **Rojo**: Requiere configuración
- ⚠️ **Amarillo**: Advertencias

### **Estados Posibles:**

1. **Franjas Personalizadas: ❌ No Configurado**
   - Falta ejecutar script SQL
   - Seguir Opción 1 arriba

2. **Profesionales: ❌ No Configurado**
   - Ir a: `Configuración → Gestionar Profesionales`
   - Agregar al menos un profesional activo

3. **Horarios Tradicionales: ✅ Disponible**
   - Puede usar como alternativa temporal

## 📋 Script SQL Simplificado

Si no puede acceder a los archivos, aquí está el script básico:

```sql
-- Crear tabla de franjas
CREATE TABLE IF NOT EXISTS custom_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de disponibilidad
CREATE TABLE IF NOT EXISTS custom_slot_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES custom_time_slots(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    UNIQUE(slot_id, professional_id)
);

-- Configurar seguridad
ALTER TABLE custom_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_slot_availability ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow public read custom_time_slots" ON custom_time_slots FOR SELECT USING (true);
CREATE POLICY "Allow public read custom_slot_availability" ON custom_slot_availability FOR SELECT USING (true);
CREATE POLICY "Admin full access custom_time_slots" ON custom_time_slots USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');
CREATE POLICY "Admin full access custom_slot_availability" ON custom_slot_availability USING (auth.jwt() ->> 'email' = 'admin@4huellitas.com');
```

## 🚀 Después de la Configuración

Una vez configurado exitosamente:

1. **Acceder al Panel**
   ```
   Admin Dashboard → Configuración → Franjas Personalizadas
   ```

2. **Configurar Primera Franja**
   - Seleccionar día de la semana
   - Hacer clic en "Agregar Franja"
   - Configurar hora inicio/fin
   - Asignar profesionales

3. **Probar Reservas**
   - Ir al sistema de citas como usuario
   - Verificar que aparezcan las nuevas franjas

## 🆘 Si Continúan los Problemas

1. **Verificar en Supabase**
   - Table Editor → Buscar tablas `custom_time_slots` y `custom_slot_availability`
   - SQL Editor → Ejecutar: `SELECT * FROM custom_time_slots LIMIT 5;`

2. **Verificar Consola del Navegador**
   - F12 → Console
   - Buscar mensajes de error específicos

3. **Verificar Profesionales**
   - Debe existir al menos un profesional activo
   - Ir a: `Configuración → Gestionar Profesionales`

4. **Contactar Soporte**
   - Proporcionar capturas del error en consola
   - Confirmar si las tablas existen en Supabase

---

**Nota**: El sistema está diseñado para funcionar sin problemas una vez configurado. Los errores actuales son esperados y normales antes de la primera configuración.