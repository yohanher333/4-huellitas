import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Package, 
  Loader2, 
  ShoppingBag,
  Plus,
  Tag,
  X
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

// Componente de tarjeta de producto mejorada
const ProductCard = ({ product, onSelect }) => {
  const hasStock = product.stock_quantity > 0 || !product.track_inventory;
  const lowStock = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= 5;
  
  return (
    <motion.button
      whileHover={{ y: hasStock ? -4 : 0 }}
      whileTap={{ scale: hasStock ? 0.97 : 1 }}
      onClick={() => hasStock && onSelect(product)}
      disabled={!hasStock}
      className={`group w-full bg-white rounded-2xl shadow-sm border-2 overflow-hidden text-left transition-all duration-200 ${
        hasStock 
          ? 'hover:shadow-xl hover:border-[#0378A6]/40 cursor-pointer border-transparent' 
          : 'opacity-60 cursor-not-allowed border-gray-200'
      }`}
    >
      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-slate-300" />
          </div>
        )}
        
        {/* Overlay sin stock */}
        {!hasStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Badge className="bg-red-500 text-white border-0 py-1.5 px-3 text-sm font-semibold">
              Agotado
            </Badge>
          </div>
        )}
        
        {/* Badge stock bajo */}
        {lowStock && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white border-0 text-xs shadow-lg">
              ¡Últimos {product.stock_quantity}!
            </Badge>
          </div>
        )}
        
        {/* Botón de agregar con overlay */}
        {hasStock && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-4">
            <div className="bg-[#0378A6] hover:bg-[#026080] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Agregar</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Info del producto */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
          {product.name}
        </h3>
        
        {product.category_name && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {product.category_name}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-lg font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </span>
          
          {product.track_inventory && hasStock && !lowStock && (
            <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 font-normal">
              {product.stock_quantity} uds
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// Chip de categoría
const CategoryChip = ({ category, isSelected, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
      isSelected 
        ? 'bg-white text-[#0378A6] shadow-lg ring-2 ring-white/50' 
        : 'bg-white/20 text-white hover:bg-white/30'
    }`}
  >
    {category.name}
  </motion.button>
);

const POSProductGrid = ({ onProductSelect }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch categorías
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch productos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProducts(data?.map(p => ({
        ...p,
        category_name: p.category?.name,
        track_inventory: p.track_inventory ?? true // Por defecto trackea inventario
      })) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  return (
    <div className="h-full flex flex-col">
      {/* Header de búsqueda */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-[#0378A6] to-[#025d80] border-b border-[#0378A6]/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Catálogo</h2>
              <p className="text-xs text-white/70">{products.length} productos</p>
            </div>
          </div>
          
          <div className="flex-grow" />
          
          {/* Campo de búsqueda */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-10 rounded-xl border-white/20 bg-white/90 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Chips de categorías */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <CategoryChip 
            category={{ name: '🏷️ Todos' }}
            isSelected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          />
          {categories.map(cat => (
            <CategoryChip 
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Grid de productos */}
      <div className="flex-grow overflow-hidden bg-gradient-to-b from-white via-slate-50 to-[#0378A6]/5">
        <ScrollArea className="h-full">
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <p className="text-[#0378A6] font-medium">Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Package className="w-10 h-10 text-[#0378A6]/60" />
                </div>
                <p className="text-[#0378A6] font-medium">No se encontraron productos</p>
                <p className="text-[#0378A6]/60 text-sm mt-1">Intenta con otra búsqueda o categoría</p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="mt-4 rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {products.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.03 }}
                      layout
                    >
                      <ProductCard 
                        product={product} 
                        onSelect={onProductSelect}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default POSProductGrid;
