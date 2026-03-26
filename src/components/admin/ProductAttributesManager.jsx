import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit, Trash2, Plus, Settings2, Loader2, ChevronDown, ChevronUp, X, Palette, Search, Eye, EyeOff, Tag
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
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";

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

// Tipos de atributos disponibles
const attributeTypes = [
  { value: 'select', label: 'Selección', description: 'Lista desplegable de opciones' },
  { value: 'color', label: 'Color', description: 'Selector de colores' },
  { value: 'size', label: 'Talla/Tamaño', description: 'Opciones de talla' },
  { value: 'text', label: 'Texto libre', description: 'Campo de texto' },
];

const ProductAttributesManager = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [attributeToDelete, setAttributeToDelete] = useState(null);
  const [expandedAttributes, setExpandedAttributes] = useState([]);
  const [currentAttributeId, setCurrentAttributeId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'select',
    is_active: true
  });

  const [valueFormData, setValueFormData] = useState({
    value: '',
    slug: '',
    color_hex: '',
    sort_order: 0
  });

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select(`
          *,
          values:product_attribute_values(*)
        `)
        .order('name');

      if (error) throw error;
      setAttributes(data || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los atributos.",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const toggleExpanded = (id) => {
    setExpandedAttributes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handlers para atributos
  const handleOpenDialog = (attribute = null) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setFormData({
        name: attribute.name,
        slug: attribute.slug,
        description: attribute.description || '',
        type: attribute.type || 'select',
        is_active: attribute.is_active ?? true
      });
    } else {
      setEditingAttribute(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: 'select',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveAttribute = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const attributeData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        type: formData.type,
        is_active: formData.is_active
      };

      let error;
      if (editingAttribute) {
        ({ error } = await supabase
          .from('product_attributes')
          .update(attributeData)
          .eq('id', editingAttribute.id));
      } else {
        ({ error } = await supabase
          .from('product_attributes')
          .insert([attributeData]));
      }

      if (error) throw error;

      toast({ title: "Éxito", description: `Atributo ${editingAttribute ? 'actualizado' : 'creado'} correctamente.` });
      setIsDialogOpen(false);
      fetchAttributes();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteAttribute = async () => {
    if (!attributeToDelete) return;

    try {
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('id', attributeToDelete.id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Atributo eliminado." });
      setDeleteDialogOpen(false);
      setAttributeToDelete(null);
      fetchAttributes();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Handlers para valores de atributos
  const handleOpenValueDialog = (attributeId, value = null) => {
    setCurrentAttributeId(attributeId);
    if (value) {
      setEditingValue(value);
      setValueFormData({
        value: value.value,
        slug: value.slug,
        color_hex: value.color_hex || '',
        sort_order: value.sort_order || 0
      });
    } else {
      setEditingValue(null);
      setValueFormData({
        value: '',
        slug: '',
        color_hex: '',
        sort_order: 0
      });
    }
    setIsValueDialogOpen(true);
  };

  const handleSaveValue = async () => {
    if (!valueFormData.value.trim()) {
      toast({ title: "Error", description: "El valor es obligatorio.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const valueData = {
        attribute_id: currentAttributeId,
        value: valueFormData.value.trim(),
        slug: valueFormData.slug || generateSlug(valueFormData.value),
        color_hex: valueFormData.color_hex || null,
        sort_order: valueFormData.sort_order || 0
      };

      let error;
      if (editingValue) {
        ({ error } = await supabase
          .from('product_attribute_values')
          .update(valueData)
          .eq('id', editingValue.id));
      } else {
        ({ error } = await supabase
          .from('product_attribute_values')
          .insert([valueData]));
      }

      if (error) throw error;

      toast({ title: "Éxito", description: `Valor ${editingValue ? 'actualizado' : 'agregado'}.` });
      setIsValueDialogOpen(false);
      fetchAttributes();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteValue = async (valueId) => {
    try {
      const { error } = await supabase
        .from('product_attribute_values')
        .delete()
        .eq('id', valueId);

      if (error) throw error;
      toast({ title: "Éxito", description: "Valor eliminado." });
      fetchAttributes();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const currentAttribute = attributes.find(a => a.id === currentAttributeId);
  const isColorType = currentAttribute?.type === 'color';

  // Stats
  const stats = {
    total: attributes.length,
    activos: attributes.filter(a => a.is_active).length,
    inactivos: attributes.filter(a => !a.is_active).length,
    totalValores: attributes.reduce((acc, a) => acc + (a.values?.length || 0), 0)
  };

  if (loading) {
    return (
      <div className="-m-4 md:-m-6 min-h-screen bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#F26513]/5 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#0378A6]/20 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-transparent border-t-[#0378A6] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Cargando atributos...</p>
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
            <Settings2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
              Atributos de Productos
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Define atributos como talla, color, sabor para las variantes
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#025d80] hover:to-[#0378A6] shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Atributo
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
              <Settings2 className="w-5 h-5 text-[#0378A6]" />
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
              <p className="text-xs text-gray-500 font-medium">Activos</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.activos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-gray-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
              <EyeOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Inactivos</p>
              <p className="text-2xl font-bold text-gray-500">{stats.inactivos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border-l-4 border-l-[#F26513] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl">
              <Tag className="w-5 h-5 text-[#F26513]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Valores</p>
              <p className="text-2xl font-bold text-[#F26513]">{stats.totalValores}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Attributes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {attributes.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-[#0378A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings2 className="w-10 h-10 text-[#0378A6]/30" />
            </div>
            <p className="text-lg font-semibold text-gray-700">No hay atributos creados</p>
            <p className="text-sm text-gray-500 mt-1">Crea tu primer atributo para empezar</p>
            <Button onClick={() => handleOpenDialog()} className="mt-4 bg-gradient-to-r from-[#0378A6] to-[#025d80]">
              <Plus className="w-4 h-4 mr-2" />
              Crear primer atributo
            </Button>
          </div>
        ) : (
          attributes.map((attribute, index) => (
            <motion.div
              key={attribute.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Collapsible
                open={expandedAttributes.includes(attribute.id)}
                onOpenChange={() => toggleExpanded(attribute.id)}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#0378A6]/10 hover:shadow-lg transition-all duration-300">
                  {/* Attribute Header */}
                  <div className="flex items-center gap-4 p-4 border-b border-gray-100">
                    <CollapsibleTrigger asChild>
                      <button className="p-2 hover:bg-[#0378A6]/10 rounded-lg text-[#0378A6] transition-colors">
                        {expandedAttributes.includes(attribute.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </CollapsibleTrigger>

                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0378A6]/20 to-[#0378A6]/10 flex items-center justify-center flex-shrink-0">
                      {attribute.type === 'color' ? (
                        <Palette className="w-5 h-5 text-[#0378A6]" />
                      ) : (
                        <Settings2 className="w-5 h-5 text-[#0378A6]" />
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{attribute.name}</span>
                        <Badge className="text-xs bg-[#0378A6]/10 text-[#0378A6] border-[#0378A6]/20">
                          {attributeTypes.find(t => t.value === attribute.type)?.label || attribute.type}
                        </Badge>
                        {!attribute.is_active && (
                          <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {attribute.values?.length || 0} valores configurados
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">{attribute.values?.length || 0}</span>
                      <span className="text-xs text-gray-500">valores</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenValueDialog(attribute.id)}
                        className="border-[#0378A6]/20 text-[#0378A6] hover:bg-[#0378A6]/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Valor
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(attribute)}
                        className="text-[#0378A6] hover:bg-[#0378A6]/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setAttributeToDelete(attribute);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Values List */}
                  <CollapsibleContent>
                    {attribute.values?.length > 0 ? (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-[#0378A6]/5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {attribute.values
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map(value => (
                              <div
                                key={value.id}
                                className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-100 group hover:border-[#0378A6]/30 hover:shadow-sm transition-all duration-200"
                              >
                                {attribute.type === 'color' && value.color_hex && (
                                  <div
                                    className="w-7 h-7 rounded-lg border-2 border-white shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: value.color_hex }}
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-700 flex-grow truncate">{value.value}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenValueDialog(attribute.id, value)}
                                    className="p-1.5 hover:bg-[#0378A6]/10 rounded-lg text-[#0378A6]"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteValue(value.id)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gradient-to-br from-gray-50 to-[#0378A6]/5">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Tag className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No hay valores agregados</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenValueDialog(attribute.id)}
                          className="mt-3 border-[#0378A6]/20 text-[#0378A6] hover:bg-[#0378A6]/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar primer valor
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Attribute Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="bg-gradient-to-r from-[#0378A6] to-[#025d80] text-white rounded-t-lg p-5 -m-6 mb-4">
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {editingAttribute ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              {editingAttribute ? 'Editar Atributo' : 'Nuevo Atributo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: e.target.value,
                  slug: !editingAttribute ? generateSlug(e.target.value) : prev.slug
                }))}
                placeholder="Ej: Talla, Color, Sabor"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="talla"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de atributo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attributeTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-gray-500 text-xs ml-2">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Atributo activo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-200">Cancelar</Button>
            <Button onClick={handleSaveAttribute} disabled={saving} className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#025d80] hover:to-[#0378A6]">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAttribute ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Value Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="bg-gradient-to-r from-[#F26513] to-[#d45511] text-white rounded-t-lg p-5 -m-6 mb-4">
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {editingValue ? <Edit className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
              </div>
              {editingValue ? 'Editar Valor' : 'Agregar Valor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                value={valueFormData.value}
                onChange={(e) => setValueFormData(prev => ({
                  ...prev,
                  value: e.target.value,
                  slug: !editingValue ? generateSlug(e.target.value) : prev.slug
                }))}
                placeholder="Ej: Grande, Rojo, Pollo"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={valueFormData.slug}
                onChange={(e) => setValueFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="grande"
              />
            </div>

            {isColorType && (
              <div className="space-y-2">
                <Label>Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    value={valueFormData.color_hex}
                    onChange={(e) => setValueFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                    placeholder="#FF0000"
                  />
                  <input
                    type="color"
                    value={valueFormData.color_hex || '#000000'}
                    onChange={(e) => setValueFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                value={valueFormData.sort_order}
                onChange={(e) => setValueFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsValueDialogOpen(false)} className="border-gray-200">Cancelar</Button>
            <Button onClick={handleSaveValue} disabled={saving} className="bg-gradient-to-r from-[#F26513] to-[#d45511] hover:from-[#d45511] hover:to-[#F26513]">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingValue ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-red-100">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-gray-900">¿Eliminar atributo?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="mt-3">
              {attributeToDelete && (
                <div className="space-y-2">
                  <p>Estás a punto de eliminar el atributo <strong className="text-gray-700">"{attributeToDelete.name}"</strong> y todos sus valores.</p>
                  {attributeToDelete.values?.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-700 text-sm">
                      ⚠️ Este atributo tiene {attributeToDelete.values.length} valor(es) que serán eliminados.
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
            <AlertDialogAction onClick={handleDeleteAttribute} className="bg-red-500 hover:bg-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductAttributesManager;
