import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Search, MessageCircle, Filter, Calendar, Clock, X, Send, Bell, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const AppointmentDialog = ({ isOpen, setIsOpen, appointment, fetchAppointments, owners, pets, services }) => {
  const [formData, setFormData] = useState({ owner_id: '', pet_id: '', service_id: '', appointment_time: '', status: 'scheduled' });
  const [filteredPets, setFilteredPets] = useState([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  
  useEffect(() => {
    if (appointment) {
      setFormData({
        owner_id: appointment.owner_id || '',
        pet_id: appointment.pet_id || '',
        service_id: appointment.service_id || '',
        appointment_time: appointment.appointment_time ? format(new Date(appointment.appointment_time), "yyyy-MM-dd'T'HH:mm") : '',
        status: appointment.status || 'scheduled'
      });
      if (appointment.owner_id) {
        setFilteredPets(pets.filter(p => p.owner_id === appointment.owner_id));
      }
    } else {
      setFormData({ owner_id: '', pet_id: '', service_id: '', appointment_time: '', status: 'scheduled' });
      setFilteredPets([]);
      setPhoneSearch('');
    }
  }, [appointment, isOpen, pets]);
  
  const handleOwnerChange = (ownerId) => {
    setFormData({...formData, owner_id: ownerId, pet_id: ''});
    setFilteredPets(pets.filter(p => p.owner_id === ownerId));
    const owner = owners.find(o => o.id === ownerId);
    setPhoneSearch(owner?.phone || '');
  }

  const handlePhoneSearch = async () => {
    if (!phoneSearch) {
      toast({ title: "Introduce un teléfono", variant: "destructive"});
      return;
    }
    const foundOwner = owners.find(o => o.phone === phoneSearch);
    if(foundOwner) {
        handleOwnerChange(foundOwner.id);
        toast({ title: "Usuario encontrado" });
    } else {
        toast({ title: "Usuario no encontrado", description: "Puedes registrarlo desde la sección Propietarios.", variant: "destructive" });
    }
  }

  const handleSave = async () => {
    if (!formData.owner_id || !formData.pet_id || !formData.service_id || !formData.appointment_time) {
      toast({ title: "Error", description: "Todos los campos son obligatorios.", variant: "destructive" });
      return;
    }
    let error;
    const submissionData = {
        ...formData,
        appointment_time: new Date(formData.appointment_time).toISOString()
    };
    if (appointment) {
      ({ error } = await supabase.from('appointments').update(submissionData).eq('id', appointment.id));
    } else {
      ({ error } = await supabase.from('appointments').insert(submissionData));
    }
    if (error) {
      toast({ title: "Error", description: `No se pudo guardar la cita. ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `Cita ${appointment ? 'actualizada' : 'creada'} con éxito.` });
      setIsOpen(false);
      fetchAppointments();
    }
  };
  
  const statusTranslations = {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No Asistió'
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{appointment ? 'Editar' : 'Añadir'} Cita</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <Label>Buscar por Teléfono</Label>
            <div className="flex gap-2">
                <Input value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="Número de teléfono..." />
                <Button onClick={handlePhoneSearch} size="icon"><Search className="w-4 h-4" /></Button>
            </div>
          <Select onValueChange={handleOwnerChange} value={formData.owner_id}>
            <SelectTrigger><SelectValue placeholder="Selecciona Propietario..." /></SelectTrigger>
            <SelectContent>{owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={v => setFormData({...formData, pet_id: v})} value={formData.pet_id} disabled={!formData.owner_id}>
            <SelectTrigger><SelectValue placeholder="Selecciona Mascota..." /></SelectTrigger>
            <SelectContent>{filteredPets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={v => setFormData({...formData, service_id: v})} value={formData.service_id}>
            <SelectTrigger><SelectValue placeholder="Selecciona Servicio..." /></SelectTrigger>
            <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="datetime-local" value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})} />
          <Select onValueChange={v => setFormData({...formData, status: v})} value={formData.status}>
            <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusTranslations).map(([key, value]) => (
                 <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [relatedData, setRelatedData] = useState({ owners: [], pets: [], services: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [bulkMessageType, setBulkMessageType] = useState('reminder');
  const [customBulkMessage, setCustomBulkMessage] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all', // 'today', 'tomorrow', 'week', 'custom', 'all'
    status: 'all',
    service: 'all',
    breed: '',
    customDate: '',
    customDateEnd: '',
    searchTerm: ''
  });

  const statusTranslations = {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No Asistió',
    default: 'Otro'
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *, 
        owner:profiles(name), 
        pet:pets(name), 
        service:services(name)
      `)
      .order('appointment_time', { ascending: false });
      
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las citas.", variant: "destructive" });
    } else {
      // Obtener información de profesionales para las citas que tienen profesional asignado
      const appointmentsWithProfs = await Promise.all(data.map(async (appointment) => {
        if (appointment.assigned_professional_id) {
          const { data: professionalData } = await supabase
            .from('professionals')
            .select('id, name')
            .eq('id', appointment.assigned_professional_id)
            .single();
          
          return {
            ...appointment,
            professional: professionalData
          };
        }
        return appointment;
      }));
      
      setAppointments(appointmentsWithProfs);
    }
    setLoading(false);
  }, []);

  const fetchRelatedData = useCallback(async () => {
    const { data: owners } = await supabase.from('profiles').select('id, name, phone').eq('role', 'user');
    const { data: pets } = await supabase.from('pets').select('id, name, owner_id');
    const { data: services } = await supabase.from('services').select('id, name');
    setRelatedData({ 
      owners: owners || [], 
      pets: pets || [], 
      services: services || []
    });
  }, []);

  const sendWhatsAppReminder = async (appointment) => {
    try {
      // Obtener información completa del propietario
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', appointment.owner_id)
        .single();

      if (ownerError || !ownerData) {
        toast({ title: "Error", description: "No se pudo obtener información del propietario.", variant: "destructive" });
        return;
      }

      if (!ownerData.phone) {
        toast({ title: "Error", description: "El propietario no tiene número de teléfono registrado.", variant: "destructive" });
        return;
      }

      // Formatear la fecha y hora
      const appointmentDate = format(new Date(appointment.appointment_time), "dd 'de' MMMM 'de' yyyy", { locale: es });
      const appointmentTime = format(new Date(appointment.appointment_time), "h:mm a", { locale: es });

      // Crear mensaje de recordatorio
      const reminderMessage = `
🐾 *RECORDATORIO DE CITA - 4HUELLITAS*

Hola ${ownerData.name}, te recordamos que tienes una cita programada:

📅 *Fecha:* ${appointmentDate}
🕐 *Hora:* ${appointmentTime}
🐕 *Mascota:* ${appointment.pet?.name || 'No especificada'}
🏥 *Servicio:* ${appointment.service?.name || 'No especificado'}
${appointment.professional?.name ? `👨‍⚕️ *Profesional:* ${appointment.professional.name}` : ''}

📍 *Dirección:* Carrera 22C no° 57DD-43
📞 *Teléfono:* +57 301 263 5719

⚠️ *IMPORTANTE:*
• Llegar 10 minutos antes de la cita
• Traer carnet de vacunas actualizado
• En caso de cancelación, avisar con 24h de anticipación

¡Esperamos verte pronto! 🐾
      `.trim();

      // Limpiar el número de teléfono (remover espacios, guiones, etc.)
      const cleanPhone = ownerData.phone.replace(/[\s\-\(\)]/g, '');
      
      // Construir URL de WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Marcar recordatorio como enviado
      await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appointment.id);

      toast({ 
        title: "Recordatorio enviado", 
        description: `Se abrió WhatsApp para enviar recordatorio a ${ownerData.name}` 
      });

      // Refrescar la lista para actualizar las campanitas
      fetchAppointments();

    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo enviar el recordatorio.", 
        variant: "destructive" 
      });
    }
  };

  const needsReminder = (appointment) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const appointmentDate = new Date(appointment.appointment_time);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // La cita es mañana y no se ha enviado recordatorio y está programada
    return appointmentDate.getTime() === tomorrow.getTime() && 
           !appointment.reminder_sent && 
           appointment.status === 'scheduled';
  };

  const applyFilters = useCallback(() => {
    let filtered = [...appointments];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Filtro por rango de fechas
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appointment_time);
        
        switch (filters.dateRange) {
          case 'today':
            return appDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return appDate.toDateString() === tomorrow.toDateString();
          case 'week':
            return appDate >= today && appDate <= weekEnd;
          case 'custom':
            if (filters.customDate) {
              const startDate = new Date(filters.customDate);
              const endDate = filters.customDateEnd ? new Date(filters.customDateEnd) : new Date(startDate);
              endDate.setHours(23, 59, 59, 999);
              return appDate >= startDate && appDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Filtro por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Filtro por servicio
    if (filters.service !== 'all') {
      filtered = filtered.filter(app => app.service_id === filters.service);
    }

    // Filtro por término de búsqueda (nombre del propietario, mascota)
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.owner?.name?.toLowerCase().includes(searchTerm) ||
        app.pet?.name?.toLowerCase().includes(searchTerm) ||
        app.service?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por raza (necesitaríamos obtener información de raza de las mascotas)
    if (filters.breed) {
      // Este filtro requeriría modificar la query para incluir información de raza
      // Por ahora lo dejamos preparado
    }

    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      status: 'all',
      service: 'all',
      breed: '',
      customDate: '',
      customDateEnd: '',
      searchTerm: ''
    });
  };

  const getFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.service !== 'all') count++;
    if (filters.breed) count++;
    if (filters.searchTerm) count++;
    if (filters.customDate) count++;
    return count;
  };

  const sendBulkWhatsAppMessages = async () => {
    try {
      if (filteredAppointments.length === 0) {
        toast({ 
          title: "No hay citas", 
          description: "No hay citas para enviar mensajes.", 
          variant: "destructive" 
        });
        return;
      }

      // Obtener información de propietarios únicos
      const uniqueOwnerIds = [...new Set(filteredAppointments.map(app => app.owner_id))];
      
      const { data: ownersData, error: ownersError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .in('id', uniqueOwnerIds)
        .eq('role', 'user');

      if (ownersError) {
        toast({ 
          title: "Error", 
          description: "No se pudo obtener información de los propietarios.", 
          variant: "destructive" 
        });
        return;
      }

      // Filtrar propietarios que tienen teléfono
      const ownersWithPhone = ownersData.filter(owner => owner.phone);
      
      if (ownersWithPhone.length === 0) {
        toast({ 
          title: "Sin números", 
          description: "Ninguno de los propietarios tiene número de teléfono registrado.", 
          variant: "destructive" 
        });
        return;
      }

      // Generar mensaje según el tipo
      let message = '';
      
      switch (bulkMessageType) {
        case 'reminder':
          message = `🐾 *4HUELLITAS - RECORDATORIO GENERAL*

Hola, te recordamos que tienes una cita programada con nosotros próximamente.

📍 *Ubicación:* Carrera 22C no° 57DD-43
📞 *Teléfono:* +57 301 263 5719
🕐 *Horarios:* [Horarios de atención]

⚠️ *IMPORTANTE:*
• Llegar 10 minutos antes de la cita
• Traer carnet de vacunas actualizado
• En caso de cancelación, avisar con 24h de anticipación

¡Esperamos verte pronto! 🐾`;
          break;
        case 'promotion':
          message = `🎉 *4HUELLITAS - OFERTA ESPECIAL*

¡Hola! Tenemos una promoción especial para ti:

✨ *[Describe la promoción aquí]*

📅 *Válida hasta:* [Fecha de vencimiento]
📍 *Visítanos:* Carrera 22C no° 57DD-43
📞 *Reserva:* +57 301 263 5719

¡No te lo pierdas! 🐾`;
          break;
        case 'announcement':
          message = `📢 *4HUELLITAS - COMUNICADO IMPORTANTE*

Estimado cliente,

[Escribe aquí el comunicado importante]

📞 *Contacto:* +57 301 263 5719
📍 *Dirección:* Carrera 22C no° 57DD-43

Gracias por tu comprensión 🐾`;
          break;
        case 'custom':
          message = customBulkMessage || 'Mensaje personalizado de 4HUELLITAS';
          break;
        default:
          message = 'Mensaje de 4HUELLITAS';
      }

      // Abrir WhatsApp para cada propietario (se abrirán en pestañas separadas)
      let successCount = 0;
      
      for (let i = 0; i < ownersWithPhone.length; i++) {
        const owner = ownersWithPhone[i];
        const cleanPhone = owner.phone.replace(/[\s\-\(\)]/g, '');
        const personalizedMessage = message.replace(/\[Nombre\]/g, owner.name);
        
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;
        
        // Abrir con un pequeño retraso para evitar bloqueos del navegador
        setTimeout(() => {
          window.open(whatsappUrl, `whatsapp_${owner.id}`, 'width=800,height=600');
        }, i * 500); // 500ms de retraso entre cada ventana
        
        successCount++;
      }

      // Marcar recordatorios como enviados si es un recordatorio
      if (bulkMessageType === 'reminder') {
        const appointmentIds = filteredAppointments.map(app => app.id);
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .in('id', appointmentIds);
        
        // Refrescar la lista para actualizar las campanitas
        fetchAppointments();
      }

      toast({ 
        title: "Mensajes preparados", 
        description: `Se abrirán ${successCount} ventanas de WhatsApp para enviar mensajes.` 
      });

      setShowBulkMessageModal(false);

    } catch (error) {
      console.error('Error al enviar mensajes masivos:', error);
      toast({ 
        title: "Error", 
        description: "No se pudieron preparar los mensajes masivos.", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchRelatedData();
  }, [fetchAppointments, fetchRelatedData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleOpenDialog = (appointment = null) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDelete = async (appointmentId) => {
    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la cita.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Cita eliminada correctamente." });
      fetchAppointments();
    }
  };

  // Funciones para selección múltiple
  const toggleSelectAppointment = (appointmentId) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId) 
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const selectAllAppointments = () => {
    if (selectedAppointments.length === filteredAppointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(filteredAppointments.map(app => app.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .in('id', selectedAppointments);
      
      if (error) {
        toast({ 
          title: "Error", 
          description: "No se pudieron eliminar algunas citas.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Éxito", 
          description: `${selectedAppointments.length} cita(s) eliminada(s) correctamente.` 
        });
        setSelectedAppointments([]);
        fetchAppointments();
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Error al eliminar las citas seleccionadas.", 
        variant: "destructive" 
      });
    }
    setShowBulkDeleteConfirm(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-black text-white';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Citas</h2>
            {(() => {
              const pendingReminders = appointments.filter(app => needsReminder(app)).length;
              return pendingReminders > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg border border-orange-200">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {pendingReminders} recordatorio{pendingReminders !== 1 ? 's' : ''} pendiente{pendingReminders !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {getFilterCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F26513] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getFilterCount()}
                  </span>
                )}
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkMessageModal(true)}
              disabled={filteredAppointments.length === 0}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Mensaje Masivo ({filteredAppointments.length})
            </Button>
            {selectedAppointments.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Seleccionadas ({selectedAppointments.length})
              </Button>
            )}
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Cita
            </Button>
          </div>
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-xl p-4 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Filtrar Citas</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de Búsqueda */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar</Label>
                <Input
                  placeholder="Cliente, mascota, servicio..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>

              {/* Filtro de Fecha */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Período</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => setFilters({...filters, dateRange: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="tomorrow">Mañana</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="custom">Fecha personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Estado */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="no_show">No Asistió</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Servicio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Servicio</Label>
                <Select 
                  value={filters.service} 
                  onValueChange={(value) => setFilters({...filters, service: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    {relatedData.services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fechas Personalizadas */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-white rounded-lg border">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha inicial</Label>
                  <Input
                    type="date"
                    value={filters.customDate}
                    onChange={(e) => setFilters({...filters, customDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha final (opcional)</Label>
                  <Input
                    type="date"
                    value={filters.customDateEnd}
                    onChange={(e) => setFilters({...filters, customDateEnd: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Contador de resultados */}
            <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
              <span>Mostrando {filteredAppointments.length} de {appointments.length} citas</span>
              {getFilterCount() > 0 && (
                <span className="text-[#0378A6] font-medium">
                  {getFilterCount()} filtro{getFilterCount() !== 1 ? 's' : ''} activo{getFilterCount() !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3 w-12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllAppointments}
                  className="p-1 h-auto"
                >
                  {selectedAppointments.length === filteredAppointments.length && filteredAppointments.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </th>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3 hidden md:table-cell">Cliente</th>
              <th className="p-3 hidden lg:table-cell">Mascota</th>
              <th className="p-3 hidden xl:table-cell">Profesional</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No se encontraron citas</p>
                    <p className="text-sm">
                      {appointments.length === 0 
                        ? 'No hay citas registradas' 
                        : 'Intenta ajustar los filtros para ver más resultados'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAppointments.map(app => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSelectAppointment(app.id)}
                      className="p-1 h-auto"
                    >
                      {selectedAppointments.includes(app.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </td>
                  <td className="p-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>
                      {app.appointment_time ? format(new Date(app.appointment_time), "d MMM yyyy, h:mm a", { locale: es }) : 'Fecha no válida'}
                    </span>
                    {needsReminder(app) && (
                      <div className="relative" title="Recordatorio pendiente - Cita para mañana">
                        <Bell className="w-4 h-4 text-orange-500 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                      </div>
                    )}
                  </div>
                </td>
                  <td className="p-3 hidden md:table-cell">{app.owner?.name || 'N/A'}</td>
                  <td className="p-3 hidden lg:table-cell">{app.pet?.name || 'N/A'}</td>
                  <td className="p-3 hidden xl:table-cell">
                    {app.professional?.name ? (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {app.professional.name}
                      </span>
                    ) : app.assigned_professional_id ? (
                      <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        ID: {app.assigned_professional_id}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No asignado</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge className={cn("capitalize", getStatusBadge(app.status))}>{statusTranslations[app.status] || statusTranslations.default}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => sendWhatsAppReminder(app)}
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(app)}>
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la cita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(app.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AppointmentDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        appointment={editingAppointment}
        fetchAppointments={fetchAppointments}
        {...relatedData}
      />

      {/* Modal de Mensaje Masivo */}
      <Dialog open={showBulkMessageModal} onOpenChange={setShowBulkMessageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Enviar Mensaje Masivo por WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Información de destinatarios */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Destinatarios</span>
              </div>
              <p className="text-sm text-blue-700">
                Se enviará el mensaje a <strong>{filteredAppointments.length} cita(s)</strong> 
                {getFilterCount() > 0 && (
                  <span> filtrada(s) según los criterios aplicados</span>
                )}
              </p>
              {getFilterCount() > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Filtros activos: {getFilterCount()}
                </p>
              )}
            </div>

            {/* Tipo de mensaje */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de mensaje</Label>
              <Select value={bulkMessageType} onValueChange={setBulkMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Recordatorio General</SelectItem>
                  <SelectItem value="promotion">Promoción/Oferta</SelectItem>
                  <SelectItem value="announcement">Comunicado Importante</SelectItem>
                  <SelectItem value="custom">Mensaje Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mensaje personalizado */}
            {bulkMessageType === 'custom' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mensaje personalizado</Label>
                <Textarea
                  rows={6}
                  placeholder="Escribe tu mensaje personalizado aquí..."
                  value={customBulkMessage}
                  onChange={(e) => setCustomBulkMessage(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Puedes usar [Nombre] para personalizar con el nombre del cliente
                </p>
              </div>
            )}

            {/* Vista previa del mensaje */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vista previa del mensaje</Label>
              <div className="bg-gray-50 p-3 rounded-lg border text-sm whitespace-pre-wrap">
                {bulkMessageType === 'reminder' && `🐾 *4HUELLITAS - RECORDATORIO GENERAL*

Hola, te recordamos que tienes una cita programada con nosotros próximamente.

📍 *Ubicación:* Carrera 22C no° 57DD-43
📞 *Teléfono:* +57 301 263 5719
🕐 *Horarios:* [Horarios de atención]

⚠️ *IMPORTANTE:*
• Llegar 10 minutos antes de la cita
• Traer carnet de vacunas actualizado
• En caso de cancelación, avisar con 24h de anticipación

¡Esperamos verte pronto! 🐾`}

                {bulkMessageType === 'promotion' && `🎉 *4HUELLITAS - OFERTA ESPECIAL*

¡Hola! Tenemos una promoción especial para ti:

✨ *[Describe la promoción aquí]*

📅 *Válida hasta:* [Fecha de vencimiento]
📍 *Visítanos:* Carrera 22C no° 57DD-43
📞 *Reserva:* +57 301 263 5719

¡No te lo pierdas! 🐾`}

                {bulkMessageType === 'announcement' && `📢 *4HUELLITAS - COMUNICADO IMPORTANTE*

Estimado cliente,

[Escribe aquí el comunicado importante]

📞 *Contacto:* +57 301 263 5719
📍 *Dirección:* Carrera 22C no° 57DD-43

Gracias por tu comprensión 🐾`}

                {bulkMessageType === 'custom' && (customBulkMessage || 'Escribe tu mensaje personalizado arriba...')}
              </div>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Importante</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Se abrirán múltiples ventanas de WhatsApp (una por cada cliente). 
                Asegúrate de permitir ventanas emergentes en tu navegador.
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={sendBulkWhatsAppMessages}
              disabled={bulkMessageType === 'custom' && !customBulkMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar a {filteredAppointments.length} cliente(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Eliminación Masiva */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              ¿Eliminar citas seleccionadas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente <strong>{selectedAppointments.length} cita(s)</strong> seleccionada(s).
              <br /><br />
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 font-medium">Citas que se eliminarán:</p>
                <ul className="text-sm text-red-700 mt-2 max-h-32 overflow-y-auto">
                  {selectedAppointments.map(id => {
                    const appointment = filteredAppointments.find(app => app.id === id);
                    return appointment ? (
                      <li key={id} className="flex justify-between py-1">
                        <span>{appointment.owner?.name || 'N/A'}</span>
                        <span>{appointment.appointment_time ? format(new Date(appointment.appointment_time), "d MMM yyyy", { locale: es }) : 'Fecha inválida'}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar {selectedAppointments.length} cita(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default AppointmentsList;