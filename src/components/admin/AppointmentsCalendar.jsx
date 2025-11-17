import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, addHours, addMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Dog, User, Scissors, Sparkles, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusConfig = {
    scheduled: { label: 'Programada', color: 'border-blue-500', bg: 'bg-blue-50', icon: <CalendarIcon className="w-4 h-4 text-blue-500" /> },
    completed: { label: 'Completada', color: 'border-green-500', bg: 'bg-green-50', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    cancelled: { label: 'Cancelada', color: 'border-red-500', bg: 'bg-red-50', icon: <XCircle className="w-4 h-4 text-red-500" /> },
    no_show: { label: 'No Asistió', color: 'border-gray-600', bg: 'bg-gray-100', icon: <AlertTriangle className="w-4 h-4 text-gray-600" /> }
};

const AppointmentsCalendar = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [refreshKey, setRefreshKey] = useState(0);

    // Helper function to format time properly
    const formatTimeRange = (appointmentDate, endDate) => {
        try {
            const startHour = appointmentDate.getHours();
            const startMin = appointmentDate.getMinutes();
            const arrivalEndMin = startMin + 15;
            const arrivalEndHour = startHour + Math.floor(arrivalEndMin / 60);
            const finalArrivalMin = arrivalEndMin % 60;
            
            const endHour = endDate.getHours();
            const endMin = endDate.getMinutes();
            
            const formatHour = (h, m) => {
                const period = h >= 12 ? 'PM' : 'AM';
                const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                return `${displayHour}:${m.toString().padStart(2, '0')}${period}`;
            };
            
            return `${formatHour(startHour, startMin)} - ${formatHour(arrivalEndHour, finalArrivalMin)} hasta ${formatHour(endHour, endMin)}`;
        } catch (error) {
            return format(appointmentDate, 'HH:mm') + ' - ' + format(endDate, 'HH:mm');
        }
    };

    const fetchAppointments = useCallback(async (month) => {
        setLoading(true);
        try {
            const startDate = startOfMonth(month);
            const endDate = endOfMonth(month);

            console.log('Fetching appointments for calendar from', startDate.toISOString(), 'to', endDate.toISOString());

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    owner:profiles!appointments_owner_id_fkey(name),
                    pet:pets!appointments_pet_id_fkey(name),
                    service:services!appointments_service_id_fkey(name, duration_minutes)
                `)
                .gte('appointment_time', startDate.toISOString())
                .lte('appointment_time', endDate.toISOString())
                .order('appointment_time', { ascending: true });

            if (error) {
                console.error('Error fetching appointments:', error);
                toast({ 
                    title: "Error", 
                    description: `No se pudieron cargar las citas: ${error.message}`, 
                    variant: "destructive" 
                });
                setAppointments([]);
            } else {
                console.log('Appointments fetched for calendar:', data);
                const processedAppointments = (data || []).map(app => ({
                    ...app, 
                    date: new Date(app.appointment_time)
                }));
                setAppointments(processedAppointments);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            toast({ 
                title: "Error", 
                description: "Error inesperado al cargar las citas.", 
                variant: "destructive" 
            });
            setAppointments([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAppointments(currentMonth);
    }, [fetchAppointments, currentMonth, refreshKey]);

    // Función para refrescar manualmente
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast({ title: "Actualizando", description: "Refrescando calendario..." });
    };

    // Auto-refresh cada 30 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAppointments(currentMonth);
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [fetchAppointments, currentMonth]);
    
    const getAppointmentsForDay = (day) => {
        if (!day) return [];
        return appointments.filter(app => isSameDay(app.date, day));
    }
    
    const selectedDayAppointments = useMemo(() => getAppointmentsForDay(selectedDate), [selectedDate, appointments]);
    
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col xl:flex-row gap-6 h-full"
        >
            <Card className="flex-grow xl:w-2/3 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                <ChevronLeft className="w-5 h-5"/>
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleRefresh}
                                className="text-[#0378A6] hover:bg-[#0378A6]/10"
                                title="Refrescar calendario"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                            </Button>
                        </div>
                        <CardTitle className="text-xl capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="w-5 h-5"/>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 text-center font-semibold text-gray-500 text-sm border-b">
                        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {calendarDays.map(day => {
                            const dailyAppointments = getAppointmentsForDay(day);
                            return (
                                <div 
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "h-32 border-b border-r p-1.5 cursor-pointer hover:bg-sky-50 transition-colors",
                                        format(day, 'MM') !== format(currentMonth, 'MM') && 'bg-gray-50 text-gray-400',
                                        isSameDay(day, new Date()) && 'relative',
                                        isSameDay(day, selectedDate) && 'bg-[#0378A6]/10 ring-2 ring-[#0378A6]'
                                    )}
                                >
                                    <span className={cn("text-sm", isSameDay(day, new Date()) && 'text-white bg-[#F26513] rounded-full w-6 h-6 flex items-center justify-center font-bold')}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="mt-1 space-y-1 overflow-y-auto max-h-20 text-xs">
                                        {dailyAppointments.map(app => {
                                            const statusInfo = statusConfig[app.status] || statusConfig.scheduled;
                                            let bgColor, textColor, borderColor;
                                            
                                            switch(app.status) {
                                                case 'scheduled':
                                                    bgColor = 'bg-blue-500';
                                                    textColor = 'text-white';
                                                    borderColor = 'border-l-blue-600';
                                                    break;
                                                case 'completed':
                                                    bgColor = 'bg-green-500';
                                                    textColor = 'text-white';
                                                    borderColor = 'border-l-green-600';
                                                    break;
                                                case 'cancelled':
                                                    bgColor = 'bg-red-500';
                                                    textColor = 'text-white';
                                                    borderColor = 'border-l-red-600';
                                                    break;
                                                case 'no_show':
                                                    bgColor = 'bg-gray-600';
                                                    textColor = 'text-white';
                                                    borderColor = 'border-l-gray-700';
                                                    break;
                                                default:
                                                    bgColor = 'bg-blue-500';
                                                    textColor = 'text-white';
                                                    borderColor = 'border-l-blue-600';
                                            }
                                            
                                            return (
                                                <div 
                                                    key={app.id} 
                                                    className={cn(
                                                        "p-1 rounded-sm flex items-center gap-1 text-[10px] font-medium border-l-2 shadow-sm",
                                                        bgColor,
                                                        textColor,
                                                        borderColor
                                                    )}
                                                    title={`${app.pet?.name} | ${formatTimeRange(app.date, addHours(app.date, 2))} | ${statusInfo.label}`}
                                                >
                                                    <div className="flex items-center gap-1 w-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0"></span>
                                                        <p className="font-semibold truncate flex-1">{app.pet?.name || 'N/A'}</p>
                                                        <span className="text-[9px] opacity-75">{format(app.date, 'h:mm a').replace(/am|pm/gi, (match) => match.toUpperCase())}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="xl:w-1/3 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">
                        Citas para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {appointments.length > 0 && (
                        <div className="space-y-2 mb-3">
                            <div className="text-xs text-gray-500 text-center">
                                Última actualización: {format(new Date(), 'HH:mm:ss')} • {appointments.length} citas este mes
                            </div>
                            <div className="flex justify-center gap-3 text-[10px] flex-wrap">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                                    <span className="text-gray-600">Programada</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                                    <span className="text-gray-600">Completada</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
                                    <span className="text-gray-600">Cancelada</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-600 rounded-sm"></div>
                                    <span className="text-gray-600">No Asistió</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <ScrollArea className="h-[calc(100vh-280px)]">
                         {loading && selectedDayAppointments.length === 0 ? (
                             <div className="flex flex-col justify-center items-center h-full">
                                 <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#0378A6] mb-2"></div>
                                 <p className="text-sm text-gray-500">Cargando citas...</p>
                             </div>
                        ) : selectedDayAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDayAppointments.sort((a,b) => a.date - b.date).map(app => {
                                    const statusInfo = statusConfig[app.status] || statusConfig.scheduled;
                                    const duration = app.service?.duration_minutes || 120;
                                    const endTime = addHours(app.date, duration / 60);
                                    return (
                                        <motion.div 
                                            key={app.id} 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn("p-4 rounded-lg border-l-4", statusInfo.color, statusInfo.bg)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Dog className="w-5 h-5"/>{app.pet?.name || 'N/A'}</p>
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                  {statusInfo.icon}
                                                  <span>{statusInfo.label}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 pl-7 space-y-1 text-gray-600 text-sm">
                                                <p className="flex items-center gap-2"><User className="w-4 h-4"/>{app.owner?.name || 'N/A'}</p>
                                                <p className="flex items-center gap-2"><Scissors className="w-4 h-4"/>{app.service?.name || 'N/A'}</p>
                                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                                    <Clock className="w-4 h-4"/>
                                                    <span className="text-sm">
                                                        {formatTimeRange(app.date, endTime)}
                                                    </span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-10 flex flex-col items-center justify-center h-full">
                                <Sparkles className="mx-auto w-12 h-12 text-gray-300"/>
                                <p className="mt-4 font-semibold">No hay citas para este día.</p>
                                <p className="text-sm">¡Un día tranquilo!</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AppointmentsCalendar;