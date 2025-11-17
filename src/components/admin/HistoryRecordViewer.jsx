import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Download, Share2 } from 'lucide-react';
import { useHistoryPDF } from '@/hooks/useHistoryPDF';

const HistoryRecordViewer = ({ isOpen, setIsOpen, record, pet }) => {
    const { generateHistoryPdf } = useHistoryPDF();
    
    if (!record || !pet) return null;

    const handleDownloadPDF = () => {
        generateHistoryPdf(record, pet);
    };

    const shareOnWhatsApp = () => {
        let detailsText = '';
        const details = record.details;
        switch (record.record_type) {
            case 'grooming': 
                detailsText = `Servicio: ${details.service_name || 'N/A'}\nComportamiento: ${details.behavior || 'N/A'}\nObservaciones: ${details.observations || 'N/A'}`; 
                break;
            case 'vaccination': 
                detailsText = `Vacuna: ${details.vaccine || 'N/A'}\nDosis: ${details.dose || 'N/A'}${details.observations ? `\nObservaciones: ${details.observations}` : ''}`; 
                break;
            case 'deworming': 
                detailsText = `Producto: ${details.product || 'N/A'}\nTipo: ${details.type || 'N/A'}${details.observations ? `\nObservaciones: ${details.observations}` : ''}`; 
                break;
            case 'general': 
                detailsText = `Observación: ${details.observation || 'N/A'}`; 
                break;
            default: 
                detailsText = 'Detalles no disponibles.';
        }

        const message = `¡Hola! Te comparto el registro de atención para ${pet.name}:\n\n*Fecha:* ${format(parseISO(record.record_date), "d MMM yyyy", { locale: es })}\n*Tipo:* ${record.record_type}\n*Detalles:*\n${detailsText}\n\n- Generado por 4huellitas`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const renderDetails = () => {
        const details = record.details;
        
        // Debug para ver qué datos están llegando
        if (record.record_type === 'grooming') {
            console.log('🔍 Debug - Datos de peluquería:', {
                before_images_raw: details.before_images,
                after_images_raw: details.after_images,
                before_blob_urls: details.before_images?.filter(img => img?.startsWith('blob:')),
                after_blob_urls: details.after_images?.filter(img => img?.startsWith('blob:')),
                before_valid_urls: details.before_images?.filter(img => img && !img.startsWith('blob:') && (img.startsWith('http') || img.startsWith('https'))),
                after_valid_urls: details.after_images?.filter(img => img && !img.startsWith('blob:') && (img.startsWith('http') || img.startsWith('https')))
            });
        }
        
        const detailItem = (label, value) => value ? <p><strong>{label}:</strong> {value}</p> : null;
        switch (record.record_type) {
            case 'grooming':
                // Filtrar imágenes válidas (excluir URLs blob temporales)
                const validBeforeImages = details.before_images && Array.isArray(details.before_images) 
                    ? details.before_images.filter(img => 
                        img && 
                        typeof img === 'string' && 
                        img.trim() !== '' && 
                        !img.startsWith('blob:') && 
                        (img.startsWith('http') || img.startsWith('https'))
                    ) 
                    : [];
                const validAfterImages = details.after_images && Array.isArray(details.after_images) 
                    ? details.after_images.filter(img => 
                        img && 
                        typeof img === 'string' && 
                        img.trim() !== '' && 
                        !img.startsWith('blob:') && 
                        (img.startsWith('http') || img.startsWith('https'))
                    ) 
                    : [];
                
                return (<>
                    {detailItem("Servicio", details.service_name)}
                    {detailItem("Comportamiento", details.behavior)}
                    {detailItem("Observaciones", details.observations)}
                    {validBeforeImages.length > 0 && (
                        <div>
                            <strong>Fotos del Antes:</strong>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {validBeforeImages.map((image, index) => (
                                    <img 
                                        key={index} 
                                        src={image} 
                                        alt={`Antes ${index + 1}`} 
                                        className="rounded-lg max-h-32 w-full object-cover cursor-pointer hover:opacity-80" 
                                        onClick={() => window.open(image, '_blank')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {validAfterImages.length > 0 && (
                        <div>
                            <strong>Fotos del Después:</strong>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {validAfterImages.map((image, index) => (
                                    <img 
                                        key={index} 
                                        src={image} 
                                        alt={`Después ${index + 1}`} 
                                        className="rounded-lg max-h-32 w-full object-cover cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(image, '_blank')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>);
            case 'vaccination':
                return (<>
                    {detailItem("Vacuna", details.vaccine)}
                    {detailItem("Dosis", details.dose)}
                    {details.next_dose && detailItem("Próxima Dosis", format(parseISO(details.next_dose), 'd MMM yyyy', { locale: es }))}
                    {detailItem("Observaciones", details.observations)}
                </>);
            case 'deworming':
                return (<>
                    {detailItem("Producto", details.product)}
                    {detailItem("Tipo", details.type)}
                    {details.next_application && detailItem("Próxima Aplicación", format(parseISO(details.next_application), 'd MMM yyyy', { locale: es }))}
                    {detailItem("Observaciones", details.observations)}
                </>);
            case 'general':
                return <p>{details.observation || 'Sin detalles.'}</p>;
            default:
                return <p>Detalles no disponibles.</p>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="capitalize">Registro de {record.record_type}</DialogTitle>
                    <div className="text-sm text-gray-500 flex items-center gap-2 pt-1">
                        <Clock className="w-4 h-4" />
                        {format(parseISO(record.record_date), "d MMMM, yyyy 'a las' h:mm a", { locale: es })}
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-3 text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
                    {renderDetails()}
                    {record.professional && <p className="text-xs text-gray-500 mt-4">Atendido por: {record.professional.name}</p>}
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="outline" onClick={shareOnWhatsApp}><Share2 className="w-4 h-4 mr-2" />Compartir</Button>
                    <Button onClick={handleDownloadPDF}><Download className="w-4 h-4 mr-2" />Descargar PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HistoryRecordViewer;