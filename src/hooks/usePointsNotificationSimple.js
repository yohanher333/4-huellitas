import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const usePointsNotification = (user) => {
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({});
    
    useEffect(() => {
        if (!user?.id) return;

        let subscription = null;

        const setupSubscription = () => {
            try {
                subscription = supabase
                    .channel(`points_${user.id}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_points_history',
                        filter: `user_id=eq.${user.id}`
                    }, (payload) => {
                        const { points, service_type, description } = payload.new;
                        
                        let config = {};
                        
                        switch (service_type) {
                            case 'registration':
                                config = {
                                    type: 'registration',
                                    points: points,
                                    customTitle: '¡Bienvenido a la Manada!',
                                    customDescription: `¡Felicidades! Has ganado ${points} puntos de bienvenida.`
                                };
                                break;
                                
                            case 'appointment_scheduled':
                                config = {
                                    type: 'appointment',
                                    points: points,
                                    customTitle: '¡Cita Agendada!',
                                    customDescription: `¡Excelente! Has ganado ${points} puntos por agendar una cita.`
                                };
                                break;
                                
                            default:
                                config = {
                                    type: 'service',
                                    points: points,
                                    customTitle: '¡Puntos Ganados!',
                                    customDescription: `Has ganado ${points} puntos: ${description}`
                                };
                        }
                        
                        setModalConfig(config);
                        setShowModal(true);
                    })
                    .subscribe();
            } catch (error) {
                console.error('Error setting up subscription:', error);
            }
        };

        setupSubscription();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [user?.id]);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setModalConfig({});
    }, []);

    // Función simplificada que no hace llamadas a la DB
    const checkWelcomePoints = useCallback(() => {
        // Esta función ahora es solo placeholder
        // Los puntos se mostrarán automáticamente via subscription
    }, []);

    return {
        showModal,
        modalConfig,
        closeModal,
        checkWelcomePoints
    };
};