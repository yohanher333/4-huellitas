import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building2,
  CheckCircle,
  Loader2,
  User,
  Receipt,
  Sparkles,
  ShoppingBag,
  ArrowRight
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

const paymentMethods = [
  { id: 'cash', label: 'Efectivo', icon: Banknote, gradient: 'from-green-500 to-emerald-600' },
  { id: 'card', label: 'Tarjeta', icon: CreditCard, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'transfer', label: 'Transferencia', icon: Building2, gradient: 'from-purple-500 to-violet-600' },
  { id: 'nequi', label: 'Nequi', icon: Smartphone, gradient: 'from-pink-500 to-rose-600' },
  { id: 'daviplata', label: 'Daviplata', icon: Smartphone, gradient: 'from-red-500 to-orange-600' },
];

const POSCheckoutModal = ({ 
  isOpen, 
  onClose, 
  cart, 
  customer, 
  subtotal, 
  onCompleteOrder,
  loading 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  
  const total = subtotal;
  const change = parseFloat(amountReceived || 0) - total;
  
  const handleComplete = async () => {
    const result = await onCompleteOrder({
      method: paymentMethod,
      amountReceived: parseFloat(amountReceived) || total,
      details: paymentDetails
    });
    
    if (result) {
      // Reset form
      setPaymentMethod('cash');
      setAmountReceived('');
      setPaymentDetails('');
    }
  };
  
  const quickAmounts = [10000, 20000, 50000, 100000];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0378A6] to-[#025d80] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Receipt className="w-5 h-5" />
              </div>
              Finalizar Venta
            </DialogTitle>
          </DialogHeader>
          
          {/* Total destacado */}
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-sm">Total a cobrar</p>
              <p className="text-4xl font-bold mt-1">{formatPrice(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">{cart.length} productos</p>
              <p className="text-sm text-white/70">{cart.reduce((sum, item) => sum + item.quantity, 0)} artículos</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda - Resumen */}
            <div className="space-y-4">
              {/* Info cliente */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#0378A6]/10 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0378A6]" />
                  </div>
                  <span className="font-semibold text-gray-800">Cliente</span>
                </div>
                {customer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl flex items-center justify-center text-white font-bold">
                      {(customer.name || customer.full_name)?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{customer.name || customer.full_name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Cliente Mostrador</p>
                )}
              </div>
              
              {/* Resumen de productos */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-800">Productos</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-800">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Columna derecha - Método de pago */}
            <div className="space-y-4">
              {/* Métodos de pago */}
              <div>
                <Label className="text-sm font-semibold mb-3 block text-gray-700">
                  Método de pago
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    
                    return (
                      <motion.button
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'border-[#0378A6] bg-[#0378A6]/5 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${method.gradient} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-[#0378A6]' : 'text-gray-700'
                        }`}>
                          {method.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-[#0378A6] ml-auto" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* Monto recibido (solo para efectivo) */}
              {paymentMethod === 'cash' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                    Monto recibido
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="text-xl h-14 rounded-xl font-bold text-center"
                  />
                  
                  {/* Botones de monto rápido */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountReceived(total.toString())}
                      className="text-xs rounded-full"
                    >
                      Exacto
                    </Button>
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmountReceived(amount.toString())}
                        className="text-xs rounded-full"
                      >
                        {formatPrice(amount)}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Cambio */}
                  {parseFloat(amountReceived) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl ${
                        change >= 0 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                          : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${
                          change >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {change >= 0 ? 'Cambio a devolver' : 'Falta'}
                        </span>
                        <span className={`text-2xl font-bold ${
                          change >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatPrice(Math.abs(change))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
              
              {/* Detalles adicionales */}
              <div>
                <Label htmlFor="details" className="text-sm font-semibold text-gray-700">
                  Referencia (opcional)
                </Label>
                <Textarea
                  id="details"
                  placeholder="Últimos 4 dígitos, referencia..."
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  rows={2}
                  className="mt-2 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 h-12 rounded-xl"
            >
              Cancelar
            </Button>
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              onClick={handleComplete}
              disabled={loading || (paymentMethod === 'cash' && change < 0)}
              className={`flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || (paymentMethod === 'cash' && change < 0)
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Completar Venta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default POSCheckoutModal;
