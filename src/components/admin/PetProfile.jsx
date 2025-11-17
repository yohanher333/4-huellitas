import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Dog, Cat, Cake, Stethoscope, Plus, Upload, Shield, Info, FilePlus, Palette, PawPrint, Clock, Trash2, Edit, AlertTriangle, Search, Eye, FileSignature, Download, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HistoryRecordViewer from '@/components/admin/HistoryRecordViewer';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from 'jspdf';
import ConsentSignatureEditor from './ConsentSignatureEditor';

const PetProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const photoInputRef = useRef(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [filters, setFilters] = useState({ grooming: { search: '', date: null }, vaccination: { search: '', date: null }, deworming: { search: '', date: null }, general: { search: '', date: null } });
  const [isConsentEditOpen, setIsConsentEditOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);

  const handleFilterChange = (type, field, value) => setFilters(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  
  const fetchHistory = useCallback(async () => { 
    const { data: historyData, error: historyError } = await supabase.from('pet_history').select('*, professional:professionals(name)').eq('pet_id', id).order('record_date', { ascending: false }); 
    if (!historyError) setHistory(historyData); 
  }, [id]);

  const fetchPetData = useCallback(async () => {
    setLoading(true);
    const { data: petData, error: petError } = await supabase.from('pets').select('*, owner:profiles(id, name, phone, document_number), breed:breeds(name, behavior_color)').eq('id', id).single();
    if (petError || !petData) { toast({ title: "Mascota no encontrada", variant: "destructive" }); navigate('/admin/pets'); return; }
    setPet(petData); setEditData({ ...petData, breed_id: petData.breed_id || null, age_category: petData.age_category || null }); setImagePreview(petData.photo_url || '');
    const { data: breedsData } = await supabase.from('breeds').select('id, name'); setBreeds(breedsData || []);
    await fetchHistory(); setLoading(false);
  }, [id, navigate, fetchHistory]);

  useEffect(() => { fetchPetData(); }, [fetchPetData]);
  
  const handleEditSave = async () => {
    let photoUrl = pet.photo_url;
    if (newImageFile) {
      const fileName = `pet-photos/${pet.owner.id}/${id}/${Date.now()}`;
      if (pet.photo_url) { const oldFileKey = pet.photo_url.split('/site-assets/')[1]; if (oldFileKey) await supabase.storage.from('site-assets').remove([oldFileKey]); }
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, newImageFile, { upsert: true });
      if (uploadError) { toast({ title: "Error al subir imagen", description: uploadError.message, variant: "destructive" }); return; }
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName); photoUrl = publicUrl;
    }
    
    // Manejar el comportamiento personalizado correctamente
    const behaviorValue = editData.behavior_override === 'Personalizado' 
      ? (editData.custom_behavior && editData.custom_behavior.trim() !== '' ? editData.custom_behavior : null)
      : (editData.behavior_override && editData.behavior_override.trim() !== '' ? editData.behavior_override : null);
    
    // Función helper para limpiar valores - garantiza que no se envíen strings vacíos
    const cleanValue = (value) => {
      if (value === null || value === undefined || value === 'none') return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' ? trimmed : null;
      }
      return value;
    };
    
    // Limpiar datos antes del envío - convertir cadenas vacías en null
    const cleanData = {
      name: cleanValue(editData.name),
      birth_date: cleanValue(editData.birth_date),
      gender: cleanValue(editData.gender),
      breed_id: cleanValue(editData.breed_id),
      medical_issues: cleanValue(editData.medical_issues),
      disabilities: cleanValue(editData.disabilities),
      behavior_override: cleanValue(behaviorValue),
      species: cleanValue(editData.species),
      age_category: cleanValue(editData.age_category),
      photo_url: cleanValue(photoUrl),
      weight: editData.weight && editData.weight.toString().trim() !== '' ? parseFloat(editData.weight) : null
    };

    const { error } = await supabase.from('pets').update(cleanData).eq('id', id);
    if (error) { toast({ title: "Error", description: `No se pudo actualizar. ${error.message}`, variant: "destructive" }); } 
    else { toast({ title: "Éxito", description: "Información actualizada." }); setIsEditing(false); setNewImageFile(null); fetchPetData(); }
  };

  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setNewImageFile(file); setImagePreview(URL.createObjectURL(file)); } };
  const handleHistoryAdd = (type) => navigate(`/admin/add-history/${id}/${type}`);
  const handleHistoryEdit = (entry) => navigate(`/admin/add-history/${id}/${entry.record_type}/${entry.id}`);
  const handleHistoryDelete = async (historyId) => {
    const { error } = await supabase.from('pet_history').delete().eq('id', historyId);
    if (error) toast({ title: "Error", description: `No se pudo eliminar el registro. ${error.message}`, variant: "destructive" });
    else { toast({ title: "Éxito", description: "Registro eliminado." }); fetchHistory(); }
  };
  const handleViewRecord = (record) => { setViewingRecord(record); setIsViewerOpen(true); };

  const getFilteredHistory = (type) => {
    return history.filter(h => {
        if (h.record_type !== type) return false;
        const currentFilter = filters[type];
        const searchLower = currentFilter.search.toLowerCase();
        const dateMatch = !currentFilter.date || format(parseISO(h.record_date), 'yyyy-MM-dd') === format(currentFilter.date, 'yyyy-MM-dd');
        const searchString = JSON.stringify(h.details).toLowerCase() + (h.professional?.name?.toLowerCase() || '');
        const searchMatch = !currentFilter.search || searchString.includes(searchLower);
        return dateMatch && searchMatch;
    });
  };

  const generateConsentPdf = async () => {
    if (!pet?.consent_signature || !pet.consent_signature.startsWith('data:image/png;base64,')) {
      toast({ title: "Error", description: "La firma no es válida o no existe.", variant: "destructive" });
      return;
    }
    // Validar longitud mínima base64 PNG (cabecera PNG: iVBORw0KGgo)
    const base64 = pet.consent_signature.split(',')[1] || '';
    // Depuración avanzada
    console.log("[Depuración PDF] Tamaño base64:", base64.length);
    console.log("[Depuración PDF] Primeros 30 caracteres:", base64.substring(0, 30));
    console.log("[Depuración PDF] Últimos 30 caracteres:", base64.substring(base64.length - 30));
    if (!base64.startsWith('iVBORw0KGgo') || base64.length < 500) {
      toast({ title: "Error", description: "La firma está corrupta o incompleta. Por favor, vuelve a registrar la firma.", variant: "destructive" });
      return;
    }

    try {
      const { data: company } = await supabase.from('company_info').select('logo').maybeSingle();
      const doc = new jsPDF();
      
      if (company?.logo) {
        try {
          doc.addImage(company.logo, 'PNG', 15, 15, 40, 40);
        } catch (logoErr) {
          console.error('[Depuración PDF] Error en logo:', logoErr);
        }
      }
      
      doc.setFontSize(22);
      doc.text("Consentimiento Informado", 105, 40, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Fecha de Firma: ${format(new Date(pet.consent_signed_at), "d 'de' MMMM, yyyy", { locale: es })}`, 105, 50, { align: 'center' });
      doc.line(15, 60, 195, 60);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Datos de la Mascota", 15, 70);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      doc.text(`Nombre: ${pet.name}`, 15, 80);
      doc.text(`Raza: ${pet.breed?.name || 'No especificada'}`, 15, 87);
      doc.line(15, 92, 195, 92);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Datos del Propietario", 15, 102);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      doc.text(`Nombre: ${pet.owner.name}`, 15, 112);
      doc.text(`Documento: ${pet.owner.document_number || 'No especificado'}`, 15, 119);
      doc.text(`Teléfono: ${pet.owner.phone}`, 15, 126);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Firma del Propietario", 15, 142);

      try {
        doc.addImage(pet.consent_signature, 'PNG', 15, 147, 80, 40);
      } catch (imgErr) {
        console.error("[Depuración PDF] Error en addImage:", imgErr);
        toast({ title: "Error al procesar la imagen", description: `Error interno: ${imgErr.message || imgErr}`, variant: "destructive" });
        return;
      }
      
      doc.line(15, 190, 195, 190);
      doc.setFontSize(8);
      doc.text("Documento generado automáticamente por el sistema de 4huellitas.", 105, 195, { align: 'center' });

      // SEGUNDA PÁGINA - CONSENTIMIENTO SPA
      doc.addPage();
      
      // Logo en la segunda página (si existe)
      if (company?.logo) {
        try {
          doc.addImage(company.logo, 'PNG', 15, 15, 40, 40);
        } catch (logoErr) {
          console.error('[Depuración PDF] Error en logo página 2:', logoErr);
        }
      }

      // Título de la segunda página
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text("Consentimiento SPA", 105, 40, { align: 'center' });
      
      // Definición de peluquería canina
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const definicion = '"LA PELUQUERIA CANINA ES EL ACTO POR EL CUAL UNA PERSONA DISPONE DE UN ANIMAL PARA SU ASEO, BAÑO, CEPILLADO, CORTE O ARREGLO ESTETICO, ADAPTADO A LOS DISTINTOS TIPOS DE PELOS DE CADA RAZA. EL GROOMER DOMINA LOS INSTRUMENTOS Y TECNICAS ESPECIALES PARA EL TRABAJO SOBRE PERROS Y GATOS"';
      const definicionLines = doc.splitTextToSize(definicion, 165);
      doc.text(definicionLines, 15, 65);
      
      // Reglamento del SPA
      let yPos = 65 + (definicionLines.length * 5) + 15;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Reglamento del SPA", 15, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const reglamentoTextos = [
        "En el SPA prevalece la paciencia, respeto, confianza e higiene para tu mascota.",
        "Se atiende con cita programada, y solo se tiene un cupo limitado por día para brindar calidad en nuestro servicio.",
        "Su mascota durante su estancia en las instalaciones nunca se quedará solo.",
        "No se utilizan anestésicos.",
        "Su mascota jamás será maltratada."
      ];
      
      reglamentoTextos.forEach((texto) => {
        const lines = doc.splitTextToSize(`• ${texto}`, 165);
        doc.text(lines, 15, yPos);
        yPos += lines.length * 5 + 2;
      });
      
      // Condiciones del SPA
      yPos += 5;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Condiciones del SPA", 15, yPos);
      
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      const condicionesTextos = [
        "El centro veterinario 4 Huellitas, así como sus médicos y auxiliares desconocen el estado de salud de las mascotas ingresadas al servicio de peluquería canina.",
        "Al tratarse de animales y seres vivos se hace imposible su total inmovilización por lo que pueden someterse a cortes, pellizcos, hematomas y lesiones leves accidentales ajenas a la predisposición para con los animales a los que se les dará un trato adecuado.",
        "Al sacar los animales de su entorno, están dispuestos a sufrir ataques de pánico, escapismos, convulsiones y hasta muertes súbitas debido a la falta de costumbre, presencia de otros animales, ruidos ajenos etc...",
        "Si eventualmente se llegara a presentar alguna anomalía dentro de la peluquería canina. Serán avisado a sus propietarios, y de parte del centro veterinario 4huellitas se hará el respectivo seguimiento a la evolución de la mascota.",
        "No se admiten mascotas enfermas.",
        "Las mascotas pueden presentar después de la peluquería canina irritaciones en la piel o en los ojos ya sea por sensibilidad al shampoo, o por estrés.",
        "El dueño tiene la obligación de revisar su mascota en el momento de ser entregada, después de este tiempo 4huellitas no se hace responsable de cualquier problema que llegase a presentar en la misma.",
        "El animal debe ser retirado dentro de las 24 hs., siendo la postergación a cargo del dueño. En caso de no retirarlo, incurrirá en falta a la LEY 14436 de protección al animal, por abandono del mismo, dejando a la veterinaria libre de toda responsabilidad en el caso.",
        "El propietario, por la presente, deja libre al CENTRO VETERINARIO 4HUELLITAS, sobre todo daño, robo, hurto, perjuicio o riesgo, debido a pérdida o muerte del animal que pudiera surgir por cualquier causa."
      ];
      
      condicionesTextos.forEach((texto) => {
        const lines = doc.splitTextToSize(`• ${texto}`, 165);
        // Verificar si necesitamos una nueva página
        if (yPos + (lines.length * 4) > 270) {
          doc.addPage();
          yPos = 20;
          // Logo en la nueva página si existe
          if (company?.logo) {
            try {
              doc.addImage(company.logo, 'PNG', 15, 15, 40, 40);
              yPos = 60;
            } catch (logoErr) {
              console.error('[Depuración PDF] Error en logo página adicional:', logoErr);
            }
          }
        }
        doc.text(lines, 15, yPos);
        yPos += lines.length * 4 + 3;
      });
      
      // Línea final y texto de generación automática en la última página
      doc.line(15, yPos + 5, 195, yPos + 5);
      doc.setFontSize(8);
      doc.text("Documento generado automáticamente por el sistema de 4huellitas.", 105, yPos + 15, { align: 'center' });

      // Abrir PDF en nueva pestaña en lugar de descargar
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Limpiar el URL después de un tiempo para liberar memoria
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);
    } catch(e) {
      console.error("Error al generar PDF:", e);
      toast({ title: "Error al generar PDF", description: `No se pudo procesar la firma. Detalle: ${e.message || e}`, variant: "destructive" });
    }
  };

  const handleConsentSave = async (signature, date) => {
    setConsentLoading(true);
    const { error } = await supabase.from('pets').update({ consent_signature: signature, consent_signed_at: date }).eq('id', id);
    setConsentLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el consentimiento.', variant: 'destructive' });
    } else {
      toast({ title: 'Consentimiento guardado', description: 'La firma y fecha se han registrado correctamente.' });
      setIsConsentEditOpen(false);
      fetchPetData();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#F26513]"></div></div>;
  if (!pet) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Button onClick={() => navigate('/admin/pets')} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Mascotas
      </Button>
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
         <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="relative w-24 h-24 shrink-0">
            <img src={imagePreview || 'https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/5b1a62d4e78298715d311910a3013c72.png'} alt={pet.name} className="w-24 h-24 object-cover rounded-full bg-gray-200" />
            {isEditing && (<Button size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full" onClick={() => photoInputRef.current.click()}><Upload className="h-4 w-4" /></Button>)}
            <input type="file" ref={photoInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <div className="flex-grow">
             {isEditing ? <Input value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} className="text-3xl font-bold font-heading"/> : <h1 className="text-3xl font-bold font-heading text-gray-800">{pet.name}</h1>}
             <p className="text-gray-600">{pet.breed?.name || 'Raza no especificada'}</p>
             <p className="text-gray-500 text-sm mt-1">Propietario: {pet.owner?.name}</p>
          </div>
          <div>{isEditing ? (<div className="flex gap-2"><Button onClick={handleEditSave} size="sm">Guardar</Button><Button onClick={() => { setIsEditing(false); fetchPetData(); } } size="sm" variant="ghost">Cancelar</Button></div>) : (<Button onClick={() => {
            setEditData({
              ...pet,
              behavior_override: pet.behavior_override && 
                (pet.behavior_override.startsWith('🟥') || pet.behavior_override.startsWith('🟧') || 
                 pet.behavior_override.startsWith('🟩') || pet.behavior_override.startsWith('🟦')) 
                ? pet.behavior_override : 'Personalizado',
              custom_behavior: pet.behavior_override && 
                !(pet.behavior_override.startsWith('🟥') || pet.behavior_override.startsWith('🟧') || 
                  pet.behavior_override.startsWith('🟩') || pet.behavior_override.startsWith('🟦')) 
                ? pet.behavior_override : null
            });
            setIsEditing(true);
          }} size="sm" variant="outline"><Edit className="w-4 h-4 mr-1"/>Editar</Button>)}</div>
        </div>

        {/* Información Básica de la Mascota */}
        <Card className="mb-4 border-0 bg-gradient-to-br from-white to-blue-50/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#0378A6] to-[#0378A6]/90 text-white rounded-t-xl shadow-md">
            <CardTitle className="text-xl flex items-center gap-3 font-normal text-white drop-shadow-md">
              <Info className="w-6 h-6" />
              Información Básica de la Mascota
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Fecha de Nacimiento */}
              <div className="bg-white rounded-lg p-4 border border-blue-100 hover:border-[#0378A6]/30 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-[#0378A6] font-medium mb-3">
                  <div className="p-1.5 bg-[#0378A6]/10 rounded-lg">
                    <Cake className="w-4 h-4" />
                  </div>
                  Fecha de Nacimiento
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.birth_date || ''}
                    onChange={(e) => setEditData({...editData, birth_date: e.target.value})}
                    className="border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">
                      {pet.birth_date ? format(parseISO(pet.birth_date), "d 'de' MMMM, yyyy", { locale: es }) : 'No especificado'}
                    </p>
                  </div>
                )}
              </div>

              {/* Género */}
              <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-green-700 font-medium mb-3">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Dog className="w-4 h-4" />
                  </div>
                  Género
                </Label>
                {isEditing ? (
                  <Select value={editData.gender || 'none'} onValueChange={(value) => setEditData({...editData, gender: value === 'none' ? null : value})}>
                    <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-200">
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      <SelectItem value="male">Macho</SelectItem>
                      <SelectItem value="female">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">
                      {pet.gender === 'male' ? 'Macho' : pet.gender === 'female' ? 'Hembra' : 'No especificado'}
                    </p>
                  </div>
                )}
              </div>

              {/* Especie */}
              <div className="bg-white rounded-lg p-4 border border-orange-100 hover:border-[#F26513]/30 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-[#F26513] font-medium mb-3">
                  <div className="p-1.5 bg-[#F26513]/10 rounded-lg">
                    <PawPrint className="w-4 h-4" />
                  </div>
                  Especie
                </Label>
                {isEditing ? (
                  <Select value={editData.species || ''} onValueChange={(value) => setEditData({...editData, species: value})}>
                    <SelectTrigger className="border-[#F26513]/20 focus:border-[#F26513] focus:ring-[#F26513]/20">
                      <SelectValue placeholder="Seleccionar especie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perro">Perro</SelectItem>
                      <SelectItem value="Gato">Gato</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">
                      {pet.species || 'No especificado'}
                    </p>
                  </div>
                )}
              </div>

              {/* Raza */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-purple-700 font-medium mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Palette className="w-4 h-4" />
                  </div>
                  Raza
                </Label>
                {isEditing ? (
                  <Select value={editData.breed_id || ''} onValueChange={(value) => setEditData({...editData, breed_id: value})}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-200">
                      <SelectValue placeholder="Seleccionar raza" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.map(breed => (
                        <SelectItem key={breed.id} value={breed.id}>{breed.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">{pet.breed?.name || 'No especificado'}</p>
                  </div>
                )}
              </div>

              {/* Categoría de Edad */}
              <div className="bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-indigo-700 font-medium mb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  Categoría de Edad
                </Label>
                {isEditing ? (
                  <Select value={editData.age_category || ''} onValueChange={(value) => setEditData({...editData, age_category: value})}>
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cachorro">Cachorro</SelectItem>
                      <SelectItem value="joven">Joven</SelectItem>
                      <SelectItem value="adulto">Adulto</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">
                      {pet.age_category === 'cachorro' ? 'Cachorro' : 
                       pet.age_category === 'joven' ? 'Joven' : 
                       pet.age_category === 'adulto' ? 'Adulto' : 
                       pet.age_category === 'senior' ? 'Senior' : 'No especificado'}
                    </p>
                  </div>
                )}
              </div>

              {/* Peso */}
              <div className="bg-white rounded-lg p-4 border border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-cyan-700 font-medium mb-3">
                  <div className="p-1.5 bg-cyan-100 rounded-lg">
                    <PawPrint className="w-4 h-4" />
                  </div>
                  Peso (kg)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 12.5"
                    value={editData.weight || ''}
                    onChange={(e) => setEditData({...editData, weight: e.target.value})}
                    className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-200"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[40px] flex items-center">
                    <p className="text-gray-800 font-medium">
                      {pet.weight ? `${pet.weight} kg` : 'No especificado'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campos de texto más largos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Problemas Médicos */}
              <div className="bg-white rounded-lg p-4 border border-red-100 hover:border-red-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-red-700 font-medium mb-3">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  Problemas Médicos
                </Label>
                {isEditing ? (
                  <Textarea
                    placeholder="Describe cualquier problema médico conocido..."
                    value={editData.medical_issues || ''}
                    onChange={(e) => setEditData({...editData, medical_issues: e.target.value})}
                    className="min-h-20 border-red-200 focus:border-red-500 focus:ring-red-200"
                  />
                ) : (
                  <div className="min-h-20 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">{pet.medical_issues || 'Ninguno registrado'}</p>
                  </div>
                )}
              </div>

              {/* Discapacidades */}
              <div className="bg-white rounded-lg p-4 border border-yellow-100 hover:border-yellow-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-yellow-700 font-medium mb-3">
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  Discapacidades o Necesidades Especiales
                </Label>
                {isEditing ? (
                  <Textarea
                    placeholder="Describe cualquier discapacidad o necesidad especial..."
                    value={editData.disabilities || ''}
                    onChange={(e) => setEditData({...editData, disabilities: e.target.value})}
                    className="min-h-20 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-200"
                  />
                ) : (
                  <div className="min-h-20 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">{pet.disabilities || 'Ninguna registrada'}</p>
                  </div>
                )}
              </div>

              {/* Comportamiento */}
              <div className="bg-white rounded-lg p-4 border border-amber-100 hover:border-amber-300 transition-colors shadow-sm lg:col-span-2">
                <Label className="flex items-center gap-2 text-amber-700 font-medium mb-3">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  Comportamiento y Temperamento
                </Label>
                {isEditing ? (
                  <Select
                    value={editData.behavior_override || ''}
                    onValueChange={(value) => setEditData({...editData, behavior_override: value})}
                  >
                    <SelectTrigger className="border-amber-200 focus:border-amber-500 focus:ring-amber-200">
                      <SelectValue placeholder="Selecciona el comportamiento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="🟥 Agresivo / Defensivo">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟥</span>
                          <span className="text-red-700 font-medium">Agresivo / Defensivo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="🟧 Nervioso / Desconfiado">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟧</span>
                          <span className="text-orange-700 font-medium">Nervioso / Desconfiado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="🟩 Sociable / Cooperativo">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟩</span>
                          <span className="text-green-700 font-medium">Sociable / Cooperativo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="🟦 Tranquilo / Obediente">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟦</span>
                          <span className="text-blue-700 font-medium">Tranquilo / Obediente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Personalizado">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✏️</span>
                          <span className="text-gray-700 font-medium">Comportamiento personalizado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="min-h-20 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 flex items-center gap-2">
                      {pet.behavior_override ? (
                        pet.behavior_override.startsWith('🟥') || pet.behavior_override.startsWith('🟧') || 
                        pet.behavior_override.startsWith('🟩') || pet.behavior_override.startsWith('🟦') ? (
                          <>
                            <span className="text-xl">{pet.behavior_override.split(' ')[0]}</span>
                            <span className={`font-medium ${
                              pet.behavior_override.startsWith('🟥') ? 'text-red-700' :
                              pet.behavior_override.startsWith('🟧') ? 'text-orange-700' :
                              pet.behavior_override.startsWith('🟩') ? 'text-green-700' :
                              pet.behavior_override.startsWith('🟦') ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {pet.behavior_override.substring(2)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg">✏️</span>
                            <span className="text-gray-700 font-medium">{pet.behavior_override}</span>
                          </>
                        )
                      ) : (
                        <span className="text-gray-500">No especificado - Comportamiento normal</span>
                      )}
                    </p>
                  </div>
                )}
                {isEditing && editData.behavior_override === 'Personalizado' && (
                  <div className="mt-3">
                    <Textarea 
                      placeholder="Describe el comportamiento específico de la mascota..."
                      value={editData.custom_behavior || ''}
                      onChange={e => setEditData({...editData, custom_behavior: e.target.value})}
                      className="min-h-20 border-amber-200 focus:border-amber-500 focus:ring-amber-200"
                    />
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileSignature/>Consentimiento Informado</CardTitle></CardHeader>
        <CardContent>
          {pet.consent_signed_at && pet.consent_signature ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-green-600 flex items-center gap-2"><CheckCircle/> Firmado</p>
                <p className="text-sm text-gray-500 ml-7">{format(parseISO(pet.consent_signed_at), "d MMMM, yyyy 'a las' h:mm a", { locale: es })}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={generateConsentPdf}><Eye className="w-4 h-4 mr-2"/>Ver PDF</Button>
                <Button variant="outline" onClick={() => setIsConsentEditOpen(true)}>Editar consentimiento</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-yellow-600">
                <XCircle/> <p className="font-semibold">Pendiente de firma. Puedes registrar el consentimiento aquí.</p>
              </div>
              <Button variant="outline" onClick={() => setIsConsentEditOpen(true)}>Registrar consentimiento</Button>
            </div>
          )}
          {isConsentEditOpen && (
            <div className="mt-6">
              <ConsentSignatureEditor
                initialSignature={pet.consent_signature || ''}
                initialDate={pet.consent_signed_at || ''}
                onSave={handleConsentSave}
                loading={consentLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de la Mascota</h2>
        <Tabs defaultValue="grooming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4"><TabsTrigger value="grooming"><PawPrint className="w-4 h-4 mr-1"/>Peluquería</TabsTrigger><TabsTrigger value="vaccination"><Shield className="w-4 h-4 mr-1"/>Vacunación</TabsTrigger><TabsTrigger value="deworming"><Stethoscope className="w-4 h-4 mr-1"/>Desparasitación</TabsTrigger><TabsTrigger value="general"><Info className="w-4 h-4 mr-1"/>General</TabsTrigger></TabsList>
          {['grooming', 'vaccination', 'deworming', 'general'].map(type => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                <Button onClick={() => handleHistoryAdd(type)} size="sm"><FilePlus className="w-4 h-4 mr-2" />Añadir Registro</Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input placeholder="Buscar en historial..." className="w-full sm:w-48" value={filters[type].search} onChange={e => handleFilterChange(type, 'search', e.target.value)} />
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal"><Clock className="mr-2 h-4 w-4" />{filters[type].date ? format(filters[type].date, "PPP", {locale: es}) : <span>Filtrar fecha</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters[type].date} onSelect={date => handleFilterChange(type, 'date', date)} initialFocus /></PopoverContent>
                    </Popover>
                    {filters[type].date && <Button variant="ghost" size="sm" onClick={() => handleFilterChange(type, 'date', null)}>Limpiar</Button>}
                </div>
              </div>
              <div className="space-y-4">
                {getFilteredHistory(type).map(entry => (
                  <div key={entry.id} className="bg-gray-50 p-4 rounded-lg text-sm flex justify-between items-center">
                     <div>
                       <p className="font-bold text-[#0378A6] flex items-center gap-2"> <Clock className="w-4 h-4"/> {format(new Date(entry.record_date), 'd MMM yyyy, HH:mm', { locale: es })} </p>
                       <p className="font-medium text-gray-700 ml-6">{entry.details?.service_name || entry.details?.vaccine || entry.details?.product || 'Observación General'}</p>
                       {entry.professional && <p className="text-xs text-gray-500 ml-6">Atendido por: {entry.professional.name}</p>}
                     </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewRecord(entry)}><Eye className="w-4 h-4 text-blue-500"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleHistoryEdit(entry)}><Edit className="w-4 h-4 text-yellow-500"/></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4 text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleHistoryDelete(entry.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                      </div>
                  </div>
                ))}
                {getFilteredHistory(type).length === 0 && <p className="text-gray-500 text-center py-4">No hay registros que coincidan con los filtros.</p>}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <HistoryRecordViewer isOpen={isViewerOpen} setIsOpen={setIsViewerOpen} record={viewingRecord} pet={pet} />
    </motion.div>
  );
};

export default PetProfile;