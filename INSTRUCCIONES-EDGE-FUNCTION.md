# INSTRUCCIONES PARA CREAR LA FUNCIÓN EN SUPABASE

## Paso 1: Ve a tu proyecto en Supabase
1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto "4HUELLITAS"

## Paso 2: Crear la Edge Function
1. En el menú lateral, ve a **Edge Functions**
2. Haz clic en **"Create a new function"**
3. Nombre de la función: `delete-user`
4. Copia y pega el siguiente código:

---

## CÓDIGO DE LA FUNCIÓN:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Crear cliente Supabase con Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener userId del body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Eliminar usuario de Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    // 2. Eliminar perfil (puede fallar si ya fue eliminado por CASCADE)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (authError) {
      return new Response(
        JSON.stringify({ 
          error: 'Error al eliminar usuario de Auth', 
          details: authError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

---

## Paso 3: Desplegar la función
1. Haz clic en **"Deploy"** o **"Save"**
2. Espera a que se despliegue (puede tomar 1-2 minutos)

## Paso 4: Verificar que funcione
1. Una vez desplegada, verás la URL de la función
2. Debe ser algo como: `https://bzdldrzlhtprdwbvepuc.supabase.co/functions/v1/delete-user`

## Paso 5: ¡Listo!
Ya puedes usar el botón "Eliminar propietario" en tu administrador. La función eliminará tanto el usuario de Auth como el perfil de la base de datos.

---

## NOTAS IMPORTANTES:
- La función usa automáticamente las variables de entorno de Supabase (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
- No necesitas configurar nada adicional
- El código del frontend ya está actualizado para usar esta función
