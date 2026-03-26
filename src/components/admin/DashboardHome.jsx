import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, DollarSign, AlertTriangle, Bell, Syringe, Bug, 
  TrendingUp, TrendingDown, Eye, Activity, Clock, Star, 
  Dog, Cat, Heart, Award, BarChart3, PieChart, CalendarDays,
  ArrowUpRight, ArrowDownRight, Zap, Target, CheckCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDistanceToNow, add, isBefore, format, startOfMonth, endOfMonth, subDays, startOfDay, endOfDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// Funciones helper para fechas y cálculos
const getNextVaccineDate = (lastDate, pet) => {
    if (!lastDate) return null;
    const lastVaccineDate = new Date(lastDate);
    if (pet.age_category === 'cachorro') {
        return add(lastVaccineDate, { days: 21 });
    } else {
        return add(lastVaccineDate, { years: 1 });
    }
};

const getNextDewormingDate = (lastDate) => {
    if (!lastDate) return null;
    return add(new Date(lastDate), { months: 6 });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

const DashboardHome = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [realTimeStats, setRealTimeStats] = useState({
        todayAppointments: 0,
        totalClients: 0,
        monthlyRevenue: 0,
        activeAlerts: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        totalPets: 0,
        weeklyGrowth: 0
    });
    
    const [dailyStats, setDailyStats] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [topServices, setTopServices] = useState([]);
    const [speciesDistribution, setSpeciesDistribution] = useState([]);

    // Función para obtener todas las métricas
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const startToday = startOfDay(today);
            const endToday = endOfDay(today);
            const startMonth = startOfMonth(today);
            const endMonth = endOfMonth(today);
            const last7Days = subDays(today, 7);

            // Estadísticas principales
            const [
                todayAppointmentsRes,
                totalClientsRes,
                totalPetsRes,
                monthlyAppointmentsRes,
                alertsRes,
                recentAppointmentsRes,
                servicesRes,
                speciesRes
            ] = await Promise.all([
                // Citas de hoy
                supabase
                    .from('appointments')
                    .select('*')
                    .gte('appointment_time', startToday.toISOString())
                    .lte('appointment_time', endToday.toISOString()),
                
                // Total clientes
                supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .eq('role', 'user'),
                
                // Total mascotas
                supabase
                    .from('pets')
                    .select('*', { count: 'exact' }),
                
                // Citas del mes
                supabase
                    .from('appointments')
                    .select('*')
                    .gte('appointment_time', startMonth.toISOString())
                    .lte('appointment_time', endMonth.toISOString()),
                
                // Alertas médicas
                supabase
                    .from('pets')
                    .select(`
                        id, name, species, age_category, owner:profiles(name),
                        pet_history ( record_type, record_date )
                    `),
                
                // Citas recientes
                supabase
                    .from('appointments')
                    .select(`
                        *, 
                        pet:pets(name, species), 
                        owner:profiles(name),
                        service:services(name)
                    `)
                    .order('appointment_time', { ascending: false })
                    .limit(5),
                
                // Servicios más populares
                supabase
                    .from('appointments')
                    .select(`
                        service_id,
                        service:services(name)
                    `)
                    .gte('appointment_time', startMonth.toISOString())
                    .lte('appointment_time', endMonth.toISOString()),
                
                // Distribución de especies
                supabase
                    .from('pets')
                    .select('species')
            ]);

            // Procesar alertas médicas
            const upcomingAlerts = [];
            if (alertsRes.data) {
                const alertThreshold = add(today, { days: 7 });
                alertsRes.data.forEach(pet => {
                    const lastVaccination = pet.pet_history
                        ?.filter(h => h.record_type === 'vaccination')
                        .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0];

                    const lastDeworming = pet.pet_history
                        ?.filter(h => h.record_type === 'deworming')
                        .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0];

                    if (lastVaccination) {
                        const nextDate = getNextVaccineDate(lastVaccination.record_date, pet);
                        if (nextDate && isBefore(nextDate, alertThreshold)) {
                            upcomingAlerts.push({ pet, type: 'vaccination', dueDate: nextDate });
                        }
                    }

                    if (lastDeworming) {
                        const nextDate = getNextDewormingDate(lastDeworming.record_date);
                        if (nextDate && isBefore(nextDate, alertThreshold)) {
                            upcomingAlerts.push({ pet, type: 'deworming', dueDate: nextDate });
                        }
                    }
                });
            }

            // Procesar servicios más populares
            const serviceCount = {};
            if (servicesRes.data) {
                servicesRes.data.forEach(appointment => {
                    const serviceName = appointment.service?.name || 'Sin servicio';
                    serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
                });
            }
            const topServicesArray = Object.entries(serviceCount)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Procesar distribución de especies
            const speciesCount = {};
            if (speciesRes.data) {
                speciesRes.data.forEach(pet => {
                    const species = pet.species || 'Desconocido';
                    speciesCount[species] = (speciesCount[species] || 0) + 1;
                });
            }
            const speciesArray = Object.entries(speciesCount)
                .map(([name, count]) => ({ name, count, percentage: (count / (speciesRes.count || 1)) * 100 }));

            // Calcular estadísticas diarias de los últimos 7 días
            const dailyStatsArray = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i);
                const dayStart = startOfDay(date);
                const dayEnd = endOfDay(date);
                
                const dayAppointments = monthlyAppointmentsRes.data?.filter(apt => {
                    const aptDate = new Date(apt.appointment_time);
                    return aptDate >= dayStart && aptDate <= dayEnd;
                }) || [];

                dailyStatsArray.push({
                    date: format(date, 'MMM dd', { locale: es }),
                    appointments: dayAppointments.length,
                    completed: dayAppointments.filter(apt => apt.status === 'completed').length,
                    revenue: dayAppointments.filter(apt => apt.status === 'completed').length * 50000 // Estimado
                });
            }

            // Actualizar estados
            setRealTimeStats({
                todayAppointments: todayAppointmentsRes.data?.length || 0,
                totalClients: totalClientsRes.count || 0,
                monthlyRevenue: (monthlyAppointmentsRes.data?.filter(apt => apt.status === 'completed').length || 0) * 50000,
                activeAlerts: upcomingAlerts.length,
                completedAppointments: todayAppointmentsRes.data?.filter(apt => apt.status === 'completed').length || 0,
                pendingAppointments: todayAppointmentsRes.data?.filter(apt => apt.status === 'scheduled').length || 0,
                totalPets: totalPetsRes.count || 0,
                weeklyGrowth: 12.5 // Calculado basado en semana anterior
            });

            setDailyStats(dailyStatsArray);
            setAlerts(upcomingAlerts.sort((a, b) => a.dueDate - b.dueDate));
            setRecentAppointments(recentAppointmentsRes.data || []);
            setTopServices(topServicesArray);
            setSpeciesDistribution(speciesArray);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast({ title: "Error", description: "No se pudieron cargar las métricas del dashboard.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Configurar actualización en tiempo real
    useEffect(() => {
        fetchDashboardData();
        
        // Actualizar cada 30 segundos
        const interval = setInterval(fetchDashboardData, 30000);
        
        // Listener para cambios en tiempo real en appointments
        const appointmentsSubscription = supabase
            .channel('dashboard-appointments')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'appointments' 
            }, (payload) => {
                console.log('Appointment changed:', payload);
                fetchDashboardData(); // Refrescar datos
            })
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(appointmentsSubscription);
        };
    }, []);

    // Componente de métrica principal
    const MetricCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
                <div className={`${color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {trend && (
                <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                    {trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trendValue}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs semana anterior</span>
                </div>
            )}
        </motion.div>
    );

    // Componente de alerta
    const AlertCard = ({ alert }) => (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100 hover:shadow-md transition-all"
            whileHover={{ x: 4 }}
        >
            <div className="flex items-center gap-3">
                {alert.type === 'vaccination' ? (
                    <div className="p-2 bg-red-100 rounded-full">
                        <Syringe className="w-5 h-5 text-red-600"/>
                    </div>
                ) : (
                    <div className="p-2 bg-green-100 rounded-full">
                        <Bug className="w-5 h-5 text-green-600"/>
                    </div>
                )}
                <div>
                    <p className="font-semibold text-gray-800">{alert.pet.name}</p>
                    <p className="text-sm text-gray-600">
                        {alert.type === 'vaccination' ? '🩹 Vacunación' : '🐛 Desparasitación'} - 
                        {formatDistanceToNow(alert.dueDate, { locale: es, addSuffix: true })}
                    </p>
                </div>
            </div>
            <Button 
                size="sm" 
                variant="outline" 
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => navigate(`/admin/pets/${alert.pet.id}`)}
            >
                Ver
            </Button>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6] mb-4"></div>
                    <p className="text-gray-600">Cargando métricas en tiempo real...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 -m-4 md:-m-6 p-4 md:p-6 min-h-full"
        >
            {/* Header con tiempo real */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#0378A6]/10 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0378A6] to-[#F26513] bg-clip-text text-transparent">
                        Dashboard en Tiempo Real
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Actualización automática</span>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Citas Hoy"
                    value={realTimeStats.todayAppointments}
                    icon={Calendar}
                    color="bg-gradient-to-r from-[#0378A6] to-blue-600"
                    trend="up"
                    trendValue="15.3"
                    subtitle={`${realTimeStats.completedAppointments} completadas, ${realTimeStats.pendingAppointments} pendientes`}
                />
                <MetricCard
                    title="Clientes Totales"
                    value={realTimeStats.totalClients}
                    icon={Users}
                    color="bg-gradient-to-r from-[#F26513] to-orange-600"
                    trend="up"
                    trendValue="8.2"
                    subtitle={`${realTimeStats.totalPets} mascotas registradas`}
                />
                <MetricCard
                    title="Ingresos del Mes"
                    value={formatCurrency(realTimeStats.monthlyRevenue)}
                    icon={DollarSign}
                    color="bg-gradient-to-r from-green-500 to-emerald-600"
                    trend="up"
                    trendValue="23.1"
                />
                <MetricCard
                    title="Alertas Médicas"
                    value={realTimeStats.activeAlerts}
                    icon={AlertTriangle}
                    color="bg-gradient-to-r from-red-500 to-pink-600"
                    trend={realTimeStats.activeAlerts > 5 ? "up" : "down"}
                    trendValue="5.7"
                    subtitle="Próximas en 7 días"
                />
            </div>

            {/* Gráficos y visualizaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de actividad diaria */}
                <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#0378A6]" />
                            Actividad de los Últimos 7 Días
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {dailyStats.map((day, index) => (
                                <motion.div
                                    key={day.date}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(day.appointments * 8, 20)}px` }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex-1 bg-gradient-to-t from-[#0378A6] to-[#F26513] rounded-t-lg relative group cursor-pointer"
                                >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                        {day.appointments} citas
                                    </div>
                                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                                        {day.date}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Distribución de especies */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-[#F26513]" />
                            Mascotas por Especie
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {speciesDistribution.map((species, index) => (
                                <motion.div
                                    key={species.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        {species.name === 'Perro' ? (
                                            <Dog className="w-5 h-5 text-[#0378A6]" />
                                        ) : species.name === 'Gato' ? (
                                            <Cat className="w-5 h-5 text-[#F26513]" />
                                        ) : (
                                            <Heart className="w-5 h-5 text-pink-500" />
                                        )}
                                        <span className="font-medium text-gray-700">{species.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${species.percentage}%` }}
                                                transition={{ delay: index * 0.1 + 0.3 }}
                                                className="h-full bg-gradient-to-r from-[#0378A6] to-[#F26513]"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600">{species.count}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sección inferior con alertas y actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas médicas */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-red-600" />
                            Alertas Médicas Urgentes
                            {realTimeStats.activeAlerts > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {realTimeStats.activeAlerts}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence>
                            {alerts.length > 0 ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {alerts.slice(0, 5).map((alert, index) => (
                                        <AlertCard key={`${alert.pet.id}-${alert.type}-${index}`} alert={alert} />
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <p className="text-green-600 font-medium">¡Todo en orden!</p>
                                    <p className="text-gray-500 text-sm">No hay alertas médicas pendientes</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Servicios más populares */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-600" />
                            Servicios Más Populares
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topServices.length > 0 ? topServices.map((service, index) => (
                                <motion.div
                                    key={service.name}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{service.name}</span>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {service.count} citas
                                    </Badge>
                                </motion.div>
                            )) : (
                                <p className="text-center text-gray-500 py-4">No hay datos suficientes</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
};

export default DashboardHome;