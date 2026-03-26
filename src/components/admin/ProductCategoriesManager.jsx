import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit, Trash2, Plus, ChevronRight, ChevronDown, FolderTree, 
  Image as ImageIcon, GripVertical, Eye, EyeOff, Loader2, Search 
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Función para generar slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Componente para mostrar una categoría en el árbol
const CategoryTreeItem = ({ category, level = 0, onEdit, onDelete, onToggleActive, expandedIds, toggleExpanded }) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.includes(category.id);

  const levelColors = [
    'border-l-[#0378A6]',
    'border-l-[#F26513]',
    'border-l-emerald-500',
    'border-l-purple-500'
  ];

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-3 p-4 bg-white hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-100 group ${
          !category.is_active ? 'opacity-60' : ''
        } ${level > 0 ? `ml-${level * 6} border-l-4 ${levelColors[level % levelColors.length]}` : ''}`}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => hasChildren && toggleExpanded(category.id)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            hasChildren ? 'hover:bg-[#0378A6]/10 cursor-pointer text-[#0378A6]' : 'cursor-default text-gray-300'
          }`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
          ) : (
            <span className="w-5 h-5" />
          )}
        </button>

        {/* Category image or icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0378A6]/10 to-[#0378A6]/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#0378A6]/20">
          {category.image_url ? (
            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            <FolderTree className="w-6 h-6 text-[#0378A6]" />
          )}
        </div>

        {/* Category info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate">{category.name}</span>
            {level > 0 && (
              <Badge className="text-xs bg-[#0378A6]/10 text-[#0378A6] border-[#0378A6]/20">
                Nivel {level + 1}
              </Badge>
            )}
            {!category.is_active && (
              <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200">
                Inactiva
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate mt-0.5">/{category.slug}</p>
        </div>

        {/* Products count */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-sm font-semibold text-gray-700">{category.products_count || 0}</span>
          <span className="text-xs text-gray-500">productos</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleActive(category)}
            className={`p-2 rounded-lg transition-colors ${
              category.is_active 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={category.is_active ? 'Activa' : 'Inactiva'}
          >
            {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded-lg text-[#0378A6] hover:bg-[#0378A6]/10 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {category.children.map(child => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductCategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: null,
    sort_order: 0,
    is_active: true
  });

  // Construir árbol de categorías
  const buildCategoryTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildCategoryTree(items, item.id)
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // También obtener conteo de productos para cada categoría
      const { data: productsCount, error: countError } = await supabase
        .from('products')
        .select('category_id');

      if (!countError && productsCount) {
        const countMap = productsCount.reduce((acc, p) => {
          if (p.category_id) {
            acc[p.category_id] = (acc[p.category_id] || 0) + 1;
          }
          return acc;
        }, {});

        data.forEach(cat => {
          cat.products_count = countMap[cat.id] || 0;
        });
      }

      setFlatCategories(data || []);
      setCategories(buildCategoryTree(data || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías.",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedIds(flatCategories.map(c => c.id));
  };

  const collapseAll = () => {
    setExpandedIds([]);
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        parent_id: category.parent_id,
        sort_order: category.sort_order || 0,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        parent_id: null,
        sort_order: 0,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingCategory ? generateSlug(name) : prev.slug
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let slug = formData.slug || generateSlug(formData.name);
      
      // Verificar si el slug ya existe (excluyendo la categoría actual si estamos editando)
      const { data: existingSlug } = await supabase
        .from('product_categories')
        .select('id, slug')
        .eq('slug', slug)
        .maybeSingle();
      
      // Si existe y no es la misma categoría que estamos editando, generar uno único
      if (existingSlug && (!editingCategory || existingSlug.id !== editingCategory.id)) {
        // Agregar timestamp para hacerlo único
        slug = `${slug}-${Date.now().toString(36)}`;
        toast({
          title: "Aviso",
          description: "Se generó un slug único porque el original ya existe.",
        });
      }

      const categoryData = {
        name: formData.name.trim(),
        slug: slug,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        parent_id: formData.parent_id || null,
        sort_order: formData.sort_order || 0,
        is_active: formData.is_active
      };

      // Verificar que no se asigne como padre a sí mismo
      if (editingCategory && categoryData.parent_id === editingCategory.id) {
        toast({
          title: "Error",
          description: "Una categoría no puede ser su propia categoría padre.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      let error;
      if (editingCategory) {
        ({ error } = await supabase
          .from('product_categories')
          .update(categoryData)
          .eq('id', editingCategory.id));
      } else {
        ({ error } = await supabase
          .from('product_categories')
          .insert([categoryData]));
      }

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Categoría ${editingCategory ? 'actualizada' : 'creada'} correctamente.`
      });
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Mensaje más claro para error de slug duplicado
      let errorMessage = "No se pudo guardar la categoría.";
      if (error.code === '23505' && error.message?.includes('slug')) {
        errorMessage = "Ya existe una categoría con ese slug. Por favor, modifica el slug manualmente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setSaving(false);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente."
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la categoría.",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Categoría ${!category.is_active ? 'activada' : 'desactivada'}.`
      });
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive"
      });
    }
  };

  // Filtrar categorías por búsqueda
  const filteredCategories = searchTerm
    ? categories.filter(cat => {
        const searchLower = searchTerm.toLowerCase();
        const matchesCategory = cat.name.toLowerCase().includes(searchLower);
        const matchesChildren = cat.children?.some(child => 
          child.name.toLowerCase().includes(searchLower)
        );
        return matchesCategory || matchesChildren;
      })
    : categories;

  // Obtener opciones para el selector de categoría padre
  const getParentOptions = () => {
    // No permitir seleccionar la categoría que se está editando ni sus hijos
    const getChildIds = (categoryId) => {
      const children = flatCategories.filter(c => c.parent_id === categoryId);
      return children.reduce((ids, child) => {
        return [...ids, child.id, ...getChildIds(child.id)];
      }, []);
    };

    const excludeIds = editingCategory 
      ? [editingCategory.id, ...getChildIds(editingCategory.id)]
      : [];

    return flatCategories.filter(c => !excludeIds.includes(c.id));
  };

  // Construir el nombre completo con jerarquía
  const getFullCategoryPath = (categoryId, allCategories) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parent_id) {
      return `${getFullCategoryPath(category.parent_id, allCategories)} > ${category.name}`;
    }
    return category.name;
  };

  // Stats
  const stats = {
    total: flatCategories.length,
    activas: flatCategories.filter(c => c.is_active).length,
    inactivas: flatCategories.filter(c => !c.is_active).length,
    conProductos: flatCategories.filter(c => c.products_count > 0).length
  };

  if (loading) {
    return (
      <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#0378A6]/20 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-transparent border-t-[#0378A6] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/5"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl shadow-lg">
            <FolderTree className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
              Categorías de Productos
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Gestiona las categorías jerárquicas de tu tienda
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#025d80] hover:to-[#0378A6] shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-[#0378A6] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/10 rounded-xl">
              <FolderTree className="w-5 h-5 text-[#0378A6]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-[#0378A6]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Activas</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.activas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-gray-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
              <EyeOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Inactivas</p>
              <p className="text-2xl font-bold text-gray-500">{stats.inactivas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-[#F26513] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl">
              <ImageIcon className="w-5 h-5 text-[#F26513]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Con Productos</p>
              <p className="text-2xl font-bold text-[#F26513]">{stats.conProductos}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-[#0378A6]/10 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0378A6]" />
            <Input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll} className="border-[#0378A6]/20 text-[#0378A6] hover:bg-[#0378A6]/10">
              <ChevronDown className="w-4 h-4 mr-1" />
              Expandir
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="border-gray-200 text-gray-600 hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 mr-1" />
              Colapsar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Categories tree */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#0378A6]/10 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0378A6] to-[#025d80] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Árbol de Categorías
            </h3>
            <span className="text-white/80 text-sm">{filteredCategories.length} categorías principales</span>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#0378A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-10 h-10 text-[#0378A6]/30" />
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Intenta con otra búsqueda' : 'Crea tu primera categoría para empezar'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => handleOpenDialog()} 
                className="mt-4 bg-gradient-to-r from-[#0378A6] to-[#025d80]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear primera categoría
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredCategories.map((category, index) => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteClick}
                onToggleActive={handleToggleActive}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="bg-gradient-to-r from-[#0378A6] to-[#025d80] text-white rounded-t-lg p-5 -m-6 mb-4">
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {editingCategory ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ej: Alimentos para perros"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="alimentos-para-perros"
              />
              <p className="text-xs text-gray-500">Se usa para la URL: /tienda/categoria/{formData.slug || 'slug'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Categoría Padre</Label>
              <Select 
                value={formData.parent_id || 'root'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === 'root' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría padre (raíz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Sin categoría padre (raíz)</SelectItem>
                  {getParentOptions().map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getFullCategoryPath(cat.id, flatCategories)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la categoría..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="flex-grow"
                />
                {formData.image_url && (
                  <div className="w-10 h-10 rounded border overflow-hidden flex-shrink-0">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Orden de visualización</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Categoría activa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-200">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#025d80] hover:to-[#0378A6]">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-red-100">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-gray-900">¿Eliminar categoría?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="mt-3">
              {categoryToDelete && (
                <div className="space-y-2">
                  <p>Estás a punto de eliminar la categoría <strong className="text-gray-700">"{categoryToDelete.name}"</strong>.</p>
                  {categoryToDelete.children?.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-700 text-sm">
                      ⚠️ Esta categoría tiene subcategorías que quedarán huérfanas.
                    </div>
                  )}
                  {categoryToDelete.products_count > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-700 text-sm">
                      ⚠️ Hay {categoryToDelete.products_count} producto(s) en esta categoría.
                    </div>
                  )}
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-600 text-sm">
                    Esta acción no se puede deshacer.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductCategoriesManager;
