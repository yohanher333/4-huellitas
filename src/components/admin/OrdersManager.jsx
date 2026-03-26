import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Receipt, 
  Search, 
  Loader2, 
  Calendar,
  Clock,
  User,
  Package,
  CreditCard,
  Eye,
  Filter,
  RefreshCw,
  Store,
  Globe,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  DollarSign,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear precio en COP
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

// Configuración de estados con colores vibrantes
const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock, dotColor: 'bg-amber-500' },
  received: { label: 'Recibido', color: 'bg-sky-50 text-sky-700 border-sky-300', icon: CheckCircle, dotColor: 'bg-sky-500' },
  processing: { label: 'En Proceso', color: 'bg-violet-50 text-violet-700 border-violet-300', icon: Package, dotColor: 'bg-violet-500' },
  completed: { label: 'Completado', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle, dotColor: 'bg-emerald-500' },
  cancelled: { label: 'Cancelado', color: 'bg-rose-50 text-rose-700 border-rose-300', icon: XCircle, dotColor: 'bg-rose-500' }
};

const paymentStatusConfig = {
  awaiting_payment: { label: 'Por Pagar', color: 'bg-orange-50 text-orange-700 border-orange-300', dotColor: 'bg-orange-500' },
  partial: { label: 'Pago Parcial', color: 'bg-amber-50 text-amber-700 border-amber-300', dotColor: 'bg-amber-500' },
  paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', dotColor: 'bg-emerald-500' },
  refunded: { label: 'Reembolsado', color: 'bg-slate-50 text-slate-700 border-slate-300', dotColor: 'bg-slate-500' }
};

const sourceConfig = {
  pos: { label: 'Tienda', icon: Store, color: 'text-[#0378A6]', bgColor: 'bg-[#0378A6]/10' },
  web: { label: 'Web', icon: Globe, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-50' }
};

const OrdersManager = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch pedidos
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterPayment !== 'all') {
        query = query.eq('payment_status', filterPayment);
      }

      if (filterSource !== 'all') {
        query = query.eq('source', filterSource);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPayment, filterSource]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtrar por búsqueda
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.id?.toLowerCase().includes(term) ||
      order.order_number?.toLowerCase().includes(term) ||
      order.shipping_details?.fullName?.toLowerCase().includes(term) ||
      order.shipping_details?.phone?.toLowerCase().includes(term) ||
      order.shipping_details?.email?.toLowerCase().includes(term)
    );
  });

  // Ver detalle del pedido
  const viewOrderDetail = (order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  // Eliminar pedido
  const deleteOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente"
      });

      fetchOrders();
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    }
  };

  // Calcular estadísticas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0)
  };

  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/5"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl shadow-lg">
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
              Gestión de Pedidos
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Administra y rastrea todos los pedidos
            </p>
          </div>
        </div>

        <Button 
          onClick={fetchOrders} 
          className="bg-[#0378A6] hover:bg-[#025d80] text-white shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-white/90 backdrop-blur-sm shadow-md border-l-4 border-l-[#0378A6] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/10 rounded-xl">
                <Receipt className="w-6 h-6 text-[#0378A6]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Pedidos</p>
                <p className="text-2xl font-bold text-[#0378A6]">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-md border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-md border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Completados</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-md border-l-4 border-l-[#F26513] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#F26513]/20 to-[#F26513]/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-[#F26513]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Ingresos</p>
                <p className="text-xl font-bold text-[#F26513]">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-md bg-white/90 backdrop-blur-sm border-[#0378A6]/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-[#0378A6]" />
              <span className="text-sm font-medium text-gray-600">Filtros</span>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0378A6]" />
                <Input
                  placeholder="Buscar por ID, cliente, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px] border-[#0378A6]/20 focus:ring-[#0378A6]/20">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full md:w-[180px] border-[#0378A6]/20 focus:ring-[#0378A6]/20">
                  <SelectValue placeholder="Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  {Object.entries(paymentStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-full md:w-[160px] border-[#0378A6]/20 focus:ring-[#0378A6]/20">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(sourceConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de pedidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-lg bg-white/90 backdrop-blur-sm border-[#0378A6]/10 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#0378A6]/20 rounded-full"></div>
                  <div className="absolute top-0 w-16 h-16 border-4 border-transparent border-t-[#0378A6] rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-500 font-medium">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[#0378A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-10 h-10 text-[#0378A6]/40" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No hay pedidos</p>
                <p className="text-sm text-gray-500 mt-1">Los pedidos aparecerán aquí cuando se creen</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#0378A6] to-[#025d80]">
                    <tr>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Pedido</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Cliente</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Fecha</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Origen</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Estado</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Pago</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-white uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order, index) => {
                    const SourceIcon = sourceConfig[order.source]?.icon || Store;
                    const StatusIcon = statusConfig[order.status]?.icon || Clock;
                    
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-[#0378A6]/5 transition-colors duration-200 group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#0378A6]/10 rounded-lg flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-[#0378A6]" />
                            </div>
                            <p className="font-bold text-[#025d80]">
                              #{order.order_number || order.id?.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {order.shipping_details?.fullName || 'Cliente Mostrador'}
                              </p>
                              {order.shipping_details?.phone && (
                                <p className="text-xs text-gray-500">{order.shipping_details.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(order.created_at), 'dd MMM yyyy', { locale: es })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(order.created_at), 'HH:mm', { locale: es })} hrs
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${sourceConfig[order.source]?.bgColor} ${sourceConfig[order.source]?.color}`}>
                            <SourceIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{sourceConfig[order.source]?.label}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-lg font-bold text-[#0378A6]">
                            {formatPrice(order.total_amount)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${statusConfig[order.status]?.color} border font-medium px-3 py-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[order.status]?.dotColor} mr-1.5 inline-block`}></span>
                            {statusConfig[order.status]?.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${paymentStatusConfig[order.payment_status]?.color} border font-medium px-3 py-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${paymentStatusConfig[order.payment_status]?.dotColor} mr-1.5 inline-block`}></span>
                            {paymentStatusConfig[order.payment_status]?.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              className="bg-[#0378A6] hover:bg-[#025d80] text-white shadow-sm"
                              onClick={() => viewOrderDetail(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                              onClick={() => setDeleteConfirm(order)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* AlertDialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="border-red-100">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-gray-900">¿Eliminar pedido?</AlertDialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">Pedido #{deleteConfirm?.order_number || deleteConfirm?.id?.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <AlertDialogDescription className="mt-4 bg-red-50 p-3 rounded-lg border border-red-100">
              <span className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Esta acción no se puede deshacer. Se eliminará permanentemente el pedido y toda su información.</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrder(deleteConfirm?.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersManager;
