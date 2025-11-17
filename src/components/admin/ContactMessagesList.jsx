import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Eye, Trash2, Search, Calendar, Filter, User, MessageSquare, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ContactMessagesList = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });

  const statusConfig = {
    nuevo: {
      label: 'Nuevo',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Mail className="w-3 h-3" />
    },
    leido: {
      label: 'Leído',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Eye className="w-3 h-3" />
    },
    respondido: {
      label: 'Respondido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />
    },
    archivado: {
      label: 'Archivado',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <Clock className="w-3 h-3" />
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    let filtered = [...messages];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(message =>
        message.name.toLowerCase().includes(searchLower) ||
        message.email.toLowerCase().includes(searchLower) ||
        message.message.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(message => message.status === filters.status);
    }

    // Filtro de fecha
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(message => 
        new Date(message.created_at) >= startDate
      );
    }

    setFilteredMessages(filtered);
  }, [messages, filters]);

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    setShowViewModal(true);
    
    // Marcar como leído si es nuevo
    if (message.status === 'nuevo') {
      await updateMessageStatus(message.id, 'leido');
    }
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: newStatus } : msg
      ));

      toast({
        title: "Estado actualizado",
        description: `Mensaje marcado como ${statusConfig[newStatus].label.toLowerCase()}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje.",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje ha sido eliminado correctamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mensajes de Contacto</h2>
            <p className="text-gray-600">{filteredMessages.length} mensaje(s) encontrado(s)</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar mensajes..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="nuevo">Nuevos</SelectItem>
            <SelectItem value="leido">Leídos</SelectItem>
            <SelectItem value="respondido">Respondidos</SelectItem>
            <SelectItem value="archivado">Archivados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el tiempo</SelectItem>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setFilters({ search: '', status: 'all', dateRange: 'all' })}
          className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
        >
          <X className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      </div>

      {/* Lista de mensajes */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay mensajes que coincidan con los filtros</p>
            <p>Intenta ajustar los criterios de búsqueda</p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const statusInfo = statusConfig[message.status];
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-white to-blue-50/30 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#0378A6]/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#0378A6]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{message.name}</h3>
                        <p className="text-sm text-gray-600">{message.email}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm line-clamp-2 mb-3 ml-13">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center gap-3 ml-13">
                      <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(message.created_at), "d MMM yyyy 'a las' h:mm a", { locale: es })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMessage(message)}
                      className="text-[#0378A6] hover:bg-[#0378A6]/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Select value={message.status} onValueChange={(value) => updateMessageStatus(message.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo</SelectItem>
                        <SelectItem value="leido">Leído</SelectItem>
                        <SelectItem value="respondido">Respondido</SelectItem>
                        <SelectItem value="archivado">Archivado</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMessage(message.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal de vista detallada */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#0378A6] to-[#F26513] text-white rounded-t-xl p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-normal text-white flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              Mensaje de Contacto
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              {/* Información del remitente */}
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre</label>
                    <p className="font-semibold text-gray-800">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="font-semibold text-gray-800">{selectedMessage.email}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Fecha de envío</label>
                  <p className="font-semibold text-gray-800">
                    {format(new Date(selectedMessage.created_at), "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Mensaje</label>
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Estado actual */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Estado actual</label>
                  <Badge className={`${statusConfig[selectedMessage.status].color} flex items-center gap-1 w-fit`}>
                    {statusConfig[selectedMessage.status].icon}
                    {statusConfig[selectedMessage.status].label}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'respondido')}
                    className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Respondido
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ContactMessagesList;