import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, Edit, Phone, Mail, Award, Clock, User } from 'lucide-react';

const ProfessionalsManager = () => {
  const [professionals, setProfessionals] = useState([]);
  const [newProfessional, setNewProfessional] = useState({ 
    id: '', 
    name: '', 
    photo_url: '', 
    phone: '', 
    email: '', 
    specialty: '', 
    experience_years: '', 
    description: '' 
  });
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      // Obtener profesionales de la tabla professionals
      const { data: professionalsData, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfessionals(professionalsData || []);
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

  const handleAddProfessional = async () => {
    if (!newProfessional.id || !newProfessional.name) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa ID y nombre del profesional",
        variant: "destructive"
      });
      return;
    }

    if (newProfessional.email && !/\S+@\S+\.\S+/.test(newProfessional.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insertar en la tabla professionals
      const professionalData = {
        id: newProfessional.id,
        name: newProfessional.name,
        photo_url: newProfessional.photo_url || null,
        phone: newProfessional.phone || null,
        email: newProfessional.email || null,
        specialty: newProfessional.specialty || null,
        experience_years: newProfessional.experience_years ? parseInt(newProfessional.experience_years) : null,
        description: newProfessional.description || null,
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('professionals')
        .insert(professionalData);

      if (insertError) throw insertError;

      // Obtener todos los horarios existentes y agregar disponibilidad
      const { data: workSchedules } = await supabase
        .from('work_schedules')
        .select('id')
        .eq('is_active', true);

      if (workSchedules && workSchedules.length > 0) {
        const insertPromises = workSchedules.map(schedule => 
          supabase
            .from('professional_availability')
            .insert({
              schedule_id: schedule.id,
              professional_id: newProfessional.id
            })
        );

        await Promise.all(insertPromises);
      }
      
      toast({ title: "Profesional agregado exitosamente" });
      resetForm();
      fetchProfessionals();
    } catch (error) {
      toast({
        title: "Error al agregar profesional",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditProfessional = async () => {
    if (!editingProfessional.name) {
      toast({
        title: "Campo requerido",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (editingProfessional.email && !/\S+@\S+\.\S+/.test(editingProfessional.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const professionalData = {
        name: editingProfessional.name,
        photo_url: editingProfessional.photo_url || null,
        phone: editingProfessional.phone || null,
        email: editingProfessional.email || null,
        specialty: editingProfessional.specialty || null,
        experience_years: editingProfessional.experience_years ? parseInt(editingProfessional.experience_years) : null,
        description: editingProfessional.description || null
      };

      const { error } = await supabase
        .from('professionals')
        .update(professionalData)
        .eq('id', editingProfessional.id);

      if (error) throw error;

      toast({ title: "Profesional actualizado exitosamente" });
      setEditingProfessional(null);
      fetchProfessionals();
    } catch (error) {
      toast({
        title: "Error al actualizar profesional",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewProfessional({ 
      id: '', 
      name: '', 
      photo_url: '', 
      phone: '', 
      email: '', 
      specialty: '', 
      experience_years: '', 
      description: '' 
    });
    setEditingProfessional(null);
    setShowAddForm(false);
  };

  const handleDeleteProfessional = async (professionalId) => {
    try {
      // Verificar si tiene citas asignadas
      const { data: appointments, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('assigned_professional_id', professionalId)
        .eq('status', 'scheduled');

      if (checkError) throw checkError;

      if (appointments && appointments.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `Este profesional tiene ${appointments.length} cita(s) programada(s). Cancela o reasigna las citas primero.`,
          variant: "destructive"
        });
        return;
      }

      // Marcar como inactivo en lugar de eliminar
      const { error: updateError } = await supabase
        .from('professionals')
        .update({ is_active: false })
        .eq('id', professionalId);

      if (updateError) throw updateError;

      // Eliminar de professional_availability
      const { error } = await supabase
        .from('professional_availability')
        .delete()
        .eq('professional_id', professionalId);

      if (error) throw error;

      toast({ title: "Profesional desactivado exitosamente" });
      fetchProfessionals();
    } catch (error) {
      toast({
        title: "Error al eliminar profesional",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProfessionalStats = async (professionalId) => {
    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('assigned_professional_id', professionalId);

      const total = appointments?.length || 0;
      const scheduled = appointments?.filter(a => a.status === 'scheduled').length || 0;

      return { total, scheduled };
    } catch (error) {
      return { total: 0, scheduled: 0 };
    }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Botón para agregar profesional */}
            <div className="flex justify-end">
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Profesional
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Profesional</DialogTitle>
                    <DialogDescription>
                      Completa la información del nuevo profesional
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-id">ID del Profesional *</Label>
                        <Input
                          id="new-id"
                          placeholder="prof_003"
                          value={newProfessional.id}
                          onChange={(e) => setNewProfessional(prev => ({...prev, id: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Nombre Completo *</Label>
                        <Input
                          id="new-name"
                          placeholder="Dr. López"
                          value={newProfessional.name}
                          onChange={(e) => setNewProfessional(prev => ({...prev, name: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-phone">Teléfono</Label>
                        <Input
                          id="new-phone"
                          placeholder="+57 300 123 4567"
                          value={newProfessional.phone}
                          onChange={(e) => setNewProfessional(prev => ({...prev, phone: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          placeholder="doctor@veterinaria.com"
                          value={newProfessional.email}
                          onChange={(e) => setNewProfessional(prev => ({...prev, email: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-specialty">Especialidad</Label>
                        <Input
                          id="new-specialty"
                          placeholder="Cirugía General"
                          value={newProfessional.specialty}
                          onChange={(e) => setNewProfessional(prev => ({...prev, specialty: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-experience">Años de Experiencia</Label>
                        <Input
                          id="new-experience"
                          type="number"
                          placeholder="5"
                          value={newProfessional.experience_years}
                          onChange={(e) => setNewProfessional(prev => ({...prev, experience_years: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-photo">URL de Foto de Perfil</Label>
                      <Input
                        id="new-photo"
                        placeholder="https://ejemplo.com/foto-doctor.jpg"
                        value={newProfessional.photo_url}
                        onChange={(e) => setNewProfessional(prev => ({...prev, photo_url: e.target.value}))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-description">Descripción</Label>
                      <Textarea
                        id="new-description"
                        placeholder="Breve descripción del profesional, su experiencia y áreas de expertise..."
                        value={newProfessional.description}
                        onChange={(e) => setNewProfessional(prev => ({...prev, description: e.target.value}))}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddProfessional}>
                      Agregar Profesional
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de profesionales */}
            <div>
              <h3 className="font-semibold mb-4">Profesionales Registrados</h3>
              {professionals.length > 0 ? (
                <div className="grid gap-6">
                  {professionals.map(prof => (
                    <Card key={prof.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Foto de perfil */}
                          <div className="flex-shrink-0">
                            {prof.photo_url ? (
                              <img
                                src={prof.photo_url}
                                alt={prof.name}
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=0378A6&color=fff&size=80`;
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-[#0378A6] flex items-center justify-center text-white text-xl font-semibold">
                                {prof.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Información principal */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">{prof.name}</h4>
                                <p className="text-sm text-gray-600">ID: {prof.id}</p>
                                {prof.specialty && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Award className="h-4 w-4 text-[#F26513]" />
                                    <span className="text-sm font-medium text-[#F26513]">{prof.specialty}</span>
                                  </div>
                                )}
                              </div>

                              {/* Acciones */}
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setEditingProfessional({...prof})}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Editar Profesional</DialogTitle>
                                      <DialogDescription>
                                        Actualiza la información de {prof.name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {editingProfessional && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-name">Nombre Completo *</Label>
                                            <Input
                                              id="edit-name"
                                              value={editingProfessional.name}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, name: e.target.value}))}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-phone">Teléfono</Label>
                                            <Input
                                              id="edit-phone"
                                              value={editingProfessional.phone || ''}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, phone: e.target.value}))}
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-email">Email</Label>
                                            <Input
                                              id="edit-email"
                                              type="email"
                                              value={editingProfessional.email || ''}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, email: e.target.value}))}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-specialty">Especialidad</Label>
                                            <Input
                                              id="edit-specialty"
                                              value={editingProfessional.specialty || ''}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, specialty: e.target.value}))}
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-experience">Años de Experiencia</Label>
                                            <Input
                                              id="edit-experience"
                                              type="number"
                                              value={editingProfessional.experience_years || ''}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, experience_years: e.target.value}))}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-photo">URL de Foto</Label>
                                            <Input
                                              id="edit-photo"
                                              value={editingProfessional.photo_url || ''}
                                              onChange={(e) => setEditingProfessional(prev => ({...prev, photo_url: e.target.value}))}
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="edit-description">Descripción</Label>
                                          <Textarea
                                            id="edit-description"
                                            value={editingProfessional.description || ''}
                                            onChange={(e) => setEditingProfessional(prev => ({...prev, description: e.target.value}))}
                                            rows={3}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setEditingProfessional(null)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleEditProfessional}>
                                        Actualizar
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Desactivar profesional?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Se desactivará a <strong>{prof.name}</strong> y se eliminará de todos los horarios. 
                                        Esta acción se puede revertir más tarde.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteProfessional(prof.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Desactivar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            {/* Información de contacto y experiencia */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              {prof.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{prof.phone}</span>
                                </div>
                              )}
                              {prof.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <span>{prof.email}</span>
                                </div>
                              )}
                              {prof.experience_years && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>{prof.experience_years} años de experiencia</span>
                                </div>
                              )}
                            </div>

                            {/* Descripción */}
                            {prof.description && (
                              <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-md">
                                {prof.description}
                              </p>
                            )}

                            {/* Estadísticas de citas */}
                            {stats[prof.id] && (
                              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">{stats[prof.id].total}</span>
                                  <span className="text-gray-600 ml-1">citas totales</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{stats[prof.id].scheduled}</span>
                                  <span className="text-gray-600 ml-1">programadas</span>
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
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No hay profesionales registrados</p>
                  <p className="text-gray-400 text-sm">Agrega el primer profesional usando el botón de arriba</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Nota importante:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Al agregar un profesional, se asigna automáticamente a todos los horarios existentes</li>
              <li>Para controlar disponibilidad por día, usa "Configuración → Disponibilidad"</li>
              <li>No se puede eliminar un profesional que tenga citas programadas</li>
              <li>Las citas se asignan automáticamente al primer profesional disponible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsManager;