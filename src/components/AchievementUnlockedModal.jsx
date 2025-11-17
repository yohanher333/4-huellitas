import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, CalendarPlus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AchievementUnlockedModal = ({ isOpen, onClose, type = 'registration', points = 100, customTitle, customDescription }) => {
    const navigate = useNavigate();

    const handleBookAppointment = () => {
        onClose();
        navigate('/book-appointment?fresh=true');
    };

    const handleViewAchievements = () => {
        onClose();
        navigate('/dashboard');
    };

    // Configuraciones por tipo de logro
    const achievementConfig = {
        registration: {
            title: '¡Bienvenido a la Manada!',
            description: `Has ganado "¡Bienvenido a la Manada!" y ${points} puntos por registrarte.`,
            primaryAction: 'Agendar 1ª Cita (+200 Puntos)',
            primaryIcon: CalendarPlus
        },
        appointment: {
            title: '¡Cita Agendada!',
            description: `¡Genial! Has ganado ${points} puntos por agendar una cita para tu mascota.`,
            primaryAction: 'Agendar Otra Cita (+200 Puntos)',
            primaryIcon: CalendarPlus
        },
        service: {
            title: '¡Puntos Ganados!',
            description: `¡Felicidades! Has recibido ${points} puntos por el servicio completado.`,
            primaryAction: 'Agendar Nueva Cita (+200 Puntos)',
            primaryIcon: CalendarPlus
        },
        custom: {
            title: customTitle || '¡Puntos Ganados!',
            description: customDescription || `Has ganado ${points} puntos.`,
            primaryAction: 'Agendar Nueva Cita (+200 Puntos)',
            primaryIcon: CalendarPlus
        }
    };

    const config = achievementConfig[type] || achievementConfig.custom;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-400 text-white overflow-hidden z-50">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                    className="absolute -top-16 -left-16 w-48 h-48 text-yellow-500/20"
                >
                    <Trophy className="w-full h-full" strokeWidth={0.5} />
                </motion.div>
                <DialogHeader className="z-10">
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mx-auto mb-4 w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center"
                    >
                        <Trophy className="w-12 h-12 text-gray-900" />
                    </motion.div>
                    <DialogTitle className="text-2xl font-bold text-center text-yellow-400">{config.title}</DialogTitle>
                    <DialogDescription className="text-center text-gray-300 pt-2">
                        {config.description.includes(points.toString()) ? 
                            <span dangerouslySetInnerHTML={{
                                __html: config.description.replace(points.toString(), `<span class="font-bold text-white">${points}</span>`)
                            }} /> :
                            <>
                                {config.description} <span className="font-bold text-white">{points} puntos</span>
                            </>
                        }
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-3 pt-4 z-10">
                    <Button onClick={handleBookAppointment} className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                        <config.primaryIcon className="w-4 h-4 mr-2" /> {config.primaryAction}
                    </Button>
                    <Button onClick={handleViewAchievements} variant="outline" className="w-full bg-transparent border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300">
                        <Star className="w-4 h-4 mr-2" /> Ver mi ranking
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AchievementUnlockedModal;