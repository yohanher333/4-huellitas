import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, 
  UserPlus, 
  Search, 
  X, 
  Phone, 
  Mail, 
  FileText,
  Loader2,
  CheckCircle,
  Users,
  StickyNote
} from 'lucide-react';

const POSCustomerSelector = ({ 
  selectedCustomer, 
  onCustomerSelect, 
  orderNotes, 
  onOrderNotesChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar clientes
  const searchCustomers = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setCustomers([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,document_number.ilike.%${term}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchCustomers(searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, searchCustomers]);

  // Seleccionar cliente
  const handleSelectCustomer = (customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchTerm('');
    setCustomers([]);
  };

  // Limpiar cliente
  const clearCustomer = () => {
    onCustomerSelect(null);
  };

  return (
    <div className="space-y-4">
      {/* Sección de Cliente */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#0378A6]/30 overflow-hidden shadow-lg shadow-[#0378A6]/10">
        <div className="px-4 py-3 border-b border-[#0378A6]/20 bg-gradient-to-r from-[#0378A6] to-[#025d80]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-white">Cliente</h3>
          </div>
        </div>
        
        <div className="p-4">
          {selectedCustomer ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-[#0378A6]/5 to-teal-50/50 rounded-xl border border-[#0378A6]/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0378A6] to-[#025d80] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#0378A6]/30">
                    {(selectedCustomer.name || selectedCustomer.full_name)?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedCustomer.name || selectedCustomer.full_name}
                    </p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-[#0378A6]" />
                        {selectedCustomer.phone}
                      </p>
                    )}
                    {selectedCustomer.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#0378A6]" />
                        {selectedCustomer.email}
                      </p>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                  onClick={clearCustomer}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full p-5 border-2 border-dashed border-slate-200 hover:border-[#0378A6] rounded-xl hover:bg-[#0378A6]/5 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">Seleccionar Cliente</p>
                      <p className="text-xs text-gray-400 mt-0.5">o vender como "Mostrador"</p>
                    </div>
                  </div>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0378A6]/10 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#0378A6]" />
                    </div>
                    Buscar Cliente
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Nombre, teléfono, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      autoFocus
                    />
                  </div>
                  
                  {/* Resultados */}
                  <ScrollArea className="h-[300px]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0378A6]" />
                        <p className="text-sm text-gray-400 mt-3">Buscando...</p>
                      </div>
                    ) : searchTerm.length < 2 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                          <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm">Escribe al menos 2 caracteres</p>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                          <User className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm">No se encontraron clientes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customers.map((customer, idx) => (
                          <motion.button
                            key={customer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full p-4 rounded-xl border-2 border-transparent hover:border-[#0378A6] hover:bg-[#0378A6]/5 text-left transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-600 font-bold group-hover:from-[#0378A6] group-hover:to-[#025d80] group-hover:text-white transition-all">
                                {(customer.name || customer.full_name)?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="font-semibold text-gray-800 truncate">
                                  {customer.name || customer.full_name}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                  {customer.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {customer.phone}
                                    </span>
                                  )}
                                  {customer.email && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="w-3 h-3" />
                                      {customer.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <CheckCircle className="w-5 h-5 text-[#0378A6] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Sección de Notas */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#0378A6]/30 overflow-hidden shadow-lg shadow-[#0378A6]/10">
        <div className="px-4 py-3 border-b border-[#0378A6]/20 bg-gradient-to-r from-[#025d80] to-[#0378A6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-white">Notas del pedido</h3>
          </div>
        </div>
        
        <div className="p-4">
          <Textarea
            placeholder="Agregar notas o instrucciones especiales..."
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            rows={4}
            className="resize-none rounded-xl border-slate-200 focus:border-[#0378A6] bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default POSCustomerSelector;
