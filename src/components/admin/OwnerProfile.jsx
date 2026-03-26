import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Mail, Phone, MapPin, Dog, Key } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const OwnerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive'
      });
      return;
    }

    setChangingPassword(true);

    try {
      // Actualizar la contraseña directamente en auth.users usando RPC
      const { error } = await supabase.rpc('admin_update_user_password', {
        user_id: id,
        new_password: newPassword
      });

      if (error) {
        // Si RPC no existe, intentar con actualización directa del perfil
        // y notificar que deben usar el enlace de recuperación
        console.error('RPC error:', error);
        
        // Enviar email de recuperación como alternativa
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          owner.email,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (resetError) throw resetError;

        toast({
          title: 'Email enviado',
          description: `Se ha enviado un correo de recuperación a ${owner.email}. El usuario debe seguir el enlace para establecer su nueva contraseña.`,
        });
      } else {
        toast({
          title: 'Éxito',
          description: 'Contraseña actualizada correctamente'
        });
      }

      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      
      // Como alternativa final, enviar email de recuperación
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          owner.email,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (!resetError) {
          toast({
            title: 'Email de recuperación enviado',
            description: `Se ha enviado un correo de recuperación a ${owner.email}. El usuario puede establecer una nueva contraseña desde allí.`,
          });
          setShowPasswordDialog(false);
          setNewPassword('');
          setConfirmPassword('');
        } else {
          throw new Error('No se pudo enviar el email de recuperación');
        }
      } catch (finalError) {
        toast({
          title: 'Error',
          description: 'No se pudo cambiar la contraseña. Por favor, contacta al soporte técnico.',
          variant: 'destructive'
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    const fetchOwnerData = async () => {
      setLoading(true);
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (ownerError || !ownerData) {
        toast({ title: "Error", description: "No se pudo encontrar al propietario.", variant: "destructive" });
        navigate('/admin/owners');
        return;
      }
      setOwner(ownerData);

      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*, breed:breeds(name)')
        .eq('owner_id', id);
      
      if (petsError) {
        toast({ title: "Error", description: "No se pudieron cargar las mascotas.", variant: "destructive" });
      } else {
        setPets(petsData);
      }

      setLoading(false);
    };

    fetchOwnerData();
  }, [id, navigate]);


  if (loading) {
    return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;
  }

  if (!owner) return null;

  const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
      <Icon className="w-6 h-6 text-[#0378A6]" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || 'No especificado'}</p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="-m-4 md:-m-6 p-4 md:p-6">
      <Button onClick={() => navigate('/admin/owners')} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Propietarios
      </Button>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#0378A6]/10 p-6 md:p-8 border border-[#0378A6]/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {owner.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 font-heading">{owner.name}</h1>
              <p className="text-gray-600">ID: {owner.id.substring(0, 8)}</p>
              {owner.is_in_clinton_list && <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full mt-2 inline-block">EN LISTA NEGRA</span>}
            </div>
          </div>
          <Button 
            onClick={() => setShowPasswordDialog(true)}
            variant="outline"
            className="border-[#0378A6] text-[#0378A6] hover:bg-[#0378A6] hover:text-white"
          >
            <Key className="w-4 h-4 mr-2" />
            Cambiar Contraseña
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <InfoCard icon={User} label="Nombre Completo" value={owner.name} />
          <InfoCard icon={Mail} label="Email" value={owner.email} />
          <InfoCard icon={Phone} label="Teléfono" value={owner.phone} />
          <InfoCard icon={MapPin} label="Dirección" value={owner.address} />
          <InfoCard icon={User} label="Documento" value={owner.document_number} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mascotas Registradas</h2>
          {pets.length > 0 ? (
            <div className="space-y-4">
              {pets.map(pet => (
                <div key={pet.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#F26513] p-3 rounded-full">
                      <Dog className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{pet.name}</p>
                      <p className="text-sm text-gray-600">{pet.breed?.name || pet.breed || 'Raza no especificada'}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/admin/pets/${pet.id}`)}>
                    Ver Ficha
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Este propietario no tiene mascotas registradas.</p>
          )}
        </div>
      </div>

      {/* Diálogo para cambiar contraseña */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {owner.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={changingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                disabled={changingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={changingPassword}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-[#0378A6] hover:bg-[#0378A6]/90"
            >
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default OwnerProfile;