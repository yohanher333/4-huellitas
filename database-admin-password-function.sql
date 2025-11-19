-- Función para que los administradores puedan cambiar contraseñas de usuarios
-- Esta función debe ejecutarse en Supabase SQL Editor

-- Crear la función RPC
CREATE OR REPLACE FUNCTION admin_update_user_password(
  user_id UUID,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_role TEXT;
  result JSON;
BEGIN
  -- Verificar que el usuario que ejecuta la función es admin
  SELECT role INTO requesting_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Si no es admin, rechazar
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Solo los administradores pueden cambiar contraseñas de otros usuarios';
  END IF;

  -- Validar que la contraseña tenga al menos 6 caracteres
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  -- Actualizar la contraseña en auth.users
  -- Nota: Esta parte requiere que uses la extensión pgsodium o pgcrypto
  -- y que tengas permisos para actualizar auth.users
  
  -- Como alternativa, podemos actualizar usando el hash
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_id;

  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  result := json_build_object(
    'success', true,
    'message', 'Contraseña actualizada correctamente'
  );

  RETURN result;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION admin_update_user_password(UUID, TEXT) TO authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION admin_update_user_password IS 'Permite a los administradores actualizar contraseñas de usuarios. Solo ejecutable por usuarios con role=admin';
