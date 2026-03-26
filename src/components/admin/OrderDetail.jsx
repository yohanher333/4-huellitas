import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  Loader2, 
  Calendar,
  Clock,
  User,
  Package,
  Store,
  Globe,
  MessageCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  FileText
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

// Configuración de estados
const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  processing: { label: 'En Proceso', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
};

const paymentStatusConfig = {
  awaiting_payment: { label: 'Por Pagar', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  partial: { label: 'Pago Parcial', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800 border-green-200' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const sourceConfig = {
  pos: { label: 'Tienda Física', icon: Store, color: 'text-blue-600 bg-blue-50' },
  web: { label: 'Tienda Web', icon: Globe, color: 'text-green-600 bg-green-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' }
};

const paymentMethodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata'
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch pedido
  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido",
        variant: "destructive"
      });
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Actualizar estado del pedido
  const updateOrderStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Pedido actualizado a "${statusConfig[newStatus]?.label}"`
      });

      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Actualizar estado de pago
  const updatePaymentStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pago actualizado",
        description: `Estado de pago actualizado a "${paymentStatusConfig[newStatus]?.label}"`
      });

      setOrder(prev => ({ ...prev, payment_status: newStatus }));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pago",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Eliminar pedido
  const deleteOrder = async () => {
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

      navigate('/admin/orders');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#0378A6]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Pedido no encontrado</p>
        <Button variant="link" onClick={() => navigate('/admin/orders')}>
          Volver a pedidos
        </Button>
      </div>
    );
  }

  const SourceIcon = sourceConfig[order.source]?.icon || Store;
  const orderNumber = order.order_number || order.id?.slice(-6).toUpperCase();

  return (
    <div className="space-y-6 -m-4 md:-m-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#0378A6]/10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin/orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-[#0378A6]" />
              <span className="bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">Pedido #{orderNumber}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {format(new Date(order.created_at), "EEEE d 'de' MMMM, yyyy - HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig[order.status]?.color} border px-3 py-1`}>
            {statusConfig[order.status]?.label}
          </Badge>
          <Badge className={`${paymentStatusConfig[order.payment_status]?.color} border px-3 py-1`}>
            {paymentStatusConfig[order.payment_status]?.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productos */}
          <Card className="shadow-lg shadow-[#0378A6]/10 bg-white/95 backdrop-blur-sm border border-[#0378A6]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0378A6]" />
                Productos ({order.products?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.products?.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.quantity} x {formatPrice(product.base_price)}
                      </p>
                    </div>
                    <p className="font-bold text-[#0378A6]">
                      {formatPrice(product.totalPrice)}
                    </p>
                  </motion.div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#0378A6]">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {order.shipping_details?.orderNotes && (
            <Card className="shadow-sm border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <FileText className="w-5 h-5" />
                  Notas del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-800">{order.shipping_details.orderNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Detalles de pago */}
          {order.shipping_details?.paymentDetails && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0378A6]" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Método</span>
                    <span className="font-medium">
                      {paymentMethodLabels[order.shipping_details?.paymentMethod] || order.shipping_details?.paymentMethod}
                    </span>
                  </div>
                  {order.shipping_details?.paymentDetails && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referencia</span>
                      <span className="font-medium">{order.shipping_details.paymentDetails}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Origen */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Origen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-3 p-3 rounded-lg ${sourceConfig[order.source]?.color}`}>
                <SourceIcon className="w-6 h-6" />
                <span className="font-medium">{sourceConfig[order.source]?.label}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#0378A6]" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0378A6] flex items-center justify-center text-white font-bold text-lg">
                  {order.shipping_details?.fullName?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.shipping_details?.fullName || 'Cliente Mostrador'}
                  </p>
                </div>
              </div>

              {order.shipping_details?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{order.shipping_details.phone}</span>
                </div>
              )}

              {order.shipping_details?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{order.shipping_details.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestión de estados */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Gestionar Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado del Pedido</label>
                <Select
                  value={order.status}
                  onValueChange={updateOrderStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado del Pago</label>
                <Select
                  value={order.payment_status}
                  onValueChange={updatePaymentStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Pedido
              </Button>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0378A6]" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID del Pedido</span>
                <span className="font-mono text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actualizado</span>
                <span>{format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AlertDialog de confirmación de eliminación */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el pedido #{orderNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
