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
  Package, 
  Search, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  ArrowUpDown,
  Barcode,
  TrendingUp,
  TrendingDown,
  Box,
  Filter,
  History,
  Edit,
  Save,
  X,
  CheckCircle2,
  PackagePlus,
  PackageMinus,
  ClipboardList
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

// Componente para tarjeta de producto en inventario
const InventoryProductCard = ({ product, onAdjust, onQuickEdit }) => {
  const stockStatus = product.stock_quantity <= 0 
    ? 'out' 
    : product.stock_quantity <= product.low_stock_threshold 
      ? 'low' 
      : 'ok';
  
  const statusConfig = {
    ok: { label: 'En Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    low: { label: 'Stock Bajo', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
    out: { label: 'Agotado', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle }
  };

  const StatusIcon = statusConfig[stockStatus].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-white/90 backdrop-blur-sm rounded-2xl border shadow-lg transition-all overflow-hidden ${
        stockStatus === 'out' 
          ? 'border-red-200 shadow-red-100' 
          : stockStatus === 'low' 
            ? 'border-amber-200 shadow-amber-100' 
            : 'border-[#0378A6]/20 shadow-[#0378A6]/10 hover:border-[#0378A6]/40 hover:shadow-xl hover:shadow-[#0378A6]/15'
      }`}
    >
      <div className="flex">
        {/* Imagen del producto */}
        <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-100 flex-shrink-0 relative overflow-hidden">
          {product.main_image_url ? (
            <img 
              src={product.main_image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          {/* Badge de estado */}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[stockStatus].color}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{statusConfig[stockStatus].label}</span>
          </div>
        </div>

        {/* Info del producto */}
        <div className="flex-grow p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-gray-900 text-base truncate">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {product.sku && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    SKU: {product.sku}
                  </span>
                )}
                {product.barcode && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    {product.barcode}
                  </span>
                )}
              </div>
              {product.category_name && (
                <Badge variant="outline" className="mt-2 text-xs border-[#0378A6]/30 text-[#0378A6]">
                  {product.category_name}
                </Badge>
              )}
            </div>

            {/* Stock actual destacado */}
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-bold ${
                stockStatus === 'out' 
                  ? 'text-red-600' 
                  : stockStatus === 'low' 
                    ? 'text-amber-600' 
                    : 'text-[#0378A6]'
              }`}>
                {product.stock_quantity}
              </div>
              <div className="text-xs text-gray-500">unidades</div>
              <div className="text-xs text-gray-400 mt-1">
                Mín: {product.low_stock_threshold}
              </div>
            </div>
          </div>

          {/* Precios y acciones */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-gray-500">Precio venta</span>
                <div className="font-semibold text-gray-900">{formatPrice(product.price)}</div>
              </div>
              {product.cost_price > 0 && (
                <div>
                  <span className="text-xs text-gray-500">Costo</span>
                  <div className="font-medium text-gray-600">{formatPrice(product.cost_price)}</div>
                </div>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
                onClick={() => onQuickEdit(product)}
              >
                <Edit className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#026d99] hover:to-[#024c6d] text-white"
                onClick={() => onAdjust(product)}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Ajustar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modal de ajuste de inventario
const AdjustInventoryModal = ({ product, isOpen, onClose, onSave }) => {
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      toast({ title: "Error", description: "Ingresa una cantidad válida", variant: "destructive" });
      return;
    }

    const qty = parseInt(quantity);
    let newStock = product.stock_quantity;

    switch (adjustmentType) {
      case 'add':
        newStock = product.stock_quantity + qty;
        break;
      case 'remove':
        newStock = Math.max(0, product.stock_quantity - qty);
        break;
      case 'set':
        newStock = qty;
        break;
    }

    setLoading(true);
    
    const { error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    // Registrar movimiento en inventory_movements si existe la tabla
    try {
      await supabase.from('inventory_movements').insert({
        product_id: product.id,
        type: adjustmentType,
        quantity: qty,
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        reason: reason || null,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // La tabla puede no existir, ignorar
    }

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el inventario", variant: "destructive" });
    } else {
      toast({ 
        title: "Inventario actualizado", 
        description: `Stock de ${product.name} actualizado a ${newStock} unidades` 
      });
      onSave();
      onClose();
    }
  };

  const getPreview = () => {
    if (!quantity || parseInt(quantity) <= 0) return product.stock_quantity;
    const qty = parseInt(quantity);
    switch (adjustmentType) {
      case 'add': return product.stock_quantity + qty;
      case 'remove': return Math.max(0, product.stock_quantity - qty);
      case 'set': return qty;
      default: return product.stock_quantity;
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0378A6]">
            <ArrowUpDown className="w-5 h-5" />
            Ajustar Inventario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Producto info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {product.main_image_url ? (
              <img src={product.main_image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-500">Stock actual: <span className="font-bold text-[#0378A6]">{product.stock_quantity}</span></p>
            </div>
          </div>

          {/* Tipo de ajuste */}
          <div className="space-y-2">
            <Label>Tipo de ajuste</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                className={adjustmentType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                onClick={() => setAdjustmentType('add')}
              >
                <PackagePlus className="w-4 h-4 mr-1" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                className={adjustmentType === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setAdjustmentType('remove')}
              >
                <PackageMinus className="w-4 h-4 mr-1" />
                Salida
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'set' ? 'default' : 'outline'}
                className={adjustmentType === 'set' ? 'bg-[#0378A6] hover:bg-[#026d99]' : ''}
                onClick={() => setAdjustmentType('set')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Fijar
              </Button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label>Cantidad</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ingresa la cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Vista previa */}
          {quantity && parseInt(quantity) > 0 && (
            <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="text-center">
                <div className="text-sm text-gray-500">Actual</div>
                <div className="text-xl font-bold text-gray-600">{product.stock_quantity}</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Nuevo</div>
                <div className={`text-2xl font-bold ${
                  getPreview() > product.stock_quantity 
                    ? 'text-emerald-600' 
                    : getPreview() < product.stock_quantity 
                      ? 'text-red-600' 
                      : 'text-[#0378A6]'
                }`}>
                  {getPreview()}
                </div>
              </div>
            </div>
          )}

          {/* Razón */}
          <div className="space-y-2">
            <Label>Razón del ajuste (opcional)</Label>
            <Textarea
              placeholder="Ej: Compra de mercancía, Ajuste por inventario físico..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-[#0378A6] to-[#025d80]"
              onClick={handleSave}
              disabled={loading || !quantity || parseInt(quantity) <= 0}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Modal de edición rápida
const QuickEditModal = ({ product, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    stock_quantity: '',
    low_stock_threshold: '',
    price: '',
    cost_price: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        stock_quantity: product.stock_quantity?.toString() || '0',
        low_stock_threshold: product.low_stock_threshold?.toString() || '5',
        price: product.price?.toString() || '0',
        cost_price: product.cost_price?.toString() || ''
      });
    }
  }, [product]);

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        price: parseFloat(form.price) || 0,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el producto", variant: "destructive" });
    } else {
      toast({ title: "Producto actualizado", description: `${product.name} ha sido actualizado` });
      onSave();
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0378A6]">
            <Edit className="w-5 h-5" />
            Edición Rápida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Producto info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {product.main_image_url ? (
              <img src={product.main_image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{product.name}</h4>
              {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock actual</Label>
              <Input
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock mínimo</Label>
              <Input
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio venta</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio costo</Label>
              <Input
                type="number"
                min="0"
                placeholder="Opcional"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-[#0378A6] to-[#025d80]"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal
export default function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);

  // Cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories(name)
      `)
      .order('name');

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } else {
      const formatted = data?.map(p => ({
        ...p,
        category_name: p.product_categories?.name || null
      })) || [];
      setProducts(formatted);
    }
    
    setLoading(false);
  }, []);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    setCategories(data || []);
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    // Búsqueda
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

    // Categoría
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;

    // Estado de stock
    let matchesStock = true;
    if (filterStock === 'low') {
      matchesStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
    } else if (filterStock === 'out') {
      matchesStock = product.stock_quantity <= 0;
    } else if (filterStock === 'ok') {
      matchesStock = product.stock_quantity > product.low_stock_threshold;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Estadísticas
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock_quantity > p.low_stock_threshold).length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length,
    outOfStock: products.filter(p => p.stock_quantity <= 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0),
    totalCost: products.reduce((sum, p) => sum + ((p.cost_price || 0) * p.stock_quantity), 0)
  };

  const handleAdjust = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const handleQuickEdit = (product) => {
    setSelectedProduct(product);
    setShowQuickEditModal(true);
  };

  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-[#0378A6]/10 rounded-xl">
                <Box className="w-6 h-6 md:w-8 md:h-8 text-[#0378A6]" />
              </div>
              Inventario
            </h1>
            <p className="text-gray-500 mt-1">Gestiona el stock de tus productos</p>
          </div>
          <Button 
            variant="outline" 
            onClick={loadProducts}
            className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0378A6]/10 rounded-lg">
              <Package className="w-5 h-5 text-[#0378A6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total productos</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-4 shadow-md border border-emerald-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.inStock}</div>
              <div className="text-xs text-gray-500">En Stock</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-md border border-amber-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
              <div className="text-xs text-gray-500">Stock Bajo</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-4 shadow-md border border-red-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              <div className="text-xs text-gray-500">Agotados</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md border border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{formatPrice(stats.totalValue)}</div>
              <div className="text-xs text-gray-500">Valor inventario</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-4 shadow-md border border-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{formatPrice(stats.totalCost)}</div>
              <div className="text-xs text-gray-500">Costo total</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro categoría */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro stock */}
          <Select value={filterStock} onValueChange={setFilterStock}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Estado de stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ok">En Stock</SelectItem>
              <SelectItem value="low">Stock Bajo</SelectItem>
              <SelectItem value="out">Agotados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0378A6]" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No se encontraron productos</h3>
          <p className="text-gray-400">Intenta con otros filtros de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <InventoryProductCard
                key={product.id}
                product={product}
                onAdjust={handleAdjust}
                onQuickEdit={handleQuickEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modales */}
      <AdjustInventoryModal
        product={selectedProduct}
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedProduct(null);
        }}
        onSave={loadProducts}
      />

      <QuickEditModal
        product={selectedProduct}
        isOpen={showQuickEditModal}
        onClose={() => {
          setShowQuickEditModal(false);
          setSelectedProduct(null);
        }}
        onSave={loadProducts}
      />
    </div>
  );
}
