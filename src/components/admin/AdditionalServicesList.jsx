import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Plus } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";

const AdditionalServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_min: '',
    price_max: '',
    is_mandatory_conditional: false
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('additional_services').select('*').order('created_at', { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los servicios adicionales.", variant: "destructive" });
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
        price_min: service.price_min || '',
        price_max: service.price_max || '',
        is_mandatory_conditional: service.is_mandatory_conditional
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price_min: '', price_max: '', is_mandatory_conditional: false });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "El nombre es obligatorio.", variant: "destructive" });
      return;
    }
    
    const serviceData = {
        name: formData.name,
        description: formData.description,
        price_min: formData.price_min || null,
        price_max: formData.price_max || null,
        is_mandatory_conditional: formData.is_mandatory_conditional
    };

    let error;
    if (editingService) {
      ({ error } = await supabase.from('additional_services').update(serviceData).eq('id', editingService.id));
    } else {
      ({ error } = await supabase.from('additional_services').insert(serviceData));
    }
    
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el servicio.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `Servicio ${editingService ? 'actualizado' : 'creado'} con éxito.` });
      setIsDialogOpen(false);
      fetchServices();
    }
  };

  const handleDelete = async (serviceId) => {
    const { error } = await supabase.from('additional_services').delete().eq('id', serviceId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el servicio.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Servicio eliminado con éxito." });
      fetchServices();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Servicios Adicionales</h2>
        <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Añadir Servicio</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Nombre</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Condicional</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{service.name}</td>
                <td className="p-3">
                  {service.price_min && service.price_max ? `$${Number(service.price_min).toLocaleString('es-CO')} - $${Number(service.price_max).toLocaleString('es-CO')}` : service.price_min ? `$${Number(service.price_min).toLocaleString('es-CO')}` : 'N/A'}
                </td>
                <td className="p-3">{service.is_mandatory_conditional ? 'Sí' : 'No'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}><Edit className="w-4 h-4 text-yellow-500" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción eliminará el servicio permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingService ? 'Editar' : 'Añadir'} Servicio Adicional</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
                <Label htmlFor="name">Nombre del Servicio</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Se aplica si se detectan pulgas durante el servicio." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="price_min">Precio Mínimo</Label>
                    <Input id="price_min" type="number" placeholder="15000" value={formData.price_min} onChange={e => setFormData({...formData, price_min: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="price_max">Precio Máximo</Label>
                    <Input id="price_max" type="number" placeholder="20000" value={formData.price_max} onChange={e => setFormData({...formData, price_max: e.target.value})} />
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="is_mandatory_conditional" checked={formData.is_mandatory_conditional} onCheckedChange={checked => setFormData({...formData, is_mandatory_conditional: checked})} />
                <label htmlFor="is_mandatory_conditional" className="text-sm font-medium leading-none">Es un servicio obligatorio condicional (ej. Baño antipulgas)</label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdditionalServicesList;