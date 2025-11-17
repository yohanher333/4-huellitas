import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './customSupabaseClient';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Función para asignar puntos automáticamente
export const assignAutomaticPoints = async (userId, serviceType, points, description) => {
  try {
    // Insertar en historial de puntos
    const { error: historyError } = await supabase
      .from('user_points_history')
      .insert({
        user_id: userId,
        points: points,
        service_type: serviceType,
        description: description,
        assigned_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error inserting points history:', historyError);
      return { success: false, error: historyError };
    }

    // Los puntos se actualizan automáticamente en la tabla profiles mediante trigger
    
    return { success: true };
  } catch (error) {
    console.error('Error assigning automatic points:', error);
    return { success: false, error };
  }
};

// Función para puntos de registro (100 puntos)
export const assignWelcomePoints = async (userId) => {
  return await assignAutomaticPoints(
    userId,
    'registration',
    100,
    '¡Bienvenido a la Manada! - Registro en plataforma'
  );
};

// Función para puntos de cita agendada (200 puntos)
export const assignAppointmentPoints = async (userId) => {
  return await assignAutomaticPoints(
    userId,
    'appointment_scheduled',
    200,
    'Cita Agendada - Gracias por confiar en nosotros'
  );
};