import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { assignAppointmentPoints } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { es } from 'date-fns/locale';
import { format, addMinutes, parse, startOfDay, addHours } from 'date-fns';
import { ArrowLeft, Sparkles, AlertTriangle, Download, Share2, UserX, Dog, Clock, CheckCircle, Calendar as CalendarIcon, User, Heart, Facebook, Instagram, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConsentModal from '@/components/ConsentModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

// Funciones de persistencia fuera del componente para disponibilidad inmediata
const CONFIRMATION_STORAGE_KEY_NEW = 'appointmentConfirmationDataNew';
const CONFIRMATION_STORAGE_KEY = 'appointmentConfirmationData'; // Legacy key
const CONFIRMATION_DISMISSED_KEY = 'appointmentConfirmationDismissed'; // Para rastrear si el usuario cerró la confirmación

const saveConfirmationData = (appointmentData, currentStep) => {
  try {
    const confirmationData = {
      appointmentDetails: appointmentData,
      step: currentStep,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    localStorage.setItem(CONFIRMATION_STORAGE_KEY_NEW, JSON.stringify(confirmationData));
    console.log('Datos de confirmación guardados en nueva clave:', confirmationData);
  } catch (error) {
    console.error('Error saving confirmation data:', error);
  }
};

const loadConfirmationData = () => {
  try {
    // Primero intentar la nueva clave
    let savedData = localStorage.getItem(CONFIRMATION_STORAGE_KEY_NEW);
    let usingNewKey = true;
    
    // Si no existe, intentar la clave legacy
    if (!savedData) {
      savedData = localStorage.getItem(CONFIRMATION_STORAGE_KEY);
      usingNewKey = false;
    }
    
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log(`Datos de confirmación cargados desde ${usingNewKey ? 'nueva' : 'legacy'} clave:`, parsed);
      
      // Solo restaurar si es reciente (últimas 24 horas)
      const timestamp = new Date(parsed.timestamp || new Date().toISOString());
      const now = new Date();
      const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
      
      if (hoursDiff < 24 && parsed.appointmentDetails) {
        console.log('Restaurando datos de confirmación válidos');
        // Si usamos datos legacy, migrarlos al nuevo sistema
        if (!usingNewKey) {
          console.log('Migrando datos legacy al nuevo sistema');
          saveConfirmationData(parsed.appointmentDetails, parsed.step || 4);
          localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
        }
        return parsed;
      } else {
        console.log('Datos de confirmación expirados o inválidos');
        // Limpiar datos expirados
        localStorage.removeItem(usingNewKey ? CONFIRMATION_STORAGE_KEY_NEW : CONFIRMATION_STORAGE_KEY);
      }
    } else {
      console.log('No hay datos de confirmación guardados');
    }
  } catch (error) {
    console.error('Error loading confirmation data:', error);
  }
  return null;
};

const clearConfirmationData = () => {
  try {
    localStorage.removeItem(CONFIRMATION_STORAGE_KEY_NEW);
    localStorage.removeItem(CONFIRMATION_STORAGE_KEY); // También limpiar legacy
    localStorage.removeItem(CONFIRMATION_DISMISSED_KEY); // También limpiar marca de cerrado
    console.log('Datos de confirmación limpiados');
  } catch (error) {
    console.error('Error clearing confirmation data:', error);
  }
};

const markConfirmationAsDismissed = () => {
  try {
    localStorage.setItem(CONFIRMATION_DISMISSED_KEY, 'true');
    console.log('Confirmación marcada como cerrada por el usuario');
  } catch (error) {
    console.error('Error marking confirmation as dismissed:', error);
  }
};

const wasConfirmationDismissed = () => {
  try {
    return localStorage.getItem(CONFIRMATION_DISMISSED_KEY) === 'true';
  } catch (error) {
    console.error('Error checking if confirmation was dismissed:', error);
    return false;
  }
};

const AppointmentPage = ({ user }) => {
  // Claves para localStorage
  const LOCAL_STORAGE_KEY = 'appointmentFormData';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Reagendado
  const rescheduleId = searchParams.get('reschedule');
  const returnTo = searchParams.get('returnTo');
  const phoneNumber = searchParams.get('phone');
  const [isRescheduleMode, setIsRescheduleMode] = useState(!!rescheduleId);
  const [originalAppointment, setOriginalAppointment] = useState(null);
  
  useEffect(() => {
    if (!user && !isRescheduleMode) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para poder agendar una cita.",
        variant: "destructive",
        duration: 5000,
      });
      navigate('/login');
    }
  }, [user, navigate]);

  const [step, setStep] = useState(1);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  // Efecto inicial unificado para cargar datos de confirmación
  useEffect(() => {
    console.log('Iniciando carga de datos de confirmación...');
    
    // Si viene con parámetro 'fresh', NO cargar datos guardados
    const isFreshStart = searchParams.get('fresh') === 'true';
    if (isFreshStart) {
      console.log('Inicio limpio detectado (fresh=true), omitiendo carga de datos');
      // Limpiar cualquier dato residual
      clearConfirmationData();
      clearLocalStorage();
      return;
    }
    
    // Si el usuario cerró la confirmación previamente, NO volver a mostrarla
    if (wasConfirmationDismissed()) {
      console.log('Usuario cerró la confirmación previamente, omitiendo carga');
      return;
    }
    
    // Intentar cargar datos de confirmación usando el nuevo sistema
    const confirmationData = loadConfirmationData();
    if (confirmationData && confirmationData.appointmentDetails) {
      console.log('Restaurando estado desde confirmationData:', confirmationData);
      setStep(confirmationData.step);
      setAppointmentDetails(confirmationData.appointmentDetails);
      return; // Salir temprano si encontramos datos de confirmación
    }
    
    console.log('No se encontraron datos de confirmación, verificando localStorage legacy...');
  }, [searchParams]);
  const [groomingServices, setGroomingServices] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [haircutStyles, setHaircutStyles] = useState([]);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  
  const [defaultService, setDefaultService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);

  const [userData, setUserData] = useState({ name: '', petName: '', breedId: '', breedName: '', document_number: '', address: '' });
  
  // Efecto secundario para cargar otros datos persistidos solo si no hay confirmación
  useEffect(() => {
    // Si viene con parámetro 'fresh', NO cargar nada
    const isFreshStart = searchParams.get('fresh') === 'true';
    if (isFreshStart) {
      console.log('Inicio limpio detectado, omitiendo carga de datos legacy');
      return;
    }
    
    // Si el usuario cerró la confirmación, no cargar confirmación pero sí otros datos
    const wasDismissed = wasConfirmationDismissed();
    
    // Solo ejecutar si no hemos cargado datos de confirmación
    const confirmationData = loadConfirmationData();
    if (confirmationData && confirmationData.appointmentDetails && !wasDismissed) {
      console.log('Ya se cargaron datos de confirmación, saltando carga de datos legacy');
      return;
    }
    
    console.log('Cargando datos legacy desde localStorage...');
    
    // Verificar si hay una confirmación persistente al cargar
    // Solo cargar confirmación guardada si venimos de una recarga de página
    // o si específicamente es un reagendamiento
    const isPageReload = window.performance.navigation.type === 1;
    const isDirectNavigation = !document.referrer || document.referrer === window.location.href;
    
    const savedConfirmation = localStorage.getItem(CONFIRMATION_STORAGE_KEY);
    if (savedConfirmation && (isPageReload || isDirectNavigation || isRescheduleMode)) {
      try {
        const confirmationData = JSON.parse(savedConfirmation);
        setStep(4);
        setAppointmentDetails(confirmationData);
        return;
      } catch {
        localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      }
    } else if (savedConfirmation && !isRescheduleMode) {
      // Si navegamos desde otra parte de la app (no recarga), limpiar confirmación
      localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
    }
    
    // Restaurar datos guardados si existen SOLO al montar
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setStep(parsed.step || 1);
          setSelectedDate(parsed.selectedDate ? new Date(parsed.selectedDate) : undefined);
          setSelectedTime(parsed.selectedTime || null);
          setSelectedPetId(parsed.selectedPetId || '');
          setSelectedPet(parsed.selectedPet || null);
          setUserData(parsed.userData || { name: '', petName: '', breedId: '', breedName: '', document_number: '', address: '' });
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // Limpiar confirmación cuando el usuario navega fuera de la página de confirmación
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Solo limpiar si no estamos en step 4 (pantalla de confirmación)
      if (step !== 4) {
        localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      }
    };

    const handlePopState = () => {
      // Limpiar confirmación cuando el usuario navega con botones del browser
      localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      // Limpiar confirmación al desmontar el componente
      if (step !== 4) {
        localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      }
    };
  }, [step]);
  
  useEffect(() => {
    const data = {
      step,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      selectedTime,
      selectedPetId,
      selectedPet,
      userData
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [step, selectedDate, selectedTime, selectedPetId, selectedPet, userData]);
  const clearLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearConfirmationData();
  };
  
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [professionalName, setProfessionalName] = useState('Por asignar');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  
  const mandatoryConditionalService = additionalServices.find(s => s.name === 'Baño antipulgas');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: servicesData } = await supabase.from('services').select('id, name, description, duration_minutes, price_by_breed, cleanup_duration_minutes, is_default');
      const defaultSrv = servicesData.find(s => s.is_default);
      setDefaultService(defaultSrv);
      setGroomingServices(servicesData.filter(s => !s.is_default));
      
      const { data: breedsData } = await supabase.from('breeds').select('*').order('name');
      setBreeds(breedsData || []);
      const { data: addServicesData } = await supabase.from('additional_services').select('*');
      setAdditionalServices(addServicesData || []);
      
      setLoading(false);
    };
    fetchData();
    
    if (user) {
      setUserData({ name: user.name, document_number: user.document_number || '', address: user.address || '' });
      const fetchUserPets = async () => {
          const { data } = await supabase.from('pets').select('*, breed:breeds(id, name), consent_signature, consent_signed_at').eq('owner_id', user.id);
          setUserPets(data || []);
      };
      fetchUserPets();
    }
  }, [user]);

  const getAvailableTimes = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    setAvailableTimes([]);

    try {
      // Use new custom slots system
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();

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

      if (slotsError) {
        console.error("Error fetching custom slots:", slotsError);
        setAvailableTimes([]);
        setLoadingSlots(false);
        return;
      }

      if (!customSlots || customSlots.length === 0) {
        setAvailableTimes([]);
        setLoadingSlots(false);
        return;
      }

      // Get existing appointments for the day
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('status', 'scheduled')
        .gte('appointment_time', `${formattedDate}T00:00:00.000Z`)
        .lte('appointment_time', `${formattedDate}T23:59:59.999Z`);

      const availableSlots = [];
      const now = new Date();

      console.log("Procesando franjas obtenidas:", customSlots.length);

      customSlots.forEach(slot => {
        // Count available professionals for this slot
        const availableProfessionalsCount = slot.custom_slot_availability.length;

        console.log(`Franja ${slot.start_time}: ${availableProfessionalsCount} profesionales asignados`, slot.custom_slot_availability);

        // Count existing appointments that overlap with this slot
        const slotStart = new Date(`${formattedDate}T${slot.start_time}`);
        const slotEnd = new Date(`${formattedDate}T${slot.end_time}`);

        const conflictingAppointments = appointments?.filter(apt => {
          const aptTime = new Date(apt.appointment_time);
          return aptTime >= slotStart && aptTime < slotEnd;
        }) || [];

        // Check if slot is available (at least 6 hours in the future and has capacity)
        const slotDateTime = new Date(`${formattedDate}T${slot.start_time}`);
        const minimumBookingTime = addHours(now, 6); // Mínimo 6 horas de anticipación
        const canBook = (
          slotDateTime >= minimumBookingTime && 
          conflictingAppointments.length < availableProfessionalsCount
        );

        if (canBook) {
          const slotData = {
            start_time: slot.start_time,
            end_time: slot.end_time,
            slot_id: slot.id,
            available_spots: availableProfessionalsCount - conflictingAppointments.length,
            total_professionals: availableProfessionalsCount
          };
          console.log(`Slot disponible agregado:`, slotData);
          availableSlots.push(slotData);
        } else {
          console.log(`Slot NO disponible: ${slot.start_time} - Futuro: ${slotDateTime > now}, Capacidad: ${conflictingAppointments.length}/${availableProfessionalsCount}`);
        }
      });

      setAvailableTimes(availableSlots);
    } catch (err) {
      console.error("Error in getAvailableTimes:", err);
      setAvailableTimes([]);
    }
    
    setLoadingSlots(false);
  }, []);



  const getAvailableTimesFallback = useCallback(async (date) => {
    const dayOfWeek = date.getDay();
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Get work schedules for the day with professional availability
    const { data: schedules, error: schedulesError } = await supabase
      .from('work_schedules')
      .select('*, professional_availability(professional_id)')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (schedulesError || !schedules?.length) {
      setAvailableTimes([]);
      return;
    }

    // Get existing appointments for the day
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, service:services(duration_minutes, cleanup_duration_minutes)')
      .eq('status', 'scheduled')
      .gte('appointment_time', `${formattedDate}T00:00:00.000Z`)
      .lte('appointment_time', `${formattedDate}T23:59:59.999Z`);

  const serviceDuration = 120; // Fixed 2 hours
  const totalDuration = serviceDuration;

    let availableSlots = [];

    // Count total professionals available across all schedules for this day
    const allAvailableProfessionals = new Set();
    schedules.forEach(schedule => {
      schedule.professional_availability?.forEach(pa => {
        allAvailableProfessionals.add(pa.professional_id);
      });
    });

    const maxConcurrentAppointments = Math.max(1, allAvailableProfessionals.size);

    schedules.forEach(schedule => {
      // Generate potential time slots for this schedule every 15 minutes
      let currentTime = parse(schedule.start_time, 'HH:mm:ss', new Date());
      const endTime = parse(schedule.end_time, 'HH:mm:ss', new Date());

      // Generar slots cada 15 minutos, pero verificar que quepa la cita completa (2 horas)
      while (addMinutes(currentTime, totalDuration) <= endTime) {
        const slotTime = format(currentTime, 'HH:mm');
        
        // Count existing appointments in this time slot (2 hours duration)
        const slotStart = new Date(date);
        slotStart.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
        const slotEnd = addMinutes(slotStart, totalDuration); // 2 horas completas
        
        const conflictingAppointments = appointments?.filter(apt => {
          const aptTime = new Date(apt.appointment_time);
          const aptDuration = (apt.service?.duration_minutes || 120) + (apt.service?.cleanup_duration_minutes || 30);
          const aptEndTime = addMinutes(aptTime, aptDuration);
          
          return (slotStart < aptEndTime && slotEnd > aptTime);
        }) || [];

        // Allow slot if there are fewer appointments than available professionals
        const canBook = conflictingAppointments.length < maxConcurrentAppointments;
        
        if (canBook) {
          // Check if slot is at least 6 hours in the future
          const slotDateTime = new Date(date);
          slotDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
          const minimumBookingTime = addHours(new Date(), 6); // Mínimo 6 horas de anticipación
          
          if (slotDateTime >= minimumBookingTime) {
            // Check if this slot is already added (to avoid duplicates from multiple schedules)
            const existingSlot = availableSlots.find(s => s.start_time === slotTime);
            if (!existingSlot) {
              // Crear franja de llegada de 15 minutos
              const arrivalEndTime = addMinutes(currentTime, 15);
              availableSlots.push({
                start_time: slotTime,
                end_time: format(addMinutes(currentTime, serviceDuration), 'HH:mm'), // Fin de la cita (2 horas después)
                arrival_window: `${slotTime} - ${format(arrivalEndTime, 'HH:mm')}`, // Ventana de llegada (15 min)
                service_duration: serviceDuration // Duración real del servicio
              });
            }
          }
        }
        
        // Avanzar cada 15 minutos para el siguiente slot
        currentTime = addMinutes(currentTime, 15);
      }
    });

    setAvailableTimes(availableSlots);
  }, []);

  // Función para obtener el nombre de un profesional
  const getProfessionalName = useCallback(async (professionalId) => {
    if (!professionalId) return 'Por asignar';
    
    const { data, error } = await supabase
      .from('professionals')
      .select('name')
      .eq('id', professionalId)
      .single();
    
    if (error || !data) return `ID: ${professionalId}`;
    return data.name;
  }, []);

  // Efecto para restaurar el nombre del profesional cuando se cargan datos de confirmación
  useEffect(() => {
    const restoreProfessionalName = async () => {
      if (appointmentDetails && appointmentDetails.assigned_professional_id && step === 4) {
        const profName = await getProfessionalName(appointmentDetails.assigned_professional_id);
        setProfessionalName(profName);
      }
    };
    
    restoreProfessionalName();
  }, [appointmentDetails, step, getProfessionalName]);

  // Función para encontrar un profesional disponible
  const findAvailableProfessional = useCallback(async (date, time) => {
    const dayOfWeek = date.getDay();
    const formattedDate = format(date, 'yyyy-MM-dd');

    console.log("Buscando profesional para:", { dayOfWeek, time, date: formattedDate });

    // Ensure time format is correct (time comes from DB as HH:MM:SS)
    const timeFormatted = time; // No need to modify, it already comes as HH:MM:SS from DB
    console.log("Tiempo recibido:", timeFormatted);

    // Find the specific custom time slot for this time
    const { data: customSlot, error: slotError } = await supabase
      .from('custom_time_slots')
      .select(`
        id,
        start_time,
        end_time,
        custom_slot_availability(
          professional_id,
          is_available
        )
      `)
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', timeFormatted)
      .eq('is_active', true)
      .single();

    if (slotError) {
      console.error("Error al buscar franja:", slotError);
      return null;
    }

    console.log("Franja encontrada:", customSlot);

    if (!customSlot || !customSlot.custom_slot_availability?.length) {
      console.error("No hay franja o no tiene profesionales asignados:", {
        hasSlot: !!customSlot,
        availabilityCount: customSlot?.custom_slot_availability?.length || 0
      });
      return null;
    }

    const slotStart = new Date(`${formattedDate}T${customSlot.start_time}`);
    const slotEnd = new Date(`${formattedDate}T${customSlot.end_time}`);

    // Get available professionals for this slot
    const availableProfessionals = customSlot.custom_slot_availability
      .filter(av => av.is_available)
      .map(av => av.professional_id);

    if (availableProfessionals.length === 0) return null;

    // Check which professionals are busy during this time slot
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('assigned_professional_id, appointment_time')
      .eq('status', 'scheduled')
      .gte('appointment_time', `${formattedDate}T00:00:00.000Z`)
      .lte('appointment_time', `${formattedDate}T23:59:59.999Z`)
      .not('assigned_professional_id', 'is', null);

    const busyProfessionals = new Set();
    existingAppointments?.forEach(apt => {
      const aptTime = new Date(apt.appointment_time);
      
      // Check if appointment overlaps with this slot
      if (aptTime >= slotStart && aptTime < slotEnd) {
        busyProfessionals.add(apt.assigned_professional_id);
      }
    });

    console.log("Profesionales disponibles:", availableProfessionals);
    console.log("Profesionales ocupados:", Array.from(busyProfessionals));

    // Return first available professional
    for (const professionalId of availableProfessionals) {
      if (!busyProfessionals.has(professionalId)) {
        console.log("Profesional asignado:", professionalId);
        return professionalId;
      }
    }

    console.log("No hay profesionales libres en esta franja");
    return null; // No professional available
  }, []);

  useEffect(() => {
    if (selectedDate) {
      getAvailableTimes(selectedDate);
    }
  }, [selectedDate, getAvailableTimes]);

  // Cargar cita original en modo reagendado
  useEffect(() => {
    const fetchOriginalAppointment = async () => {
      if (rescheduleId) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, service:services(*), pet:pets(name, owner_id), owner:profiles(name)')
          .eq('id', rescheduleId)
          .single();
        
        if (error) {
          toast({
            title: "Error",
            description: "No se pudo cargar la cita original",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        if (data) {
          setOriginalAppointment(data);
          setSelectedPetId(data.pet_id);
          setStep(2); // Ir directamente a selección de fecha/hora
          
          // Cargar nombre del profesional actual si existe
          if (data.assigned_professional_id) {
            const profName = await getProfessionalName(data.assigned_professional_id);
            setProfessionalName(profName);
          }
          
          toast({
            title: "Reagendando cita",
            description: `Reagendando: ${data.pet?.name} - ${data.service?.name}`,
            duration: 3000
          });
        }
      }
    };
    
    fetchOriginalAppointment();
  }, [rescheduleId, navigate]);
  
  useEffect(() => {
    const pet = userPets.find(p => p.id === selectedPetId);
    setSelectedPet(pet || null);
    const breedId = pet?.breed?.id || userData.breedId;
    if(breedId && defaultService?.price_by_breed) {
        supabase.from('breed_style_prices').select('price, style:haircut_styles(id, name)').eq('breed_id', breedId).then(({data}) => setHaircutStyles(data || []));
    } else { setHaircutStyles([]); }
  }, [userData.breedId, defaultService, selectedPetId, userPets]);

  const handleGoToConfirmation = () => {
    if (user?.is_in_clinton_list) {
      const message = `¡Hola! Soy ${user.name}, estoy en la Lista Negra y me gustaría agendar una cita.`;
      window.open(`https://wa.me/573012635719?text=${encodeURIComponent(message)}`, '_blank');
      toast({ title: "Agendamiento especial", description: "Estás en nuestra Lista Negra. Te hemos redirigido a WhatsApp para agendar tu cita.", duration: 7000 });
      return;
    }

    const currentPet = selectedPet || { name: userData.petName, breed: { name: breeds.find(b => b.id === userData.breedId)?.name } };
    setUserData(prev => ({
        ...prev,
        petName: currentPet.name,
        breedName: currentPet.breed?.name,
    }));
    
    if (!selectedPetId && !userData.petName) return;
    if (selectedPet && selectedPet.species === 'Gato') {
      const message = `¡Hola! Me gustaría agendar una cita de peluquería para mi gato, ${selectedPet.name}.`;
      window.open(`https://wa.me/573012635719?text=${encodeURIComponent(message)}`, '_blank');
      toast({ title: "Agendamiento para Gatos", description: "Te hemos redirigido a WhatsApp para una atención especializada.", duration: 7000 });
      return;
    }

    if (selectedPet && !selectedPet.consent_signed_at) {
        setIsConsentModalOpen(true);
    } else if (!selectedPetId) { // New pet
        setIsConsentModalOpen(true);
    } else {
        handleBooking();
    }
  };

  const handleBooking = async (signature) => {
    setLoading(true);
    if (isConsentModalOpen) setIsConsentModalOpen(false);
    
    let petId = selectedPetId;

    if (!petId) {
        const { data: petData, error: petError } = await supabase.from('pets')
          .insert({ owner_id: user.id, name: userData.petName, breed_id: userData.breedId || null, species: 'Perro', consent_signature: signature, consent_signed_at: signature ? new Date().toISOString() : null })
          .select().single();
        if (petError) { toast({ title: "Error creando mascota", description: petError.message, variant: "destructive" }); setLoading(false); return; }
        petId = petData.id;
    } else if (signature) {
         const { error: consentError } = await supabase.from('pets').update({
            consent_signature: signature,
            consent_signed_at: new Date().toISOString(),
         }).eq('id', petId);
        if (consentError) { toast({ title: "Error al guardar consentimiento", variant: "destructive" }); setLoading(false); return; }
    }

    const appointmentTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    appointmentTime.setHours(hours, minutes, 0, 0);

    // Asignar profesional disponible
    const assignedProfessional = await findAvailableProfessional(selectedDate, selectedTime);
    
    if (!assignedProfessional) {
      console.error("Error: No se encontró profesional disponible", {
        date: selectedDate,
        time: selectedTime,
        dayOfWeek: selectedDate.getDay()
      });
      toast({ 
        title: "Error de configuración", 
        description: "Esta franja horaria no tiene profesionales asignados. Por favor contacta al administrador o selecciona otro horario.",
        variant: "destructive" 
      }); 
      setLoading(false); 
      return;
    }

    let appointment, appError;
    
    if (isRescheduleMode && originalAppointment) {
      // Actualizar cita existente (reagendado)
      const { data, error } = await supabase
        .from('appointments')
        .update({
          appointment_time: appointmentTime.toISOString(),
          assigned_professional_id: assignedProfessional
        })
        .eq('id', originalAppointment.id)
        .select('*, service:services(*), pet:pets(name, photo_url, breed:breeds(name)), owner:profiles(name)')
        .single();
      
      appointment = data;
      appError = error;
    } else {
      // Crear nueva cita
      const { data, error } = await supabase.from('appointments').insert({
        owner_id: user.id, pet_id: petId, service_id: defaultService.id,
        appointment_time: appointmentTime.toISOString(), status: 'scheduled',
        assigned_professional_id: assignedProfessional
      }).select('*, service:services(*), pet:pets(name, photo_url, breed:breeds(name)), owner:profiles(name)').single();
      
      appointment = data;
      appError = error;
    }
    
    if (appError) { 
        toast({ title: isRescheduleMode ? "Error al reagendar" : "Error al agendar", description: appError.message, variant: "destructive" }); 
        setLoading(false); 
    } else { 
        setAppointmentDetails(appointment);
        
        // Asignar puntos automáticamente solo para citas nuevas (no reagendamiento)
        if (!isRescheduleMode) {
          const pointsResult = await assignAppointmentPoints(user.id);
          if (!pointsResult.success) {
            console.error('Error assigning appointment points:', pointsResult.error);
            // No mostramos error al usuario, los puntos son secundarios
          }
        }
        
        // Obtener nombre del profesional asignado
        const profName = await getProfessionalName(assignedProfessional);
        setProfessionalName(profName); 
        if (isRescheduleMode) {
          toast({ 
            title: "Cita reagendada exitosamente", 
            description: "Tu cita ha sido reagendada correctamente",
            duration: 3000 
          });
          // Redirigir de vuelta después de un breve delay
          setTimeout(() => {
            if (returnTo) {
              if (returnTo.includes('check-appointment') && phoneNumber) {
                navigate(`${returnTo}?phone=${phoneNumber}`);
              } else {
                navigate(returnTo);
              }
            } else {
              navigate('/dashboard/appointments');
            }
          }, 2000);
        }
        setStep(4); 
        
        // Persistir la confirmación para que no se pierda al salir/volver
        saveConfirmationData(appointment, 4);
        
        setLoading(false); 
    }
  };

  const timeToAmPm = (time) => { if (!time) return ''; const [hours, minutes] = time.split(':'); const date = new Date(); date.setHours(hours, minutes); return format(date, 'hh:mm a'); };
  
  const timeToMinutes = (time) => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; };
  
  const minutesToTime = (totalMinutes) => { const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60; return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; };
  const handleDownloadPdf = async () => {
    try {
      // Validar que appointmentDetails existe
      if (!appointmentDetails) {
        toast({
          title: "Error",
          description: "No se encontraron los detalles de la cita para generar el PDF",
          variant: "destructive"
        });
        return;
      }

      const doc = new jsPDF();
      
      // Obtener logo y datos de la empresa
      let companyLogo = null;
      let companyName = "4HUELLITAS";
      let companyPhone = "+57 301 263 5719";
      let companyAddress = "Cra. 22c #57DD-43";
      
      try {
        const { data: companyData } = await supabase
          .from('company_info')
          .select('logo, name, phone, address')
          .maybeSingle();
        
        if (companyData?.logo) companyLogo = companyData.logo;
        if (companyData?.name) companyName = companyData.name;
        if (companyData?.phone) companyPhone = companyData.phone;
        if (companyData?.address) companyAddress = companyData.address;
      } catch (error) {
        console.log('No se pudo obtener la información de la empresa:', error);
      }
      
      // Configuración de colores
      const primaryColor = [3, 120, 166]; // #0378A6
      const secondaryColor = [242, 101, 19]; // #F26513
      const successColor = [34, 197, 94]; // green-500
      const grayColor = [107, 114, 128];
      const darkGray = [55, 65, 81];
      
      // Header con gradiente
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Agregar logo si está disponible
      if (companyLogo) {
        try {
          doc.addImage(companyLogo, 'PNG', 15, 10, 30, 30);
        } catch (logoError) {
          console.log('Error agregando logo al PDF:', logoError);
        }
      }
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text("CONFIRMACION DE CITA", companyLogo ? 55 : 105, 25, { align: companyLogo ? 'left' : 'center' });
      doc.setFontSize(14);
      doc.text(companyName, companyLogo ? 55 : 105, 35, { align: companyLogo ? 'left' : 'center' });
      doc.setFontSize(12);
      doc.text("Centro Veterinario Integral", companyLogo ? 55 : 105, 42, { align: companyLogo ? 'left' : 'center' });
      
      // Información principal de la cita
      let yPos = 65;
      doc.setTextColor(...darkGray);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text("CITA CONFIRMADA", 105, yPos, { align: 'center' });
      
      // Línea decorativa
      yPos += 8;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(2);
      doc.line(50, yPos, 160, yPos);
      
      // Detalles de la cita en recuadros
      yPos += 15;
      
      // Recuadro de información principal
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPos, 180, 60, 5, 5, 'F');
      doc.setDrawColor(...grayColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, 180, 60, 5, 5, 'S');
      
      // Contenido del recuadro
      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("DETALLES DE LA CITA", 25, yPos + 15);
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      // Información en dos columnas
      doc.setFont(undefined, 'bold');
      doc.text("Servicio:", 25, yPos + 25);
      doc.setFont(undefined, 'normal');
      const serviceName = (appointmentDetails.service?.name || 'Peluqueria Canina')
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/ñ/g, 'n');
      doc.text(serviceName, 25, yPos + 32);
      
      doc.setFont(undefined, 'bold');
      doc.text("Mascota:", 25, yPos + 42);
      doc.setFont(undefined, 'normal');
      doc.text(appointmentDetails.pet?.name || 'N/A', 25, yPos + 49);
      
      doc.setFont(undefined, 'bold');
      doc.text("Fecha:", 110, yPos + 25);
      doc.setFont(undefined, 'normal');
      const dateText = format(new Date(appointmentDetails.appointment_time), "d 'de' MMMM, yyyy", { locale: es })
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/ñ/g, 'n');
      doc.text(dateText, 110, yPos + 32);
      
      doc.setFont(undefined, 'bold');
      doc.text("Hora:", 110, yPos + 42);
      doc.setFont(undefined, 'normal');
      doc.text(format(new Date(appointmentDetails.appointment_time), "h:mm a"), 110, yPos + 49);
      
      // Información del profesional
      yPos += 65;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(15, yPos, 180, 25, 5, 5, 'F');
      doc.setDrawColor(...grayColor);
      doc.roundedRect(15, yPos, 180, 25, 5, 5, 'S');
      
      doc.setTextColor(...successColor);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("PROFESIONAL ASIGNADO", 25, yPos + 12);
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Dr(a). ${professionalName}`, 25, yPos + 20);
      
      // Información importante con QR incluido
      yPos += 30;
      const importantBoxHeight = 55; // Altura aumentada para acomodar QR
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(15, yPos, 180, importantBoxHeight, 5, 5, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(15, yPos, 180, importantBoxHeight, 5, 5, 'S');
      
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("INFORMACION IMPORTANTE", 25, yPos + 12);
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const importantText = "- El pago se realiza directamente en la tienda\n- Los precios pueden variar segun el estado del pelaje\n- Por favor llegar 10 minutos antes de la cita\n- Traer carnet de vacunas actualizado";
      const splitImportantText = doc.splitTextToSize(importantText, 110); // Ancho reducido para dar espacio al QR
      doc.text(splitImportantText, 25, yPos + 22);
      
      // QR Code con información de la cita - Lado derecho del cuadro
      try {
        const qrSize = 32;
        const qrX = 155; // Posición X del QR (lado derecho)
        const qrY = yPos + 10; // Posición Y del QR
        
        // Generar información de la cita para el QR (solo texto, sin enlace)
        const appointmentInfo = `Cita 4Huellitas
ID: ${appointmentDetails.id?.substring(0, 8) || 'N/A'}
Mascota: ${appointmentDetails.pet?.name || 'N/A'}
Fecha: ${format(new Date(appointmentDetails.appointment_time), "d/MM/yyyy")}
Hora: ${format(new Date(appointmentDetails.appointment_time), "HH:mm")}
Servicio: ${appointmentDetails.service?.name || 'N/A'}`;
        
        // Generar QR code con información de la cita
        const qrDataUrl = await QRCode.toDataURL(appointmentInfo, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Agregar la imagen QR al PDF
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Texto descriptivo del QR
        doc.setTextColor(...grayColor);
        doc.setFontSize(6);
        doc.text("Información", qrX + 2, qrY + qrSize + 4);
        doc.text("de tu cita", qrX + 4, qrY + qrSize + 8);
        
      } catch (error) {
        // Fallback si falla la generación del QR
        const qrSize = 32;
        const qrX = 155;
        const qrY = yPos + 10;
        
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, 'F');
        doc.setDrawColor(...grayColor);
        doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, 'S');
        
        doc.setTextColor(...grayColor);
        doc.setFontSize(7);
        doc.text("QR Cita", qrX + 8, qrY + 18);
        console.error('Error generando QR:', error);
      }
      
      // Actualizar yPos con la nueva altura del cuadro
      yPos += importantBoxHeight;
      
      // Sección eliminada - QR ahora va dentro del cuadro de información importante
      
      // Footer con franja de información de contacto
      const pageHeight = doc.internal.pageSize.height;
      const footerHeight = 35;
      const footerY = pageHeight - footerHeight;
      
      // Franja de fondo para el footer
      doc.setFillColor(239, 246, 255);
      doc.rect(0, footerY, 210, footerHeight, 'F');
      
      // Línea superior del footer
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(0, footerY, 210, footerY);
      
      // Título de información de contacto
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("INFORMACION DE CONTACTO", 15, footerY + 10);
      
      // Información de contacto en el footer
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      // Primera línea de contacto
      doc.text(`Direccion: ${companyAddress}`, 15, footerY + 18);
      doc.text(`Telefono: ${companyPhone}`, 110, footerY + 18);
      
      // Segunda línea de contacto
      doc.text("Sitio web: www.4huellitas.com", 15, footerY + 25);
      doc.text("Email: contacto@4huellitas.com", 110, footerY + 25);
      
      // Información del documento en la parte inferior
      doc.setTextColor(...grayColor);
      doc.setFontSize(7);
      doc.text("Documento generado automáticamente", 15, footerY + 32);
      doc.text(`Fecha: ${format(new Date(), "d/MM/yyyy HH:mm", { locale: es })}`, 105, footerY + 32, { align: 'center' });
      doc.text(`ID: ${appointmentDetails.id?.substring(0, 8) || 'N/A'}`, 195, footerY + 32, { align: 'right' });
      
      // Abrir PDF en nueva pestaña
      const fileName = `cita_${companyName.replace(/\s+/g, '_')}_${format(new Date(appointmentDetails.appointment_time), 'yyyy_MM_dd_HH_mm')}.pdf`;
      
      // Crear blob URL y abrir en nueva pestaña
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (newWindow) {
        // Limpiar el URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 10000);
      }
      
      toast({
        title: "PDF Generado",
        description: "Tu confirmación de cita se ha abierto en una nueva pestaña.",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };
  const handleShareWhatsApp = () => { 
    // Validar que appointmentDetails exista
    if (!appointmentDetails) {
      toast({
        title: "Error",
        description: "No hay información de cita disponible para compartir.",
        variant: "destructive"
      });
      return;
    }
    
    const petName = appointmentDetails.pet?.name || 'N/A'; 
    const serviceName = appointmentDetails.service?.name || 'N/A'; 
    
    // Validar que appointment_time exista
    if (!appointmentDetails.appointment_time) {
      toast({
        title: "Error",
        description: "La información de la cita está incompleta.",
        variant: "destructive"
      });
      return;
    }
    
    const date = format(new Date(appointmentDetails.appointment_time), "eeee, d 'de' MMMM", { locale: es }); 
    const time = format(new Date(appointmentDetails.appointment_time), "h:mm a"); 
    const message = `¡Hola! Te confirmo tu cita en 4huellitas para ${petName}:\n\n*Servicio:* ${serviceName}\n*Fecha:* ${date}\n*Hora:* ${time}\n\n📍 *Dirección:* Carrera 22C no° 57DD-43\n📞 *Teléfono:* +57 301 263 5719\n\nRecuerda que los precios y servicios adicionales se confirman en tienda. ¡Te esperamos!`; 
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`; 
    window.open(whatsappUrl, '_blank'); 
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Inicia sesión para continuar</h1>
          <p className="text-gray-600">Debes tener una cuenta para agendar una cita.</p>
          <Button onClick={() => navigate('/login')} className="mt-4">Ir a Iniciar Sesión</Button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1: return ( <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}> <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2 text-center">Nuestros Servicios de Peluquería</h1> <p className="text-center text-gray-600 mb-6">Estos son nuestros servicios principales. La cita se agendará para una 'Peluquería Canina' general.</p> <div className="space-y-4"> {groomingServices.map(service => ( <div key={service.id} className="p-6 bg-white rounded-2xl shadow-md border-2 border-transparent"> <div className="flex items-center gap-4"> <Dog className="w-8 h-8 text-[#0378A6]" /> <div> <h3 className="font-bold text-lg font-subheading">{service.name}</h3> <p className="text-gray-600 text-sm">{service.description}</p> </div> </div> </div> ))} </div> <div className="text-center mt-8"> <Button onClick={() => setStep(2)} className="h-12 px-8 text-lg">Agendar una Cita</Button> </div> </motion.div> );
      case 2: return ( <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}> <h1 className="text-3xl font-bold font-heading text-gray-800 mb-6 text-center">Elige Fecha y Hora</h1> <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 bg-white p-6 rounded-2xl shadow-md"> <div className="lg:col-span-3 flex justify-center"> <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={es} disabled={(date) => date < startOfDay(new Date())} /> </div> <AnimatePresence> {selectedDate && ( <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}> <h3 className="font-semibold text-center mb-4 text-lg font-subheading">Horarios Disponibles</h3> {loadingSlots ? <div className="flex justify-center pt-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div> : availableTimes.length > 0 ? ( <div className="grid grid-cols-1 gap-3"> {availableTimes.map(slot => ( 
                          <Button 
                            key={slot.start_time} 
                            variant={selectedTime === slot.start_time ? 'default' : 'outline'} 
                            onClick={() => setSelectedTime(slot.start_time)} 
                            className="h-16 text-sm flex flex-col justify-center items-center p-3 space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 opacity-70" />
                              <span className="font-bold text-lg">
                                {timeToAmPm(slot.start_time)}
                              </span>
                            </div>
                            <div className="text-xs opacity-70">
                              {timeToAmPm(slot.start_time)} a {timeToAmPm(slot.end_time)}
                            </div>
                            {slot.available_spots && (
                              <div className="text-xs opacity-60">
                                {slot.available_spots} cupo{slot.available_spots !== 1 ? 's' : ''} disponible{slot.available_spots !== 1 ? 's' : ''}
                              </div>
                            )}
                          </Button> 
                        ))} </div> ) : <p className="text-center text-sm text-gray-500 pt-8">No hay horarios disponibles para este día.</p> } </motion.div> )} </AnimatePresence> </div> {selectedTime && user && ( <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center"> <Button onClick={() => setStep(3)} className="h-12 px-8 text-lg">Continuar</Button> </motion.div> )} </motion.div> );
      case 3: return ( <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}> <h1 className="text-3xl font-bold font-heading text-gray-800 mb-6 text-center">Confirma los Datos de tu Cita</h1> {user?.is_in_clinton_list && ( <Alert variant="destructive" className="mb-6"> <UserX className="h-4 w-4" /> <AlertTitle>Estás en la Lista Negra</AlertTitle> <AlertDescription> Para agendar una cita, por favor contáctanos directamente por WhatsApp. </AlertDescription> </Alert> )} {mandatoryConditionalService && ( <Alert className="mb-6 border-yellow-400 text-yellow-800 bg-yellow-50"> <AlertTriangle className="h-4 w-4 !text-yellow-500" /> <AlertTitle className="font-bold">{mandatoryConditionalService.name}</AlertTitle> <AlertDescription> Servicio obligatorio de ser necesario. Su costo se confirmará en tienda. </AlertDescription> </Alert> )} <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-4 bg-white p-6 rounded-2xl shadow-md"> <h3 className="font-bold text-lg border-b pb-2">Detalles de la Mascota</h3> {(userPets.length > 0) ? ( <div className="space-y-1"> <Label className="font-subheading">Mascota</Label> <Select onValueChange={value => setSelectedPetId(value)} value={selectedPetId}> <SelectTrigger><SelectValue placeholder="Selecciona tu mascota..." /></SelectTrigger> <SelectContent>{userPets.map(pet => <SelectItem key={pet.id} value={pet.id}>{pet.name} ({pet.species})</SelectItem>)}</SelectContent> </Select> <Button variant="link" className="p-0 h-auto text-sm" onClick={() => { setSelectedPetId(''); setUserData(prev => ({...prev, petName: '', breedId: ''}))}}>O añadir una nueva mascota</Button> </div> ) : null } { selectedPetId === '' && (<div className="space-y-4 mt-4 pt-4 border-t"><div className="space-y-1"><Label className="font-subheading">Nombre de la Nueva Mascota</Label><Input value={userData.petName} onChange={e => setUserData({...userData, petName: e.target.value})} /></div><div className="space-y-1"><Label className="font-subheading">Raza</Label><Select onValueChange={value => setUserData({...userData, breedId: value})}><SelectTrigger><SelectValue placeholder="Selecciona una raza..." /></SelectTrigger><SelectContent>{breeds.map(breed => <SelectItem key={breed.id} value={breed.id}>{breed.name}</SelectItem>)}</SelectContent></Select></div></div>)} </div> <div className="space-y-4 bg-white p-6 rounded-2xl shadow-md"> <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#F26513]" /> Personaliza tu Servicio</h3> {defaultService && ( <div className="mb-4 p-3 bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 rounded-lg border border-[#0378A6]/20"> <div className="flex items-center justify-between"> <span className="font-medium text-gray-800">{defaultService.name}</span> <span className="text-lg font-bold text-[#0378A6]"> {defaultService.price_by_breed ? 'Según raza y estilo' : `$${defaultService.base_price?.toLocaleString() || 'Consultar'}`} </span> </div> <p className="text-xs text-gray-600 mt-1">Servicio base - El precio final se confirma en tienda</p> </div> )} {defaultService?.price_by_breed && haircutStyles.length > 0 && ( <div className="space-y-2"> <Label className="font-subheading">Estilos de Corte Disponibles (Informativo)</Label> <Alert variant="default" className="text-sm mb-2"><AlertDescription>El estilo y precio final se confirman en tienda.</AlertDescription></Alert> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"> {haircutStyles.map(stylePrice => ( <div key={stylePrice.style.id} className="flex flex-col h-auto text-center py-3 px-3 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 transition-colors"> <span className="font-medium text-gray-800 mb-1">{stylePrice.style.name}</span> <span className="text-sm font-bold text-[#0378A6]">${stylePrice.price?.toLocaleString() || 'Consultar'}</span> </div> ))} </div> </div> )} {additionalServices.filter(s => !s.is_mandatory_conditional).length > 0 && ( <div className="space-y-2"> <Label className="font-subheading">Servicios Adicionales (Informativo)</Label> <Alert variant="default" className="mt-2 text-sm"><AlertDescription>Su necesidad y costo se confirmarán en la tienda.</AlertDescription></Alert> </div> )} </div> </div> <Button onClick={handleGoToConfirmation} disabled={loading || (!selectedPetId && (!userData.petName || !userData.breedId)) } className="w-full mt-6 h-12 text-lg bg-[#F26513] hover:bg-[#F26513]/90">{loading ? 'Confirmando...' : 'Confirmar y Agendar'}</Button> </motion.div> );
      case 4: return ( 
        <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Celebración header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold font-heading text-green-600 mb-2">
              {isRescheduleMode ? '¡Cita Reagendada!' : '¡Cita Confirmada!'}
            </h1>
            <p className="text-gray-600">Tu cita ha sido registrada exitosamente</p>
          </div>

          {/* Ticket de cita mejorado */}
          <div id="appointment-ticket" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-6">
            <div className="text-center mb-6">
              <img 
                alt={appointmentDetails?.pet?.name || 'Foto de mascota'} 
                src={appointmentDetails?.pet?.photo_url || '/pet-placeholder.svg'} 
                className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-gradient-to-r from-[#0378A6] to-[#F26513] shadow-lg"
              />
              <h2 className="font-bold text-2xl mt-4 bg-gradient-to-r from-[#0378A6] to-[#F26513] bg-clip-text text-transparent">
                {appointmentDetails?.service?.name || 'Peluquería Canina'}
              </h2>
            </div>
            
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Dog className="w-5 h-5 text-[#0378A6]" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Mascota</span>
                        <p className="font-semibold text-gray-800">{appointmentDetails?.pet?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-[#F26513]" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fecha</span>
                        <p className="font-semibold text-gray-800">
                          {appointmentDetails?.appointment_time ? format(new Date(appointmentDetails.appointment_time), "eeee, d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Hora</span>
                        <p className="font-semibold text-gray-800">
                          {appointmentDetails?.appointment_time ? format(new Date(appointmentDetails.appointment_time), "h:mm a") : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Profesional</span>
                        <p className="font-semibold text-purple-700">{professionalName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 !text-amber-600" />
                  <AlertTitle className="text-amber-800">¡Importante!</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    El pago y el costo final se determinan en la tienda. Los servicios adicionales o estilos específicos pueden aplicar cargos extra.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Button onClick={handleDownloadPdf} variant="outline" className="h-12 text-lg bg-white hover:bg-gray-50 border-2 border-[#0378A6] text-[#0378A6] hover:text-[#0378A6]">
                  <Download className="w-5 h-5 mr-2" /> 
                  Descargar PDF
                </Button>
                <Button onClick={handleShareWhatsApp} className="h-12 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  <Share2 className="w-5 h-5 mr-2" /> 
                  Compartir por WhatsApp
                </Button>
                <Button 
                  onClick={() => {
                    // Marcar que el usuario cerró la confirmación
                    markConfirmationAsDismissed();
                    
                    // Limpiar datos de confirmación y localStorage INMEDIATAMENTE
                    clearConfirmationData();
                    clearLocalStorage();
                    
                    // Resetear todos los estados a sus valores iniciales
                    setAppointmentDetails(null);
                    setStep(1);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setSelectedPetId('');
                    setSelectedPet(null);
                    setUserData({ 
                      name: user?.name || '', 
                      petName: '', 
                      breedId: '', 
                      breedName: '', 
                      document_number: user?.document_number || '', 
                      address: user?.address || '' 
                    });
                    setAvailableTimes([]);
                    
                    // Navegar con parámetro 'fresh' para indicar inicio limpio
                    navigate('/dashboard/appointments/new?fresh=true', { replace: true });
                  }}
                  className="h-12 text-lg bg-gradient-to-r from-[#F26513] to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  <CalendarIcon className="w-5 h-5 mr-2" /> 
                  Agendar Nueva Cita
                </Button>
              </div>

              {/* Sección de redes sociales mejorada */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-[#0378A6]/5 to-[#F26513]/5 p-6 rounded-2xl border border-gray-200"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <Heart className="w-6 h-6 text-red-500" />
                    ¡Comparte tu experiencia!
                  </h3>
                  <p className="text-gray-600">
                    Ayúdanos a llegar a más familias peludas calificándonos en nuestras redes sociales
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {/* Facebook */}
                  <motion.a
                    href="https://www.facebook.com/share/1FpzQyVFjT/"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                  >
                    <Facebook className="w-5 h-5" />
                    Calíficanos en Facebook
                  </motion.a>

                  {/* Instagram */}
                  <motion.a
                    href="https://www.instagram.com/4.huellitas/"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                  >
                    <Instagram className="w-5 h-5" />
                    Síguenos en Instagram
                  </motion.a>

                  {/* Google Reviews */}
                  <motion.a
                    href="https://share.google/OrMocWscIsrCHkgr0"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                  >
                    <Star className="w-5 h-5" />
                    Reseña en Google
                  </motion.a>
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full">
                    <Sparkles className="w-4 h-4 text-[#F26513]" />
                    Tu opinión nos ayuda a mejorar cada día
                  </div>
                </div>
              </motion.div>
        </motion.div> 
      );
      default: return null;
    }
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0378A6]/10 to-[#F26513]/10 flex flex-col items-center justify-center p-4 pb-32">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          {step > 1 && step !== 4 && <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}><ArrowLeft /></Button>}
          {step === 1 && <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft /></Button>}
          {step === 4 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                // Marcar que el usuario cerró manualmente la confirmación
                markConfirmationAsDismissed();
                clearLocalStorage();
                navigate('/dashboard');
              }}
              title="Salir de la confirmación"
            >
              <ArrowLeft />
            </Button>
          )}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div className="bg-gradient-to-r from-[#0378A6] to-[#F26513] h-2.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      <ConsentModal isOpen={isConsentModalOpen} onConfirm={handleBooking} loading={loading} userData={{...userData, name: user?.name, phone: user?.phone}} setUserData={setUserData} />
    </div>
  );
};

export default AppointmentPage;