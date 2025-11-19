import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PawPrint, Shield, Stethoscope, Info, ImagePlus, X, UploadCloud, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const recordTypeDetails = {
    grooming: { title: 'Registro de Peluquería', icon: PawPrint },
    vaccination: { title: 'Registro de Vacunación', icon: Shield },
    deworming: { title: 'Registro de Desparasitación', icon: Stethoscope },
    general: { title: 'Observación General', icon: Info },
};

const ImageUploader = ({ title, images, setImages, previews, setPreviews }) => {
    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);
            const previewsArray = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...previewsArray]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div>
            <Label className="font-semibold">{title}</Label>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                        <img src={preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-lg"/>
                        <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}><X className="h-4 w-4"/></Button>
                    </div>
                ))}
                <Label htmlFor={`${title}-upload`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 text-gray-500">
                    <UploadCloud className="w-8 h-8"/>
                    <span className="text-xs text-center">Añadir foto</span>
                </Label>
            </div>
            <Input id={`${title}-upload`} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/>
        </div>
    );
};


const AddHistoryPage = () => {
    const { petId, recordType, historyId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ record_date: new Date().toISOString().slice(0, 16), details: {} });
    const [professionals, setProfessionals] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false); // Flag para controlar si ya se restauró el borrador
    
    // State for grooming images
    const [beforeImages, setBeforeImages] = useState([]);
    const [beforePreviews, setBeforePreviews] = useState([]);
    const [afterImages, setAfterImages] = useState([]);
    const [afterPreviews, setAfterPreviews] = useState([]);

    const detailsConfig = recordTypeDetails[recordType] || { title: 'Nuevo Registro', icon: Info };
    const isEditing = Boolean(historyId);
    
    // Clave única para localStorage basada en petId, recordType e historyId
    const draftKey = `history_draft_${petId}_${recordType}_${historyId || 'new'}`;

    // Guardar borrador en localStorage cada vez que cambie formData (solo después de restaurar)
    useEffect(() => {
        if (!isEditing && draftRestored) { // Solo guardar después de que se haya restaurado el borrador
            const draftData = {
                formData,
                beforePreviews,
                afterPreviews,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(draftKey, JSON.stringify(draftData));
        }
    }, [formData, beforePreviews, afterPreviews, draftKey, isEditing, draftRestored]);

    useEffect(() => {
        const fetchData = async () => {
            if (recordType === 'grooming') {
                const { data: servicesData } = await supabase.from('services').select('id, name, created_at').order('created_at', { ascending: false });
                // Filtrar servicios únicos por nombre, manteniendo el más reciente
                const uniqueServices = [];
                const seenNames = new Set();
                
                servicesData?.forEach(service => {
                    if (!seenNames.has(service.name)) {
                        seenNames.add(service.name);
                        uniqueServices.push(service);
                    }
                });
                
                setServices(uniqueServices || []);
            }
            const { data: profsData } = await supabase.from('professionals').select('id, name').eq('is_active', true);
            setProfessionals(profsData || []);

            if (isEditing) {
                setLoading(true);
                const { data, error } = await supabase.from('pet_history').select('*').eq('id', historyId).single();
                if (error) {
                    toast({ title: "Error", description: "No se pudo cargar el registro.", variant: "destructive" });
                    navigate(`/admin/pets/${petId}`);
                } else {
                    setFormData({
                        record_date: format(new Date(data.record_date), "yyyy-MM-dd'T'HH:mm"),
                        details: data.details || {},
                        professional_id: data.professional_id,
                    });
                    if (recordType === 'grooming') {
                        setBeforePreviews(data.details.before_images || []);
                        setAfterPreviews(data.details.after_images || []);
                    }
                }
                setLoading(false);
            } else {
                // Intentar cargar borrador guardado para registros nuevos
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    try {
                        const draftData = JSON.parse(savedDraft);
                        const draftAge = new Date() - new Date(draftData.timestamp);
                        // Solo restaurar si el borrador tiene menos de 24 horas
                        if (draftAge < 24 * 60 * 60 * 1000) {
                            setFormData(draftData.formData);
                            setBeforePreviews(draftData.beforePreviews || []);
                            setAfterPreviews(draftData.afterPreviews || []);
                            toast({ 
                                title: "Borrador restaurado", 
                                description: "Se ha recuperado tu borrador anterior.",
                                duration: 3000
                            });
                        } else {
                            // Eliminar borradores antiguos
                            localStorage.removeItem(draftKey);
                        }
                    } catch (error) {
                        console.error('Error al restaurar borrador:', error);
                        localStorage.removeItem(draftKey);
                    }
                }
                // Activar el flag después de intentar restaurar (haya o no borrador)
                setDraftRestored(true);
            }
        };
        fetchData();
    }, [recordType, historyId, isEditing, petId, navigate, draftKey]);
    
    const handleDetailChange = (field, value) => setFormData(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
    const handleFormChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
    
    const handleCancel = () => {
        // Limpiar borrador al cancelar
        if (!isEditing) {
            localStorage.removeItem(draftKey);
        }
        navigate(`/admin/pets/${petId}`);
    };
    
    const handleClearDraft = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar el borrador y empezar de nuevo?')) {
            localStorage.removeItem(draftKey);
            setFormData({ record_date: new Date().toISOString().slice(0, 16), details: {} });
            setBeforePreviews([]);
            setAfterPreviews([]);
            setBeforeImages([]);
            setAfterImages([]);
            setDraftRestored(true); // Mantener el flag activo para que siga guardando
            toast({ 
                title: "Borrador eliminado", 
                description: "El formulario se ha limpiado correctamente." 
            });
        }
    };

    const uploadImages = async (imageList, category) => {
        const imageUrls = [];
        for (const image of imageList) {
            const fileName = `pet-history/${petId}/${recordType}-${category}-${Date.now()}-${image.name}`;
            const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, image);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
            imageUrls.push(publicUrl);
        }
        return imageUrls;
    };

    const handleSave = async () => {
        setLoading(true);
        let detailsToSave = { ...formData.details };
        
        try {
            if (recordType === 'grooming') {
                const newBeforeImages = await uploadImages(beforeImages, 'before');
                const newAfterImages = await uploadImages(afterImages, 'after');
                // Solo usar las previews existentes si estamos editando y no hay nuevas imágenes
                detailsToSave.before_images = newBeforeImages.length > 0 ? [...(beforePreviews || []), ...newBeforeImages] : (beforePreviews || []);
                detailsToSave.after_images = newAfterImages.length > 0 ? [...(afterPreviews || []), ...newAfterImages] : (afterPreviews || []);
                if (detailsToSave.service_id) {
                    const selectedService = services.find(s => s.id === detailsToSave.service_id);
                    detailsToSave.service_name = selectedService?.name;
                }
            }
            const payload = { pet_id: petId, record_type: recordType, record_date: formData.record_date, details: detailsToSave, professional_id: formData.professional_id };
            const { error } = isEditing ? await supabase.from('pet_history').update(payload).eq('id', historyId) : await supabase.from('pet_history').insert(payload);
            if (error) throw error;
            
            // Limpiar borrador después de guardar exitosamente
            localStorage.removeItem(draftKey);
            
            toast({ title: "Éxito", description: `Registro ${isEditing ? 'actualizado' : 'guardado'} correctamente.` });
            navigate(`/admin/pets/${petId}`);
        } catch (error) { toast({ title: "Error al guardar", description: error.message, variant: "destructive" }); } 
        finally { setLoading(false); }
    };

    const renderFields = () => {
        const commonFields = (
          <>
            <div><Label>Fecha y Hora</Label><Input type="datetime-local" value={formData.record_date || ''} onChange={e => handleFormChange('record_date', e.target.value)} /></div>
            <div><Label>Profesional a Cargo</Label><Select onValueChange={v => handleFormChange('professional_id', v)} value={formData.professional_id || ''}><SelectTrigger><SelectValue placeholder="Seleccionar profesional..."/></SelectTrigger><SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><User className="w-4 h-4"/>{p.name}</div></SelectItem>)}</SelectContent></Select></div>
          </>
        );
        switch (recordType) {
            case 'grooming': return <> {commonFields} 
                <div><Label>Servicio</Label><Select onValueChange={v => handleDetailChange('service_id', v)} value={formData.details.service_id || ''}><SelectTrigger><SelectValue placeholder="Seleccionar servicio..."/></SelectTrigger><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div> 
                <div><Label>Comportamiento</Label><Textarea value={formData.details.behavior || ''} onChange={e => handleDetailChange('behavior', e.target.value)} /></div>
                <div><Label>Observaciones</Label><Textarea value={formData.details.observations || ''} onChange={e => handleDetailChange('observations', e.target.value)} /></div>
                <div className="space-y-4">
                    <ImageUploader title="Fotos del Antes" images={beforeImages} setImages={setBeforeImages} previews={beforePreviews} setPreviews={setBeforePreviews} />
                    <ImageUploader title="Fotos del Después" images={afterImages} setImages={setAfterImages} previews={afterPreviews} setPreviews={setAfterPreviews} />
                </div>
            </>;
            case 'vaccination': return <> {commonFields} <div><Label>Vacuna</Label><Input value={formData.details.vaccine || ''} onChange={e => handleDetailChange('vaccine', e.target.value)} /></div> <div><Label>Dosis</Label><Input value={formData.details.dose || ''} onChange={e => handleDetailChange('dose', e.target.value)} /></div> <div><Label>Próxima Dosis</Label><Input type="date" value={formData.details.next_dose || ''} onChange={e => handleDetailChange('next_dose', e.target.value)} /></div> <div><Label>Observaciones</Label><Textarea value={formData.details.observations || ''} onChange={e => handleDetailChange('observations', e.target.value)} /></div></>;
            case 'deworming': return <> {commonFields} <div><Label>Producto</Label><Input value={formData.details.product || ''} onChange={e => handleDetailChange('product', e.target.value)} /></div> <div><Label>Tipo</Label><Select onValueChange={v => handleDetailChange('type', v)} value={formData.details.type || ''}><SelectTrigger><SelectValue placeholder="Interna/Externa"/></SelectTrigger><SelectContent><SelectItem value="Interna">Interna</SelectItem><SelectItem value="Externa">Externa</SelectItem></SelectContent></Select></div> <div><Label>Próxima Aplicación</Label><Input type="date" value={formData.details.next_application || ''} onChange={e => handleDetailChange('next_application', e.target.value)} /></div> <div><Label>Observaciones</Label><Textarea value={formData.details.observations || ''} onChange={e => handleDetailChange('observations', e.target.value)} /></div> </>;
            case 'general': return <> {commonFields} <div><Label>Observación</Label><Textarea value={formData.details.observation || ''} onChange={e => handleDetailChange('observation', e.target.value)} /></div></>;
            default: return <p>Tipo de registro no válido.</p>;
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <detailsConfig.icon className="w-6 h-6 text-[#0378A6]" />
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar' : 'Añadir'} {detailsConfig.title}</h1>
                </div>
                {!isEditing && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleClearDraft}
                        className="text-gray-600 hover:text-red-600"
                    >
                        Limpiar Borrador
                    </Button>
                )}
            </div>
            <div className="space-y-6">
                {loading ? <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div> : renderFields()}
            </div>
            <div className="mt-8 flex justify-end gap-2">
                <Button variant="ghost" onClick={handleCancel} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar Registro"}</Button>
            </div>
        </motion.div>
    );
};

export default AddHistoryPage;