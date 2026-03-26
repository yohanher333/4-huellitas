import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Edit, Trash2, Plus, Package, Barcode, 
  Loader2, Search, Eye, EyeOff, Star, Copy,
  ShoppingBag, CheckCircle2, AlertTriangle, TrendingUp,
  Filter, RefreshCw, FolderTree, Settings, Upload, Check, Square, CheckSquare
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ProductImporter from './ProductImporter';

// Formatear precio en COP
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

// Componente para la tarjeta de producto en la lista
const ProductCard = ({ product, onEdit, onDelete, onToggleActive, onToggleFeatured, onDuplicate, isSelected, onToggleSelect }) => {
  const stockStatus = product.stock_quantity <= 0 
    ? 'out' 
    : product.stock_quantity <= 5 
      ? 'low' 
      : 'ok';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className={`group bg-white/90 backdrop-blur-sm rounded-2xl border shadow-lg transition-all overflow-hidden ${
        isSelected 
          ? 'border-[#0378A6] ring-2 ring-[#0378A6]/30'
          : !product.is_active 
            ? 'opacity-60 border-gray-200' 
            : stockStatus === 'out'
              ? 'border-red-200 shadow-red-100 hover:shadow-red-200'
              : stockStatus === 'low'
                ? 'border-amber-200 shadow-amber-100 hover:shadow-amber-200'
                : 'border-[#0378A6]/20 shadow-[#0378A6]/10 hover:border-[#0378A6]/40 hover:shadow-xl hover:shadow-[#0378A6]/20'
      }`}
    >
      <div className="flex">
        {/* Checkbox de selección */}
        <div 
          className="flex items-center justify-center w-10 bg-gray-50 border-r border-gray-100 cursor-pointer hover:bg-[#0378A6]/10 transition-colors"
          onClick={() => onToggleSelect(product.id)}
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-[#0378A6]" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        {/* Product Image */}
        <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative overflow-hidden">
          {product.main_image_url ? (
            <img 
              src={product.main_image_url} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-2 left-2 bg-amber-400 rounded-full p-1.5 shadow-md">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
          )}
          {!product.is_active && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">Inactivo</span>
            </div>
          )}
          {/* Stock badge */}
          {product.is_active && stockStatus !== 'ok' && (
            <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              stockStatus === 'out' 
                ? 'bg-red-500 text-white' 
                : 'bg-amber-500 text-white'
            }`}>
              {stockStatus === 'out' ? 'Agotado' : 'Stock bajo'}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-grow p-4 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-gray-900 text-base md:text-lg truncate group-hover:text-[#0378A6] transition-colors">
                {product.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {product.sku && (
                  <span className="text-xs text-[#0378A6] bg-[#0378A6]/10 px-2 py-0.5 rounded-full font-medium">
                    SKU: {product.sku}
                  </span>
                )}
                {product.barcode && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    {product.barcode}
                  </span>
                )}
              </div>
              {product.category_names?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.category_names.slice(0, 3).map((catName, idx) => (
                    <Badge key={idx} className="bg-[#0378A6] text-white border-0 shadow-sm hover:bg-[#025d80] text-xs">
                      {catName}
                    </Badge>
                  ))}
                  {product.category_names.length > 3 && (
                    <Badge variant="outline" className="text-xs border-[#0378A6]/30 text-[#0378A6]">
                      +{product.category_names.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-xl md:text-2xl bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
                {formatPrice(product.price)}
              </div>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <div className="text-sm text-gray-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </div>
              )}
              {product.cost_price > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Costo: {formatPrice(product.cost_price)}
                </div>
              )}
              <div className={`text-sm font-semibold mt-1 ${
                stockStatus === 'out' 
                  ? 'text-red-600' 
                  : stockStatus === 'low' 
                    ? 'text-amber-600' 
                    : 'text-emerald-600'
              }`}>
                {product.stock_quantity} unidades
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={() => onToggleActive(product)}
              className={`p-2 rounded-lg transition-all ${
                product.is_active 
                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
              title={product.is_active ? 'Activo - Click para desactivar' : 'Inactivo - Click para activar'}
            >
              {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleFeatured(product)}
              className={`p-2 rounded-lg transition-all ${
                product.is_featured 
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
              title={product.is_featured ? 'Destacado - Click para quitar' : 'Click para destacar'}
            >
              <Star className={`w-4 h-4 ${product.is_featured ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={() => onDuplicate(product)}
              className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:bg-[#0378A6]/10 hover:text-[#0378A6] transition-all"
              title="Duplicar producto"
            >
              <Copy className="w-4 h-4" />
            </button>
            <div className="flex-grow" />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(product)}
              className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10 hover:border-[#0378A6]"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" 
              onClick={() => onDelete(product)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductsManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name),
          category_relations:product_category_relations(
            category:product_categories(id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (filterCategory !== 'all') {
        // Filtrar por categoría usando la tabla de relaciones
        const { data: productIds } = await supabase
          .from('product_category_relations')
          .select('product_id')
          .eq('category_id', filterCategory);
        
        if (productIds && productIds.length > 0) {
          query = query.in('id', productIds.map(p => p.product_id));
        } else {
          // Si no hay productos en la nueva tabla, buscar en category_id legacy
          query = query.eq('category_id', filterCategory);
        }
      }

      if (filterStatus === 'active') {
        query = query.eq('is_active', true);
      } else if (filterStatus === 'inactive') {
        query = query.eq('is_active', false);
      } else if (filterStatus === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filterStatus === 'low_stock') {
        query = query.lte('stock_quantity', 5);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProducts(data?.map(p => {
        // Obtener nombres de categorías desde las relaciones múltiples
        const categoryNames = p.category_relations
          ?.map(r => r.category?.name)
          .filter(Boolean) || [];
        
        // Si no hay relaciones, usar el category_id legacy
        if (categoryNames.length === 0 && p.category?.name) {
          categoryNames.push(p.category.name);
        }
        
        return {
          ...p,
          category_name: categoryNames[0] || null, // Para compatibilidad
          category_names: categoryNames // Array de todas las categorías
        };
      }) || []);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }, [searchTerm, filterCategory, filterStatus]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleToggleActive = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);
      if (error) throw error;
      toast({ 
        title: "Éxito", 
        description: `Producto ${!product.is_active ? 'activado' : 'desactivado'}.` 
      });
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id);
      if (error) throw error;
      toast({ 
        title: "Éxito", 
        description: `Producto ${!product.is_featured ? 'destacado' : 'quitado de destacados'}.` 
      });
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const { id, created_at, updated_at, category, ...productData } = product;
      const duplicateData = {
        ...productData,
        name: `${product.name} (copia)`,
        slug: `${product.slug}-copia-${Date.now()}`,
        sku: product.sku ? `${product.sku}-COPY` : null,
        is_active: false
      };

      const { error } = await supabase.from('products').insert([duplicateData]);
      if (error) throw error;
      
      toast({ title: "Éxito", description: "Producto duplicado. Editalo para publicarlo." });
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      // Eliminar imágenes relacionadas
      await supabase.from('product_images').delete().eq('product_id', deleteConfirm.id);
      // Eliminar variantes
      await supabase.from('product_variants').delete().eq('product_id', deleteConfirm.id);
      // Eliminar producto
      const { error } = await supabase.from('products').delete().eq('id', deleteConfirm.id);
      if (error) throw error;

      toast({ title: "Éxito", description: "Producto eliminado." });
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Funciones de selección
  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Eliminar productos seleccionados
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    setDeletingMultiple(true);
    const count = selectedProducts.length;
    let successCount = 0;

    try {
      // Eliminar uno por uno pero en paralelo para mayor velocidad
      const deletePromises = selectedProducts.map(async (productId) => {
        // Eliminar relaciones primero (ignorar errores)
        await supabase.from('product_images').delete().eq('product_id', productId);
        await supabase.from('product_variants').delete().eq('product_id', productId);
        await supabase.from('product_category_relations').delete().eq('product_id', productId);
        
        // Eliminar producto
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) successCount++;
        return !error;
      });

      await Promise.all(deletePromises);

      toast({ 
        title: "Productos eliminados", 
        description: `${successCount} de ${count} productos eliminados.`
      });
    } catch (error) {
      console.error('Error eliminando productos:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Ocurrió un error al eliminar los productos.",
        variant: "destructive"
      });
    }

    setDeletingMultiple(false);
    setBulkDeleteConfirm(false);
    setSelectedProducts([]);
    fetchProducts();
  };

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    featured: products.filter(p => p.is_featured).length,
    lowStock: products.filter(p => p.stock_quantity <= 5).length,
    outOfStock: products.filter(p => p.stock_quantity <= 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0)
  };

  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-[#0378A6]/10 rounded-xl">
                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-[#0378A6]" />
              </div>
              Productos
            </h1>
            <p className="text-gray-500 mt-1">Gestiona el catálogo de productos de tu tienda</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-[#F26513]/30 text-[#F26513] hover:bg-[#F26513]/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Excel
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/products/categories')}
              className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
            >
              <FolderTree className="w-4 h-4 mr-2" />
              Categorías
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/products/attributes')}
              className="border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Atributos
            </Button>
            <Button 
              onClick={() => navigate('/admin/products/new')}
              className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#026d99] hover:to-[#024c6d] text-white shadow-lg shadow-[#0378A6]/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterStatus('all')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0378A6]/10 rounded-lg">
              <Package className="w-5 h-5 text-[#0378A6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-emerald-100 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterStatus('active')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
              <div className="text-xs text-gray-500">Activos</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-amber-100 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterStatus('featured')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
              <div className="text-xs text-gray-500">Destacados</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-orange-100 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterStatus('low_stock')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
              <div className="text-xs text-gray-500">Stock bajo</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-red-100 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterStatus('inactive')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <EyeOff className="w-5 h-5 text-red-600" />
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
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-4 shadow-md border border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{formatPrice(stats.totalValue)}</div>
              <div className="text-xs text-gray-500">Valor total</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="pl-10 border-gray-200 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-52 border-gray-200">
              <FolderTree className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-44 border-gray-200">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="featured">Destacados</SelectItem>
              <SelectItem value="low_stock">Stock bajo</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchProducts}
            className="border-gray-200 hover:bg-[#0378A6]/10 hover:text-[#0378A6] hover:border-[#0378A6]/30"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Selection Bar */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between bg-white rounded-xl p-3 border border-[#0378A6]/20 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={selectAllProducts}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#0378A6]/10 transition-colors"
            >
              {selectedProducts.length === products.length ? (
                <CheckSquare className="w-5 h-5 text-[#0378A6]" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm font-medium">
                {selectedProducts.length === products.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </span>
            </button>
            
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-[#0378A6] text-white">
                  {selectedProducts.length} seleccionado{selectedProducts.length > 1 ? 's' : ''}
                </Badge>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
          
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar ({selectedProducts.length})
            </Button>
          )}
        </motion.div>
      )}

      {/* Product List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#0378A6] mb-4" />
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#0378A6]/30 shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-[#0378A6]/10 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-[#0378A6]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'No se encontraron productos con los filtros seleccionados.'
              : 'Comienza agregando tu primer producto al catálogo.'}
          </p>
          {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
            <Button 
              onClick={() => navigate('/admin/products/new')}
              className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#026d99] hover:to-[#024c6d] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleActive={handleToggleActive}
                  onToggleFeatured={handleToggleFeatured}
                  onDuplicate={handleDuplicate}
                  isSelected={selectedProducts.includes(product.id)}
                  onToggleSelect={toggleSelectProduct}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="border-red-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              ¿Eliminar producto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también las imágenes y variantes asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className="border-red-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              ¿Eliminar {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los productos seleccionados junto con sus imágenes, variantes y datos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200" disabled={deletingMultiple}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingMultiple}
            >
              {deletingMultiple ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar {selectedProducts.length}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Importer Modal */}
      <ProductImporter
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={() => {
          fetchProducts();
          setImportOpen(false);
        }}
        categories={categories}
      />
    </div>
  );
};

export default ProductsManager;
