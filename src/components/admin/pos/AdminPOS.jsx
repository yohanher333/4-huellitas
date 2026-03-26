import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  History,
  Store,
  Zap,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import POSProductGrid from './POSProductGrid';
import POSCart from './POSCart';
import POSCheckoutModal from './POSCheckoutModal';
import POSCustomerSelector from './POSCustomerSelector';
import POSOrderHistoryModal from './POSOrderHistoryModal';

// Formatear precio en COP
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

const AdminPOS = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [dailyStats, setDailyStats] = useState({ total: 0, count: 0, lastOrder: null });
  const [loading, setLoading] = useState(false);

  // Fetch estadísticas del día
  const fetchDailyStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, order_number')
        .eq('source', 'pos')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      setDailyStats({ 
        total, 
        count: data?.length || 0,
        lastOrder: data?.[0] || null
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  // Agregar producto al carrito
  const addProductToCart = useCallback((product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { 
        ...product, 
        quantity: 1, 
        unitPrice: parseFloat(product.price) || 0
      }];
    });
    
    toast({
      title: "Producto agregado",
      description: `${product.name} añadido al carrito`,
      duration: 1500
    });
  }, []);

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderNotes('');
  };

  // Abrir checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrito vacío',
        description: 'Agrega productos antes de continuar.',
      });
      return;
    }
    setIsCheckoutOpen(true);
  };

  // Completar pedido
  const handleCompleteOrder = async (paymentDetails) => {
    setLoading(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const total = subtotal;

      // Crear objeto de pedido
      const orderData = {
        total_amount: total,
        status: 'completed',
        payment_status: 'paid',
        source: 'pos',
        created_by_user_id: user?.id,
        user_id: selectedCustomer?.id || null,
        shipping_details: {
          fullName: selectedCustomer?.name || selectedCustomer?.full_name || 'Cliente Mostrador',
          email: selectedCustomer?.email || '',
          phone: selectedCustomer?.phone || '',
          orderNotes: orderNotes,
          shippingType: 'pickup',
          paymentMethod: paymentDetails.method,
          paymentDetails: paymentDetails.details || ''
        },
        products: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          base_price: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity
        }))
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock de productos
      for (const item of cart) {
        // Obtener stock actual
        const { data: productData } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();
        
        if (productData) {
          const newStock = Math.max(0, (productData.stock_quantity || 0) - item.quantity);
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.id);
          
          if (stockError) {
            console.error('Error updating stock:', stockError);
          }
        }
      }

      toast({
        title: '¡Venta completada!',
        description: `Pedido #${data.id?.slice(-6).toUpperCase()} registrado exitosamente.`,
      });

      // Limpiar y actualizar stats
      clearCart();
      setIsCheckoutOpen(false);
      fetchDailyStats();
      
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo completar el pedido'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-100 via-blue-50/30 to-teal-50/40 -m-4 md:-m-6">
      {/* Header tipo POS */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/50 border-b border-slate-200/80 shadow-sm px-4 md:px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Punto de Venta
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
          
          {/* Stats minimalistas */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Ventas del día */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 lg:flex-initial bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl px-5 py-3 shadow-lg shadow-emerald-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-xs font-medium text-white/80">Ventas Hoy</p>
                  <p className="text-lg font-bold">{formatPrice(dailyStats.total)}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Contador de ventas */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Pedidos</p>
                  <p className="text-lg font-bold text-gray-800">{dailyStats.count}</p>
                </div>
              </div>
            </motion.div>

            {/* Botón historial */}
            <Button 
              variant="outline" 
              onClick={() => setIsHistoryOpen(true)}
              className="h-[62px] px-4 rounded-2xl border-2 hover:bg-slate-50 hover:border-slate-300"
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid POS */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">
        {/* Panel izquierdo - Cliente */}
        <div className="lg:col-span-3 bg-gradient-to-b from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15 border-r border-[#0378A6]/20 overflow-auto">
          <div className="p-4">
            <POSCustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
              orderNotes={orderNotes}
              onOrderNotesChange={setOrderNotes}
            />
          </div>
        </div>

        {/* Panel central - Productos */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white via-slate-50 to-[#0378A6]/5 overflow-hidden">
          <POSProductGrid onProductSelect={addProductToCart} />
        </div>

        {/* Panel derecho - Carrito */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15 border-l border-[#0378A6]/20 overflow-hidden shadow-[-4px_0_20px_rgba(3,120,166,0.1)]">
          <POSCart
            cart={cart}
            setCart={setCart}
            onCheckout={handleCheckout}
            onClear={clearCart}
          />
        </div>
      </div>

      {/* Modales */}
      <POSCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        customer={selectedCustomer}
        subtotal={cartSubtotal}
        onCompleteOrder={handleCompleteOrder}
        loading={loading}
      />

      <POSOrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default AdminPOS;
