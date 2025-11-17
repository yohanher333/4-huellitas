import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  Save, 
  Calendar,
  Settings,
  Edit3,
  AlertCircle,
  CheckCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parse } from 'date-fns';
import SystemStatusChecker from './SystemStatusChecker';

const daysOfWeek = [
  { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' }
];

// Generate time slots in 5-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      slots.push(timeString);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const timeToAmPm = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return format(date, 'hh:mm a');
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  const diffMinutes = endMinutes - startMinutes;
  
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

const CustomTimeSlotManager = () => {
  const [customSlots, setCustomSlots] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [systemReady, setSystemReady] = useState(false);
  const [systemError, setSystemError] = useState(null);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '09:30:00'
  });

  // Verificar si el sistema está configurado correctamente
  const checkSystemSetup = useCallback(async () => {
    try {
      console.log('Verificando configuración del sistema...');
      
      // Verificar si las tablas existen intentando una consulta simple
      const { data: testSlots, error: testError } = await supabase
        .from('custom_time_slots')
        .select('id')
        .limit(1);

      if (testError) {
        if (testError.code === '42P01') { // Table does not exist
          throw new Error('Las tablas del sistema de franjas personalizadas no existen. Es necesario ejecutar el script de base de datos.');
        } else {
          throw new Error(`Error de configuración: ${testError.message}`);
        }
      }

      setSystemReady(true);
      setSystemError(null);
      console.log('Sistema configurado correctamente');
    } catch (error) {
      console.error('Error en configuración del sistema:', error);
      setSystemReady(false);
      setSystemError(error.message);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Iniciando carga de datos...');
      
      // Fetch custom time slots
      console.log('Obteniendo custom_time_slots...');
      const { data: slots, error: slotsError } = await supabase
        .from('custom_time_slots')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      if (slotsError) {
        console.error('Error en custom_time_slots:', slotsError);
        throw new Error(`Error en franjas: ${slotsError.message}`);
      }

      // Fetch professionals
      console.log('Obteniendo profesionales...');
      const { data: profs, error: profsError } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (profsError) {
        console.error('Error en professionals:', profsError);
        throw new Error(`Error en profesionales: ${profsError.message}`);
      }

      // Fetch slot availability
      console.log('Obteniendo disponibilidad...');
      const { data: availability, error: availError } = await supabase
        .from('custom_slot_availability')
        .select('*');

      if (availError) {
        console.error('Error en custom_slot_availability:', availError);
        // No lanzar error si la tabla está vacía, solo advertir
        console.warn(`Advertencia en disponibilidad: ${availError.message}`);
      }

      console.log('Datos cargados exitosamente:', { slots: slots?.length, profs: profs?.length, availability: availability?.length });

      setCustomSlots(slots || []);
      setProfessionals(profs || []);
      setSlotAvailability(availability || []);
      
      if (slots && slots.length === 0) {
        toast({
          title: "Sin franjas configuradas",
          description: "No hay franjas horarias configuradas. Puede agregar nuevas franjas.",
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error al cargar datos",
        description: `Detalles: ${error.message}. Revise la consola para más información.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      await checkSystemSetup();
      if (systemReady && !systemError) {
        await fetchData();
      } else {
        setLoading(false);
      }
    };
    
    initializeSystem();
  }, [checkSystemSetup, systemReady, systemError]);

  const handleAddSlot = async () => {
    try {
      console.log('Intentando agregar franja:', newSlot);
      
      // Validate time range
      if (newSlot.start_time >= newSlot.end_time) {
        toast({
          title: "Error de validación",
          description: "La hora de fin debe ser posterior a la hora de inicio.",
          variant: "destructive"
        });
        return;
      }

      // Insert the slot
      const { data, error } = await supabase
        .from('custom_time_slots')
        .insert([newSlot])
        .select()
        .single();

      if (error) {
        console.error('Error al insertar franja:', error);
        throw new Error(`Error al crear franja: ${error.message}`);
      }

      console.log('Franja creada exitosamente:', data);

      // Add all professionals as available by default (solo si hay profesionales)
      if (professionals.length > 0) {
        console.log('Agregando disponibilidad de profesionales...');
        const availabilityInserts = professionals.map(prof => ({
          slot_id: data.id,
          professional_id: prof.id,
          is_available: true
        }));

        const { error: availError } = await supabase
          .from('custom_slot_availability')
          .insert(availabilityInserts);

        if (availError) {
          console.error('Error al agregar disponibilidad:', availError);
          // No fallar completamente, solo advertir
          toast({
            title: "Advertencia",
            description: "Franja creada, pero hubo un problema al asignar profesionales. Puede asignarlos manualmente.",
            variant: "default"
          });
        } else {
          console.log('Disponibilidad de profesionales agregada exitosamente');
        }
      } else {
        console.warn('No hay profesionales activos para asignar a la franja');
        toast({
          title: "Nota",
          description: "Franja creada. No hay profesionales activos para asignar. Agregue profesionales desde la gestión de profesionales.",
        });
      }

      toast({
        title: "Éxito",
        description: "Franja horaria agregada correctamente."
      });

      setShowAddDialog(false);
      setNewSlot({
        day_of_week: selectedDay,
        start_time: '09:00:00',
        end_time: '09:30:00'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast({
        title: "Error al agregar franja",
        description: `Detalles: ${error.message}. Revise la consola para más información.`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const { error } = await supabase
        .from('custom_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Franja horaria eliminada."
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la franja horaria.",
        variant: "destructive"
      });
    }
  };

  const handleToggleProfessionalAvailability = async (slotId, professionalId, currentlyAvailable) => {
    try {
      if (currentlyAvailable) {
        // Remove availability
        const { error } = await supabase
          .from('custom_slot_availability')
          .delete()
          .eq('slot_id', slotId)
          .eq('professional_id', professionalId);

        if (error) throw error;
      } else {
        // Add availability
        const { error } = await supabase
          .from('custom_slot_availability')
          .upsert([{
            slot_id: slotId,
            professional_id: professionalId,
            is_available: true
          }]);

        if (error) throw error;
      }

      fetchData();
    } catch (error) {
      console.error('Error toggling professional availability:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad.",
        variant: "destructive"
      });
    }
  };

  const isProfessionalAvailable = (slotId, professionalId) => {
    return slotAvailability.some(av => 
      av.slot_id === slotId && 
      av.professional_id === professionalId && 
      av.is_available
    );
  };

  const getAvailableProfessionalsCount = (slotId) => {
    return slotAvailability.filter(av => 
      av.slot_id === slotId && av.is_available
    ).length;
  };

  const filteredSlots = customSlots.filter(slot => slot.day_of_week === selectedDay);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div>
      </div>
    );
  }

  // Mostrar error de configuración del sistema
  if (systemError || !systemReady) {
    return <SystemStatusChecker />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      {/* Header */}
      <Card className="shadow-lg border-l-4 border-l-[#0378A6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#0378A6]" />
            Gestión de Franjas Horarias Personalizadas
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Configura franjas horarias flexibles por día. Cada franja puede tener diferente duración 
            y disponibilidad de profesionales.
          </p>
        </CardHeader>
      </Card>

      {/* Day Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Seleccionar Día</Label>
            <Button
              onClick={() => {
                setNewSlot({ ...newSlot, day_of_week: selectedDay });
                setShowAddDialog(true);
              }}
              className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Franja
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map(day => (
                <SelectItem key={day.id} value={day.id.toString()}>
                  {day.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Slots Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Franjas para {daysOfWeek.find(d => d.id === selectedDay)?.name}
            <Badge variant="outline">
              {filteredSlots.length} franja{filteredSlots.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay franjas horarias configuradas para este día.</p>
              <p className="text-sm mt-1">Haz clic en "Agregar Franja" para empezar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredSlots.map((slot) => {
                  const availableCount = getAvailableProfessionalsCount(slot.id);
                  const duration = calculateDuration(slot.start_time, slot.end_time);
                  
                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 border rounded-lg bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {timeToAmPm(slot.start_time)} - {timeToAmPm(slot.end_time)}
                            </span>
                          </div>
                          <Badge variant="secondary">{duration}</Badge>
                          <Badge 
                            variant={availableCount > 0 ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            {availableCount} profesional{availableCount !== 1 ? 'es' : ''}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Professional Availability */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Profesionales Disponibles
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {professionals.map((prof) => {
                            const isAvailable = isProfessionalAvailable(slot.id, prof.id);
                            return (
                              <div
                                key={prof.id}
                                className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md"
                              >
                                <Checkbox
                                  id={`${slot.id}-${prof.id}`}
                                  checked={isAvailable}
                                  onCheckedChange={() => 
                                    handleToggleProfessionalAvailability(slot.id, prof.id, isAvailable)
                                  }
                                />
                                <Label 
                                  htmlFor={`${slot.id}-${prof.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {prof.name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Editar' : 'Agregar'} Franja Horaria
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Día</Label>
              <Select 
                value={newSlot.day_of_week.toString()} 
                onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map(day => (
                    <SelectItem key={day.id} value={day.id.toString()}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora de Inicio</Label>
                <Select 
                  value={newSlot.start_time} 
                  onValueChange={(value) => setNewSlot({ ...newSlot, start_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map(time => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {timeToAmPm(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hora de Fin</Label>
                <Select 
                  value={newSlot.end_time} 
                  onValueChange={(value) => setNewSlot({ ...newSlot, end_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.filter(time => time > newSlot.start_time).map(time => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {timeToAmPm(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Duración: <strong>{calculateDuration(newSlot.start_time, newSlot.end_time)}</strong>
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddSlot}>
              <Save className="w-4 h-4 mr-2" />
              {editingSlot ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomTimeSlotManager;