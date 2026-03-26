import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Receipt, 
  Loader2, 
  Calendar,
  Clock,
  User,
  Package,
  CreditCard
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

const POSOrderHistoryModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('source', 'pos')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, fetchOrders]);

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      nequi: 'Nequi',
      daviplata: 'Daviplata'
    };
    return methods[method] || method;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completado', variant: 'default', className: 'bg-green-500' },
      pending: { label: 'Pendiente', variant: 'outline', className: 'text-yellow-600 border-yellow-300' },
      cancelled: { label: 'Cancelado', variant: 'destructive', className: '' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0378A6] to-teal-600 p-5 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg">Historial de Ventas</span>
                <p className="text-sm text-white/70 font-normal mt-0.5">
                  {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0378A6]/20 to-teal-100 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#0378A6]" />
            </div>
            <p className="text-gray-500">Cargando historial...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-4 ring-slate-100">
              <Receipt className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium">No hay ventas hoy</p>
            <p className="text-sm text-gray-400 mt-1">Las ventas realizadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lista de pedidos */}
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {orders.map((order) => (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedOrder?.id === order.id
                        ? 'border-[#0378A6] bg-gradient-to-r from-[#0378A6]/10 to-teal-50 shadow-md shadow-[#0378A6]/10'
                        : 'border-slate-100 hover:border-[#0378A6]/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          #{order.id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(order.created_at), 'HH:mm', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.shipping_details?.fullName || 'Cliente Mostrador'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0378A6]">
                          {formatPrice(order.total_amount)}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>

            {/* Detalle del pedido seleccionado */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50/30 rounded-xl p-4 border border-slate-100">
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">
                      Pedido #{selectedOrder.id?.slice(-6).toUpperCase()}
                    </h4>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedOrder.created_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      {selectedOrder.shipping_details?.fullName || 'Cliente Mostrador'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4" />
                      {getPaymentMethodLabel(selectedOrder.shipping_details?.paymentMethod)}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Productos
                    </h5>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedOrder.products?.map((product, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {product.quantity}x {product.name}
                            </span>
                            <span className="font-medium">
                              {formatPrice(product.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#0378A6]">
                        {formatPrice(selectedOrder.total_amount)}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.shipping_details?.orderNotes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Notas:</strong> {selectedOrder.shipping_details.orderNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-gray-50 rounded-2xl flex items-center justify-center mb-3">
                    <Receipt className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-center font-medium">Selecciona un pedido</p>
                  <p className="text-sm text-gray-400 mt-1">para ver los detalles</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default POSOrderHistoryModal;
