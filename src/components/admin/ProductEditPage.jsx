import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Save, Package, Barcode, 
  Loader2, Eye, EyeOff, Star, X, ChevronDown, ChevronUp,
  Plus, Trash2, AlertCircle, UploadCloud, Image as ImageIcon, Link,
  FileText, DollarSign, Palette, Truck, Settings, FolderOpen, Camera, Check
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Clave para localStorage
const DRAFT_STORAGE_KEY = 'product_draft';

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

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

// Componente para características del producto
const FeaturesEditor = ({ features, onChange }) => {
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      onChange([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    onChange(features.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          placeholder="Agregar característica..."
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
        />
        <Button type="button" variant="outline" onClick={addFeature}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {features.length > 0 && (
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
              <span className="flex-grow text-sm">{feature}</span>
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para galería de imágenes con subida de archivos
const GalleryEditor = ({ images, onChange }) => {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const addImageFromUrl = () => {
    if (newImageUrl.trim()) {
      onChange([...images, { url: newImageUrl.trim(), alt: '' }]);
      setNewImageUrl('');
      setShowUrlInput(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      setUploadProgress(progress);

      try {
        // Generar nombre único para el archivo
        const fileExt = file.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Subir a Supabase Storage (sin restricciones de tamaño)
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ 
            title: "Error al subir", 
            description: `No se pudo subir ${file.name}: ${uploadError.message}`, 
            variant: "destructive" 
          });
          continue;
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('site-assets')
          .getPublicUrl(fileName);

        newImages.push({ url: publicUrl, alt: file.name.split('.')[0] });
      } catch (error) {
        console.error('Error uploading:', error);
        toast({ 
          title: "Error", 
          description: `Error al subir ${file.name}`, 
          variant: "destructive" 
        });
      }
    }

    onChange(newImages);
    setUploading(false);
    setUploadProgress(0);
    
    // Limpiar input de archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (newImages.length > images.length) {
      toast({ title: "Éxito", description: `${newImages.length - images.length} imagen(es) subida(s).` });
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      onChange(newImages);
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de subida de archivos */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading ? 'border-[#0378A6] bg-blue-50' : 'border-gray-300 hover:border-[#0378A6] hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileSelect({ target: { files } });
          }
        }}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 mx-auto text-[#0378A6] animate-spin" />
            <p className="text-[#0378A6] font-medium">Subiendo imágenes... {uploadProgress}%</p>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#0378A6] h-2 rounded-full transition-all" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-1">Arrastra imágenes aquí o haz clic para seleccionar</p>
            <p className="text-sm text-gray-400 mb-3">Soporta cualquier tamaño y formato de imagen</p>
            <div className="flex justify-center gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Seleccionar archivos
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => setShowUrlInput(!showUrlInput)}
              >
                <Link className="w-4 h-4 mr-2" />
                Usar URL
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </>
        )}
      </div>

      {/* Input para URL */}
      {showUrlInput && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageFromUrl())}
          />
          <Button type="button" variant="outline" onClick={addImageFromUrl}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowUrlInput(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                <img 
                  src={image.url} 
                  alt={image.alt || `Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">Error</text></svg>';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  className="p-1.5 bg-white rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={index === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  className="p-1.5 bg-white rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={index === images.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-red-500 rounded text-white hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !showUrlInput && (
        <p className="text-sm text-gray-400 text-center">Las imágenes aparecerán aquí después de subirlas</p>
      )}
    </div>
  );
};

// Componente para imagen principal con subida
const MainImageUploader = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `products/main-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast({ title: "Éxito", description: "Imagen principal subida." });
    } catch (error) {
      console.error('Error uploading:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      setUrlValue('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative inline-block">
          <div className="w-48 h-48 rounded-lg border overflow-hidden bg-gray-100">
            <img 
              src={value} 
              alt="Imagen principal" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            uploading ? 'border-[#0378A6] bg-blue-50' : 'border-gray-300 hover:border-[#0378A6] hover:bg-gray-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect({ target: { files: [file] } });
          }}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 mx-auto text-[#0378A6] animate-spin" />
              <p className="text-[#0378A6]">Subiendo imagen...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm mb-2">Arrastra una imagen o selecciona un archivo</p>
              <div className="flex justify-center gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Subir archivo
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Usar URL
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </>
          )}
        </div>
      )}

      {showUrlInput && !value && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <Button type="button" variant="outline" onClick={handleUrlSubmit}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowUrlInput(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente para variantes
const VariantsEditor = ({ productId, variants, attributes, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    barcode: '',
    price: '',
    stock_quantity: 0,
    attributes: {}
  });

  const handleAddVariant = async () => {
    if (!productId) {
      toast({
        title: "Guarda primero",
        description: "Debes guardar el producto antes de agregar variantes.",
        variant: "default"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: variant, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          sku: newVariant.sku || null,
          barcode: newVariant.barcode || null,
          price: newVariant.price ? parseFloat(newVariant.price) : null,
          stock_quantity: newVariant.stock_quantity || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar atributos
      if (Object.keys(newVariant.attributes).length > 0) {
        const attributeInserts = Object.entries(newVariant.attributes)
          .filter(([_, valueId]) => valueId)
          .map(([attrId, valueId]) => ({
            variant_id: variant.id,
            attribute_id: attrId,
            attribute_value_id: valueId
          }));

        if (attributeInserts.length > 0) {
          await supabase.from('product_variant_attributes').insert(attributeInserts);
        }
      }

      toast({ title: "Éxito", description: "Variante agregada." });
      setIsAdding(false);
      setNewVariant({ sku: '', barcode: '', price: '', stock_quantity: 0, attributes: {} });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteVariant = async (variantId) => {
    try {
      await supabase.from('product_variants').delete().eq('id', variantId);
      toast({ title: "Éxito", description: "Variante eliminada." });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {!productId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Guarda el producto primero para poder agregar variantes.
          </AlertDescription>
        </Alert>
      )}

      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-4 gap-4 flex-grow text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">SKU</span>
                      <span className="font-medium">{variant.sku || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Código</span>
                      <span className="font-medium">{variant.barcode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Precio</span>
                      <span className="font-medium">{variant.price ? formatPrice(variant.price) : 'Heredado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Stock</span>
                      <span className="font-medium">{variant.stock_quantity}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 ml-4"
                    onClick={() => handleDeleteVariant(variant.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdding ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva Variante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU de variante</Label>
                <Input
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU-VAR-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Código de barras</Label>
                <Input
                  value={newVariant.barcode}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio (vacío = heredar)</Label>
                <Input
                  type="number"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-2">
                <Label>Atributos</Label>
                <div className="grid grid-cols-2 gap-4">
                  {attributes.map(attr => (
                    <div key={attr.id}>
                      <Label className="text-sm text-gray-600">{attr.name}</Label>
                      <Select
                        value={newVariant.attributes[attr.id] || ''}
                        onValueChange={(value) => setNewVariant(prev => ({
                          ...prev,
                          attributes: { ...prev.attributes, [attr.id]: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Seleccionar ${attr.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {attr.values?.map(val => (
                            <SelectItem key={val.id} value={val.id}>{val.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleAddVariant} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setIsAdding(true)} 
          className="w-full"
          disabled={!productId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Variante
        </Button>
      )}
    </div>
  );
};

// Componente principal
const ProductEditPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const location = useLocation();
  const isEditing = !!productId;
  const barcodeInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasDraft, setHasDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialFormData = {
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku: '',
    barcode: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    category_ids: [],
    main_image_url: '',
    features: [],
    tags: [],
    weight: '',
    stock_quantity: 0,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_active: true,
    is_featured: false,
    gallery_images: [],
    variants: []
  };

  const [formData, setFormData] = useState(initialFormData);

  // Guardar borrador automáticamente
  const saveDraft = useCallback((data) => {
    try {
      const draft = {
        data,
        timestamp: new Date().toISOString(),
        productId: productId || 'new'
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      console.log('Borrador guardado');
    } catch (error) {
      console.error('Error guardando borrador:', error);
    }
  }, [productId]);

  // Cargar borrador
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Verificar que el borrador sea del mismo producto o un nuevo producto
        if (draft.productId === (productId || 'new')) {
          return draft.data;
        }
      }
    } catch (error) {
      console.error('Error cargando borrador:', error);
    }
    return null;
  }, [productId]);

  // Limpiar borrador
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  }, []);

  // Verificar si hay borrador al cargar
  useEffect(() => {
    const draft = loadDraft();
    if (draft && !isEditing) {
      setHasDraft(true);
    }
  }, [loadDraft, isEditing]);

  // Auto-guardar borrador cuando cambian los datos
  useEffect(() => {
    if (isDirty && !isEditing) {
      const timer = setTimeout(() => {
        saveDraft(formData);
      }, 1000); // Guardar después de 1 segundo de inactividad
      return () => clearTimeout(timer);
    }
  }, [formData, isDirty, isEditing, saveDraft]);

  // Fetch categories and attributes
  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, attributesRes] = await Promise.all([
        supabase.from('product_categories').select('*').eq('is_active', true).order('name'),
        supabase.from('product_attributes').select('*, values:product_attribute_values(*)').eq('is_active', true)
      ]);
      
      setCategories(categoriesRes.data || []);
      setAttributes(attributesRes.data || []);
    };
    fetchData();
  }, []);

  // Fetch product if editing
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        // Verificar borrador para nuevo producto
        const draft = loadDraft();
        if (draft) {
          setFormData(draft);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;

        // Cargar imágenes
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order');

        // Cargar variantes
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId);

        // Cargar categorías del producto (múltiples)
        const { data: categoryRelations } = await supabase
          .from('product_category_relations')
          .select('category_id')
          .eq('product_id', productId);
        
        // Si no hay relaciones, usar el category_id legacy del producto
        let categoryIds = categoryRelations?.map(r => r.category_id) || [];
        if (categoryIds.length === 0 && product.category_id) {
          categoryIds = [product.category_id];
        }

        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          short_description: product.short_description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          price: product.price?.toString() || '',
          compare_at_price: product.compare_at_price?.toString() || '',
          cost_price: product.cost_price?.toString() || '',
          category_ids: categoryIds,
          main_image_url: product.main_image_url || '',
          features: product.features || [],
          tags: product.tags || [],
          weight: product.weight?.toString() || '',
          stock_quantity: product.stock_quantity || 0,
          low_stock_threshold: product.low_stock_threshold || 5,
          track_inventory: product.track_inventory ?? true,
          allow_backorder: product.allow_backorder ?? false,
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          gallery_images: images?.map(img => ({ url: img.image_url, alt: img.alt_text })) || [],
          variants: variants || []
        });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo cargar el producto.", variant: "destructive" });
        navigate('/admin/products');
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId, navigate, loadDraft]);

  // Handler para restaurar borrador
  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft);
      setHasDraft(false);
      toast({ title: "Borrador restaurado", description: "Se ha cargado tu borrador anterior." });
    }
  };

  // Handler para descartar borrador
  const handleDiscardDraft = () => {
    clearDraft();
    setFormData(initialFormData);
    toast({ title: "Borrador descartado" });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !isEditing ? generateSlug(name) : prev.slug
    }));
    setIsDirty(true);
  };

  const handleSave = async (asDraft = false) => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio.", variant: "destructive" });
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        price: parseFloat(formData.price) || 0,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        // Mantener category_id para compatibilidad (primera categoría seleccionada)
        category_id: formData.category_ids?.length > 0 ? formData.category_ids[0] : null,
        main_image_url: formData.main_image_url.trim() || null,
        features: formData.features,
        tags: formData.tags,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        stock_quantity: formData.stock_quantity || 0,
        low_stock_threshold: formData.low_stock_threshold || 5,
        track_inventory: formData.track_inventory,
        allow_backorder: formData.allow_backorder,
        is_active: asDraft ? false : formData.is_active,
        is_featured: formData.is_featured
      };

      let savedProductId = productId;

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        savedProductId = data.id;
      }

      // Guardar imágenes de galería
      if (savedProductId) {
        await supabase.from('product_images').delete().eq('product_id', savedProductId);
        
        if (formData.gallery_images.length > 0) {
          const imagesToInsert = formData.gallery_images.map((img, index) => ({
            product_id: savedProductId,
            image_url: img.url,
            alt_text: img.alt || null,
            sort_order: index
          }));
          await supabase.from('product_images').insert(imagesToInsert);
        }

        // Guardar relaciones de categorías (múltiples)
        await supabase.from('product_category_relations').delete().eq('product_id', savedProductId);
        
        if (formData.category_ids?.length > 0) {
          const categoryRelations = formData.category_ids.map(categoryId => ({
            product_id: savedProductId,
            category_id: categoryId
          }));
          await supabase.from('product_category_relations').insert(categoryRelations);
        }
      }

      // Limpiar borrador después de guardar exitosamente
      clearDraft();
      setIsDirty(false);

      toast({
        title: "Éxito",
        description: asDraft 
          ? "Producto guardado como borrador." 
          : `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente.`
      });

      if (!isEditing) {
        navigate(`/admin/products/edit/${savedProductId}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleBack = () => {
    if (isDirty && !isEditing) {
      saveDraft(formData);
      toast({ 
        title: "Borrador guardado", 
        description: "Tus cambios se han guardado automáticamente." 
      });
    }
    navigate('/admin/products');
  };

  // Refresh variants
  const refreshVariants = async () => {
    if (!productId) return;
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);
    setFormData(prev => ({ ...prev, variants: data || [] }));
  };

  // Construir path de categoría
  const getCategoryPath = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    return category.name;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15 -m-4 md:-m-6 p-4 md:p-6 rounded-2xl">
        <Loader2 className="w-10 h-10 animate-spin text-[#0378A6] mb-4" />
        <p className="text-[#0378A6] font-medium">Cargando producto...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen -m-4 md:-m-6 p-4 md:p-6 bg-gradient-to-br from-[#0378A6]/5 via-[#0378A6]/10 to-[#0378A6]/15"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 mb-6"
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="hover:bg-[#0378A6]/10 hover:text-[#0378A6]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#0378A6] to-[#025d80] rounded-xl shadow-lg shadow-[#0378A6]/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0378A6] to-[#025d80] bg-clip-text text-transparent">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              <p className="text-gray-500 text-sm">
                {isEditing ? formData.name : 'Completa la información del producto'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 sm:flex-none border-[#0378A6]/30 text-[#0378A6] hover:bg-[#0378A6]/10"
            >
              Guardar Borrador
            </Button>
          )}
          <Button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 sm:flex-none bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#026d99] hover:to-[#024c6d] shadow-lg shadow-[#0378A6]/30"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Guardar Cambios' : 'Publicar Producto'}
          </Button>
        </div>
      </motion.div>

      {/* Draft Alert */}
      {hasDraft && !isEditing && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800">Tienes un borrador guardado. ¿Deseas restaurarlo?</span>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                Descartar
              </Button>
              <Button size="sm" onClick={handleRestoreDraft} className="bg-amber-600 hover:bg-amber-700">
                Restaurar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg shadow-[#0378A6]/10 border border-[#0378A6]/20">
              <TabsTrigger 
                value="basic"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0378A6] data-[state=active]:to-[#025d80] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all font-medium"
              >
                <FileText className="w-4 h-4 mr-1" /> Información
              </TabsTrigger>
              <TabsTrigger 
                value="pricing"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0378A6] data-[state=active]:to-[#025d80] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all font-medium"
              >
                <DollarSign className="w-4 h-4 mr-1" /> Precios
              </TabsTrigger>
              <TabsTrigger 
                value="media"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0378A6] data-[state=active]:to-[#025d80] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all font-medium"
              >
                <ImageIcon className="w-4 h-4 mr-1" /> Imágenes
              </TabsTrigger>
              <TabsTrigger 
                value="variants"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0378A6] data-[state=active]:to-[#025d80] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all font-medium"
              >
                <Palette className="w-4 h-4 mr-1" /> Variantes
              </TabsTrigger>
            </TabsList>

            {/* Tab: Información Básica */}
            <TabsContent value="basic">
              <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#0378A6]/5 to-[#025d80]/5 border-b border-[#0378A6]/10">
                  <CardTitle className="flex items-center gap-2 text-[#0378A6]">
                    <Package className="w-5 h-5" />
                    Información del Producto
                  </CardTitle>
                  <CardDescription>Datos básicos del producto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#025d80] font-medium">Nombre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleNameChange}
                        placeholder="Nombre del producto"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-[#025d80] font-medium">Slug (URL)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleChange('slug', generateSlug(e.target.value))}
                        placeholder="nombre-del-producto"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description" className="text-[#025d80] font-medium">Descripción corta</Label>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => handleChange('short_description', e.target.value)}
                      placeholder="Breve descripción (máx. 500 caracteres)"
                      maxLength={500}
                      className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#025d80] font-medium">Descripción completa</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Descripción detallada del producto..."
                      rows={5}
                      className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-[#025d80] font-medium">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                        placeholder="SKU-001"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode" className="text-[#025d80] font-medium">Código de barras</Label>
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          ref={barcodeInputRef}
                          value={formData.barcode}
                          onChange={(e) => handleChange('barcode', e.target.value)}
                          placeholder="Escanear o ingresar código"
                          className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => barcodeInputRef.current?.focus()}
                          className="border-[#0378A6]/30 hover:bg-[#0378A6]/10 hover:text-[#0378A6]"
                        >
                          <Barcode className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#025d80] font-medium">Características</Label>
                    <FeaturesEditor
                      features={formData.features}
                      onChange={(features) => handleChange('features', features)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Precios */}
            <TabsContent value="pricing">
              <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#F26513]/5 to-[#F26513]/10 border-b border-[#F26513]/20">
                  <CardTitle className="flex items-center gap-2 text-[#F26513]">
                    <DollarSign className="w-5 h-5 mr-2" /> Precios e Inventario
                  </CardTitle>
                  <CardDescription>Configura precios y stock del producto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-[#025d80] font-medium">Precio de venta</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compare_at_price" className="text-[#025d80] font-medium">Precio anterior</Label>
                      <Input
                        id="compare_at_price"
                        type="number"
                        value={formData.compare_at_price}
                        onChange={(e) => handleChange('compare_at_price', e.target.value)}
                        placeholder="Para descuentos"
                        min="0"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost_price" className="text-[#025d80] font-medium">Costo</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        value={formData.cost_price}
                        onChange={(e) => handleChange('cost_price', e.target.value)}
                        placeholder="Costo"
                        min="0"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                  </div>

                  <hr className="my-4 border-[#0378A6]/20" />

                  <h4 className="font-semibold text-[#0378A6] flex items-center gap-2">
                    <Package className="w-4 h-4 mr-2" /> Inventario
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity" className="text-[#025d80] font-medium">Stock actual</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                        min="0"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold" className="text-[#025d80] font-medium">Alerta de stock bajo</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
                        min="0"
                        className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0378A6]/5 to-[#0378A6]/10 rounded-xl border border-[#0378A6]/20">
                      <Label className="text-[#025d80] font-medium">Rastrear inventario</Label>
                      <Switch
                        checked={formData.track_inventory}
                        onCheckedChange={(checked) => handleChange('track_inventory', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0378A6]/5 to-[#0378A6]/10 rounded-xl border border-[#0378A6]/20">
                      <Label className="text-[#025d80] font-medium">Permitir pedidos sin stock</Label>
                      <Switch
                        checked={formData.allow_backorder}
                        onCheckedChange={(checked) => handleChange('allow_backorder', checked)}
                      />
                    </div>
                  </div>

                  <hr className="my-4 border-[#0378A6]/20" />

                  <h4 className="font-semibold text-[#0378A6] flex items-center gap-2">
                    <Truck className="w-4 h-4 mr-2" /> Envío
                  </h4>

                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="weight" className="text-[#025d80] font-medium">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="border-[#0378A6]/30 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Imágenes */}
            <TabsContent value="media">
              <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-b border-purple-500/20">
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <ImageIcon className="w-5 h-5 mr-2" /> Imágenes del Producto
                  </CardTitle>
                  <CardDescription>Imagen principal y galería</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label className="text-[#025d80] font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 mr-1" /> Imagen principal
                    </Label>
                    <MainImageUploader 
                      value={formData.main_image_url}
                      onChange={(url) => handleChange('main_image_url', url)}
                    />
                  </div>

                  <hr className="my-4 border-[#0378A6]/20" />

                  <div className="space-y-2">
                    <Label className="text-[#025d80] font-medium flex items-center gap-2">
                      <Camera className="w-4 h-4 mr-1" /> Galería de imágenes
                    </Label>
                    <GalleryEditor
                      images={formData.gallery_images}
                      onChange={(images) => handleChange('gallery_images', images)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Variantes */}
            <TabsContent value="variants">
              <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border-b border-emerald-500/20">
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <Palette className="w-5 h-5 mr-2" /> Variantes del Producto
                  </CardTitle>
                  <CardDescription>
                    Crea variantes con diferentes atributos (talla, color, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <VariantsEditor
                    productId={productId}
                    variants={formData.variants}
                    attributes={attributes}
                    onRefresh={refreshVariants}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#0378A6]/5 to-[#025d80]/5 border-b border-[#0378A6]/10 pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#0378A6]">
                <Settings className="w-4 h-4 mr-1" /> Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#0378A6]/5 to-transparent rounded-lg">
                <Label className="text-[#025d80] font-medium">Producto activo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#F26513]/5 to-transparent rounded-lg">
                <Label className="text-[#025d80] font-medium flex items-center gap-1"><Star className="w-4 h-4" /> Destacado</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleChange('is_featured', checked)}
                />
              </div>
              {formData.is_active ? (
                <Badge className="w-full justify-center py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30">
                  <Eye className="w-3 h-3 mr-1" /> Visible en tienda
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-full justify-center py-2 bg-gray-100 text-gray-600">
                  <EyeOff className="w-3 h-3 mr-1" /> No visible
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Category Card */}
          <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#0378A6]/5 to-[#025d80]/5 border-b border-[#0378A6]/10 pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#0378A6]">
                <FolderOpen className="w-4 h-4 mr-1" /> Categorías
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No hay categorías disponibles</p>
                ) : (
                  categories.map(cat => {
                    const isSelected = formData.category_ids?.includes(cat.id);
                    return (
                      <div 
                        key={cat.id}
                        onClick={() => {
                          const newIds = isSelected 
                            ? formData.category_ids.filter(id => id !== cat.id)
                            : [...(formData.category_ids || []), cat.id];
                          handleChange('category_ids', newIds);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#0378A6]/10 border border-[#0378A6]/30' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-[#0378A6] text-white' 
                            : 'border-2 border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-[#0378A6] font-medium' : 'text-gray-700'}`}>
                          {getCategoryPath(cat.id)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {formData.category_ids?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {formData.category_ids.length} categoría{formData.category_ids.length > 1 ? 's' : ''} seleccionada{formData.category_ids.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          {formData.main_image_url && (
            <Card className="border-[#0378A6]/20 shadow-lg shadow-[#0378A6]/10 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-b border-purple-500/20 pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-purple-600">
                  <Eye className="w-4 h-4 mr-1" /> Vista previa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-3 shadow-inner">
                  <img 
                    src={formData.main_image_url} 
                    alt={formData.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-semibold truncate text-[#025d80]">{formData.name || 'Nombre del producto'}</h4>
                <p className="text-[#0378A6] font-bold mt-1 text-lg">
                  {formData.price ? formatPrice(formData.price) : '$0'}
                </p>
                {formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price || 0) && (
                  <p className="text-sm text-gray-400 line-through">
                    {formatPrice(formData.compare_at_price)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductEditPage;
