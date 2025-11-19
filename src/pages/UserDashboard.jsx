import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  User, Dog, Heart, Calendar as CalendarIcon, Award, LogOut, Edit, Trash2, Camera, ShieldCheck, Home, Plus, Cat, Clock, PawPrint, History, X, Trophy, ChevronDown, ChevronUp, Info, Cake, Stethoscope, Shield, Palette, AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { format, isFuture, isPast, differenceInHours, addMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';

// Components
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import PetHistoryPage from '@/pages/PetHistoryPage';
import AchievementUnlockedModal from '@/components/AchievementUnlockedModal';
import UserAchievementsHistory from '@/components/UserAchievementsHistory';
import { usePointsNotification } from '@/hooks/usePointsNotificationSimple';
import WelcomeWheelModal from '@/components/WelcomeWheelModal';

// Función para redimensionar imágenes
const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con compresión (siempre usar JPEG para mejor compresión)
      canvas.toBlob(
        (blob) => {
          const fileExtension = file.name.split('.').pop().toLowerCase();
          const fileName = file.name.replace(/\.[^/.]+$/, '.jpg'); // Cambiar extensión a .jpg
          
          const resizedFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        },
        'image/jpeg', // Siempre usar JPEG para mejor compresión
        quality
      );
    };
    
    img.onerror = () => {
      // Si hay error, devolver el archivo original
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Shared Dialogs from CheckAppointmentPage
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
        if (!date || !service) return []; setLoadingTimes(true);
        const dayOfWeek = date.getDay();
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Get custom time slots for the specific day
        const { data: customSlots, error: slotsError } = await supabase
            .from('custom_time_slots')
            .select(`
                id,
                start_time,
                end_time,
                custom_slot_availability!inner(
                    professional_id,
                    is_available
                )
            `)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .eq('custom_slot_availability.is_available', true)
            .order('start_time');

        if (slotsError || !customSlots?.length) { setLoadingTimes(false); return; }

        // Get existing appointments for the day
        const { data: appointments } = await supabase
            .from('appointments')
            .select('id, appointment_time')
            .eq('status', 'scheduled')
            .gte('appointment_time', `${formattedDate}T00:00:00.000Z`)
            .lte('appointment_time', `${formattedDate}T23:59:59.999Z`);

        const availableSlots = [];
        const now = new Date();

        customSlots.forEach(slot => {
            // Count available professionals for this slot
            const availableProfessionalsCount = slot.custom_slot_availability.length;

            // Count existing appointments that overlap with this slot
            const slotStart = new Date(`${formattedDate}T${slot.start_time}`);
            const slotEnd = new Date(`${formattedDate}T${slot.end_time}`);

            const conflictingAppointments = appointments?.filter(apt => {
                if (apt.id === appointment?.id) return false; // Exclude current appointment when rescheduling
                const aptTime = new Date(apt.appointment_time);
                return aptTime >= slotStart && aptTime < slotEnd;
            }) || [];

            // Check if slot is available (not in the past and has capacity)
            const slotDateTime = new Date(`${formattedDate}T${slot.start_time}`);
            const canBook = (
                slotDateTime > now && 
                conflictingAppointments.length < availableProfessionalsCount
            );

            if (canBook) {
                availableSlots.push(format(slotStart, 'HH:mm'));
            }
        });

        setAvailableTimes(availableSlots); setLoadingTimes(false);
    }, [appointment]);

    useEffect(() => { if (selectedDate && appointment?.service) getAvailableTimes(selectedDate, appointment.service); }, [selectedDate, appointment, getAvailableTimes]);
    const timeToAmPm = (time) => { if (!time) return ''; const [hours, minutes] = time.split(':'); const date = new Date(); date.setHours(hours, minutes); return format(date, 'hh:mm a'); };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>Reagendar Cita</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="flex justify-center"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) || !schedules.some(s => s.day_of_week === date.getDay())} /></div>
                    <div>
                         <h3 className="font-semibold text-center mb-4 text-lg">Horarios Disponibles</h3>
                         {loadingTimes ? <div className="flex justify-center"><div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div> : availableTimes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">{availableTimes.map(time => <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)} className="h-12 text-md">{timeToAmPm(time)}</Button>)}</div>
                         ) : <p className="text-center text-sm text-gray-500">No hay horarios disponibles para este día.</p>}
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => onConfirm(selectedDate, selectedTime)} disabled={!selectedTime}>Confirmar Nuevo Horario</Button></DialogFooter>
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

// Dashboard Components
const PetCard = ({ pet, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.8 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -5 }}
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl shadow-lg overflow-hidden relative group border border-white/50 backdrop-blur-sm"
    >
      {/* Botones de acción */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        <Button 
          size="icon" 
          variant="outline" 
          className="h-9 w-9 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-yellow-50 hover:border-yellow-200 shadow-lg" 
          onClick={(e) => { e.stopPropagation(); onEdit(pet); }}
        >
          <Edit className="w-4 h-4 text-yellow-600" />
        </Button>
        <AlertDialog onOpenChange={(open) => { if(open) { document.body.style.pointerEvents = 'auto'; }}}>
          <AlertDialogTrigger asChild>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-9 w-9 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-red-50 hover:border-red-200 shadow-lg" 
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar a {pet.name}?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(pet.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Imagen de la mascota con overlay de especie */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-b from-gray-100 to-gray-200 relative overflow-hidden">
          <img 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            alt={pet.name || 'Foto de mascota'} 
            src={pet.photo_url || 'https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/5b1a62d4e78298715d311910a3013c72.png'} 
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </div>
        
        {/* Badge de especie */}
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            {pet.species === 'Gato' ? 
              <Cat className="w-5 h-5 text-[#F26513]" /> : 
              <Dog className="w-5 h-5 text-[#0378A6]" />
            }
          </div>
        </div>
      </div>

      {/* Información de la mascota */}
      <div className="p-5">
        {/* Nombre y raza */}
        <div className="mb-4">
          <h3 className="font-bold text-xl text-gray-800 mb-1 flex items-center gap-2">
            {pet.name}
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0378A6] to-[#F26513]"></div>
          </h3>
          <p className="text-gray-600 font-medium text-sm">{pet.breed?.name || 'Raza no definida'}</p>
        </div>

        {/* Estado de salud */}
        <div className="mb-4">
          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-xl border border-red-100/50">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1">Estado de Salud</p>
              <p className="text-sm text-gray-700">{pet.medical_issues || 'Saludable'}</p>
            </div>
          </div>
        </div>

        {/* Peso de la mascota */}
        {pet.weight && (
          <div className="mb-4">
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">Peso Actual</p>
                <p className="text-sm text-gray-700">{pet.weight} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Botón de ver ficha */}
        <Button 
          onClick={() => navigate(`/dashboard/pets/${pet.id}`)}
          className="w-full bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold py-2.5"
        >
          <PawPrint className="w-4 h-4 mr-2" />
          Ver Ficha Completa
        </Button>
      </div>
    </motion.div>
  );
};

const AppointmentCard = ({ appointment, onCancel, onReschedule }) => {
    const statusConfig = { 
        scheduled: { 
            label: 'Programada', 
            color: 'bg-gradient-to-r from-[#0378A6]/10 to-[#0378A6]/20 text-[#0378A6] border border-[#0378A6]/30', 
            pastColor: 'bg-gray-100 text-gray-500' 
        }, 
        completed: { 
            label: 'Completada', 
            color: 'bg-gradient-to-r from-green-500/10 to-green-500/20 text-green-700 border border-green-500/30' 
        }, 
        cancelled: { 
            label: 'Cancelada', 
            color: 'bg-gradient-to-r from-red-500/10 to-red-500/20 text-red-700 border border-red-500/30' 
        }, 
        no_show: { 
            label: 'No Asistió', 
            color: 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/20 text-yellow-700 border border-yellow-500/30' 
        }
    };
    
    const isPastAppointment = isPast(new Date(appointment.appointment_time));
    const effectiveStatus = (isPastAppointment && appointment.status === 'scheduled') ? 'completed' : appointment.status;
    const currentStatus = statusConfig[effectiveStatus] || { label: appointment.status, color: 'bg-gray-100 text-gray-800' };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r from-white to-blue-50/30 rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isPastAppointment ? 'opacity-80' : ''}`}
        >
            {/* Header con servicio y estado */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center flex-shrink-0">
                            <PawPrint className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800 leading-tight">
                                {appointment.service?.name}
                            </h3>
                            <p className="text-gray-600 font-medium">
                                para <span className="text-[#0378A6] font-semibold">{appointment.pet?.name}</span>
                            </p>
                        </div>
                    </div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${currentStatus.color}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                        {currentStatus.label}
                    </div>
                </div>
            </div>

            {/* Fecha y hora */}
            <div className="bg-gradient-to-r from-blue-50/50 to-orange-50/50 rounded-xl p-4 mb-4 border border-blue-100/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-[#0378A6]" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">
                            {format(new Date(appointment.appointment_time), "eeee, d MMMM yyyy", { locale: es })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 font-medium">
                                {format(new Date(appointment.appointment_time), "h:mm a", { locale: es })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            {appointment.status === 'scheduled' && !isPastAppointment && (
                <div className="flex gap-3">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onReschedule(appointment)}
                        className="flex-1 border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10 hover:border-[#0378A6] transition-all duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" /> 
                        Reagendar
                    </Button>
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => onCancel(appointment)}
                        className="flex-1 bg-red-500 hover:bg-red-600 transition-all duration-200"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> 
                        Cancelar
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

const PetFormDialog = ({ isOpen, setIsOpen, user, fetchPets, editingPet }) => {
    const [breeds, setBreeds] = useState([]);
    
    // Cargar datos guardados del localStorage al inicializar
    const loadSavedFormData = () => {
        try {
            const savedData = localStorage.getItem('petFormDraft');
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.log('Error cargando datos guardados:', error);
        }
        return {
            name: '', 
            species: 'Perro', 
            breed_id: '', 
            birth_date: '',
            gender: 'Macho',
            medical_issues: 'Ninguno',
            disabilities: '',
            age_category: 'adulto'
        };
    };

    // Cargar imagen guardada del localStorage
    const loadSavedImageData = () => {
        try {
            const savedImageData = localStorage.getItem('petFormImageDraft');
            if (savedImageData) {
                const imageData = JSON.parse(savedImageData);
                return {
                    photoPreview: imageData.photoPreview,
                    photoFileName: imageData.photoFileName,
                    photoFileSize: imageData.photoFileSize
                };
            }
        } catch (error) {
            console.log('Error cargando imagen guardada:', error);
        }
        return {
            photoPreview: null,
            photoFileName: null,
            photoFileSize: null
        };
    };

    const [formData, setFormData] = useState(loadSavedFormData);
    
    // Cargar datos de imagen guardados
    const savedImageData = loadSavedImageData();
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(savedImageData.photoPreview);
    const [loading, setLoading] = useState(false);
    const [imageProcessing, setImageProcessing] = useState(false);

    // Función para guardar imagen en localStorage
    const saveImageToStorage = (file, preview) => {
        try {
            if (!editingPet) { // Solo guardar si no estamos editando
                const imageData = {
                    photoPreview: preview,
                    photoFileName: file?.name || null,
                    photoFileSize: file?.size || null,
                    timestamp: Date.now()
                };
                localStorage.setItem('petFormImageDraft', JSON.stringify(imageData));
            }
        } catch (error) {
            console.log('Error guardando imagen:', error);
        }
    };

    // Función para convertir Data URL a File (para restaurar el archivo desde localStorage)
    const dataURLtoFile = async (dataURL, filename) => {
        if (!dataURL) return null;
        
        try {
            const response = await fetch(dataURL);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
        } catch (error) {
            console.log('Error convirtiendo imagen:', error);
            return null;
        }
    };

    useEffect(() => { 
        const fetchBreeds = async () => { 
            const { data } = await supabase.from('breeds').select('id, name, behavior_color').order('name'); 
            setBreeds(data || []); 
        }; 
        fetchBreeds();
        
        // Restaurar archivo de imagen si existe preview guardado
        const restoreImageFile = async () => {
            const savedImageData = loadSavedImageData();
            if (savedImageData.photoPreview && savedImageData.photoFileName && !editingPet) {
                const restoredFile = await dataURLtoFile(savedImageData.photoPreview, savedImageData.photoFileName);
                if (restoredFile) {
                    setPhotoFile(restoredFile);
                }
            }
        };
        
        restoreImageFile();
    }, [editingPet]);

    // Guardar automáticamente los datos del formulario en localStorage
    useEffect(() => {
        // Solo guardar si no estamos editando una mascota existente y el formulario tiene datos significativos
        if (!editingPet && (formData.name.trim() || formData.breed_id || formData.birth_date)) {
            try {
                localStorage.setItem('petFormDraft', JSON.stringify(formData));
            } catch (error) {
                console.log('Error guardando datos del formulario:', error);
            }
        }
    }, [formData, editingPet]);

    // Solo limpiar datos guardados cuando se cierre el modal explícitamente (no por cambio de pestaña)
    useEffect(() => {
        if (!isOpen) {
            // Verificar si se cerró por cambio de pestaña o navegación
            const modalShouldStayOpen = localStorage.getItem('petFormModalOpen') === 'true';
            if (!modalShouldStayOpen) {
                try {
                    localStorage.removeItem('petFormDraft');
                    localStorage.removeItem('petFormImageDraft');
                } catch (error) {
                    console.log('Error limpiando datos guardados:', error);
                }
            }
        }
    }, [isOpen]);

    const resetForm = useCallback(() => {
        if (editingPet) { 
            setFormData({ 
                name: editingPet.name || '', 
                species: editingPet.species || 'Perro', 
                breed_id: editingPet.breed_id || '', 
                birth_date: editingPet.birth_date || '',
                gender: editingPet.gender || '',
                medical_issues: editingPet.medical_issues || 'Ninguno',
                disabilities: editingPet.disabilities || '',
                age_category: editingPet.age_category || 'joven'
            }); 
            setPhotoPreview(editingPet.photo_url || null); 
            setPhotoFile(null);
        } else { 
            // Al crear nueva mascota, cargar datos guardados si existen
            const savedData = loadSavedFormData();
            const savedImageData = loadSavedImageData();
            setFormData(savedData);
            setPhotoPreview(savedImageData.photoPreview); 
        }
    }, [editingPet]);

    useEffect(() => { if (isOpen) resetForm(); }, [isOpen, resetForm]);

    const handlePhotoChange = async (e) => { 
        const file = e.target.files[0]; 
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                toast({ title: "Archivo no válido", description: "Por favor selecciona una imagen válida.", variant: "destructive" });
                return;
            }
            
            // Verificar tamaño del archivo original (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast({ title: "Archivo muy grande", description: "La imagen no puede ser mayor a 10MB.", variant: "destructive" });
                return;
            }
            
            setImageProcessing(true);
            
            try {
                // Redimensionar imagen automáticamente
                const resizedFile = await resizeImage(file, 800, 600, 0.8);
                console.log(`Imagen redimensionada: ${file.size} bytes -> ${resizedFile.size} bytes`);
                
                const preview = URL.createObjectURL(resizedFile);
                setPhotoFile(resizedFile); 
                setPhotoPreview(preview);
                
                // Guardar imagen en localStorage
                saveImageToStorage(resizedFile, preview);
                
                // Mostrar información del redimensionamiento al usuario
                if (file.size > resizedFile.size) {
                    const savedKB = Math.round((file.size - resizedFile.size) / 1024);
                    toast({ 
                        title: "Imagen optimizada", 
                        description: `Se redujo el tamaño en ${savedKB}KB para una carga más rápida.`,
                        variant: "default"
                    });
                }
            } catch (error) {
                console.error('Error redimensionando imagen:', error);
                toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
            } finally {
                setImageProcessing(false);
            }
        } 
    };

    const handleSave = async () => {
        if (!formData.name || !formData.breed_id) { 
            toast({ title: "¡Casi!", description: "Nombre y raza son necesarios.", variant: "destructive" }); 
            return; 
        }
        setLoading(true); 
        let photoUrl = editingPet?.photo_url || photoPreview;
        
        if (photoFile) {
            const fileName = `pet-photos/${user.id}/${Date.now()}-${photoFile.name}`;
            const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, photoFile, { upsert: true });
            if (uploadError) { 
                console.error('Error de upload:', uploadError);
                let errorMessage = "Error al subir la imagen.";
                
                if (uploadError.message?.includes('Payload too large')) {
                    errorMessage = "La imagen es muy grande. Se ha redimensionado pero aún excede el límite. Prueba con una imagen más pequeña.";
                } else if (uploadError.message?.includes('Invalid file type')) {
                    errorMessage = "Tipo de archivo no válido. Solo se permiten imágenes.";
                } else if (uploadError.message?.includes('storage')) {
                    errorMessage = "Error de almacenamiento. Inténtalo nuevamente.";
                }
                
                toast({ title: "Error de carga", description: errorMessage, variant: "destructive" }); 
                setLoading(false); 
                return; 
            }
            const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName); 
            photoUrl = publicUrl;
        }
        
        // Validación de campos requeridos
        if (!formData.name || !formData.breed_id || !formData.species || !formData.gender || !formData.age_category) {
          toast({ title: "Error", description: "Por favor completa todos los campos obligatorios.", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Validación adicional del usuario
        if (!user?.id) {
          toast({ title: "Error", description: "Usuario no válido. Por favor, inicia sesión nuevamente.", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Validar formato de UUID para breed_id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(formData.breed_id)) {
          toast({ title: "Error", description: "La raza seleccionada no es válida. Por favor, selecciona una raza de la lista.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const cleanData = {
          name: formData.name.trim(),
          breed_id: formData.breed_id,
          species: formData.species,
          gender: formData.gender,
          age_category: formData.age_category,
          birth_date: formData.birth_date && formData.birth_date.trim() !== '' ? formData.birth_date : null,
          medical_issues: formData.medical_issues && formData.medical_issues.trim() !== '' && formData.medical_issues !== 'Ninguno' ? formData.medical_issues : null,
          disabilities: formData.disabilities && formData.disabilities.trim() !== '' ? formData.disabilities : null
        };

        console.log('Datos a enviar:', { cleanData, user: { id: user.id }, photoUrl });

        let insertError;
        if (editingPet) {
            const { error } = await supabase.from('pets').update({ ...cleanData, photo_url: photoUrl }).eq('id', editingPet.id);
            insertError = error;
        } else {
            const { error } = await supabase.from('pets').insert({ ...cleanData, owner_id: user.id, photo_url: photoUrl });
            insertError = error;
            
            // Si falla por columnas faltantes, intentar solo con campos básicos
            if (insertError && insertError.message.includes('column') && insertError.message.includes('does not exist')) {
                const basicData = {
                    name: cleanData.name,
                    breed_id: cleanData.breed_id,
                    species: cleanData.species,
                    owner_id: user.id,
                    photo_url: photoUrl
                };
                const { error: basicError } = await supabase.from('pets').insert(basicData);
                insertError = basicError;
                
                if (!basicError) {
                    toast({
                        title: "Inserción parcial",
                        description: "Mascota guardada con campos básicos. Algunos campos avanzados no están disponibles.",
                        variant: "default"
                    });
                }
            }
        }
            
        if (insertError) { 
            console.error('Error de Supabase:', insertError);
            
            // Proporcionar mensajes de error más específicos
            let errorMessage = insertError.message;
            if (insertError.code === '23505') {
                errorMessage = "Ya existe una mascota con ese nombre para este propietario.";
            } else if (insertError.code === '23503') {
                errorMessage = "Los datos de raza o propietario no son válidos.";
            } else if (insertError.message.includes('invalid input syntax')) {
                errorMessage = "Alguno de los datos ingresados tiene un formato incorrecto.";
            }
            
            toast({ title: "Error", description: errorMessage, variant: "destructive" }); 
        } else { 
            toast({ title: "¡Genial!", description: `Mascota ${editingPet ? 'actualizada' : 'añadida'}.` }); 
            // Limpiar datos guardados después de guardar exitosamente
            try {
                localStorage.removeItem('petFormDraft');
                localStorage.removeItem('petFormImageDraft');
                localStorage.removeItem('petFormModalOpen');
            } catch (error) {
                console.log('Error limpiando datos guardados:', error);
            }
            fetchPets(); 
            setIsOpen(false); 
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="bg-gradient-to-r from-[#0378A6] to-[#0378A6]/90 text-white rounded-t-xl p-6 -m-6 mb-6">
                    <DialogTitle className="text-xl flex items-center gap-3 font-normal text-white drop-shadow-md">
                        <Info className="w-6 h-6" />
                        {editingPet ? 'Editar Información de la Mascota' : 'Añadir Nueva Mascota'}
                        {!editingPet && formData.name && (
                            <span className="text-sm bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                                💾 Datos guardados
                            </span>
                        )}
                        {!editingPet && photoPreview && loadSavedImageData().photoPreview && (
                            <span className="text-sm bg-green-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                                📸 Foto guardada
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                
                {/* Aviso cuando hay datos guardados */}
                {!editingPet && formData.name && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-blue-800">
                            <Info className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Se han restaurado los datos que estabas completando anteriormente.
                            </span>
                        </div>
                    </div>
                )}
                
                <div className="space-y-6">
                    {/* Foto de la mascota */}
                    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-r from-blue-50/50 to-orange-50/50 rounded-xl border border-blue-100/30">
                        <div className="relative">
                            <img 
                                src={photoPreview || 'https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/5b1a62d4e78298715d311910a3013c72.png'} 
                                alt="preview" 
                                className="w-32 h-32 rounded-full object-cover bg-gray-200 border-4 border-white shadow-lg"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                {formData.species === 'Gato' ? 
                                    <Cat className="w-6 h-6 text-[#F26513]" /> : 
                                    <Dog className="w-6 h-6 text-[#0378A6]" />
                                }
                            </div>
                        </div>
                        <Button asChild variant="outline" className="bg-white/90 hover:bg-white shadow-md" disabled={imageProcessing}>
                            <Label htmlFor="add-pet-photo" className="cursor-pointer flex items-center gap-2">
                                <Camera className="w-4 h-4"/>
                                {imageProcessing ? 'Procesando...' : 'Cambiar Foto'}
                            </Label>
                        </Button>
                        {imageProcessing && (
                            <div className="text-sm text-blue-600 text-center animate-pulse">
                                Optimizando imagen...
                            </div>
                        )}
                        <Input id="add-pet-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={imageProcessing}/>
                    </div>

                    {/* Información Básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Nombre */}
                        <div className="bg-white rounded-lg p-4 border border-blue-100 hover:border-[#0378A6]/30 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-[#0378A6] font-medium mb-3">
                                <div className="p-1.5 bg-[#0378A6]/10 rounded-lg">
                                    <PawPrint className="w-4 h-4" />
                                </div>
                                Nombre de la Mascota
                            </Label>
                            <Input 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="border-blue-200 focus:border-[#0378A6] focus:ring-blue-200"
                                placeholder="Nombre de tu mascota"
                            />
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div className="bg-white rounded-lg p-4 border border-blue-100 hover:border-[#0378A6]/30 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-[#0378A6] font-medium mb-3">
                                <div className="p-1.5 bg-[#0378A6]/10 rounded-lg">
                                    <Cake className="w-4 h-4" />
                                </div>
                                Fecha de Nacimiento
                            </Label>
                            <Input 
                                type="date"
                                value={formData.birth_date} 
                                onChange={e => setFormData({...formData, birth_date: e.target.value})}
                                className="border-blue-200 focus:border-[#0378A6] focus:ring-blue-200"
                            />
                        </div>

                        {/* Género */}
                        <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-green-700 font-medium mb-3">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Heart className="w-4 h-4" />
                                </div>
                                Género
                            </Label>
                            <Select onValueChange={(v) => setFormData({...formData, gender: v})} value={formData.gender}>
                                <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-200">
                                    <SelectValue placeholder="Seleccionar género..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Macho">Macho</SelectItem>
                                    <SelectItem value="Hembra">Hembra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Especie */}
                        <div className="bg-white rounded-lg p-4 border border-orange-100 hover:border-orange-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-orange-700 font-medium mb-3">
                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                    <PawPrint className="w-4 h-4" />
                                </div>
                                Especie
                            </Label>
                            <Select onValueChange={(v) => setFormData({...formData, species: v})} value={formData.species}>
                                <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-200">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Perro">
                                        <div className="flex items-center gap-2">
                                            <Dog className="w-4 h-4" /> 
                                            Perro
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Gato">
                                        <div className="flex items-center gap-2">
                                            <Cat className="w-4 h-4" /> 
                                            Gato
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Raza */}
                        <div className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-purple-700 font-medium mb-3">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <Palette className="w-4 h-4" />
                                </div>
                                Raza
                            </Label>
                            <Select onValueChange={(v) => setFormData({...formData, breed_id: v})} value={formData.breed_id}>
                                <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-200">
                                    <SelectValue placeholder="Seleccionar raza..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {breeds.map(b => 
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Categoría de Edad */}
                        <div className="bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-indigo-700 font-medium mb-3">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Clock className="w-4 h-4" />
                                </div>
                                Etapa de Vida
                            </Label>
                            <Select onValueChange={(v) => setFormData({...formData, age_category: v})} value={formData.age_category}>
                                <SelectTrigger className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200">
                                    <SelectValue placeholder="Seleccionar etapa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cachorro">Cachorro</SelectItem>
                                    <SelectItem value="joven">Joven</SelectItem>
                                    <SelectItem value="adulto">Adulto</SelectItem>
                                    <SelectItem value="senior">Senior</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Información Médica y Comportamiento */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Estado de Salud */}
                        <div className="bg-white rounded-lg p-4 border border-red-100 hover:border-red-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-red-700 font-medium mb-3">
                                <div className="p-1.5 bg-red-100 rounded-lg">
                                    <Stethoscope className="w-4 h-4" />
                                </div>
                                Condiciones Médicas
                            </Label>
                            <Textarea 
                                value={formData.medical_issues} 
                                onChange={e => setFormData({...formData, medical_issues: e.target.value})} 
                                placeholder="Ej: Alergias, problemas cardíacos, diabetes, etc."
                                className="min-h-20 border-red-200 focus:border-red-500 focus:ring-red-200"
                            />
                        </div>

                        {/* Discapacidades */}
                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                            <Label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                                <div className="p-1.5 bg-gray-100 rounded-lg">
                                    <Shield className="w-4 h-4" />
                                </div>
                                Discapacidades o Limitaciones
                            </Label>
                            <Textarea 
                                value={formData.disabilities} 
                                onChange={e => setFormData({...formData, disabilities: e.target.value})} 
                                placeholder="Ej: Ceguera, sordera, movilidad limitada, etc."
                                className="min-h-20 border-gray-200 focus:border-gray-500 focus:ring-gray-200"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-8 pt-6 border-t border-gray-200">
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={loading} className="hover:bg-gray-100">
                            Cancelar
                        </Button>
                    </DialogClose>
                    
                    {/* Botón para limpiar formulario solo visible en modo de creación */}
                    {!editingPet && (
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                try {
                                    localStorage.removeItem('petFormDraft');
                                    localStorage.removeItem('petFormImageDraft');
                                    setFormData({
                                        name: '', 
                                        species: 'Perro', 
                                        breed_id: '', 
                                        birth_date: '',
                                        gender: 'Macho',
                                        medical_issues: 'Ninguno',
                                        disabilities: '',
                                        age_category: 'adulto'
                                    });
                                    setPhotoFile(null);
                                    setPhotoPreview(null);
                                    toast({ title: "Formulario limpiado", description: "Puedes empezar de nuevo." });
                                } catch (error) {
                                    console.log('Error limpiando formulario:', error);
                                }
                            }}
                            disabled={loading}
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            🧹 Limpiar
                        </Button>
                    )}
                    
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white shadow-lg"
                    >
                        {loading ? 'Guardando...' : (editingPet ? 'Guardar Cambios' : 'Añadir Mascota')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const PageWrapper = ({ children, title }) => <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 sm:p-6"><h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>{children}</motion.div>;

// Main Dashboard Component
const UserDashboard = ({ user, onLogout }) => {
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Persistir estado del modal en localStorage
  const loadModalState = () => {
    try {
      const savedState = localStorage.getItem('petFormModalOpen');
      return savedState === 'true';
    } catch (error) {
      console.log('Error cargando estado del modal:', error);
      return false;
    }
  };

  const [isPetFormOpen, setIsPetFormOpen] = useState(loadModalState);
  const [editingPet, setEditingPet] = useState(null);
  const [appointmentToManage, setAppointmentToManage] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para la ruleta de bienvenida
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [shouldShowWheel, setShouldShowWheel] = useState(false);

  // Hook para notificaciones de puntos
  const { showModal, modalConfig, closeModal, checkWelcomePoints } = usePointsNotification(user);

  // Verificar si debe mostrar la ruleta (nuevo usuario con registro)
  useEffect(() => {
    const checkWheelEligibility = async () => {
      if (!user?.id) return;

      console.log('🎰 Verificando elegibilidad para ruleta...');

      // Verificar si hay premios activos
      const { data: prizes } = await supabase
        .from('anniversary_prizes')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      console.log('🎰 Premios activos:', prizes?.length || 0);

      if (!prizes || prizes.length === 0) {
        console.log('❌ No hay premios activos');
        return;
      }

      // Verificar si ya jugó antes
      const { data: winner } = await supabase
        .from('anniversary_winners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🎰 Ya jugó antes:', !!winner);

      if (!winner) {
        console.log('✅ Usuario ELEGIBLE para ruleta - shouldShowWheel = true');
        setShouldShowWheel(true);
        
        // Si no hay modal de puntos activo, mostrar la ruleta directamente después de 1 segundo
        setTimeout(() => {
          console.log('🎡 Abriendo ruleta automáticamente para usuario elegible');
          setShowWheelModal(true);
        }, 1500);
      } else {
        console.log('❌ Usuario ya participó');
      }
    };

    checkWheelEligibility();
  }, [user?.id]);

  // Función para cerrar el modal de puntos y abrir la ruleta si corresponde
  const handleClosePointsModal = useCallback(() => {
    console.log('🔔 handleClosePointsModal ejecutado');
    console.log('🔔 shouldShowWheel:', shouldShowWheel);
    
    closeModal();
    
    if (shouldShowWheel) {
      console.log('✅ Abriendo ruleta en 500ms...');
      setTimeout(() => {
        console.log('🎡 EJECUTANDO setShowWheelModal(true)');
        setShowWheelModal(true);
        setShouldShowWheel(false);
      }, 500);
    } else {
      console.log('❌ shouldShowWheel es false - NO se abrirá la ruleta');
    }
  }, [closeModal, shouldShowWheel]);

  // Verificar puntos de bienvenida al cargar
  useEffect(() => {
    if (user?.id) {
      checkWelcomePoints();
    }
  }, [user?.id, checkWelcomePoints]);

  // Efecto para restaurar el estado del modal al cargar la página
  useEffect(() => {
    const savedModalState = localStorage.getItem('petFormModalOpen');
    if (savedModalState === 'true') {
      setIsPetFormOpen(true);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return; setLoading(true);
    const [petsRes, appointmentsRes] = await Promise.all([
      supabase.from('pets').select('*, breed:breeds(name)').eq('owner_id', user.id).order('created_at'),
      supabase.from('appointments').select('*, service:services(*), pet:pets(name)').eq('owner_id', user.id).order('appointment_time', { ascending: false }),
    ]);
    if (petsRes.error) toast({ variant: "destructive", title: "Error cargando mascotas" }); else setPets(petsRes.data);
    if (appointmentsRes.error) toast({ variant: "destructive", title: "Error cargando citas" }); else setAppointments(appointmentsRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { 
    fetchDashboardData(); 
  }, [fetchDashboardData]);

  // Los puntos se manejan automáticamente via subscription

  const checkActionEligibility = (appointment) => {
    if (differenceInHours(new Date(appointment.appointment_time), new Date()) < 8) {
      toast({ title: "No puedes reagendar en este momento", description: "Debes reagendar tu cita con al menos 8 horas de antelación.", variant: "destructive" });
      return false;
    } return true;
  };
  
  const handleOpenReschedule = (appointment) => { 
    if (checkActionEligibility(appointment)) { 
      // Redirigir al calendario principal con parámetros de reagendado
      navigate(`/book-appointment?reschedule=${appointment.id}&returnTo=/dashboard/appointments`);
    } 
  };
  const handleOpenCancel = (appointment) => { if (checkActionEligibility(appointment)) { setAppointmentToManage(appointment); setIsCancelling(true); } };
  
  const handleConfirmReschedule = async (newDate, newTime) => {
    if (!appointmentToManage || !newDate || !newTime) { toast({title: "Datos incompletos", variant: "destructive"}); return; }
    const [hours, minutes] = newTime.split(':'); 
    const newAppointmentTime = new Date(newDate); 
    newAppointmentTime.setHours(hours, minutes, 0, 0);
    
    const { error } = await supabase.from('appointments').update({ 
      appointment_time: newAppointmentTime.toISOString()
    }).eq('id', appointmentToManage.id);
    
    if(error) { 
      toast({title: "Error al reagendar", variant: "destructive"}); 
    } else { 
      toast({title: "Éxito", description: "Tu cita ha sido reagendada."}); 
      fetchDashboardData(); 
    }
    setIsRescheduling(false);
  };

  const handleConfirmCancellation = async (reason) => {
    if (!appointmentToManage || !reason) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled', notes: `Cancelado por cliente. Motivo: ${reason}` }).eq('id', appointmentToManage.id);
    if (error) { toast({ title: "Error al cancelar", variant: "destructive" }); } else { toast({ title: "Éxito", description: "Cita cancelada." }); fetchDashboardData(); }
    setIsCancelling(false);
  };
  
  const handleDeletePet = async (petId) => {
    if (appointments.some(app => app.pet_id === petId && app.status === 'scheduled' && isFuture(new Date(app.appointment_time)))) { toast({ title: "Acción no permitida", description: "No puedes eliminar una mascota con citas futuras.", variant: "destructive"}); return; }
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) { toast({ title: "Error", variant: "destructive" }); } else { toast({ title: "Éxito", description: "Mascota eliminada." }); fetchDashboardData(); }
  };
  const handleEditPet = (pet) => { setEditingPet(pet); setIsPetFormOpen(true); localStorage.setItem('petFormModalOpen', 'true'); };
  const handleAddPet = () => { setEditingPet(null); setIsPetFormOpen(true); localStorage.setItem('petFormModalOpen', 'true'); };
  
  // Efecto para manejar la persistencia del estado del modal
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isPetFormOpen) {
        localStorage.setItem('petFormModalOpen', 'true');
      }
    };

    const handleBeforeUnload = () => {
      if (isPetFormOpen) {
        localStorage.setItem('petFormModalOpen', 'true');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPetFormOpen]);

  // Función personalizada para cerrar el modal que también limpia localStorage
  const handleCloseModal = (shouldClose) => {
    setIsPetFormOpen(shouldClose);
    if (!shouldClose) {
      localStorage.removeItem('petFormModalOpen');
    }
  };
  
  const DashboardHome = () => {
    // Obtener la cita más cercana (próxima cita futura ordenada por fecha)
    const upcomingAppointment = appointments
      .filter(app => isFuture(new Date(app.appointment_time)) && app.status === 'scheduled')
      .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))[0];
    
    return(
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-4 sm:p-6 space-y-8"
    >
        {/* Tarjeta de próxima cita rediseñada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#0378A6] to-[#04a8e8] text-white shadow-xl border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                Próxima Cita
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {upcomingAppointment ? (
                <div className="space-y-3">
                  <p className="font-bold text-2xl flex items-center gap-3">
                    <PawPrint className="w-7 h-7 text-yellow-300"/>
                    {upcomingAppointment.service.name}
                  </p>
                  <p className="font-semibold text-xl text-white/90">para {upcomingAppointment.pet.name}</p>
                  <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <div className="text-white/90 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{format(new Date(upcomingAppointment.appointment_time), "eeee, d MMMM, h:mm a", { locale: es })}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/90 text-lg">No tienes próximas citas.</p>
                  <p className="text-white/70 text-sm mt-1">¡Anímate a agendar una!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Botones de acción rediseñados */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div 
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Button 
              onClick={() => navigate('/book-appointment?fresh=true')} 
              className="w-full h-28 bg-gradient-to-br from-[#F26513] to-[#ff7a47] hover:from-[#F26513]/90 hover:to-[#ff7a47]/90 flex-col gap-3 shadow-xl border-none transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-7 h-7"/>
              </div>
              <span className="font-bold text-lg">Agendar Cita</span>
            </Button>
          </motion.div>
          
          <motion.div 
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button 
              onClick={handleAddPet} 
              className="w-full h-28 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex-col gap-3 shadow-xl border-none transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="w-7 h-7"/>
              </div>
              <span className="font-bold text-lg">Añadir Mascota</span>
            </Button>
          </motion.div>
        </div>

        {/* Historial reciente rediseñado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-white/20">
            <CardHeader className="bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 border-b border-gray-200/50">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-white"/>
                </div>
                Historial Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <AppointmentCard appointment={app} onCancel={handleOpenCancel} onReschedule={handleOpenReschedule} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Aún no tienes citas registradas.</p>
                </div>
              )}
              {appointments.length > 3 && (
                <Button 
                  variant="link" 
                  onClick={() => navigate('/dashboard/appointments')} 
                  className="mt-6 w-full text-[#0378A6] hover:text-[#F26513] font-semibold"
                >
                  Ver todo el historial →
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
    </motion.div>
  )};

  const PetsPage = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50"
    >
      <div className="p-4 sm:p-6">
        {/* Header moderno */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center">
                <Dog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mis Mascotas</h1>
                <p className="text-gray-600">Administra la información de tus compañeros</p>
              </div>
            </div>
            <Button 
              onClick={handleAddPet}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2"/>
              Añadir Mascota
            </Button>
          </div>
        </div>

        {/* Grid de mascotas */}
        {pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {pets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <PetCard pet={pet} onEdit={handleEditPet} onDelete={handleDeletePet} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center mx-auto mb-6">
                <Dog className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">¡Agrega tu Primera Mascota!</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Comienza registrando la información de tu compañero para poder agendar citas y llevar su historial médico.
              </p>
              <Button 
                onClick={handleAddPet}
                className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg font-semibold"
              >
                <Plus className="w-5 h-5 mr-2"/>
                Registrar Mascota
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
  
  const AppointmentsPage = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50"
    >
      <div className="p-4 sm:p-6">
        {/* Header moderno */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mis Citas</h1>
                <p className="text-gray-600">Administra tus citas médicas y de spa</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/book-appointment?fresh=true')}
              className="bg-gradient-to-r from-[#F26513] to-[#ff7a47] hover:from-[#F26513]/90 hover:to-[#ff7a47]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2"/>
              Agendar Cita
            </Button>
          </div>
          
          {/* Estadísticas de citas */}
          {appointments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-blue-700 mb-1">Total</p>
                <p className="text-lg font-bold text-blue-800">{appointments.length}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-green-700 mb-1">Completadas</p>
                <p className="text-lg font-bold text-green-800">
                  {appointments.filter(app => app.status === 'completed' || (isPast(new Date(app.appointment_time)) && app.status === 'scheduled')).length}
                </p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-orange-700 mb-1">Programadas</p>
                <p className="text-lg font-bold text-orange-800">
                  {appointments.filter(app => app.status === 'scheduled' && isFuture(new Date(app.appointment_time))).length}
                </p>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-red-700 mb-1">Canceladas</p>
                <p className="text-lg font-bold text-red-800">
                  {appointments.filter(app => app.status === 'cancelled').length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de citas o estado vacío */}
        {appointments.length > 0 ? (
          <div className="space-y-6">
            {appointments.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <AppointmentCard 
                  appointment={app} 
                  onCancel={handleOpenCancel} 
                  onReschedule={handleOpenReschedule} 
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
              {/* Icono animado */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-lg">✨</span>
                </div>
              </div>
              
              {/* Mensaje motivacional */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                ¡Es hora de cuidar a tu compañero!
              </h3>
              <p className="text-gray-600 mb-2 leading-relaxed">
                Tu agenda está libre. Es el momento perfecto para:
              </p>
              
              {/* Lista de servicios */}
              <div className="text-left mb-8 space-y-2">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-[#0378A6]"></div>
                  <span>Agendar una sesión de spa y relajación</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-[#F26513]"></div>
                  <span>Programar vacunas y chequeos médicos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Mantener al día la desparasitación</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/book-appointment?fresh=true')}
                  className="w-full bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-4 text-lg font-semibold"
                >
                  <CalendarIcon className="w-5 h-5 mr-2"/>
                  ¡Agendar mi Primera Cita!
                </Button>
                
                <p className="text-sm text-gray-500">
                  Disponible 7 días a la semana • Confirma en minutos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const ProfilePage = () => {
    const [showAchievements, setShowAchievements] = useState(false);
    
    return (
      <PageWrapper title="Mi Perfil">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center text-white text-5xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            
            {/* Mostrar puntos actuales */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 px-4 py-2 rounded-full">
              <Trophy className="w-5 h-5 text-[#0378A6]" />
              <span className="font-semibold text-gray-700">
                {user?.points || 0} puntos
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Botón para ver historial de logros */}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between hover:bg-gradient-to-r hover:from-[#0378A6]/10 hover:to-[#F26513]/10 transition-all duration-200" 
              onClick={() => setShowAchievements(!showAchievements)}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Historial de Logros
              </div>
              {showAchievements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            <Button variant="destructive" className="w-full" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
        
        {/* Componente del historial de logros */}
        <UserAchievementsHistory 
          isOpen={showAchievements} 
          onToggle={() => setShowAchievements(!showAchievements)} 
        />
      </PageWrapper>
    );
  };

  const navItems = [ { to: '/dashboard', icon: Home, label: 'Inicio' }, { to: '/dashboard/pets', icon: Dog, label: 'Mascotas' }, { to: '/dashboard/appointments', icon: CalendarIcon, label: 'Citas' }, { to: '/dashboard/profile', icon: User, label: 'Perfil' }, ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 w-full max-w-lg mx-auto flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full p-0.5">
            <img src="https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/e00c42547df182c8547e11b986abb6b3.png" alt="Logo" className="h-full w-full rounded-full bg-white p-1"/>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#0378A6] to-[#F26513] bg-clip-text text-transparent">
            ¡Hola, {user?.name?.split(' ')[0]}!
          </h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/dashboard/profile')}
          className="hover:bg-white/50"
        >
          <X className="w-5 h-5 text-gray-600"/>
        </Button>
      </header>
      <main className="flex-grow pb-32">
        {loading ? ( <div className="flex justify-center items-center h-full pt-20"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div> ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route index element={<DashboardHome />} />
                <Route path="pets" element={<PetsPage />} />
                <Route path="pets/:petId" element={<PetHistoryPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        )}
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-transparent z-50 pointer-events-none md:hidden">
        <div className="absolute bottom-4 left-4 right-4 h-16 pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex justify-around items-center h-full px-2">
            {navItems.map(item => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.to === '/dashboard'} 
                className={({isActive}) => 
                  `flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 rounded-xl mx-1 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#0378A6] to-[#F26513] text-white shadow-lg transform scale-105' 
                      : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      <PetFormDialog isOpen={isPetFormOpen} setIsOpen={handleCloseModal} user={user} fetchPets={fetchDashboardData} editingPet={editingPet} />
      <AlertDialog open={isCancelling} onOpenChange={setIsCancelling}>{appointmentToManage && <CancellationDialog onConfirm={handleConfirmCancellation} onCancel={() => setIsCancelling(false)} />}</AlertDialog>
      
      {/* Modal de notificación de puntos */}
      <AchievementUnlockedModal 
        isOpen={showModal}
        onClose={handleClosePointsModal}
        type={modalConfig.type}
        points={modalConfig.points}
        customTitle={modalConfig.customTitle}
        customDescription={modalConfig.customDescription}
      />

      {/* Modal de Ruleta de Bienvenida */}
      <WelcomeWheelModal 
        isOpen={showWheelModal}
        onClose={() => setShowWheelModal(false)}
        userId={user?.id}
        userName={user?.name}
      />

    </div>
  );
};

export default UserDashboard;