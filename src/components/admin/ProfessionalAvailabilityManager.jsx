import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { Users } from 'lucide-react';

const ProfessionalAvailabilityManager = () => {
  const [workSchedules, setWorkSchedules] = useState([]);
  const [professionalAvailability, setProfessionalAvailability] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch work schedules
      const { data: schedules } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week');

      // Fetch professional availability
      const { data: availability } = await supabase
        .from('professional_availability')
        .select('*');

      // Fetch professionals from professionals table
      const { data: professionalsList } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      setWorkSchedules(schedules || []);
      setProfessionalAvailability(availability || []);
      setProfessionals(professionalsList || []);
    } catch (error) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProfessional = async (scheduleId, professionalId, professionalName, isEnabled) => {
    try {
      if (isEnabled) {
        // Remove professional from this schedule
        const { error } = await supabase
          .from('professional_availability')
          .delete()
          .match({ schedule_id: scheduleId, professional_id: professionalId });

        if (error) throw error;
        toast({ title: "Profesional removido del horario" });
      } else {
        // Add professional to this schedule
        const { error } = await supabase
          .from('professional_availability')
          .insert({
            schedule_id: scheduleId,
            professional_id: professionalId
          });

        if (error) throw error;
        toast({ title: "Profesional agregado al horario" });
      }
      
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  };



  const isProfessionalAvailable = (scheduleId, professionalId) => {
    return professionalAvailability.some(
      pa => pa.schedule_id === scheduleId && pa.professional_id === professionalId
    );
  };



  const getAvailabilityCount = (scheduleId) => {
  // Solo contar profesionales activos
  const activeIds = professionals.map(p => p.id);
  return professionalAvailability.filter(pa => pa.schedule_id === scheduleId && activeIds.includes(pa.professional_id)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Disponibilidad de Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Info message */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-800">📝 Nota Importante</h3>
              <p className="text-sm text-blue-700">
                Los profesionales se gestionan desde <strong>Configuración → Gestión de Profesionales</strong>. 
                Aquí solo puedes configurar su disponibilidad por horario.
              </p>
            </div>

            {/* Schedule availability matrix */}
            <div className="space-y-4">
              <h3 className="font-semibold">Disponibilidad por Día y Horario</h3>
              {workSchedules.map(schedule => {
                const dayInfo = daysOfWeek.find(d => d.value === schedule.day_of_week);
                const availableCount = getAvailabilityCount(schedule.id);
                
                return (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-medium">{dayInfo?.label}</h4>
                        <p className="text-sm text-gray-600">
                          {schedule.start_time} - {schedule.end_time}
                        </p>
                      </div>
                      <Badge variant={availableCount > 1 ? "default" : availableCount === 1 ? "secondary" : "destructive"}>
                        {availableCount} profesional{availableCount !== 1 ? 'es' : ''} disponible{availableCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {professionals.map(prof => {
                        const isAvailable = isProfessionalAvailable(schedule.id, prof.id);
                        return (
                          <div key={prof.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor={`${schedule.id}-${prof.id}`} className="flex-1">
                              {prof.name}
                            </Label>
                            <Switch
                              id={`${schedule.id}-${prof.id}`}
                              checked={isAvailable}
                              onCheckedChange={(checked) => 
                                handleToggleProfessional(schedule.id, prof.id, prof.name, isAvailable)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Cómo funciona:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Si hay 1 profesional disponible: máximo 1 cita por franja horaria</li>
              <li>Si hay 2 profesionales disponibles: máximo 2 citas por franja horaria</li>
              <li>Las franjas son de 2 horas fijas más 30 minutos de limpieza</li>
              <li>Los horarios se configuran en la sección de Configuración de Franjas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalAvailabilityManager;