import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OwnerDialog = ({ isOpen, setIsOpen, owner, fetchOwners }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '' });

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || '',
        email: owner.email || '',
        phone: owner.phone || '',
        address: owner.address || '',
        password: ''
      });
    } else {
      setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    }
  }, [owner, isOpen]);

  const handleSave = async () => {
    let result;
    if (owner && owner.id) {
      result = await supabase
        .from('profiles')
        .update({ name: formData.name, email: formData.email, phone: formData.phone ?? '', address: formData.address ?? '' })
        .eq('id', owner.id);
      if (result.error) {
        toast({ title: "Error", description: "No se pudo actualizar el propietario.", variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Propietario actualizado correctamente." });
    } else {
      // 1. Crear usuario en Supabase Auth usando admin API para no cambiar sesión
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: { name: formData.name, phone: formData.phone ?? '', address: formData.address ?? '' },
      });
      if (signUpError || !signUpData?.user) {
        toast({ title: "Error", description: "No se pudo crear el usuario. " + (signUpError?.message || ''), variant: "destructive" });
        return;
      }
      // 2. Crear perfil en profiles con el id del usuario y datos completos
      const userId = signUpData.user.id;
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, name: formData.name, email: formData.email, phone: formData.phone ?? '', address: formData.address ?? '', role: 'user' }]);
      if (profileError) {
        toast({ title: "Error", description: "No se pudo crear el perfil del propietario.", variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Propietario creado correctamente." });
    }
    setIsOpen(false);
    fetchOwners();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{owner ? 'Editar Propietario' : 'Añadir Propietario'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label htmlFor="name">Nombre</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          <div><Label htmlFor="address">Dirección</Label><Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
          <div><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleSave}>{owner ? 'Guardar Cambios' : 'Crear Propietario'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const OwnersList = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedOwners, setSelectedOwners] = useState([]);
  const navigate = useNavigate();
  // Filtrado de propietarios
  const filteredOwners = owners.filter(o =>
    o.name?.toLowerCase().includes(filter.toLowerCase()) ||
    o.email?.toLowerCase().includes(filter.toLowerCase())
  );

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los propietarios.", variant: "destructive" });
    } else {
      setOwners(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);
  
  const handleOpenDialog = (owner) => {
    setEditingOwner(owner);
    setIsDialogOpen(true);
  };
  const handleOpenCreateDialog = () => {
    setEditingOwner(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (ownerId) => {
    // Llamar a Supabase Edge Function para eliminar usuario y perfil
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://bzdldrzlhtprdwbvepuc.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGxkcnpsaHRwcmR3YnZlcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTUxNzQsImV4cCI6MjA3NTI3MTE3NH0.AcqwX7FuJz4lx9gRKFt_sWhTbUKFZQdvQ5QGyjH-xf8'}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGxkcnpsaHRwcmR3YnZlcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTUxNzQsImV4cCI6MjA3NTI3MTE3NH0.AcqwX7FuJz4lx9gRKFt_sWhTbUKFZQdvQ5QGyjH-xf8'
        },
        body: JSON.stringify({ userId: ownerId })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        toast({ 
          title: "Error", 
          description: errorData.error || "No se pudo eliminar completamente el propietario.", 
          variant: "destructive" 
        });
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Propietario eliminado correctamente." });
        fetchOwners();
      } else {
        toast({ title: "Error", description: data.error || "No se pudo eliminar el propietario.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red al eliminar propietario.", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOwners.length === 0) return;
    const { error } = await supabase.from('profiles').delete().in('id', selectedOwners);
    if (error) {
      toast({ title: "Error", description: "No se pudieron eliminar los propietarios seleccionados.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Propietarios eliminados correctamente." });
      setSelectedOwners([]);
      fetchOwners();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800">Propietarios</h2>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Filtrar por nombre o email..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> Añadir Propietario
          </Button>
          <Button variant="destructive" disabled={selectedOwners.length === 0} onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar seleccionados
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3"><input type="checkbox" checked={selectedOwners.length === filteredOwners.length && filteredOwners.length > 0} onChange={e => setSelectedOwners(e.target.checked ? filteredOwners.map(o => o.id) : [])} /></th>
              <th className="p-3">Nombre</th>
              <th className="p-3 hidden md:table-cell">Email</th>
              <th className="p-3 hidden lg:table-cell">Teléfono</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOwners.map(owner => (
              <tr key={owner.id} className="border-b hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" checked={selectedOwners.includes(owner.id)} onChange={e => {
                  if (e.target.checked) setSelectedOwners([...selectedOwners, owner.id]);
                  else setSelectedOwners(selectedOwners.filter(id => id !== owner.id));
                }} /></td>
                <td className="p-3 font-medium">{owner.name}</td>
                <td className="p-3 hidden md:table-cell">{owner.email}</td>
                <td className="p-3 hidden lg:table-cell">{owner.phone}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/owners/${owner.id}`)}>
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(owner)}>
                      <Edit className="w-4 h-4 text-yellow-500" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al propietario y todos sus datos asociados (incluidas mascotas y citas).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(owner.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isDialogOpen && (
        <OwnerDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} owner={editingOwner} fetchOwners={fetchOwners} />
      )}
    </motion.div>
  );
};

export default OwnersList;