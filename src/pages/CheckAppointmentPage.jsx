import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Dog, Clock, Edit, Trash2, Search, History } from 'lucide-react';
import { format, differenceInHours, addMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

const RescheduleDialog = ({ isOpen, onOpenChange, appointment, onConfirm }) => {
    const [selectedDate, setSelectedDate] = useState();
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
      const fetchSchedules = async () => {
        const { data } = await supabase.from('work_schedules').select('*').eq('is_active', true);
        setSchedules(data || []);
      };
      fetchSchedules();
    }, []);

    const getAvailableTimes = useCallback(async (date, service) => {
        if (!date || !service) return [];
        setLoadingTimes(true);
        const dayOfWeek = date.getDay();
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Get work schedules with professional availability
        const { data: schedulesWithProfessionals, error: schedulesError } = await supabase
            .from('work_schedules')
            .select('*, professional_availability(professional_id)')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true);

        if (schedulesError || !schedulesWithProfessionals?.length) { setLoadingTimes(false); return; }

        // Count total professionals available across all schedules for this day
        const allAvailableProfessionals = new Set();
        schedulesWithProfessionals.forEach(schedule => {
            schedule.professional_availability?.forEach(pa => {
                allAvailableProfessionals.add(pa.professional_id);
            });
        });
        const maxConcurrentAppointments = Math.max(1, allAvailableProfessionals.size);

        const { data: existingAppointments } = await supabase.from('appointments').select('appointment_time, service:services(duration_minutes, cleanup_duration_minutes)').eq('status', 'scheduled').gte('appointment_time', `${formattedDate}T00:00:00.000Z`).lte('appointment_time', `${formattedDate}T23:59:59.999Z`);
        const serviceTotalDuration = 120 + 30; // Fixed 2 hours + 30 minutes cleanup
        let potentialSlots = [];
        
        schedulesWithProfessionals.forEach(schedule => {
            let currentTime = parse(schedule.start_time, 'HH:mm:ss', new Date());
            const endTime = parse(schedule.end_time, 'HH:mm:ss', new Date());
            while (addMinutes(currentTime, serviceTotalDuration) <= endTime) { 
                potentialSlots.push(new Date(currentTime)); 
                currentTime = addMinutes(currentTime, 30); 
            }
        });

        const finalSlots = potentialSlots.filter(slotStart => {
            const slotEnd = addMinutes(slotStart, serviceTotalDuration);
            const now = new Date();
            const slotDateTime = new Date(date);
            slotDateTime.setHours(slotStart.getHours(), slotStart.getMinutes());
            if(slotDateTime <= now) return false;
            
            // Count conflicting appointments in this time slot
            const conflictingAppointments = existingAppointments?.filter(app => {
                if (app.id === appointment.id) return false; // Exclude current appointment when rescheduling
                const aptTime = new Date(app.appointment_time);
                const aptDuration = (app.service?.duration_minutes || 120) + (app.service?.cleanup_duration_minutes || 30);
                const aptEndTime = addMinutes(aptTime, aptDuration);
                return (slotStart < aptEndTime && slotEnd > aptTime);
            }) || [];

            // Allow slot if there are fewer appointments than available professionals
            return conflictingAppointments.length < maxConcurrentAppointments;
        }).map(slot => format(slot, 'HH:mm'));
        
        // Remove duplicates
        const uniqueSlots = [...new Set(finalSlots)];
        setAvailableTimes(uniqueSlots);
        setLoadingTimes(false);
    }, [appointment]);

    useEffect(() => {
        if (selectedDate && appointment?.service) {
            getAvailableTimes(selectedDate, appointment.service);
        }
    }, [selectedDate, appointment, getAvailableTimes]);
    
    const timeToAmPm = (time) => { if (!time) return ''; const [hours, minutes] = time.split(':'); const date = new Date(); date.setHours(hours, minutes); return format(date, 'hh:mm a'); };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Reagendar Cita</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="flex justify-center">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) || !schedules.some(s => s.day_of_week === date.getDay())} />
                    </div>
                    <div>
                         <h3 className="font-semibold text-center mb-4 text-lg">Horarios Disponibles</h3>
                         {loadingTimes ? <div className="flex justify-center"><div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div> : availableTimes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                {availableTimes.map(time => <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)} className="h-12 text-md">{timeToAmPm(time)}</Button>)}
                            </div>
                         ) : <p className="text-center text-sm text-gray-500">No hay horarios disponibles para este día.</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onConfirm(selectedDate, selectedTime)} disabled={!selectedTime}>Confirmar Nuevo Horario</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CancellationDialog = ({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const cancellationReasons = [ "Conflicto de horario", "Mascota enferma", "Ya no necesito el servicio", "Encontré otra opción", "Motivos personales", "Otro" ];
    return (
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Cancelar Cita</AlertDialogTitle><AlertDialogDescription>Por favor, selecciona un motivo para la cancelación. Esta acción es definitiva.</AlertDialogDescription></AlertDialogHeader>
            <div className="py-4"><Label htmlFor="cancellation-reason">Motivo de la cancelación</Label><Select onValueChange={setReason} value={reason}><SelectTrigger id="cancellation-reason"><SelectValue placeholder="Selecciona un motivo..." /></SelectTrigger><SelectContent>{cancellationReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <AlertDialogFooter><AlertDialogCancel onClick={onCancel}>Cerrar</AlertDialogCancel><AlertDialogAction onClick={() => onConfirm(reason)} disabled={!reason}>Confirmar Cancelación</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
    );
};

const CheckAppointmentPage = () => {
  const { user } = useAuth(); // Obtener información del usuario autenticado
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [appointmentToManage, setAppointmentToManage] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const handleSearch = async () => {
    if (phone.length < 8) { 
      toast({ title: "Error", description: "Por favor, introduce un número de teléfono válido.", variant: "destructive" }); 
      return; 
    }
    setLoading(true); setSearched(true); setAppointments([]); setProfile(null);
    
    try {
      // Buscar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('phone', phone)
        .maybeSingle();
      
      if (profileError || !profileData) { 
        console.error('Profile not found or error:', profileError);
        setLoading(false); 
        return; 
      }
      
      setProfile(profileData);
      
      // Consulta alternativa usando servicio con bypass de RLS
      let alternativeQuery = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name)
        `)
        .eq('owner_id', profileData.id)
        .order('appointment_time', { ascending: false });

      console.log('Alternative query result:', alternativeQuery.data);

      // Intentar obtener información de mascotas a través de una consulta pública si existe
      if (alternativeQuery.data && alternativeQuery.data.length > 0) {
        for (let appointment of alternativeQuery.data) {
          if (appointment.pet_id) {
            // Intentar varias estrategias para obtener el nombre de la mascota
            
            // Estrategia 1: Consulta directa con bypass potencial
            try {
              const { data: petData1 } = await supabase
                .rpc('get_pet_name', { pet_id: appointment.pet_id })
                .single();
              
              if (petData1?.name) {
                appointment.pet = { name: petData1.name, species: petData1.species || 'Mascota' };
                console.log('Pet data from RPC:', petData1);
                continue;
              }
            } catch (e) {
              console.log('RPC method not available, trying direct query');
            }
            
            // Estrategia 2: Consulta directa con configuración diferente
            try {
              const petQuery = await supabase
                .from('pets')
                .select('name, species')
                .eq('id', appointment.pet_id)
                .eq('owner_id', profileData.id) // Doble verificación de propiedad
                .maybeSingle();
                
              if (petQuery.data?.name) {
                appointment.pet = petQuery.data;
                console.log('Pet data from direct query with owner check:', petQuery.data);
                continue;
              }
            } catch (e) {
              console.log('Direct query failed:', e);
            }
            
            // Estrategia 3: Usar información del appointment si está disponible
            if (!appointment.pet) {
              appointment.pet = { name: `Mascota ${appointment.pet_id.slice(-4)}`, species: 'Mascota' };
              console.log('Using fallback pet name for appointment:', appointment.id);
            }
          }
        }
        
        setAppointments(alternativeQuery.data);
      }
      console.log('Appointments loaded with alternative method');
    } catch (error) {
      console.error('Unexpected error in handleSearch:', error);
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
      setAppointments([]);
    }
    setLoading(false);
  };

  const checkActionEligibility = (appointment) => {
    const appointmentTime = new Date(appointment.appointment_time);
    const now = new Date();
    const hoursDifference = differenceInHours(appointmentTime, now);
    if (hoursDifference < 1 && appointment.status === 'scheduled') {
      toast({ title: "Acción no permitida", description: "No puedes modificar una cita con menos de 1 hora de antelación. Por favor, contáctanos.", variant: "destructive", duration: 5000, });
      return false;
    }
    return true;
  };
  
  const openCancellationDialog = (appointment) => { if (checkActionEligibility(appointment)) { setAppointmentToManage(appointment); setIsCancelling(true); } };
  const openRescheduleDialog = (appointment) => { 
    if (checkActionEligibility(appointment)) { 
      // Redirigir al calendario principal con parámetros de reagendado
      window.location.href = `/book-appointment?reschedule=${appointment.id}&returnTo=/check-appointment&phone=${phone}`;
    } 
  };

  const handleConfirmCancellation = async (reason) => {
    if (!appointmentToManage || !reason) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled', notes: `Cancelado por cliente. Motivo: ${reason}` }).eq('id', appointmentToManage.id);
    if (error) { toast({ title: "Error", description: "No se pudo cancelar la cita.", variant: "destructive" }); } 
    else { toast({ title: "Éxito", description: "Cita cancelada correctamente." }); handleSearch(); }
    setIsCancelling(false); setAppointmentToManage(null);
  };
  
  const handleConfirmReschedule = async (newDate, newTime) => {
    if (!appointmentToManage || !newDate || !newTime) { toast({title: "Datos incompletos", variant: "destructive"}); return; }
    const [hours, minutes] = newTime.split(':');
    const newAppointmentTime = new Date(newDate);
    newAppointmentTime.setHours(hours, minutes, 0, 0);

    // Find an available professional for the new time slot
    const assignedProfessionalId = await findAvailableProfessionalForReschedule(newAppointmentTime, appointmentToManage.service);

    const { error } = await supabase.from('appointments').update({ 
      appointment_time: newAppointmentTime.toISOString(),
      assigned_professional_id: assignedProfessionalId
    }).eq('id', appointmentToManage.id);
    
    if(error) { toast({title: "Error al reagendar", variant: "destructive"}); }
    else { toast({title: "Éxito", description: "Tu cita ha sido reagendada."}); handleSearch(); }
    setIsRescheduling(false); setAppointmentToManage(null);
  };



  const statusConfig = { scheduled: { label: 'Programada', color: 'text-blue-500', bg: 'bg-blue-100' }, completed: { label: 'Completada', color: 'text-green-500', bg: 'bg-green-100' }, cancelled: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-100' }, no_show: { label: 'No Asistió', color: 'text-yellow-600', bg: 'bg-yellow-100' }, };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0378A6]/10 to-[#F26513]/10 p-4 pt-8 md:pt-16 pb-24 md:pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 font-heading text-center">Historial de Citas</h1>
            <p className="text-gray-600 mb-6 text-center">Introduce tu número para ver y gestionar tus citas.</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-8"><Label htmlFor="phone" className="sr-only">Teléfono</Label><Input id="phone" type="tel" placeholder="Tu número de teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-lg flex-grow"/><Button onClick={handleSearch} disabled={loading} className="h-12 text-lg"><Search className="w-5 h-5 mr-2" />{loading ? 'Buscando...' : 'Buscar'}</Button></div>
            <AnimatePresence>
              {searched && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {loading ? ( <div className="flex justify-center items-center p-8"><div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-[#F26513]"></div></div> ) : (
                    <div>
                      {profile && ( <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#0378A6] rounded-r-lg"><p className="font-semibold text-lg text-gray-800">Historial de {profile.name}</p></div> )}
                      {appointments.length > 0 ? (
                        <div className="space-y-4">
                          {appointments.map(app => {
                            const status = statusConfig[app.status] || { label: app.status, color: 'text-gray-500', bg: 'bg-gray-100' };
                            return(
                              <div key={app.id} className={`rounded-xl p-4 shadow-sm ${status.bg}`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                  <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                      <p className={`font-bold text-lg ${status.color}`}>{app.service?.name || 'Servicio'}</p>
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.bg} border border-current`}>{status.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Dog className="w-4 h-4 text-gray-600" />
                                      <p className="text-gray-700">
                                        Mascota: <span className="font-bold text-gray-900">{app.pet?.name || 'Sin nombre'}</span>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-600 text-sm mt-2">
                                      <span className="flex items-center gap-1">
                                        <CalendarIcon className="w-4 h-4" /> 
                                        {format(new Date(app.appointment_time), "d MMM yyyy", {locale: es})}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> 
                                        {format(new Date(app.appointment_time), "h:mm a")}
                                      </span>
                                    </div>
                                  </div>
                                  {app.status === 'scheduled' && user && (
                                    <div className="flex gap-2 mt-4 sm:mt-0">
                                      <Button variant="outline" size="sm" onClick={() => openRescheduleDialog(app)}>
                                        <Edit className="w-4 h-4 mr-2" /> Reagendar
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => openCancellationDialog(app)}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Cancelar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {!user && appointments.some(app => app.status === 'scheduled') && (
                            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                              <div className="flex">
                                <div className="ml-3">
                                  <p className="text-sm text-amber-800">
                                    <strong>Para gestionar tus citas</strong> (reagendar o cancelar), debes{' '}
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto font-semibold text-amber-800 underline"
                                      onClick={() => window.location.href = '/login'}
                                    >
                                      iniciar sesión
                                    </Button>
                                    {' '}en tu cuenta.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 px-4 bg-gray-50 rounded-lg"><History className="w-12 h-12 mx-auto text-gray-400 mb-4" /><p className="font-semibold text-gray-700">No se encontraron citas.</p><p className="text-gray-500 text-sm">¿Quieres agendar una nueva?</p><Button onClick={() => window.location.href='/book-appointment'} className="mt-4">Agendar Cita</Button></div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <AlertDialog open={isCancelling} onOpenChange={setIsCancelling}>{appointmentToManage && <CancellationDialog onConfirm={handleConfirmCancellation} onCancel={() => setIsCancelling(false)} />}</AlertDialog>
        <RescheduleDialog isOpen={isRescheduling} onOpenChange={setIsRescheduling} appointment={appointmentToManage} onConfirm={handleConfirmReschedule} />
      </div>
    </div>
  );
};

export default CheckAppointmentPage;