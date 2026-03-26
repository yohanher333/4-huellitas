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
      color: 'bg-sky-50 text-sky-700 border-sky-300',
      dotColor: 'bg-sky-500',
      icon: <Mail className="w-3 h-3" />
    },
    leido: {
      label: 'Leído',
      color: 'bg-amber-50 text-amber-700 border-amber-300',
      dotColor: 'bg-amber-500',
      icon: <Eye className="w-3 h-3" />
    },
    respondido: {
      label: 'Respondido',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dotColor: 'bg-emerald-500',
      icon: <CheckCircle className="w-3 h-3" />
    },
    archivado: {
      label: 'Archivado',
      color: 'bg-slate-50 text-slate-700 border-slate-300',
      dotColor: 'bg-slate-500',
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
      <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#0378A6]/20 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-transparent border-t-[#0378A6] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  // Stats
  const stats = {
    total: messages.length,
    nuevo: messages.filter(m => m.status === 'nuevo').length,
    leido: messages.filter(m => m.status === 'leido').length,
    respondido: messages.filter(m => m.status === 'respondido').length
  };

  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/5"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
              Mensajes de Contacto
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {filteredMessages.length} mensaje(s) encontrado(s)
            </p>
          </div>
        </div>
        {/* Mini stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-lg border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-sm font-semibold text-sky-700">{stats.nuevo}</span>
            <span className="text-xs text-sky-600">nuevos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-semibold text-emerald-700">{stats.respondido}</span>
            <span className="text-xs text-emerald-600">respondidos</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-[#0378A6] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-[#0378A6]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-[#0378A6]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-sky-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-sky-100 to-sky-50 rounded-xl">
              <Mail className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Nuevos</p>
              <p className="text-2xl font-bold text-sky-600">{stats.nuevo}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Leídos</p>
              <p className="text-2xl font-bold text-amber-600">{stats.leido}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Respondidos</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.respondido}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-[#0378A6]/10 p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-[#0378A6]" />
          <span className="text-sm font-medium text-gray-600">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0378A6] w-4 h-4" />
            <Input
              placeholder="Buscar mensajes..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
            />
          </div>
          
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="border-[#0378A6]/20 focus:ring-[#0378A6]/20">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="nuevo"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500"></span>Nuevos</span></SelectItem>
              <SelectItem value="leido"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Leídos</span></SelectItem>
              <SelectItem value="respondido"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Respondidos</span></SelectItem>
              <SelectItem value="archivado"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500"></span>Archivados</span></SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
            <SelectTrigger className="border-[#0378A6]/20 focus:ring-[#0378A6]/20">
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
            className="border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      </motion.div>

      {/* Lista de mensajes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#0378A6]/10 overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#0378A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-[#0378A6]/30" />
              </div>
              <p className="text-lg font-semibold text-gray-700">No hay mensajes</p>
              <p className="text-sm text-gray-500 mt-1">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            filteredMessages.map((message, index) => {
              const statusInfo = statusConfig[message.status];
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#0378A6]/20 transition-all duration-300 p-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/10 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-[#0378A6]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{message.name}</h3>
                          <p className="text-sm text-gray-500">{message.email}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3 ml-14 bg-gray-50 p-2 rounded-lg">
                        {message.message}
                      </p>
                      
                      <div className="flex items-center gap-3 ml-14">
                        <Badge className={`${statusInfo.color} border flex items-center gap-1.5 font-medium`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                          {statusInfo.label}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(message.created_at), "d MMM yyyy 'a las' h:mm a", { locale: es })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                        className="text-[#0378A6] hover:bg-[#0378A6]/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Select value={message.status} onValueChange={(value) => updateMessageStatus(message.id, value)}>
                        <SelectTrigger className="w-32 h-9 text-sm border-[#0378A6]/20">
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
                        <AlertDialogContent className="border-red-100">
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                              </div>
                              <AlertDialogTitle className="text-gray-900">¿Eliminar mensaje?</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100">
                              Esta acción no se puede deshacer. El mensaje de {message.name} será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="border-gray-200">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMessage(message.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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
      </motion.div>

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
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Estado actual</label>
                  <Badge className={`${statusConfig[selectedMessage.status].color} border flex items-center gap-1.5 w-fit`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedMessage.status].dotColor}`}></span>
                    {statusConfig[selectedMessage.status].label}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                    className="border-gray-200"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'respondido')}
                    className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#025d80] hover:to-[#0378A6] text-white"
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
    </div>
  );
};

export default ContactMessagesList;