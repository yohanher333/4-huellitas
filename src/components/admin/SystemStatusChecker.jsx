import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Database,
  Settings,
  ExternalLink,
  Clock,
  Calendar
} from 'lucide-react';

const SystemStatusChecker = () => {
  const [systemStatus, setSystemStatus] = useState({
    customSlotsExists: null,
    professionalsExists: null,
    workSchedulesExists: null,
    loading: true
  });

  const checkSystemTables = useCallback(async () => {
    const results = {
      customSlotsExists: false,
      professionalsExists: false,
      workSchedulesExists: false,
      loading: false
    };

    try {
      // Check custom_time_slots table
      const { error: customSlotsError } = await supabase
        .from('custom_time_slots')
        .select('id')
        .limit(1);
      
      results.customSlotsExists = !customSlotsError;

      // Check professionals table
      const { data: professionals, error: profsError } = await supabase
        .from('professionals')
        .select('id, name')
        .limit(1);
      
      results.professionalsExists = !profsError && professionals !== null;

      // Check work_schedules table
      const { data: schedules, error: schedulesError } = await supabase
        .from('work_schedules')
        .select('id')
        .limit(1);
      
      results.workSchedulesExists = !schedulesError && schedules !== null;

    } catch (error) {
      console.error('Error checking system tables:', error);
    }

    setSystemStatus(results);
  }, []);

  useEffect(() => {
    checkSystemTables();
  }, [checkSystemTables]);

  const { customSlotsExists, professionalsExists, workSchedulesExists, loading } = systemStatus;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      {/* Status Header */}
      <Card className="shadow-lg border-l-4 border-l-[#0378A6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-[#0378A6]" />
            Estado del Sistema de Franjas Personalizadas
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Verificación del estado de las tablas y configuración necesaria.
          </p>
        </CardHeader>
      </Card>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Custom Time Slots */}
        <Card className={`border-2 ${customSlotsExists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Franjas Personalizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={customSlotsExists ? "default" : "destructive"}>
              {customSlotsExists ? "✅ Configurado" : "❌ No Configurado"}
            </Badge>
            <p className="text-xs mt-2 text-gray-600">
              Tabla: custom_time_slots
            </p>
          </CardContent>
        </Card>

        {/* Professionals */}
        <Card className={`border-2 ${professionalsExists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={professionalsExists ? "default" : "destructive"}>
              {professionalsExists ? "✅ Disponible" : "❌ No Configurado"}
            </Badge>
            <p className="text-xs mt-2 text-gray-600">
              Tabla: professionals
            </p>
          </CardContent>
        </Card>

        {/* Work Schedules */}
        <Card className={`border-2 ${workSchedulesExists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Horarios Tradicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={workSchedulesExists ? "default" : "destructive"}>
              {workSchedulesExists ? "✅ Disponible" : "❌ No Configurado"}
            </Badge>
            <p className="text-xs mt-2 text-gray-600">
              Tabla: work_schedules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Instrucciones de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!customSlotsExists && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Configurar Sistema de Franjas Personalizadas</h3>
              <p className="text-orange-700 text-sm mb-3">
                Para habilitar el sistema de franjas personalizadas, ejecute el siguiente script en su base de datos:
              </p>
              <div className="bg-orange-100 p-3 rounded-md font-mono text-sm overflow-x-auto">
                <p className="text-orange-800">
                  database/custom-time-slots.sql
                </p>
              </div>
              <p className="text-orange-700 text-xs mt-2">
                Este script creará las tablas necesarias y configurará funciones de gestión de franjas.
              </p>
            </div>
          )}

          {customSlotsExists && !professionalsExists && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Configurar Profesionales</h3>
              <p className="text-blue-700 text-sm mb-3">
                Las franjas personalizadas requieren que haya profesionales configurados en el sistema.
              </p>
              <Button 
                onClick={() => window.open('/admin/settings/professionals-manage', '_blank')}
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Gestionar Profesionales
              </Button>
            </div>
          )}

          {customSlotsExists && professionalsExists && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Sistema Listo</h3>
              <p className="text-green-700 text-sm mb-3">
                El sistema de franjas personalizadas está configurado correctamente.
              </p>
              <Button 
                onClick={checkSystemTables}
                variant="outline" 
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Verificar Nuevamente
              </Button>
            </div>
          )}

          {workSchedulesExists && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Sistema Tradicional Disponible</h3>
              <p className="text-gray-700 text-sm mb-3">
                Mientras configura las franjas personalizadas, puede usar el sistema tradicional de horarios.
              </p>
              <Button 
                onClick={() => window.open('/admin/settings/schedule', '_blank')}
                variant="outline" 
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Configurar Horarios Tradicionales
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SystemStatusChecker;