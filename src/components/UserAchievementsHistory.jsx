import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Gift, Star, Sparkles, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '../lib/customSupabaseClient';
import { useAuth } from '../contexts/SupabaseAuthContext';

const UserAchievementsHistory = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  // Mapeo de tipos de servicios a configuración visual
  const serviceConfig = {
    'registration': {
      icon: Gift,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      label: 'Registro'
    },
    'appointment_scheduled': {
      icon: Calendar,
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      label: 'Cita Agendada'
    },
    'corte_unas': {
      icon: Star,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      label: 'Corte de Uñas'
    },
    'limpieza_oidos': {
      icon: Sparkles,
      color: 'from-cyan-400 to-teal-500',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700',
      label: 'Limpieza de Oídos'
    },
    'spa': {
      icon: Trophy,
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      label: 'Spa Completo'
    },
    'consulta_general': {
      icon: Award,
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      label: 'Consulta General'
    },
    'vacunacion': {
      icon: Star,
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      label: 'Vacunación'
    },
    'desparasitacion': {
      icon: Sparkles,
      color: 'from-emerald-400 to-green-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      label: 'Desparasitación'
    },
    'admin_manual': {
      icon: Award,
      color: 'from-amber-400 to-yellow-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      label: 'Puntos Especiales'
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
      
      // Calcular puntos totales vigentes
      const { data: pointsData, error: pointsError } = await supabase
        .rpc('calculate_current_points', { target_user_id: user.id });

      if (!pointsError) {
        setTotalPoints(pointsData || 0);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchAchievements();
    }
  }, [isOpen, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) <= new Date();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="bg-gradient-to-br from-blue-50 to-orange-50 p-6 rounded-lg mt-4 border border-gray-200">
        {/* Header con puntos totales */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Mis Logros</h3>
              <p className="text-sm text-gray-600">Puntos vigentes: {totalPoints}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hover:bg-white/50"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>

        {/* Lista de logros */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div>
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aún no tienes logros registrados</p>
              <p className="text-sm">¡Agenda tu primera cita para comenzar!</p>
            </div>
          ) : (
            <AnimatePresence>
              {achievements.map((achievement, index) => {
                const config = serviceConfig[achievement.service_type] || serviceConfig['admin_manual'];
                const IconComponent = config.icon;
                const expired = isExpired(achievement.expires_at);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${
                      expired ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${config.textColor}`}>
                              {config.label}
                            </h4>
                            {expired && (
                              <Badge variant="secondary" className="text-xs">
                                Expirado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(achievement.created_at)}
                            </span>
                            {!expired && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  Expira: {formatDate(achievement.expires_at)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${expired ? 'text-gray-400 line-through' : config.textColor}`}>
                          +{achievement.points}
                        </div>
                        <div className="text-xs text-gray-500">puntos</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserAchievementsHistory;