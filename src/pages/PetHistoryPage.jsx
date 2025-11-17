import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dog, Cat, Cake, Stethoscope, PawPrint, Shield, Info, Clock, FileSignature, Download, CheckCircle, XCircle, Eye, Calendar, History } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from 'jspdf';
import HistoryRecordViewer from '@/components/admin/HistoryRecordViewer';
import { useHistoryPDF } from '@/hooks/useHistoryPDF';

const PetHistoryPage = () => {
    const { petId } = useParams();
    const navigate = useNavigate();
    const { generateHistoryPdf } = useHistoryPDF();
    const [pet, setPet] = useState(null);
    const [owner, setOwner] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);

    const fetchPetData = useCallback(async () => {
        setLoading(true);
        const { data: petData, error: petError } = await supabase
            .from('pets')
            .select('*, breed:breeds(name), owner:profiles(*)')
            .eq('id', petId)
            .single();

        if (petError || !petData) {
            toast({ title: "Mascota no encontrada", variant: "destructive" });
            navigate('/dashboard/pets');
            return;
        }
        setPet(petData);
        setOwner(petData.owner);

        const { data: historyData, error: historyError } = await supabase
            .from('pet_history')
            .select('*, professional:professionals(name)')
            .eq('pet_id', petId)
            .order('record_date', { ascending: false });

        if (historyError) {
            toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
        } else {
            setHistory(historyData);
        }

        setLoading(false);
    }, [petId, navigate]);

    useEffect(() => {
        fetchPetData();
    }, [fetchPetData]);

    const getPetAge = (birthDate) => {
        if (!birthDate) return 'Desconocida';
        return `${differenceInYears(new Date(), parseISO(birthDate))} años`;
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
      
    const handleViewRecord = (record) => {
        setViewingRecord(record);
        setIsViewerOpen(true);
    };

    const handleDownloadPDF = (entry) => {
        // Preparar los datos del pet con owner para el PDF
        const petWithOwner = {
            ...pet,
            owner: owner
        };
        generateHistoryPdf(entry, petWithOwner);
    };

    const HistoryList = ({ type }) => {
        const filteredHistory = history.filter(h => h.record_type === type);
        if (filteredHistory.length === 0) {
            return <p className="text-center text-gray-500 py-8">No hay registros de este tipo.</p>;
        }
        return (
            <div className="space-y-6">
                {filteredHistory.map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                        <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-white to-blue-50/30 border-none shadow-lg overflow-hidden">
                            <CardHeader className="pb-4 bg-gradient-to-r from-[#0378A6]/5 to-[#F26513]/5">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0378A6] to-[#F26513] shadow-sm"></div>
                                        <span className="font-semibold text-gray-800">{format(parseISO(entry.record_date), 'd MMMM, yyyy', { locale: es })}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 bg-white/70 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <Clock className="w-3 h-3"/>
                                        {format(parseISO(entry.record_date), 'h:mm a')}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50/50 to-orange-50/50 rounded-lg border-l-4 border-l-gradient-to-b border-l-[#0378A6]">
                                    <p className="font-medium text-gray-800 text-sm leading-relaxed">
                                        {entry.details?.service_name || entry.details?.vaccine || entry.details?.product || 'Observación General'}
                                    </p>
                                </div>
                                {entry.professional && (
                                    <div className="flex items-center gap-2 mb-4 p-2 bg-green-50/50 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <p className="text-xs text-gray-700">
                                            Atendido por: <span className="font-semibold text-green-700">{entry.professional.name}</span>
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleViewRecord(entry)}
                                        className="flex-1 bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver detalles
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDownloadPDF(entry)}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        );
    };

    if (loading) { return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>; }
    if (!pet) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
            {/* Header con botón de volver */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
                <div className="p-4 sm:p-6">
                    <Button onClick={() => navigate(-1)} variant="ghost" className="hover:bg-[#0378A6]/10 transition-all duration-200">
                        <ArrowLeft className="w-4 h-4 mr-2 text-[#0378A6]" /> Volver
                    </Button>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {/* Ficha técnica rediseñada */}
                <div className="relative mb-8">
                    {/* Background decorativo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0378A6]/10 via-white/50 to-[#F26513]/10 rounded-3xl transform rotate-1"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                        {/* Header con foto y nombre */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0378A6] via-[#0378A6]/90 to-[#F26513]/80"></div>
                            <div className="relative p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {/* Foto de la mascota */}
                                    <div className="relative group">
                                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/20 backdrop-blur-sm p-2">
                                            <img 
                                                src={pet.photo_url || 'https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/5b1a62d4e78298715d311910a3013c72.png'} 
                                                alt={pet.name} 
                                                className="w-full h-full rounded-full object-cover border-4 border-white/50 group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        {/* Badge de especie */}
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                            {pet.species === 'Gato' ? 
                                                <Cat className="w-6 h-6 text-[#F26513]" /> : 
                                                <Dog className="w-6 h-6 text-[#0378A6]" />
                                            }
                                        </div>
                                    </div>
                                    
                                    {/* Información principal */}
                                    <div className="flex-grow text-center sm:text-left">
                                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 font-heading">
                                            {pet.name}
                                        </h1>
                                        <p className="text-xl text-white/90 mb-4">
                                            {pet.breed?.name || 'Raza no especificada'}
                                        </p>
                                        
                                        {/* Badges de información */}
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                                <Cake className="w-5 h-5 text-white" />
                                                <span className="text-white font-medium">{getPetAge(pet.birth_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                                <PawPrint className="w-5 h-5 text-white" />
                                                <span className="text-white font-medium">{pet.species}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Información adicional con iconos coloridos */}
                        <div className="p-6 sm:p-8 bg-white/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Estado de salud */}
                                <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Estado de Salud</p>
                                        <p className="text-gray-600">{pet.medical_issues || 'Saludable'}</p>
                                    </div>
                                </div>

                                {/* Peso */}
                                {pet.weight && (
                                    <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                                            <PawPrint className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">Peso Actual</p>
                                            <p className="text-gray-600">{pet.weight} kg</p>
                                        </div>
                                    </div>
                                )}

                                {/* Fecha de registro */}
                                <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Registrado</p>
                                        <p className="text-gray-600">
                                            {format(parseISO(pet.created_at || new Date().toISOString()), "MMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Sección de consentimiento rediseñada */}
                <div className="mb-8">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                        {/* Header del consentimiento */}
                        <div className="bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 p-6 border-b border-gray-200/50">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#0378A6] rounded-full flex items-center justify-center">
                                    <FileSignature className="w-5 h-5 text-white"/>
                                </div>
                                Consentimiento Informado
                            </h2>
                        </div>
                        
                        {/* Contenido del consentimiento */}
                        <div className="p-6">
                            {pet.consent_signed_at ? (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-6 h-6 text-green-600"/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-green-700 text-lg">✅ Consentimiento Firmado</p>
                                            <p className="text-gray-600 mt-1">
                                                {format(parseISO(pet.consent_signed_at), "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={generateConsentPdf}
                                        className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Eye className="w-4 h-4 mr-2"/>
                                        Ver PDF
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <XCircle className="w-6 h-6 text-yellow-600"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-yellow-700 text-lg">⏳ Pendiente de Firma</p>
                                        <p className="text-gray-600 mt-1">
                                            El consentimiento se firmará en la próxima cita programada.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sección de historial médico rediseñada */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                    {/* Header del historial */}
                    <div className="bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 p-6 border-b border-gray-200/50">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#F26513] rounded-full flex items-center justify-center">
                                <History className="w-5 h-5 text-white"/>
                            </div>
                            Historial Médico
                        </h2>
                    </div>

                    {/* Pestañas rediseñadas */}
                    <Tabs defaultValue="grooming" className="w-full">
                        <div className="p-6 pb-0">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-100/50 p-1 rounded-xl h-auto gap-1">
                                <TabsTrigger 
                                    value="grooming" 
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F26513] data-[state=active]:to-[#F26513]/90 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-300"
                                >
                                    <PawPrint className="w-4 h-4 mr-2"/>
                                    <span className="hidden sm:inline">Peluquería</span>
                                    <span className="sm:hidden">Spa</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="vaccination"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0378A6] data-[state=active]:to-[#0378A6]/90 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-300"
                                >
                                    <Shield className="w-4 h-4 mr-2"/>
                                    <span className="hidden sm:inline">Vacunación</span>
                                    <span className="sm:hidden">Vacunas</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="deworming"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-300"
                                >
                                    <Stethoscope className="w-4 h-4 mr-2"/>
                                    <span className="hidden sm:inline">Desparasitación</span>
                                    <span className="sm:hidden">Desparasitación</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="general"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-300"
                                >
                                    <Info className="w-4 h-4 mr-2"/>
                                    <span className="hidden sm:inline">General</span>
                                    <span className="sm:hidden">Otros</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <div className="p-6">
                            <TabsContent value="grooming" className="mt-0"><HistoryList type="grooming" /></TabsContent>
                            <TabsContent value="vaccination" className="mt-0"><HistoryList type="vaccination" /></TabsContent>
                            <TabsContent value="deworming" className="mt-0"><HistoryList type="deworming" /></TabsContent>
                            <TabsContent value="general" className="mt-0"><HistoryList type="general" /></TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
            
            <HistoryRecordViewer 
                isOpen={isViewerOpen} 
                setIsOpen={setIsViewerOpen} 
                record={viewingRecord} 
                pet={pet ? {...pet, owner: owner} : null} 
            />
        </motion.div>
    );
};

export default PetHistoryPage;