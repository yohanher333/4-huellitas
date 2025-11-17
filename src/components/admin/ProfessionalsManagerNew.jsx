import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, Edit, Phone, Mail, Award, Clock } from 'lucide-react';

const ProfessionalsManagerNew = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    specialties: '',
    phone: '',
    email: '',
    photo_url: '',
    bio: '',
    years_experience: 0
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      // Intentar con todas las columnas primero
      let { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Si falla, intentar con columnas básicas
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        const { data: basicData, error: basicError } = await supabase
          .from('professionals')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        
        if (basicError) throw basicError;
        
        // Mapear datos básicos con valores por defecto
        data = basicData.map(prof => ({
          ...prof,
          specialties: [],
          phone: null,
          email: null,
          photo_url: null,
          bio: null,
          years_experience: 0
        }));

        toast({
          title: "Información limitada",
          description: "La tabla professionals necesita ser actualizada para mostrar información completa.",
          variant: "default"
        });
      } else if (error) {
        throw error;
      }

      setProfessionals(data || []);
    } catch (error) {
      toast({
        title: "Error al cargar profesionales",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para generar ID automático
  const generateProfessionalId = async () => {
    const { data: existing } = await supabase
      .from('professionals')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (existing && existing.length > 0) {
      const lastId = existing[0].id;
      const match = lastId.match(/prof_(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `prof_${nextNum.toString().padStart(3, '0')}`;
      }
    }
  return '';
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      specialties: '',
      phone: '',
      email: '',
      photo_url: '',
      bio: '',
      years_experience: 0
    });
    setEditingProfessional(null);
    setPhotoFile(null);
  };

  const handleEdit = (professional) => {
    setEditingProfessional(professional);
    setFormData({
      id: professional.id,
      name: professional.name || '',
      specialties: professional.specialties?.join(', ') || '',
      phone: professional.phone || '',
      email: professional.email || '',
      photo_url: professional.photo_url || '',
      bio: professional.bio || '',
      years_experience: professional.years_experience || 0
    });
    setIsDialogOpen(true);
  };

  const handleAdd = async () => {
  resetForm();
  // No generar id, dejar que Supabase lo cree automáticamente (UUID)
  setFormData(prev => ({ ...prev, id: '' }));
  setIsDialogOpen(true);
  };

  // Función para subir foto a Supabase Storage
  const uploadPhoto = async (file) => {
    if (!file) return null;
    
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos') // Asegúrate de que este bucket existe
        .upload(filePath, file);

      if (uploadError) {
        // Si el bucket no existe, usar URL temporal
        console.warn('Storage upload failed, using temporary URL:', uploadError);
        return URL.createObjectURL(file);
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      // Fallback a URL temporal
      return URL.createObjectURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo es 5MB",
        variant: "destructive"
      });
      return;
    }

    setPhotoFile(file);
    
    // Subir foto y obtener URL
    const photoUrl = await uploadPhoto(file);
    if (photoUrl) {
      setFormData(prev => ({ ...prev, photo_url: photoUrl }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Campo requerido",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    // Solo incluir el id si se está editando
    let basicData = {
      name: formData.name,
      is_active: true
    };
    if (editingProfessional && formData.id) {
      basicData.id = formData.id;
    }

    try {

      // Datos extendidos que pueden no existir aún
      const extendedData = {
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : [],
        phone: formData.phone || null,
        email: formData.email || null,
        photo_url: formData.photo_url || null,
        bio: formData.bio || null,
        years_experience: parseInt(formData.years_experience) || 0
      };

      let error;

      // Intentar con todos los datos primero
      let professionalData = { ...basicData, ...extendedData };

      if (editingProfessional) {
        // Actualizar profesional existente
        const { error: updateError } = await supabase
          .from('professionals')
          .update(professionalData)
          .eq('id', editingProfessional.id);
        
        // Si falla por columnas faltantes, intentar solo con datos básicos
        if (updateError && updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          const { error: basicUpdateError } = await supabase
            .from('professionals')
            .update(basicData)
            .eq('id', editingProfessional.id);
          error = basicUpdateError;
          
          if (!basicUpdateError) {
            toast({
              title: "Actualización parcial",
              description: "Solo se actualizaron los campos básicos. Ejecuta el script SQL para habilitar todas las funciones.",
              variant: "default"
            });
          }
        } else {
          error = updateError;
        }
      } else {
        // Crear nuevo profesional
        const { error: insertError } = await supabase
          .from('professionals')
          .insert([professionalData]);
        
        // Si falla por columnas faltantes, intentar solo con datos básicos
        if (insertError && insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const { error: basicInsertError } = await supabase
            .from('professionals')
            .insert([basicData]);
          error = basicInsertError;
          
          if (!basicInsertError) {
            toast({
              title: "Inserción parcial",
              description: "Solo se guardaron los campos básicos. Ejecuta el script SQL para habilitar todas las funciones.",
              variant: "default"
            });
          }
        } else {
          error = insertError;
        }

        if (!error) {
          // Agregar a todos los horarios existentes
          const { data: workSchedules } = await supabase
            .from('work_schedules')
            .select('id')
            .eq('is_active', true);

          if (workSchedules?.length > 0) {
            const availabilityInserts = workSchedules.map(schedule => ({
              professional_id: professionalId,
              schedule_id: schedule.id
            }));

            await supabase
              .from('professional_availability')
              .insert(availabilityInserts);
          }
        }
      }

      if (error) throw error;

      toast({
        title: editingProfessional ? "Profesional actualizado" : "Profesional agregado",
        description: "Los cambios se guardaron correctamente"
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProfessionals();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (professionalId) => {
    try {
      // Verificar si tiene citas asignadas
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('assigned_professional_id', professionalId)
        .eq('status', 'scheduled');

      if (appointments?.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `Este profesional tiene ${appointments.length} cita(s) programada(s)`,
          variant: "destructive"
        });
        return;
      }

      // Eliminar de professional_availability
      await supabase
        .from('professional_availability')
        .delete()
        .eq('professional_id', professionalId);

      // Marcar como inactivo en lugar de eliminar
      const { error } = await supabase
        .from('professionals')
        .update({ is_active: false })
        .eq('id', professionalId);

      if (error) throw error;

      toast({
        title: "Profesional eliminado",
        description: "El profesional ha sido desactivado correctamente"
      });

      fetchProfessionals();
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProfessionalStats = async (professionalId) => {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('assigned_professional_id', professionalId);

    const total = appointments?.length || 0;
    const scheduled = appointments?.filter(a => a.status === 'scheduled').length || 0;

    return { total, scheduled };
  };

  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadStats = async () => {
      const newStats = {};
      for (const prof of professionals) {
        newStats[prof.id] = await getProfessionalStats(prof.id);
      }
      setStats(newStats);
    };

    if (professionals.length > 0) {
      loadStats();
    }
  }, [professionals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Profesionales
          </CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Profesional
          </Button>
        </CardHeader>
        <CardContent>
          {professionals.length > 0 ? (
            <div className="grid gap-6">
              {professionals.map(prof => (
                <Card key={prof.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Foto de perfil */}
                      <div className="flex-shrink-0">
                        <img
                          src={prof.photo_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'}
                          alt={prof.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                        />
                      </div>
                      
                      {/* Información principal */}
                      <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{prof.name}</h3>
                            <p className="text-sm text-gray-600">ID: {prof.id}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(prof)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar profesional?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se eliminará a <strong>{prof.name}</strong> del sistema. 
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(prof.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Especialidades */}
                        {prof.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {prof.specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Contacto */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {prof.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {prof.phone}
                            </div>
                          )}
                          {prof.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {prof.email}
                            </div>
                          )}
                          {prof.years_experience > 0 && (
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {prof.years_experience} años de experiencia
                            </div>
                          )}
                        </div>

                        {/* Bio */}
                        {prof.bio && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {prof.bio}
                          </p>
                        )}

                        {/* Estadísticas */}
                        {stats[prof.id] && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <span>{stats[prof.id].total} citas totales</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-500" />
                              <span>{stats[prof.id].scheduled} programadas</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No hay profesionales registrados</h3>
              <p className="text-gray-500 mb-4">Agrega el primer profesional para comenzar</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Profesional
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar profesional */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? 'Editar Profesional' : 'Agregar Nuevo Profesional'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* ID automático - solo mostrar en modo edición */}
            {editingProfessional && (
              <div>
                <Label>ID del Profesional</Label>
                <Input
                  value={formData.id}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            )}

            <div>
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Dr. López"
              />
            </div>

            {/* Foto de perfil */}
            <div>
              <Label htmlFor="photo">Foto de Perfil</Label>
              <div className="space-y-3">
                {formData.photo_url && (
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({...formData, photo_url: ''})}
                    >
                      Eliminar foto
                    </Button>
                  </div>
                )}
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto && (
                  <p className="text-sm text-blue-600">Subiendo foto...</p>
                )}
                <p className="text-xs text-gray-500">
                  Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="specialties">Especialidades (separadas por coma)</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                placeholder="Corte, Baño, Desparasitación"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="profesional@4huellitas.com"
                />
              </div>
            </div>

            {/* El campo de URL de foto de perfil se elimina, solo se usa la subida de foto */}

            <div>
              <Label htmlFor="years_experience">Años de Experiencia</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                value={formData.years_experience}
                onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Describe la experiencia y especialidades del profesional..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingProfessional ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalsManagerNew;