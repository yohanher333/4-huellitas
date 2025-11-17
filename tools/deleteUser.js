// Endpoint Express para eliminar usuario de Supabase Auth y profile
// Usar Service Role Key en variable de entorno

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const SUPABASE_URL = 'https://bzdldrzlhtprdwbvepuc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

app.post('/api/delete-user', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });

  // Eliminar usuario de Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  // Eliminar perfil de profiles
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);

  if (authError || profileError) {
    return res.status(500).json({ error: 'No se pudo eliminar completamente el usuario', authError, profileError });
  }
  return res.json({ success: true });
});

// Para desarrollo local
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log('API delete-user corriendo en puerto', PORT));
}

module.exports = app;
