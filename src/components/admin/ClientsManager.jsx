import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  Star,
  Loader2,
  UserPlus,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Store,
  Globe,
  MessageCircle,
  UserCheck,
  Building2,
  X,
  FileText,
  Tag
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

// Configuración de tipos de cliente
const customerTypeConfig = {
  regular: { label: 'Regular', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  mayorista: { label: 'Mayorista', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  vip: { label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  empresa: { label: 'Empresa', color: 'bg-purple-100 text-purple-700 border-purple-200' }
};

// Configuración de origen
const sourceConfig = {
  pos: { label: 'Tienda Física', icon: Store, color: 'text-blue-600 bg-blue-50' },
  web: { label: 'Tienda Web', icon: Globe, color: 'text-green-600 bg-green-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
  referido: { label: 'Referido', icon: UserCheck, color: 'text-orange-600 bg-orange-50' },
  otro: { label: 'Otro', icon: Users, color: 'text-gray-600 bg-gray-50' }
};

// Configuración de tipos de documento
const documentTypes = [
  { id: 'CC', label: 'Cédula de Ciudadanía' },
  { id: 'CE', label: 'Cédula de Extranjería' },
  { id: 'NIT', label: 'NIT' },
  { id: 'TI', label: 'Tarjeta de Identidad' },
  { id: 'PP', label: 'Pasaporte' },
  { id: 'OTRO', label: 'Otro' }
];

// Tarjeta de cliente
const CustomerCard = ({ customer, onEdit, onDelete, onView }) => {
  const SourceIcon = sourceConfig[customer.source]?.icon || Users;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white/90 backdrop-blur-sm rounded-2xl border border-[#0378A6]/20 hover:border-[#0378A6]/40 shadow-lg shadow-[#0378A6]/10 hover:shadow-xl hover:shadow-[#0378A6]/15 transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0378A6] to-[#025d80] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#0378A6]/30">
                {customer.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              {customer.customer_type === 'vip' && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </div>
            
            {/* Info principal */}
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${customerTypeConfig[customer.customer_type]?.color} border text-xs`}>
                  {customerTypeConfig[customer.customer_type]?.label}
                </Badge>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${sourceConfig[customer.source]?.color}`}>
                  <SourceIcon className="w-3 h-3" />
                  <span>{sourceConfig[customer.source]?.label}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(customer)}>
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(customer)}>
              <Edit className="w-4 h-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(customer)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        
        {/* Detalles de contacto */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#0378A6]" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
              <Mail className="w-4 h-4 text-[#0378A6]" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-[#0378A6]" />
              <span>{customer.city}</span>
            </div>
          )}
          {customer.document_number && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4 text-[#0378A6]" />
              <span>{customer.document_type}: {customer.document_number}</span>
            </div>
          )}
        </div>
        
        {/* Estadísticas */}
        <div className="mt-4 pt-4 border-t border-[#0378A6]/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-[#0378A6]/60">Compras</p>
              <p className="font-bold text-[#0378A6]">{formatPrice(customer.total_purchases || 0)}</p>
            </div>
            <div className="h-8 w-px bg-[#0378A6]/20" />
            <div className="text-center">
              <p className="text-xs text-[#0378A6]/60">Pedidos</p>
              <p className="font-bold text-[#025d80]">{customer.total_orders || 0}</p>
            </div>
          </div>
          
          {customer.last_purchase_date && (
            <p className="text-xs text-gray-400">
              Última compra: {format(new Date(customer.last_purchase_date), 'd MMM yyyy', { locale: es })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Modal de formulario de cliente
const CustomerFormModal = ({ isOpen, onClose, customer, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document_type: 'CC',
    document_number: '',
    birth_date: '',
    address: '',
    city: '',
    neighborhood: '',
    customer_type: 'regular',
    source: 'pos',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document_type: customer.document_type || 'CC',
        document_number: customer.document_number || '',
        birth_date: customer.birth_date || '',
        address: customer.address || '',
        city: customer.city || '',
        neighborhood: customer.neighborhood || '',
        customer_type: customer.customer_type || 'regular',
        source: customer.source || 'pos',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        document_type: 'CC',
        document_number: '',
        birth_date: '',
        address: '',
        city: '',
        neighborhood: '',
        customer_type: 'regular',
        source: 'pos',
        notes: ''
      });
    }
  }, [customer, isOpen]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        birth_date: formData.birth_date || null
      };
      
      if (customer?.id) {
        // Actualizar
        const { error } = await supabase
          .from('store_customers')
          .update(dataToSave)
          .eq('id', customer.id);
          
        if (error) throw error;
        toast({ title: "Cliente actualizado", description: "Los datos se guardaron correctamente" });
      } else {
        // Crear
        const { error } = await supabase
          .from('store_customers')
          .insert([dataToSave]);
          
        if (error) throw error;
        toast({ title: "Cliente creado", description: "El cliente se registró correctamente" });
      }
      
      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el cliente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0378A6] to-[#025d80] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {customer ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información personal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#0378A6] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0378A6]" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del cliente"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="300 123 4567"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="document_type">Tipo de documento</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="document_number">Número de documento</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="1234567890"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#0378A6] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0378A6]" />
              Dirección
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle 123 # 45-67"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ciudad"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="neighborhood">Barrio</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Barrio"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Información comercial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#0378A6] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#0378A6]" />
              Información Comercial
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_type">Tipo de cliente</Label>
                <Select
                  value={formData.customer_type}
                  onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(customerTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="source">Origen</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas u observaciones sobre el cliente..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0378A6] hover:bg-[#026080]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {customer ? 'Actualizar' : 'Crear Cliente'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Modal de detalle de cliente
const CustomerDetailModal = ({ isOpen, onClose, customer, onEdit }) => {
  if (!customer) return null;
  
  const SourceIcon = sourceConfig[customer.source]?.icon || Users;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#0378A6] to-[#025d80] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
              {customer.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-0">
                  {customerTypeConfig[customer.customer_type]?.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#0378A6] text-sm">Contacto</h3>
            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-3 p-3 bg-[#0378A6]/5 rounded-xl">
                  <Phone className="w-5 h-5 text-[#0378A6]" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 p-3 bg-[#0378A6]/5 rounded-xl">
                  <Mail className="w-5 h-5 text-[#0378A6]" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 p-3 bg-[#0378A6]/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-[#0378A6]" />
                  <span>{customer.address}{customer.city ? `, ${customer.city}` : ''}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Documento */}
          {customer.document_number && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#0378A6] text-sm">Documento</h3>
              <div className="flex items-center gap-3 p-3 bg-[#0378A6]/5 rounded-xl">
                <CreditCard className="w-5 h-5 text-[#0378A6]" />
                <span>{customer.document_type}: {customer.document_number}</span>
              </div>
            </div>
          )}
          
          {/* Estadísticas */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#0378A6] text-sm">Historial de Compras</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-[#0378A6]/10 to-[#0378A6]/20 rounded-xl border border-[#0378A6]/20">
                <p className="text-xs text-[#0378A6] font-medium">Total Compras</p>
                <p className="text-2xl font-bold text-[#025d80] mt-1">
                  {formatPrice(customer.total_purchases || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#0378A6]/10 to-[#0378A6]/20 rounded-xl border border-[#0378A6]/20">
                <p className="text-xs text-[#0378A6] font-medium">Pedidos</p>
                <p className="text-2xl font-bold text-[#025d80] mt-1">
                  {customer.total_orders || 0}
                </p>
              </div>
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#0378A6] text-sm">Información Adicional</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#0378A6]/5 rounded-xl">
                <span className="text-gray-500 text-sm">Origen</span>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#0378A6]/10 text-[#0378A6]">
                  <SourceIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{sourceConfig[customer.source]?.label}</span>
                </div>
              </div>
              {customer.birth_date && (
                <div className="flex items-center justify-between p-3 bg-[#0378A6]/5 rounded-xl">
                  <span className="text-gray-500 text-sm">Fecha de Nacimiento</span>
                  <span className="font-medium">{format(new Date(customer.birth_date), 'd MMMM yyyy', { locale: es })}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-[#0378A6]/5 rounded-xl">
                <span className="text-gray-500 text-sm">Cliente desde</span>
                <span className="font-medium">{format(new Date(customer.created_at), 'd MMMM yyyy', { locale: es })}</span>
              </div>
            </div>
          </div>
          
          {/* Notas */}
          {customer.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#0378A6] text-sm">Notas</h3>
              <div className="p-4 bg-[#0378A6]/5 border border-[#0378A6]/20 rounded-xl">
                <p className="text-[#025d80] text-sm">{customer.notes}</p>
              </div>
            </div>
          )}
          
          {/* Botón editar */}
          <Button
            onClick={() => { onClose(); onEdit(customer); }}
            className="w-full bg-[#0378A6] hover:bg-[#026080]"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal
const ClientsManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    thisMonth: 0,
    totalRevenue: 0
  });

  // Fetch clientes
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_customers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCustomers(data || []);
      
      // Calcular estadísticas
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStats({
        total: data?.length || 0,
        vip: data?.filter(c => c.customer_type === 'vip').length || 0,
        thisMonth: data?.filter(c => new Date(c.created_at) >= startOfMonth).length || 0,
        totalRevenue: data?.reduce((sum, c) => sum + (parseFloat(c.total_purchases) || 0), 0) || 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.document_number?.includes(searchTerm);
    
    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    const matchesSource = filterSource === 'all' || customer.source === filterSource;
    
    return matchesSearch && matchesType && matchesSource;
  });

  // Eliminar cliente
  const deleteCustomer = async (customerId) => {
    try {
      const { error } = await supabase
        .from('store_customers')
        .update({ is_active: false })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Cliente eliminado",
        description: "El cliente se eliminó correctamente"
      });

      fetchCustomers();
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    }
  };

  // Handlers
  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleNew = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 -m-4 md:-m-6 p-4 md:p-6 min-h-screen bg-gradient-to-b from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">Clientes</h1>
            <p className="text-sm text-gray-500">Gestiona los clientes de tu tienda</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchCustomers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNew}
            className="bg-gradient-to-r from-[#0378A6] to-[#025d80] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-[#0378A6]/30"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </motion.button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 hover:shadow-xl hover:shadow-[#0378A6]/20 transition-all cursor-default"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0378A6]/40">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#0378A6] font-semibold uppercase tracking-wide">Total Clientes</p>
              <p className="text-4xl font-black bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 hover:shadow-xl hover:shadow-[#0378A6]/20 transition-all cursor-default"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0378A6]/40">
              <Star className="w-7 h-7 text-white fill-white/30" />
            </div>
            <div>
              <p className="text-sm text-[#0378A6] font-semibold uppercase tracking-wide">Clientes VIP</p>
              <p className="text-4xl font-black bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">{stats.vip}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 hover:shadow-xl hover:shadow-[#0378A6]/20 transition-all cursor-default"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0378A6]/40">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#0378A6] font-semibold uppercase tracking-wide">Este Mes</p>
              <p className="text-4xl font-black bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">{stats.thisMonth}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-[#0378A6] via-[#0378A6] to-[#025d80] rounded-2xl p-5 shadow-xl shadow-[#0378A6]/40 hover:shadow-2xl hover:shadow-[#0378A6]/50 transition-all cursor-default"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/90 font-semibold uppercase tracking-wide">Total Ventas</p>
              <p className="text-3xl font-black text-white">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email, teléfono o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] rounded-xl">
                <Tag className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(customerTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[160px] rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {Object.entries(sourceConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-[#0378A6]" />
          <p className="text-gray-500 mt-4">Cargando clientes...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10">
          <div className="w-20 h-20 bg-[#0378A6]/10 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-[#0378A6]/40" />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron clientes</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm ? 'Intenta con otra búsqueda' : 'Agrega tu primer cliente'}
          </p>
          {!searchTerm && (
            <Button onClick={handleNew} className="mt-4 bg-[#0378A6] hover:bg-[#026080]">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEdit}
                onDelete={(c) => setDeleteConfirm(c)}
                onView={handleView}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de formulario */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedCustomer(null); }}
        customer={selectedCustomer}
        onSave={fetchCustomers}
      />

      {/* Modal de detalle */}
      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedCustomer(null); }}
        customer={selectedCustomer}
        onEdit={handleEdit}
      />

      {/* AlertDialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al cliente "{deleteConfirm?.name}" de tu lista.
              El cliente no se eliminará permanentemente y podrá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCustomer(deleteConfirm?.id)}
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

export default ClientsManager;
