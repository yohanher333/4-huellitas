import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Clock, User, Save, Sun, Moon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parse } from 'date-fns';

const daysOfWeek = [
    { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' }
];

// Intervalos de 15 minutos desde 00:00 hasta 23:45
const timeSlots = [];
for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
        timeSlots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    }
}

const timeToAmPm = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'hh:mm a');
};

const ScheduleSettings = () => {
    const [schedules, setSchedules] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('work_schedules').select('*, professional_availability(professional_id)').order('day_of_week', { ascending: true }).order('start_time', { ascending: true });
        if (error) {
            toast({ title: "Error", description: "No se pudo cargar la configuración de horarios.", variant: "destructive" });
        } else {
            setSchedules(data);
        }
        setLoading(false);
    }, []);

    const fetchProfessionals = useCallback(async () => {
        const { data, error } = await supabase.from('professionals').select('id, name');
        if (error) toast({ title: "Error", description: "No se pudieron cargar los profesionales.", variant: "destructive" });
        else setProfessionals(data);
    }, []);

    useEffect(() => {
        fetchSchedules();
        fetchProfessionals();
    }, [fetchSchedules, fetchProfessionals]);

    const handleAddSchedule = async (day) => {
        const { error } = await supabase.from('work_schedules').insert({ day_of_week: day, start_time: '09:00:00', end_time: '17:00:00' });
        if (error) toast({ title: "Error", description: "No se pudo añadir el horario.", variant: "destructive" });
        else fetchSchedules();
    };

    const handleUpdateSchedule = async (id, field, value) => {
        const { error } = await supabase.from('work_schedules').update({ [field]: value }).eq('id', id);
        if (error) toast({ title: "Error", description: `No se pudo actualizar. ${error.message}`, variant: "destructive" });
        else {
            toast({title: "Horario actualizado"});
            fetchSchedules();
        }
    };

    const handleDeleteSchedule = async (id) => {
        const { error } = await supabase.from('work_schedules').delete().eq('id', id);
        if (error) toast({ title: "Error", description: "No se pudo eliminar el horario.", variant: "destructive" });
        else fetchSchedules();
    };

    const handleProfessionalToggle = async (schedule, profId, isChecked) => {
        if (isChecked) {
            const { error } = await supabase.from('professional_availability').insert({ schedule_id: schedule.id, professional_id: profId });
            if(error) toast({title: "Error", variant: "destructive"});
        } else {
            const { error } = await supabase.from('professional_availability').delete().match({ schedule_id: schedule.id, professional_id: profId });
             if(error) toast({title: "Error", variant: "destructive"});
        }
        fetchSchedules();
    };

    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 -m-4 md:-m-6 p-4 md:p-6">
            {/* Aviso sobre el nuevo sistema */}
            <Card className="shadow-lg shadow-[#0378A6]/10 border-l-4 border-l-[#0378A6] bg-white/95 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Clock className="w-6 h-6" />
                        💡 Nuevo: Sistema de Franjas Personalizadas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">🚀 Sistema Mejorado Disponible</h3>
                        <p className="text-blue-700 text-sm mb-3">
                            Ahora puede configurar <strong>franjas horarias personalizadas</strong> con duración flexible 
                            (desde 5 minutos hasta varias horas) y asignación individual de profesionales por franja.
                        </p>
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={() => window.open('/admin/settings/custom-slots', '_self')}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                ✨ Probar Franjas Personalizadas
                            </Button>
                            <span className="text-xs text-blue-600">
                                Ejemplos: 9:00-9:10 (10min), 14:00-15:30 (1.5h)
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg shadow-[#0378A6]/10 bg-white/95 backdrop-blur-sm border border-[#0378A6]/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="w-6 h-6 text-[#0378A6]" /> <span className="bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">Horarios de Trabajo Tradicionales</span></CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">
                        Sistema tradicional: Define los días y horas básicas en que la peluquería está abierta. 
                        <br />
                        <span className="text-sm text-gray-500">
                            Nota: Con franjas personalizadas obtiene mayor flexibilidad y control granular.
                        </span>
                    </p>
                    <div className="space-y-4">
                        {daysOfWeek.map(day => {
                            const daySchedules = schedules.filter(s => s.day_of_week === day.id);
                            return (
                                <div key={day.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-lg text-gray-800">{day.name}</h3>
                                        <Button size="sm" variant="outline" onClick={() => handleAddSchedule(day.id)}><Plus className="w-4 h-4 mr-2" /> Añadir franja</Button>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        {daySchedules.length > 0 ? daySchedules.map(schedule => (
                                            <div key={schedule.id} className="p-4 bg-white rounded-md border">
                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Sun className="w-5 h-5 text-yellow-500" />
                                                        <Select value={schedule.start_time} onValueChange={(v) => handleUpdateSchedule(schedule.id, 'start_time', v)}>
                                                            <SelectTrigger className="w-36"><SelectValue placeholder={timeToAmPm(schedule.start_time)} /></SelectTrigger>
                                                            <SelectContent>{timeSlots.map(t => <SelectItem key={`start-${t}`} value={t}>{timeToAmPm(t)}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                        <Moon className="w-5 h-5 text-blue-500" />
                                                        <Select value={schedule.end_time} onValueChange={(v) => handleUpdateSchedule(schedule.id, 'end_time', v)}>
                                                            <SelectTrigger className="w-36"><SelectValue placeholder={timeToAmPm(schedule.end_time)} /></SelectTrigger>
                                                            <SelectContent>{timeSlots.filter(t => t > schedule.start_time).map(t => <SelectItem key={`end-${t}`} value={t}>{timeToAmPm(t)}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                </div>
                                            </div>
                                        )) : <p className="text-center text-gray-500 text-sm">Cerrado</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ScheduleSettings;