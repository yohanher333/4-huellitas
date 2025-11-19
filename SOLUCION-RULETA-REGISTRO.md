# Guía de Solución - Ruleta de Bienvenida

## Problema: La ruleta no aparece al registrarse

### Soluciones implementadas:

#### 1. **Cambio en la detección de sistema habilitado**
**Antes:** Verificaba la tabla `anniversary_config`
**Ahora:** Verifica directamente si existen premios activos en `anniversary_prizes`

```javascript
// Nueva lógica en RegisterPage.jsx
const checkAnniversaryConfig = async () => {
  const { data: prizesData } = await supabase
    .from('anniversary_prizes')
    .select('id')
    .eq('is_active', true)
    .limit(1);
  
  if (prizesData && prizesData.length > 0) {
    setAnniversaryEnabled(true);
  }
};
```

#### 2. **Pantalla de carga mientras se cargan premios**
**Antes:** Modal retornaba `null` si no había premios cargados
**Ahora:** Muestra una pantalla de "Cargando premios..." hasta que se carguen

#### 3. **Logs de depuración agregados**
Se agregaron `console.log` en puntos clave:
- RegisterPage: Al completar registro y verificar estado
- WelcomeWheelModal: Al abrir, cargar premios, verificar participación previa

### Cómo verificar que funcione:

1. **Abrir la consola del navegador** (F12 → Console)
2. **Registrar un nuevo usuario**
3. **Verificar los logs:**
   ```
   Sistema de ruleta habilitado: premios encontrados
   Registro completado. UserId: xxx Anniversary enabled: true
   Mostrando modal de ruleta
   WelcomeWheelModal - isOpen: true userId: xxx
   WelcomeWheelModal - Fetch prizes: { prizesCount: 6, error: null }
   ```

### Pasos para activar el sistema:

#### Opción A: Usar el panel de administrador
1. Ir a `/admin`
2. Sección "Configuración"
3. Pestaña "Sistema de Aniversario"
4. Agregar al menos 1 premio activo

#### Opción B: Usar el script SQL
1. Abrir Supabase SQL Editor
2. Ejecutar el archivo `insertar-premios-ejemplo.sql`
3. Verificar que se insertaron 6 premios

### Verificación en base de datos:

```sql
-- Verificar premios activos
SELECT * FROM anniversary_prizes WHERE is_active = true;

-- Debería retornar al menos 1 fila
```

### Checklist de debugging:

- [ ] ¿Hay premios activos en `anniversary_prizes`?
- [ ] ¿Los premios tienen `is_active = true`?
- [ ] ¿Las probabilidades suman 100%?
- [ ] ¿El usuario es nuevo (no existe en `anniversary_winners`)?
- [ ] ¿La consola muestra "Mostrando modal de ruleta"?
- [ ] ¿El modal está visible (z-index: 50)?

### Si aún no funciona:

1. **Limpiar caché del navegador** (Ctrl + Shift + Delete)
2. **Verificar permisos RLS en Supabase:**
   ```sql
   -- Los usuarios deben poder leer premios
   SELECT * FROM anniversary_prizes; -- Debe funcionar
   ```
3. **Revisar errores en consola del navegador**
4. **Verificar que el userId se pasa correctamente al modal**

### Logs esperados en producción:

```
✅ Sistema de ruleta habilitado: premios encontrados
✅ Registro completado. UserId: xxxxx Anniversary enabled: true
✅ Mostrando modal de ruleta
✅ WelcomeWheelModal - isOpen: true userId: xxxxx userName: Juan
✅ WelcomeWheelModal - Fetch prizes: { prizesCount: 6, error: null }
✅ WelcomeWheelModal - Check if already spun: { data: null, error: null, hasSpun: false }
```

### Para desactivar temporalmente:

Simplemente eliminar todos los premios activos o marcarlos como inactivos:
```sql
UPDATE anniversary_prizes SET is_active = false;
```

El sistema volverá a la navegación normal sin ruleta.
