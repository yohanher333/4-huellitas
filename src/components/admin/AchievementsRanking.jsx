import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Award, Trophy, User, Hash, Plus, Gift, Calendar, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const AchievementsRanking = () => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [pointsHistory, setPointsHistory] = useState([]);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [customPoints, setCustomPoints] = useState('');
    const [description, setDescription] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [selectedUserHistory, setSelectedUserHistory] = useState(null);

    // Configuración de servicios y puntos
    const serviceOptions = [
        { value: 'corte_unas', label: 'Corte de Uñas', points: 500 },
        { value: 'limpieza_oidos', label: 'Limpieza de Oídos', points: 1000 },
        { value: 'spa', label: 'SPA', points: 2000 },
        { value: 'desparasitante_interno', label: 'Desparasitante Interno', points: 3000 },
        { value: 'desparasitante_completo', label: 'Desparasitante Interno y Externo', points: 5000 },
        { value: 'manual', label: 'Puntos Manuales', points: 0 }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Obtener usuarios con puntos actualizados (excluyendo puntos vencidos)
            const { data: rankingData, error: rankingError } = await supabase
                .from('profiles')
                .select(`
                    id, name, email,
                    user_achievements (
                        unlocked_at,
                        achievement:achievements (name, points)
                    )
                `)
                .eq('role', 'user')
                .order('name');

            // Obtener todos los usuarios para el selector
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('id, name, email')
                .eq('role', 'user')
                .order('name');

            if (rankingError) {
                toast({ title: "Error", description: "No se pudo cargar el ranking de logros.", variant: "destructive" });
            } else {
                // Calcular puntos actuales (solo los no vencidos)
                const rankingsWithCurrentPoints = await Promise.all(rankingData.map(async (user) => {
                    const currentPoints = await calculateCurrentPoints(user.id);
                    return { ...user, currentPoints };
                }));
                
                // Ordenar por puntos actuales
                rankingsWithCurrentPoints.sort((a, b) => (b.currentPoints || 0) - (a.currentPoints || 0));
                setRankings(rankingsWithCurrentPoints);
            }

            if (usersError) {
                toast({ title: "Error", description: "No se pudo cargar la lista de usuarios.", variant: "destructive" });
            } else {
                setUsers(usersData || []);
            }
            
            setLoading(false);
        };

        fetchData();
    }, []);

    // Función para calcular puntos actuales (no vencidos)
    const calculateCurrentPoints = async (userId) => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const { data, error } = await supabase
            .from('user_points_history')
            .select('points')
            .eq('user_id', userId)
            .gte('assigned_at', oneYearAgo.toISOString());

        if (error) {
            console.error('Error calculating points:', error);
            return 0;
        }

        return data?.reduce((total, record) => total + (record.points || 0), 0) || 0;
    };

    const filteredRankings = useMemo(() => {
        if (!search) return rankings;
        return rankings.filter(user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [rankings, search]);

    // Función para asignar puntos
    const handleAssignPoints = async () => {
        if (!selectedUser || (!serviceType && !customPoints)) {
            toast({ title: "Error", description: "Por favor completa todos los campos requeridos.", variant: "destructive" });
            return;
        }

        setAssigning(true);

        try {
            let pointsToAssign = 0;
            let serviceDescription = '';

            if (serviceType === 'manual') {
                pointsToAssign = parseInt(customPoints) || 0;
                serviceDescription = description || 'Puntos manuales';
            } else {
                const selectedService = serviceOptions.find(s => s.value === serviceType);
                pointsToAssign = selectedService?.points || 0;
                serviceDescription = selectedService?.label || '';
            }

            // Insertar en historial de puntos
            const { error: historyError } = await supabase
                .from('user_points_history')
                .insert({
                    user_id: selectedUser,
                    points: pointsToAssign,
                    service_type: serviceType,
                    description: serviceDescription,
                    assigned_at: new Date().toISOString()
                });

            if (historyError) throw historyError;

            // Actualizar puntos del usuario
            const currentPoints = await calculateCurrentPoints(selectedUser);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ points: currentPoints })
                .eq('id', selectedUser);

            if (updateError) throw updateError;

            toast({ 
                title: "¡Éxito!", 
                description: `Se han asignado ${pointsToAssign} puntos correctamente.` 
            });

            // Resetear formulario
            setSelectedUser('');
            setServiceType('');
            setCustomPoints('');
            setDescription('');
            setShowAssignDialog(false);

            // Recargar datos
            window.location.reload();

        } catch (error) {
            console.error('Error assigning points:', error);
            toast({ 
                title: "Error", 
                description: "No se pudieron asignar los puntos.", 
                variant: "destructive" 
            });
        }

        setAssigning(false);
    };

    // Función para ver historial de puntos de un usuario
    const handleViewHistory = async (user) => {
        setSelectedUserHistory(user);
        
        const { data, error } = await supabase
            .from('user_points_history')
            .select('*')
            .eq('user_id', user.id)
            .order('assigned_at', { ascending: false });

        if (error) {
            toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
        } else {
            setPointsHistory(data || []);
            setShowHistoryDialog(true);
        }
    };

    const getTrophy = (index) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
        if (index === 1) return <Trophy className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Trophy className="w-6 h-6 text-yellow-600" />;
        return <Hash className="w-5 h-5 text-gray-400" />;
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#0378A6]/10 p-6 border border-[#0378A6]/10">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Award className="w-6 h-6 text-[#F26513]" /> Ranking de Logros</h2>
                <div className="flex gap-3">
                    <Input
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#F26513] hover:bg-[#F26513]/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Asignar Puntos
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Asignar Puntos</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="user-select">Usuario</Label>
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger id="user-select">
                                            <SelectValue placeholder="Seleccionar usuario..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <Label htmlFor="service-select">Tipo de Servicio</Label>
                                    <Select value={serviceType} onValueChange={setServiceType}>
                                        <SelectTrigger id="service-select">
                                            <SelectValue placeholder="Seleccionar servicio..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serviceOptions.map(service => (
                                                <SelectItem key={service.value} value={service.value}>
                                                    {service.label} {service.points > 0 && `(${service.points} pts)`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {serviceType === 'manual' && (
                                    <>
                                        <div>
                                            <Label htmlFor="custom-points">Cantidad de Puntos</Label>
                                            <Input
                                                id="custom-points"
                                                type="number"
                                                placeholder="Ej: 1500"
                                                value={customPoints}
                                                onChange={(e) => setCustomPoints(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Descripción</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Motivo de asignación de puntos..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {serviceType && serviceType !== 'manual' && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <Gift className="w-4 h-4 inline mr-1" />
                                            Puntos a asignar: <strong>{serviceOptions.find(s => s.value === serviceType)?.points || 0}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAssignPoints} disabled={assigning}>
                                    {assigning ? 'Asignando...' : 'Asignar Puntos'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-[#0378A6] to-[#025d80]">
                        <tr>
                            <th className="p-3 w-12 text-white font-semibold">Rank</th>
                            <th className="p-3 text-white font-semibold">Usuario</th>
                            <th className="p-3 hidden sm:table-cell text-white font-semibold">Logros</th>
                            <th className="p-3 text-right text-white font-semibold">Puntos Actuales</th>
                            <th className="p-3 text-center text-white font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRankings.map((user, index) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                    <div className="flex items-center gap-2 font-bold">
                                        {getTrophy(index)}
                                        <span>{index + 1}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <p className="font-medium text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </td>
                                <td className="p-3 hidden sm:table-cell">
                                    <p className="font-semibold">{user.user_achievements.length}</p>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex flex-col items-end">
                                        <p className="font-bold text-xl text-[#0378A6]">{user.currentPoints || 0}</p>
                                        <p className="text-xs text-gray-500">(vigentes)</p>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewHistory(user)}
                                        className="text-[#0378A6] border-[#0378A6] hover:bg-[#0378A6] hover:text-white"
                                    >
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Historial
                                    </Button>
                                </td>
                            </tr>
                        ))}
                         {filteredRankings.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center text-gray-500 py-8">No se encontraron usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Diálogo de historial de puntos */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Historial de Puntos - {selectedUserHistory?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {pointsHistory.length > 0 ? (
                            <div className="space-y-3">
                                {pointsHistory.map((record, index) => {
                                    const assignedDate = new Date(record.assigned_at);
                                    const expiresDate = new Date(assignedDate);
                                    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
                                    const isExpired = new Date() > expiresDate;
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`p-4 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {record.description}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        Asignado: {assignedDate.toLocaleDateString('es-ES')}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <Star className="w-4 h-4 inline mr-1" />
                                                        {isExpired ? 'Expiró' : 'Expira'}: {expiresDate.toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-lg ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                                        +{record.points} pts
                                                    </p>
                                                    {isExpired && (
                                                        <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                                                            Vencido
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Este usuario no tiene historial de puntos.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default AchievementsRanking;