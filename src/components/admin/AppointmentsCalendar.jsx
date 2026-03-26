import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, addHours, addMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Dog, User, Scissors, Sparkles, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, RefreshCw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
    scheduled: { label: 'Programada', color: 'border-l-sky-500', bg: 'bg-sky-50', textColor: 'text-sky-700', dotColor: 'bg-sky-500', icon: <CalendarIcon className="w-4 h-4 text-sky-600" /> },
    completed: { label: 'Completada', color: 'border-l-emerald-500', bg: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
    cancelled: { label: 'Cancelada', color: 'border-l-rose-500', bg: 'bg-rose-50', textColor: 'text-rose-700', dotColor: 'bg-rose-500', icon: <XCircle className="w-4 h-4 text-rose-600" /> },
    no_show: { label: 'No Asistió', color: 'border-l-slate-500', bg: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-500', icon: <AlertTriangle className="w-4 h-4 text-slate-600" /> }
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
        <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/5 mb-6"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl shadow-lg">
                        <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
                            Agenda de Citas
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Calendario visual de todas las citas programadas
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Leyenda de estados */}
                    <div className="hidden lg:flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border">
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <span className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)}></span>
                                <span className="text-xs text-gray-600 font-medium">{config.label}</span>
                            </div>
                        ))}
                    </div>
                    <Button 
                        onClick={handleRefresh}
                        className="bg-[#0378A6] hover:bg-[#025d80] text-white shadow-md"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col xl:flex-row gap-6"
            >
                {/* Calendario */}
                <Card className="flex-grow xl:w-2/3 shadow-lg bg-white/90 backdrop-blur-sm border-[#0378A6]/10 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#0378A6] to-[#025d80] text-white pb-4">
                        <div className="flex justify-between items-center">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="hover:bg-white/20 text-white"
                            >
                                <ChevronLeft className="w-6 h-6"/>
                            </Button>
                            <div className="text-center">
                                <CardTitle className="text-2xl capitalize font-bold">
                                    {format(currentMonth, 'MMMM', { locale: es })}
                                </CardTitle>
                                <p className="text-white/70 text-sm">{format(currentMonth, 'yyyy')}</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="hover:bg-white/20 text-white"
                            >
                                <ChevronRight className="w-6 h-6"/>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 bg-[#0378A6]/10">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                <div key={day} className="py-3 text-center text-sm font-bold text-[#0378A6]">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Grid del calendario */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, index) => {
                                const dailyAppointments = getAppointmentsForDay(day);
                                const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                
                                return (
                                    <motion.div 
                                        key={day.toString()}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.01 }}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "min-h-[120px] border-b border-r border-gray-100 p-2 cursor-pointer transition-all duration-200",
                                            !isCurrentMonth && 'bg-gray-50/50',
                                            isCurrentMonth && 'hover:bg-[#0378A6]/5',
                                            isSelected && 'bg-[#0378A6]/10 ring-2 ring-[#0378A6] ring-inset',
                                            isToday && !isSelected && 'bg-[#F26513]/5'
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={cn(
                                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                                                !isCurrentMonth && 'text-gray-300',
                                                isCurrentMonth && 'text-gray-700',
                                                isToday && 'bg-[#F26513] text-white font-bold shadow-md'
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {dailyAppointments.length > 0 && (
                                                <Badge variant="secondary" className="text-[10px] bg-[#0378A6]/20 text-[#0378A6] h-5 px-1.5">
                                                    {dailyAppointments.length}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                            {dailyAppointments.slice(0, 3).map(app => {
                                                const statusInfo = statusConfig[app.status] || statusConfig.scheduled;
                                                return (
                                                    <div 
                                                        key={app.id} 
                                                        className={cn(
                                                            "px-1.5 py-1 rounded text-[10px] font-medium border-l-2 transition-all hover:scale-[1.02]",
                                                            statusInfo.bg,
                                                            statusInfo.color,
                                                            statusInfo.textColor
                                                        )}
                                                        title={`${app.pet?.name} - ${format(app.date, 'h:mm a')}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span className="truncate font-semibold">{app.pet?.name || 'N/A'}</span>
                                                            <span className="ml-auto text-[9px] opacity-75 flex-shrink-0">
                                                                {format(app.date, 'h:mm a').replace(/am|pm/gi, m => m.toUpperCase())}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {dailyAppointments.length > 3 && (
                                                <div className="text-[10px] text-[#0378A6] font-semibold text-center py-0.5 bg-[#0378A6]/10 rounded">
                                                    +{dailyAppointments.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel lateral - Detalle del día */}
                <Card className="xl:w-1/3 shadow-lg bg-white/90 backdrop-blur-sm border-[#0378A6]/10 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#025d80] to-[#0378A6] text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    {format(selectedDate, "d 'de' MMMM", { locale: es })}
                                </CardTitle>
                                <p className="text-white/70 text-sm capitalize">
                                    {format(selectedDate, 'EEEE', { locale: es })}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {/* Stats del mes */}
                        {appointments.length > 0 && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-[#0378A6]/10 to-[#025d80]/10 rounded-xl border border-[#0378A6]/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-[#0378A6]">Este mes</span>
                                    <Badge className="bg-[#0378A6] text-white">{appointments.length} citas</Badge>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {Object.entries(statusConfig).map(([key, config]) => {
                                        const count = appointments.filter(a => a.status === key).length;
                                        return (
                                            <div key={key} className="text-center">
                                                <div className={cn("w-3 h-3 rounded-full mx-auto mb-1", config.dotColor)}></div>
                                                <p className="text-lg font-bold text-gray-700">{count}</p>
                                                <p className="text-[9px] text-gray-500">{config.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        <ScrollArea className="h-[calc(100vh-450px)]">
                            {loading && selectedDayAppointments.length === 0 ? (
                                <div className="flex flex-col justify-center items-center py-12">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-[#0378A6]/20 rounded-full"></div>
                                        <div className="absolute top-0 w-12 h-12 border-4 border-transparent border-t-[#0378A6] rounded-full animate-spin"></div>
                                    </div>
                                    <p className="mt-4 text-sm text-gray-500 font-medium">Cargando citas...</p>
                                </div>
                            ) : selectedDayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDayAppointments.sort((a,b) => a.date - b.date).map((app, index) => {
                                        const statusInfo = statusConfig[app.status] || statusConfig.scheduled;
                                        const duration = app.service?.duration_minutes || 120;
                                        const endTime = addHours(app.date, duration / 60);
                                        return (
                                            <motion.div 
                                                key={app.id} 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={cn(
                                                    "p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all",
                                                    statusInfo.color, 
                                                    statusInfo.bg
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-10 h-10 bg-[#0378A6]/20 rounded-lg flex items-center justify-center">
                                                            <Dog className="w-5 h-5 text-[#0378A6]"/>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{app.pet?.name || 'N/A'}</p>
                                                            <p className="text-xs text-gray-500">{app.owner?.name || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn("font-medium", statusInfo.bg, statusInfo.textColor, "border", statusInfo.color.replace('border-l-', 'border-'))}>
                                                        {statusInfo.icon}
                                                        <span className="ml-1">{statusInfo.label}</span>
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600 bg-white/50 px-2 py-1.5 rounded-lg">
                                                        <Scissors className="w-4 h-4 text-[#0378A6]"/>
                                                        <span className="font-medium">{app.service?.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700 bg-white/50 px-2 py-1.5 rounded-lg">
                                                        <Clock className="w-4 h-4 text-[#F26513]"/>
                                                        <span className="font-semibold">
                                                            {format(app.date, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-[#0378A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-10 h-10 text-[#0378A6]/30"/>
                                    </div>
                                    <p className="font-semibold text-gray-700">Sin citas este día</p>
                                    <p className="text-sm text-gray-500 mt-1">¡Un día tranquilo!</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default AppointmentsCalendar;