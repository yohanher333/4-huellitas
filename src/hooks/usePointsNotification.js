import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const usePointsNotification = (user) => {
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({});
    const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false);
    
    useEffect(() => {
        if (!user?.id) return;

        let subscription = null;

        const setupSubscription = () => {
            try {
                // Suscribirse a cambios en la tabla de puntos
                subscription = supabase
                    .channel(`points_notifications_${user.id}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_points_history',
                        filter: `user_id=eq.${user.id}`
                    }, (payload) => {
                        console.log('New points received:', payload);
                        
                        const { points, service_type, description } = payload.new;
                        
                        // Configurar el modal según el tipo de servicio
                        let config = {};
                        
                        switch (service_type) {
                            case 'registration':
                                config = {
                                    type: 'registration',
                                    points: points,
                                    customTitle: '¡Bienvenido a la Manada!',
                                    customDescription: `¡Felicidades! Has ganado ${points} puntos de bienvenida por registrarte.`
                                };
                                break;
                                
                            case 'appointment_scheduled':
                                config = {
                                    type: 'appointment',
                                    points: points,
                                    customTitle: '¡Cita Agendada!',
                                    customDescription: `¡Excelente! Has ganado ${points} puntos por agendar una cita para tu mascota.`
                                };
                                break;
                                
                            case 'corte_unas':
                            case 'limpieza_oidos':
                            case 'spa':
                            case 'desparasitante_interno':
                            case 'desparasitante_completo':
                                config = {
                                    type: 'service',
                                    points: points,
                                    customTitle: '¡Servicio Completado!',
                                    customDescription: `¡Genial! Has ganado ${points} puntos por el servicio: ${description}`
                                };
                                break;
                                
                            default:
                                config = {
                                    type: 'custom',
                                    points: points,
                                    customTitle: '¡Puntos Ganados!',
                                    customDescription: `Has recibido ${points} puntos: ${description}`
                                };
                        }
                        
                        setModalConfig(config);
                        setShowModal(true);
                    })
                    .subscribe((status) => {
                        console.log('Subscription status:', status);
                    });
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

    // Función mejorada para verificar puntos de bienvenida
    const checkWelcomePoints = useCallback(async () => {
        if (!user?.id || hasCheckedWelcome) return;
        
        setHasCheckedWelcome(true);

        // Simplificamos: solo mostrar modal si el usuario se registró muy recientemente
        if (user.created_at) {
            const createdDate = new Date(user.created_at);
            const now = new Date();
            const diffMinutes = (now - createdDate) / (1000 * 60);
            
            // Si se registró hace menos de 2 minutos, probablemente es nuevo
            if (diffMinutes < 2) {
                setTimeout(() => {
                    setModalConfig({
                        type: 'registration',
                        points: 100,
                        customTitle: '¡Bienvenido a la Manada!',
                        customDescription: '¡Felicidades! Has ganado 100 puntos de bienvenida por registrarte.'
                    });
                    setShowModal(true);
                }, 1000); // Esperar 1 segundo para que todo cargue
            }
        }
    }, [user?.id, user?.created_at, hasCheckedWelcome]);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setModalConfig({});
    }, []);

    return {
        showModal,
        modalConfig,
        closeModal,
        checkWelcomePoints
    };
};