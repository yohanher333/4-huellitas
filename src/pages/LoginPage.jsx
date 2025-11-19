import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, Lock, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let emailToLogin;
    const isEmail = identifier.includes('@');

    if (isEmail) {
      emailToLogin = identifier;
    } else {
      // Es un número de teléfono
      if (identifier.length < 8) {
        toast({
          variant: "destructive",
          title: "Entrada inválida",
          description: "Por favor, introduce un número de teléfono válido.",
        });
        setLoading(false);
        return;
      }

      let profileData = null;
      let profileError = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone', identifier)
          .maybeSingle();
        profileData = data;
        profileError = error;
      } catch (err) {
        profileError = err;
      }

      if (profileError || !profileData || !profileData.email) {
        toast({
          variant: "destructive",
          title: "Fallo el inicio de sesión",
          description: "No se encontró una cuenta con ese número de teléfono.",
        });
        setLoading(false);
        return;
      }
      emailToLogin = profileData.email;
    }

    const { error } = await signIn(emailToLogin, password);
    if (!error) {
      toast({
        title: "¡Bienvenido!",
        description: "Inicio de sesión exitoso",
      });
      navigate('/'); // Redirigir al inicio o dashboard
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0378A6] to-[#F26513] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0378A6] mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-600">
                Accede a tu cuenta de 4huellitas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-700 font-medium">
                  Email o Número de Teléfono
                </Label>
                <div className="relative">
                  {identifier.includes('@') ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email o teléfono"
                    className="pl-12 h-12 rounded-xl border-2"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-12 rounded-xl border-2"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-[#0378A6] hover:bg-[#0378A6]/90 rounded-xl shadow-lg"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    const message = encodeURIComponent('Hola, olvidé mi contraseña y necesito ayuda para recuperar el acceso a mi cuenta.');
                    window.open(`https://wa.me/573012635719?text=${message}`, '_blank');
                  }}
                  className="text-[#0378A6] text-sm font-medium hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="text-center">
                <p className="text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-[#F26513] font-semibold hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;