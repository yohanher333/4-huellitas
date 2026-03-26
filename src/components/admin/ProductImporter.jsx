import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Download, FileSpreadsheet, Check, X, AlertCircle, 
  Loader2, FileText, CheckCircle2, XCircle, Monitor
} from 'lucide-react';

// Función para generar slug
const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Columnas de la plantilla
const TEMPLATE_COLUMNS = [
  { key: 'name', label: 'Nombre', description: 'Nombre del producto (requerido)', required: true },
  { key: 'sku', label: 'SKU', description: 'Código único del producto' },
  { key: 'barcode', label: 'Código de Barras', description: 'Código de barras EAN/UPC' },
  { key: 'description', label: 'Descripción', description: 'Descripción larga del producto' },
  { key: 'short_description', label: 'Descripción Corta', description: 'Máximo 500 caracteres' },
  { key: 'price', label: 'Precio Venta', description: 'Precio de venta (número)' },
  { key: 'compare_at_price', label: 'Precio Anterior', description: 'Precio antes del descuento' },
  { key: 'cost_price', label: 'Costo', description: 'Precio de costo' },
  { key: 'stock_quantity', label: 'Stock', description: 'Cantidad en inventario (número)' },
  { key: 'low_stock_threshold', label: 'Alerta Stock Bajo', description: 'Cantidad para alerta' },
  { key: 'weight', label: 'Peso (kg)', description: 'Peso del producto' },
  { key: 'category', label: 'Categoría', description: 'Nombre de la categoría' },
  { key: 'main_image_url', label: 'URL Imagen', description: 'URL de la imagen principal' },
  { key: 'is_active', label: 'Activo', description: 'SI o NO' },
  { key: 'is_featured', label: 'Destacado', description: 'SI o NO' }
];

const ProductImporter = ({ isOpen, onClose, onImportComplete, categories = [] }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });
  const [step, setStep] = useState('upload'); // upload, preview, importing, complete
  const fileInputRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Wake Lock - Mantener pantalla activa durante la importación
  useEffect(() => {
    const requestWakeLock = async () => {
      if (importing && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activado - Pantalla permanecerá activa');
        } catch (err) {
          console.log('Wake Lock no disponible:', err.message);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('Wake Lock liberado');
        } catch (err) {
          console.log('Error liberando Wake Lock:', err);
        }
      }
    };

    if (importing) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Cleanup
    return () => {
      releaseWakeLock();
    };
  }, [importing]);

  // Descargar plantilla Excel
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS.map(col => col.label),
      // Fila de ejemplo
      [
        'Producto de Ejemplo',
        'SKU-001',
        '7501234567890',
        'Esta es la descripción completa del producto de ejemplo',
        'Descripción corta del producto',
        '25000',
        '30000',
        '15000',
        '100',
        '10',
        '0.5',
        'Perros',
        'https://ejemplo.com/imagen.jpg',
        'SI',
        'NO'
      ]
    ]);

    // Ajustar ancho de columnas
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');

    // Agregar hoja de instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA IMPORTAR PRODUCTOS'],
      [''],
      ['Columnas disponibles:'],
      ...TEMPLATE_COLUMNS.map(col => [
        col.label, 
        col.required ? '(Requerido)' : '(Opcional)', 
        col.description
      ]),
      [''],
      ['NOTAS IMPORTANTES:'],
      ['- Solo el campo "Nombre" es obligatorio'],
      ['- Los campos numéricos (precio, stock, etc.) deben ser números válidos'],
      ['- Para Activo/Destacado usar: SI, NO, TRUE, FALSE, 1, 0'],
      ['- La categoría debe existir previamente en el sistema'],
      ['- Las URLs de imagen deben ser accesibles públicamente'],
      ['- El archivo puede ser .xlsx, .xls o .csv']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

    XLSX.writeFile(wb, 'plantilla_productos_4huellitas.xlsx');
    toast({ title: "Plantilla descargada", description: "Revisa la hoja 'Instrucciones' para más detalles." });
  };

  // Leer archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      '.xlsx', '.xls', '.csv'
    ];

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      toast({ 
        title: "Formato no válido", 
        description: "Solo se permiten archivos .xlsx, .xls o .csv",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // Parsear archivo
  const parseFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonData.length === 0) {
          toast({ title: "Archivo vacío", description: "El archivo no contiene datos.", variant: "destructive" });
          return;
        }

        // Mapear columnas (buscar por label o key)
        const mappedData = jsonData.map((row, index) => {
          const mapped = { _rowIndex: index + 2 }; // +2 por header y base 1
          
          TEMPLATE_COLUMNS.forEach(col => {
            // Buscar el valor por diferentes nombres posibles
            const value = row[col.label] ?? row[col.key] ?? row[col.label.toLowerCase()] ?? '';
            mapped[col.key] = value;
          });
          
          return mapped;
        });

        setParsedData(mappedData);
        validateData(mappedData);
        setStep('preview');
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({ 
          title: "Error al leer archivo", 
          description: "No se pudo procesar el archivo. Verifica el formato.",
          variant: "destructive"
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Validar datos
  const validateData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Validar nombre (único campo requerido)
      if (!row.name || !row.name.toString().trim()) {
        errors.push('Nombre es requerido');
      }

      // Validar precios (si existen, deben ser números válidos)
      ['price', 'compare_at_price', 'cost_price'].forEach(field => {
        if (row[field] && row[field] !== '') {
          const num = parseFloat(row[field]);
          if (isNaN(num) || num < 0) {
            warnings.push(`${field === 'price' ? 'Precio' : field === 'compare_at_price' ? 'Precio anterior' : 'Costo'} no válido`);
          }
        }
      });

      // Validar stock
      if (row.stock_quantity && row.stock_quantity !== '') {
        const num = parseInt(row.stock_quantity);
        if (isNaN(num) || num < 0) {
          warnings.push('Stock no válido');
        }
      }

      // Validar categoría
      if (row.category && row.category !== '') {
        const categoryExists = categories.some(
          c => c.name.toLowerCase() === row.category.toString().toLowerCase()
        );
        if (!categoryExists) {
          warnings.push(`Categoría "${row.category}" no encontrada`);
        }
      }

      return {
        row: index + 1,
        data: row,
        errors,
        warnings,
        valid: errors.length === 0
      };
    });

    setValidationResults(results);
    return results;
  };

  // Importar productos
  const handleImport = async () => {
    const validRows = validationResults.filter(r => r.valid);
    
    if (validRows.length === 0) {
      toast({ title: "Sin datos válidos", description: "No hay filas válidas para importar.", variant: "destructive" });
      return;
    }

    setImporting(true);
    setStep('importing');
    setImportStats({ success: 0, failed: 0, total: validRows.length });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i].data;
      
      try {
        // Parsear valores booleanos
        const parseBoolean = (val) => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'number') return val === 1;
          const str = val?.toString().toLowerCase().trim();
          return ['si', 'sí', 'yes', 'true', '1'].includes(str);
        };

        // Buscar categoría
        let categoryId = null;
        if (row.category && row.category !== '') {
          const category = categories.find(
            c => c.name.toLowerCase() === row.category.toString().toLowerCase()
          );
          if (category) categoryId = category.id;
        }

        // Preparar datos del producto
        const productData = {
          name: row.name.toString().trim(),
          slug: generateSlug(row.name),
          sku: row.sku?.toString().trim() || null,
          barcode: row.barcode?.toString().trim() || null,
          description: row.description?.toString().trim() || null,
          short_description: row.short_description?.toString().trim() || null,
          price: row.price ? parseFloat(row.price) || 0 : 0,
          compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
          cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
          stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) || 0 : 0,
          low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold) || 5 : 5,
          weight: row.weight ? parseFloat(row.weight) : null,
          category_id: categoryId,
          main_image_url: row.main_image_url?.toString().trim() || null,
          is_active: row.is_active !== '' ? parseBoolean(row.is_active) : true,
          is_featured: row.is_featured !== '' ? parseBoolean(row.is_featured) : false,
          track_inventory: true,
          allow_backorder: false
        };

        // Verificar slug único
        const { data: existingSlug } = await supabase
          .from('products')
          .select('id')
          .eq('slug', productData.slug)
          .maybeSingle();

        if (existingSlug) {
          productData.slug = `${productData.slug}-${Date.now().toString(36)}`;
        }

        // Insertar producto
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        // Si hay categoría, crear relación en tabla de multi-categorías
        if (categoryId && newProduct) {
          await supabase
            .from('product_category_relations')
            .insert([{ product_id: newProduct.id, category_id: categoryId }])
            .select();
        }

        successCount++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error);
        failedCount++;
      }

      // Actualizar progreso
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
      setImportStats({ success: successCount, failed: failedCount, total: validRows.length });
    }

    setImporting(false);
    setStep('complete');
    
    if (successCount > 0) {
      toast({ 
        title: "Importación completada", 
        description: `${successCount} productos importados correctamente.` 
      });
      onImportComplete?.();
    }
  };

  // Resetear estado
  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setImporting(false);
    setImportProgress(0);
    setImportStats({ success: 0, failed: 0, total: 0 });
    setStep('upload');
    onClose();
  };

  const validCount = validationResults.filter(r => r.valid).length;
  const invalidCount = validationResults.filter(r => !r.valid).length;
  const warningCount = validationResults.filter(r => r.warnings.length > 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0378A6]">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Productos desde Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo con tus productos para importarlos masivamente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            {/* Step: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Download Template */}
                <div className="bg-gradient-to-r from-[#0378A6]/5 to-[#025d80]/10 rounded-xl p-5 border border-[#0378A6]/20">
                  <h3 className="font-semibold text-[#0378A6] mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Paso 1: Descarga la plantilla
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Descarga la plantilla Excel con las columnas correctas y ejemplos.
                  </p>
                  <Button 
                    onClick={downloadTemplate}
                    variant="outline"
                    className="border-[#0378A6] text-[#0378A6] hover:bg-[#0378A6]/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Plantilla Excel
                  </Button>
                </div>

                {/* Upload Area */}
                <div className="bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-300 hover:border-[#0378A6] transition-colors">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Paso 2: Sube tu archivo
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Formatos aceptados: .xlsx, .xls, .csv
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center justify-center py-8 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="font-medium text-gray-700">
                      Haz clic para seleccionar archivo
                    </p>
                    <p className="text-sm text-gray-500">o arrastra y suelta aquí</p>
                  </div>
                </div>

                {/* Columns Info */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Columnas disponibles
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {TEMPLATE_COLUMNS.map(col => (
                      <div key={col.key} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.required ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <span className={col.required ? 'font-medium' : ''}>{col.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Solo el campo <strong>Nombre</strong> es obligatorio. Todos los demás son opcionales.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* File Info */}
                <div className="flex items-center justify-between bg-[#0378A6]/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#0378A6]" />
                    <div>
                      <p className="font-medium">{file?.name}</p>
                      <p className="text-sm text-gray-500">{parsedData.length} filas encontradas</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setStep('upload'); }}>
                    Cambiar archivo
                  </Button>
                </div>

                {/* Validation Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold text-lg">{validCount}</span>
                    </div>
                    <p className="text-sm text-emerald-600">Válidos</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold text-lg">{invalidCount}</span>
                    </div>
                    <p className="text-sm text-red-600">Con errores</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold text-lg">{warningCount}</span>
                    </div>
                    <p className="text-sm text-amber-600">Con advertencias</p>
                  </div>
                </div>

                {/* Data Preview Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Fila</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Estado</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Nombre</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Precio</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Stock</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {validationResults.map((result, idx) => (
                          <tr key={idx} className={result.valid ? '' : 'bg-red-50'}>
                            <td className="px-3 py-2 text-gray-500">{result.row}</td>
                            <td className="px-3 py-2">
                              {result.valid ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  <Check className="w-3 h-3 mr-1" /> OK
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                                  <X className="w-3 h-3 mr-1" /> Error
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium max-w-[150px] truncate">
                              {result.data.name || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{result.data.sku || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">
                              {result.data.price ? `$${parseFloat(result.data.price).toLocaleString()}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{result.data.stock_quantity || '0'}</td>
                            <td className="px-3 py-2 text-xs">
                              {result.errors.length > 0 && (
                                <span className="text-red-600">{result.errors.join(', ')}</span>
                              )}
                              {result.warnings.length > 0 && (
                                <span className="text-amber-600 ml-1">{result.warnings.join(', ')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step: Importing */}
            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <Loader2 className="w-16 h-16 text-[#0378A6] animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">Importando productos...</h3>
                  <p className="text-gray-500">Por favor no cierres esta ventana</p>
                </div>
                {/* Indicador de pantalla activa */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0378A6]/10 rounded-full border border-[#0378A6]/20">
                  <Monitor className="w-4 h-4 text-[#0378A6]" />
                  <span className="text-sm text-[#0378A6] font-medium">Pantalla activa durante importación</span>
                </div>
                <div className="w-full max-w-md">
                  <Progress value={importProgress} className="h-3" />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {importProgress}% - {importStats.success} de {importStats.total} productos
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800">¡Importación completada!</h3>
                  <p className="text-gray-500 mt-2">Resumen de la importación:</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-600">{importStats.success}</p>
                    <p className="text-sm text-emerald-700">Importados</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{importStats.failed}</p>
                    <p className="text-sm text-red-700">Fallidos</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="border-t pt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setFile(null); setStep('upload'); }}>
                Volver
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0}
                className="bg-gradient-to-r from-[#0378A6] to-[#025d80] hover:from-[#026d99] hover:to-[#024c6d]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar {validCount} productos
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button 
              onClick={handleClose}
              className="bg-gradient-to-r from-[#0378A6] to-[#025d80]"
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImporter;
