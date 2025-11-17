import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', duration_minutes: '', cleanup_duration_minutes: '', price_by_breed: false, is_default: false });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    // Admins need to fetch the price column explicitly
    const { data, error } = await supabase.rpc('get_admin_services');
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los servicios.", variant: "destructive" });
    } else {
      setServices(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price || '',
        duration_minutes: service.duration_minutes,
        cleanup_duration_minutes: service.cleanup_duration_minutes || '',
        price_by_breed: service.price_by_breed || false,
        is_default: service.is_default || false,
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '', cleanup_duration_minutes: '', price_by_breed: false, is_default: false });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.duration_minutes) {
      toast({ title: "Error", description: "Nombre y Duración son campos obligatorios.", variant: "destructive" });
      return;
    }

    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: formData.price_by_breed ? 0 : parseFloat(formData.price || 0),
      duration_minutes: parseInt(formData.duration_minutes),
      cleanup_duration_minutes: parseInt(formData.cleanup_duration_minutes || 0),
      price_by_breed: formData.price_by_breed,
      is_default: formData.is_default,
    };

    let error;
    if (editingService) {
      ({ error } = await supabase.from('services').update(serviceData).eq('id', editingService.id));
    } else {
      ({ error } = await supabase.from('services').insert([serviceData]));
    }

    if (error) {
      toast({ title: "Error", description: `No se pudo guardar el servicio. ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `Servicio ${editingService ? 'actualizado' : 'creado'} correctamente.` });
      setIsDialogOpen(false);
      fetchServices();
    }
  };

  const handleDelete = async (serviceId) => {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el servicio.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Servicio eliminado correctamente." });
      fetchServices();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Servicios</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir Servicio
        </Button>
      </div>
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Servicio por Defecto</AlertTitle>
        <AlertDescription>
          El servicio marcado como 'Por Defecto' es el que se usa para agendar todas las citas de peluquería. Asegúrate de que solo uno esté marcado.
        </AlertDescription>
      </Alert>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Nombre</th>
              <th className="p-3 hidden md:table-cell">Precio</th>
              <th className="p-3 hidden lg:table-cell">Duración</th>
              <th className="p-3">Por Defecto</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{service.name}</td>
                <td className="p-3 hidden md:table-cell">
                  {service.price_by_breed ? 'Según Raza' : `$${Number(service.price).toLocaleString('es-CO')}`}
                </td>
                <td className="p-3 hidden lg:table-cell">{service.duration_minutes} min</td>
                <td className="p-3">
                    {service.is_default && <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Sí</span>}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                      <Edit className="w-4 h-4 text-yellow-500" />
                    </Button>
                    {!service.is_default && (
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingService ? 'Editar' : 'Nuevo'} Servicio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="is_default" checked={formData.is_default} onCheckedChange={checked => setFormData({...formData, is_default: checked})} />
                <Label htmlFor="is_default" className="cursor-pointer font-semibold text-blue-600">Marcar como servicio por defecto para agendamiento</Label>
            </div>
            <div>
              <Label htmlFor="name">Nombre del Servicio</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="price_by_breed" checked={formData.price_by_breed} onCheckedChange={checked => setFormData({...formData, price_by_breed: checked})} />
                <Label htmlFor="price_by_breed" className="cursor-pointer">El precio se define por raza/estilo</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} disabled={formData.price_by_breed} />
              </div>
              <div>
                <Label htmlFor="duration">Duración (min)</Label>
                <Input id="duration" type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="cleanup_duration">Limpieza (min)</Label>
                <Input id="cleanup_duration" type="number" value={formData.cleanup_duration_minutes} onChange={e => setFormData({...formData, cleanup_duration_minutes: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Function for admins to fetch all data including price
const createAdminServicesFunction = `
CREATE OR REPLACE FUNCTION get_admin_services()
RETURNS TABLE(id uuid, name text, description text, price numeric, duration_minutes integer, price_by_breed boolean, cleanup_duration_minutes integer, is_default boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN
    RETURN QUERY SELECT s.id, s.name, s.description, s.price, s.duration_minutes, s.price_by_breed, s.cleanup_duration_minutes, s.is_default, s.created_at FROM public.services s ORDER BY s.created_at DESC;
  ELSE
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;
END;
$$;
`;

// Run this once with the database component or if needed.
// For now, I'll just put it here for reference. Let's assume it's created.

export default ServicesList;