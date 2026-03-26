import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Upload, User } from 'lucide-react';
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

const ProfessionalDialog = ({ isOpen, setIsOpen, professional, fetchProfessionals }) => {
  const [formData, setFormData] = useState({ name: '', specialty: '', phone: '', email: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name || '',
        specialty: professional.specialty || '',
        phone: professional.phone || '',
        email: professional.email || ''
      });
      setPhotoPreview(professional.photo_url);
    } else {
      setFormData({ name: '', specialty: '', phone: '', email: '' });
      setPhotoPreview(null);
    }
    setPhotoFile(null); // Reset file on open
  }, [professional, isOpen]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "El nombre es obligatorio.", variant: "destructive" });
      return;
    }
    setLoading(true);

    let finalData = { ...formData };
    
    if (photoFile) {
        const fileName = `professionals/${Date.now()}-${photoFile.name}`;
        if (professional?.photo_url) {
            const oldFileKey = professional.photo_url.split('/site-assets/')[1];
            if(oldFileKey) await supabase.storage.from('site-assets').remove([oldFileKey]);
        }
        const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, photoFile, { upsert: true });
        if (uploadError) {
            toast({ title: "Error de carga", description: `No se pudo subir la foto. ${uploadError.message}`, variant: "destructive" });
            setLoading(false); return;
        }
        const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
        finalData.photo_url = publicUrl;
    }

    const { error } = professional
      ? await supabase.from('professionals').update(finalData).eq('id', professional.id)
      : await supabase.from('professionals').insert(finalData);

    if (error) {
      toast({ title: "Error", description: `No se pudo guardar. ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `Profesional ${professional ? 'actualizado' : 'creado'}.` });
      setIsOpen(false);
      fetchProfessionals();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{professional ? 'Editar' : 'Añadir'} Profesional</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
                <img src={photoPreview || '/pet-placeholder.svg'} alt="preview" className="w-24 h-24 rounded-full object-cover bg-gray-200"/>
                <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}><Upload className="w-4 h-4 mr-2"/>Subir Foto</Button>
                <Input ref={photoInputRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/>
            </div>
            <div><Label>Nombre Completo <span className="text-red-500">*</span></Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Especialidad</Label><Input value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} placeholder="Ej: Groomer, Veterinario"/></div>
            <div><Label>Teléfono</Label><Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" disabled={loading}>Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const ProfessionalsList = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('professionals').select('*').order('name', { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los profesionales.", variant: "destructive" });
    } else {
      setProfessionals(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);
  
  const handleOpenDialog = (prof = null) => {
    setEditingProfessional(prof);
    setIsDialogOpen(true);
  };

  const handleDelete = async (profId) => {
    const { error } = await supabase.from('professionals').delete().eq('id', profId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el profesional.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Profesional eliminado." });
      fetchProfessionals();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#0378A6]/10 p-6 border border-[#0378A6]/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profesionales</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Añadir Profesional
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Nombre</th>
              <th className="p-3 hidden md:table-cell">Especialidad</th>
              <th className="p-3 hidden lg:table-cell">Contacto</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {professionals.map(prof => (
              <tr key={prof.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                    <div className="flex items-center gap-3">
                        <img src={prof.photo_url || '/pet-placeholder.svg'} alt={prof.name} className="w-10 h-10 rounded-full object-cover"/>
                        <span className="font-medium">{prof.name}</span>
                    </div>
                </td>
                <td className="p-3 hidden md:table-cell">{prof.specialty}</td>
                <td className="p-3 hidden lg:table-cell">{prof.phone || prof.email}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(prof)}>
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
                          <AlertDialogTitle>¿Eliminar a {prof.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(prof.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
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
       <ProfessionalDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} professional={editingProfessional} fetchProfessionals={fetchProfessionals} />
    </motion.div>
  );
};

export default ProfessionalsList;