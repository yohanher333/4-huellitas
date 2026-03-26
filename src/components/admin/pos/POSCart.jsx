import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  Package,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

// Formatear precio en COP
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

// Item del carrito mejorado
const CartItem = ({ item, onUpdateQuantity, onRemove, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-[#0378A6]/20 hover:border-[#0378A6]/50 hover:shadow-lg hover:shadow-[#0378A6]/10 transition-all">
      {/* Imagen del producto */}
      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
        {item.main_image_url ? (
          <img
            src={item.main_image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <Package className="w-7 h-7 text-slate-300" />
          </div>
        )}
      </div>
      
      {/* Info del producto */}
      <div className="flex-grow min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm line-clamp-1 pr-8">
            {item.name}
          </h4>
          <p className="text-[#0378A6] font-medium text-sm mt-0.5">
            {formatPrice(item.unitPrice)} c/u
          </p>
        </div>
        
        {/* Controles de cantidad */}
        <div className="flex items-center gap-1 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-600" />
          </motion.button>
          
          <span className="w-10 text-center font-bold text-gray-800">
            {item.quantity}
          </span>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-[#0378A6]/10 hover:bg-[#0378A6]/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-[#0378A6]" />
          </motion.button>
        </div>
      </div>
      
      {/* Subtotal y eliminar */}
      <div className="flex flex-col items-end justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
        
        <p className="font-bold text-gray-900 text-base">
          {formatPrice(item.unitPrice * item.quantity)}
        </p>
      </div>
    </motion.div>
  );
};

const POSCart = ({ cart, setCart, onCheckout, onClear }) => {
  // Actualizar cantidad
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }
    
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  // Eliminar item
  const removeItem = (productId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };
  
  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header del carrito */}
      <div className="flex-shrink-0 p-4 border-b border-[#0378A6]/20 bg-gradient-to-r from-[#0378A6] to-[#025d80]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              {cart.length > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                >
                  <span className="text-xs font-bold text-white">{totalItems}</span>
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-white">Carrito</h2>
              <p className="text-xs text-white/80">
                {cart.length === 0 ? 'Sin productos' : `${cart.length} producto${cart.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          {cart.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-white/20 transition-colors"
            >
              Vaciar
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Lista de productos */}
      <div className="flex-grow overflow-hidden">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="w-24 h-24 bg-white/80 rounded-3xl flex items-center justify-center mb-4 ring-4 ring-[#0378A6]/20 shadow-lg">
              <ShoppingBag className="w-12 h-12 text-[#0378A6]/50" />
            </div>
            <p className="text-[#0378A6] font-medium">Carrito vacío</p>
            <p className="text-[#0378A6]/60 text-sm mt-1 text-center">
              Selecciona productos del catálogo para comenzar
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Footer con totales y botón de cobro */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-[#0378A6]/20 via-[#0378A6]/10 to-transparent border-t border-[#0378A6]/20">
        {/* Resumen */}
        <div className="space-y-3 mb-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-[#0378A6]/20">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({totalItems} artículos)</span>
            <span className="text-gray-700 font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="h-px bg-gradient-to-r from-[#0378A6]/30 via-[#0378A6]/50 to-[#0378A6]/30" />
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total a Pagar</span>
            <motion.span 
              key={subtotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-[#0378A6]"
            >
              {formatPrice(subtotal)}
            </motion.span>
          </div>
        </div>
        
        {/* Botón de cobrar */}
        <motion.button
          whileHover={{ scale: cart.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: cart.length > 0 ? 0.98 : 1 }}
          onClick={onCheckout}
          disabled={cart.length === 0}
          className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
            cart.length > 0 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <CreditCard className="w-6 h-6" />
          <span>Procesar Cobro</span>
          {cart.length > 0 && <Sparkles className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
};

export default POSCart;
