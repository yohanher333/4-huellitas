import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useHistoryPDF = () => {
    const generateHistoryPdf = async (record, pet) => {
        try {
            const doc = new jsPDF();
            
            // Obtener logo desde company_info
            let companyLogo = null;
            let companyName = "4HUELLITAS";
            let companyPhone = "";
            let companyAddress = "";
            
            try {
                const { data: companyData } = await supabase
                    .from('company_info')
                    .select('logo, name, phone, address')
                    .maybeSingle();
                
                if (companyData?.logo) companyLogo = companyData.logo;
                if (companyData?.name) companyName = companyData.name;
                if (companyData?.phone) companyPhone = companyData.phone;
                if (companyData?.address) companyAddress = companyData.address;
            } catch (error) {
                console.log('No se pudo obtener la información de la empresa:', error);
            }
            
            // Configuración de fuentes y colores
            const primaryColor = [3, 120, 166]; // #0378A6
            const secondaryColor = [242, 101, 19]; // #F26513
            const grayColor = [107, 114, 128];
            const darkGray = [55, 65, 81];
            
            // Header con logo y branding
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F');
            
            // Agregar logo si está disponible
            if (companyLogo) {
                try {
                    doc.addImage(companyLogo, 'PNG', 15, 8, 25, 25);
                } catch (logoError) {
                    console.log('Error agregando logo al PDF:', logoError);
                }
            }
            
            // Título principal
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text(companyName, companyLogo ? 50 : 105, 20, { align: companyLogo ? 'left' : 'center' });
            doc.setFontSize(14);
            doc.text("Centro Veterinario Integral", companyLogo ? 50 : 105, 28, { align: companyLogo ? 'left' : 'center' });
            doc.setFontSize(12);
            doc.text("Registro de Atención Médica", companyLogo ? 50 : 105, 35, { align: companyLogo ? 'left' : 'center' });
            
            // Información del registro
            let yPos = 50;
            doc.setTextColor(...darkGray);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            const recordTypeNames = {
                'grooming': 'Peluquería y Estética',
                'vaccination': 'Vacunación',
                'deworming': 'Desparasitación',
                'general': 'Consulta General'
            };
            doc.text(recordTypeNames[record.record_type] || 'Registro Médico', 15, yPos);
            
            // Fecha y hora
            yPos += 10;
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...grayColor);
            doc.text(`Fecha: ${format(parseISO(record.record_date), "EEEE, d 'de' MMMM 'de' yyyy 'a las' h:mm a", { locale: es })}`, 15, yPos);
            
            // Línea divisoria
            yPos += 10;
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(1);
            doc.line(15, yPos, 195, yPos);
            
            // Información de la mascota (en recuadro)
            yPos += 15;
            doc.setFillColor(248, 250, 252);
            doc.rect(15, yPos - 5, 180, 45, 'F');
            doc.setDrawColor(...grayColor);
            doc.setLineWidth(0.5);
            doc.rect(15, yPos - 5, 180, 45);
            
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text("DATOS DE LA MASCOTA", 20, yPos + 5);
            
            doc.setTextColor(...darkGray);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Nombre: ${pet.name}`, 20, yPos + 15);
            doc.text(`Especie: ${pet.species || 'No especificada'}`, 20, yPos + 22);
            doc.text(`Raza: ${pet.breed?.name || 'No especificada'}`, 20, yPos + 29);
            doc.text(`Edad: ${pet.age ? `${pet.age} años` : 'No especificada'}`, 110, yPos + 15);
            doc.text(`Peso: ${pet.weight ? `${pet.weight} kg` : 'No especificado'}`, 110, yPos + 22);
            doc.text(`Color: ${pet.color || 'No especificado'}`, 110, yPos + 29);
            
            // Información del propietario
            yPos += 55;
            doc.setFillColor(254, 249, 195);
            doc.rect(15, yPos - 5, 180, 30, 'F');
            doc.setDrawColor(...grayColor);
            doc.rect(15, yPos - 5, 180, 30);
            
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text("PROPIETARIO", 20, yPos + 5);
            
            doc.setTextColor(...darkGray);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Nombre: ${pet.owner.name}`, 20, yPos + 15);
            if (pet.owner.phone) doc.text(`Teléfono: ${pet.owner.phone}`, 110, yPos + 15);
            if (pet.owner.email) doc.text(`Email: ${pet.owner.email}`, 20, yPos + 22);
            
            // Detalles del procedimiento
            yPos += 45;
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text("DETALLES DEL PROCEDIMIENTO", 15, yPos);
            
            yPos += 5;
            doc.setDrawColor(...primaryColor);
            doc.line(15, yPos, 195, yPos);
            yPos += 15;
            
            doc.setTextColor(...darkGray);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            const details = record.details;
            
            const addDetailField = (label, value, isBold = false) => {
                if (value && value.toString().trim()) {
                    // Escribir la etiqueta en negrita
                    doc.setFont(undefined, 'bold');
                    doc.text(`${label}:`, 15, yPos);
                    
                    // Calcular el ancho de la etiqueta y agregar un espacio adicional
                    const labelWidth = doc.getTextWidth(`${label}: `);
                    const spacing = 5; // Espacio adicional entre etiqueta y valor
                    
                    doc.setFont(undefined, 'normal');
                    
                    if (isBold) {
                        // Para campos en negrita, mantener en la misma línea con espacio adicional
                        doc.text(value.toString(), 15 + labelWidth + spacing, yPos);
                        yPos += 8;
                    } else {
                        // Manejar texto largo
                        const textWidth = 170;
                        const splitText = doc.splitTextToSize(value.toString(), textWidth);
                        
                        if (splitText.length === 1) {
                            doc.text(splitText[0], 15 + labelWidth + spacing, yPos);
                            yPos += 8;
                        } else {
                            yPos += 6;
                            doc.text(splitText, 20, yPos);
                            yPos += (splitText.length * 5) + 3;
                        }
                    }
                }
            };
            
            // Contenido específico según el tipo de registro
            switch (record.record_type) {
                case 'grooming':
                    addDetailField('Servicio Realizado', details.service_name, true);
                    addDetailField('Comportamiento de la Mascota', details.behavior);
                    addDetailField('Estilo de Corte', details.style);
                    addDetailField('Productos Utilizados', details.products);
                    addDetailField('Duración del Servicio', details.duration ? `${details.duration} minutos` : '');
                    addDetailField('Estado del Pelaje (Antes)', details.coat_condition_before);
                    addDetailField('Estado del Pelaje (Después)', details.coat_condition_after);
                    addDetailField('Observaciones Generales', details.observations);
                    
                    // Agregar imágenes al PDF si existen
                    const validBeforeImages = details.before_images && Array.isArray(details.before_images) 
                        ? details.before_images.filter(img => img && !img.startsWith('blob:') && 
                          (img.startsWith('http') || img.startsWith('https'))) : [];
                    const validAfterImages = details.after_images && Array.isArray(details.after_images) 
                        ? details.after_images.filter(img => img && !img.startsWith('blob:') && 
                          (img.startsWith('http') || img.startsWith('https'))) : [];
                    
                    // Función para agregar imágenes al PDF
                    const addImagesToPdf = async (images, title) => {
                        if (images.length === 0) return;
                        
                        yPos += 10;
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(...primaryColor);
                        doc.text(title, 15, yPos);
                        yPos += 10;
                        
                        let imageCount = 0;
                        const maxImagesPerRow = 2;
                        const imageWidth = 80;
                        const imageHeight = 60;
                        
                        for (let i = 0; i < Math.min(images.length, 6); i++) { // Máximo 6 imágenes
                            try {
                                // Verificar si necesitamos una nueva página
                                if (yPos + imageHeight > 270) {
                                    doc.addPage();
                                    yPos = 20;
                                }
                                
                                const xPos = 15 + (imageCount % maxImagesPerRow) * (imageWidth + 10);
                                
                                // Crear canvas temporal para cargar la imagen
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                const img = new Image();
                                img.crossOrigin = 'anonymous';
                                
                                await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                        canvas.width = imageWidth * 2; // Mayor resolución
                                        canvas.height = imageHeight * 2;
                                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                        
                                        try {
                                            const imageData = canvas.toDataURL('image/jpeg', 0.8);
                                            doc.addImage(imageData, 'JPEG', xPos, yPos, imageWidth, imageHeight);
                                            resolve();
                                        } catch (err) {
                                            console.log(`Error procesando imagen ${i + 1}:`, err);
                                            resolve(); // Continuar aunque falle una imagen
                                        }
                                    };
                                    
                                    img.onerror = () => {
                                        console.log(`Error cargando imagen ${i + 1}`);
                                        resolve(); // Continuar aunque falle una imagen
                                    };
                                    
                                    // Timeout para evitar que se quede colgado
                                    setTimeout(() => {
                                        console.log(`Timeout cargando imagen ${i + 1}`);
                                        resolve();
                                    }, 5000);
                                    
                                    img.src = images[i];
                                });
                                
                                imageCount++;
                                
                                // Si completamos una fila, bajar a la siguiente
                                if (imageCount % maxImagesPerRow === 0) {
                                    yPos += imageHeight + 10;
                                }
                                
                            } catch (error) {
                                console.log(`Error agregando imagen ${i + 1} al PDF:`, error);
                                continue;
                            }
                        }
                        
                        // Ajustar posición si quedaron imágenes en la última fila
                        if (imageCount % maxImagesPerRow !== 0) {
                            yPos += imageHeight + 10;
                        }
                        
                        doc.setTextColor(...darkGray);
                        doc.setFont(undefined, 'normal');
                        yPos += 5;
                    };
                    
                    // Agregar imágenes del antes
                    if (validBeforeImages.length > 0) {
                        await addImagesToPdf(validBeforeImages, "FOTOGRAFÍAS DEL ANTES");
                    }
                    
                    // Agregar imágenes del después
                    if (validAfterImages.length > 0) {
                        await addImagesToPdf(validAfterImages, "FOTOGRAFÍAS DEL DESPUÉS");
                    }
                    break;
                    
                case 'vaccination':
                    addDetailField('Vacuna Aplicada', details.vaccine, true);
                    addDetailField('Dosis', details.dose);
                    addDetailField('Lote/Serie', details.batch);
                    addDetailField('Laboratorio', details.manufacturer);
                    if (details.next_dose) {
                        addDetailField('Próxima Dosis Programada', 
                            format(parseISO(details.next_dose), "d 'de' MMMM 'de' yyyy", { locale: es }));
                    }
                    addDetailField('Peso al Momento de Vacunación', details.weight_at_vaccination ? `${details.weight_at_vaccination} kg` : '');
                    addDetailField('Temperatura Corporal', details.temperature ? `${details.temperature}°C` : '');
                    addDetailField('Reacciones Adversas', details.adverse_reactions);
                    addDetailField('Observaciones', details.observations);
                    
                    // Agregar información del profesional
                    if (record.professional?.name) {
                        addDetailField('Atendido por', record.professional.name);
                        if (record.professional.title) {
                            addDetailField('Cargo', record.professional.title);
                        }
                    }
                    break;
                    
                case 'deworming':
                    addDetailField('Producto Utilizado', details.product, true);
                    addDetailField('Tipo de Desparasitación', details.type);
                    addDetailField('Dosis Aplicada', details.dosage);
                    addDetailField('Vía de Administración', details.administration_route);
                    if (details.next_application) {
                        addDetailField('Próxima Aplicación', 
                            format(parseISO(details.next_application), "d 'de' MMMM 'de' yyyy", { locale: es }));
                    }
                    addDetailField('Peso de la Mascota', details.pet_weight ? `${details.pet_weight} kg` : '');
                    addDetailField('Parásitos Detectados', details.parasites_found);
                    addDetailField('Observaciones', details.observations);
                    break;
                    
                case 'general':
                    addDetailField('Motivo de Consulta', details.reason, true);
                    addDetailField('Síntomas Observados', details.symptoms);
                    addDetailField('Diagnóstico', details.diagnosis);
                    addDetailField('Tratamiento Prescrito', details.treatment);
                    addDetailField('Medicamentos', details.medications);
                    addDetailField('Peso Actual', details.current_weight ? `${details.current_weight} kg` : '');
                    addDetailField('Temperatura', details.temperature ? `${details.temperature}°C` : '');
                    addDetailField('Frecuencia Cardíaca', details.heart_rate ? `${details.heart_rate} lpm` : '');
                    addDetailField('Observación General', details.observation);
                    break;
                    
                default:
                    doc.text("Información detallada no disponible para este tipo de registro.", 15, yPos);
                    yPos += 10;
            }
            
            // Calcular posición del footer
            const pageHeight = doc.internal.pageSize.height;
            const footerHeight = 35;
            const footerY = pageHeight - footerHeight;
            
            // Footer con franja de información de contacto
            
            // Franja de fondo para el footer
            doc.setFillColor(239, 246, 255);
            doc.rect(0, footerY, 210, footerHeight, 'F');
            
            // Línea superior del footer
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(1);
            doc.line(0, footerY, 210, footerY);
            
            // Título de información de contacto
            doc.setTextColor(...primaryColor);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("INFORMACION DE CONTACTO", 15, footerY + 10);
            
            // Información de contacto en el footer
            doc.setTextColor(...darkGray);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            
            // Primera línea de contacto
            doc.text(`Direccion: ${companyAddress}`, 15, footerY + 18);
            doc.text(`Telefono: ${companyPhone}`, 110, footerY + 18);
            
            // Segunda línea de contacto
            doc.text("Sitio web: www.4huellitas.com", 15, footerY + 25);
            doc.text("Email: contacto@4huellitas.com", 110, footerY + 25);
            
            // Información del documento en la parte inferior
            doc.setTextColor(...grayColor);
            doc.setFontSize(7);
            doc.text("Documento generado automáticamente", 15, footerY + 32);
            doc.text(`Fecha: ${format(new Date(), "d/MM/yyyy HH:mm", { locale: es })}`, 105, footerY + 32, { align: 'center' });
            doc.text(`ID: ${record.id?.substring(0, 8) || 'N/A'}`, 195, footerY + 32, { align: 'right' });
            
            // Guardar el archivo con tipo traducido al español
            const recordTypeTranslations = {
                'grooming': 'peluqueria',
                'vaccination': 'vacunacion',
                'deworming': 'desparasitacion',
                'general': 'general'
            };
            const recordTypeInSpanish = recordTypeTranslations[record.record_type] || record.record_type;
            const fileName = `registro_${pet.name.replace(/[^a-zA-Z0-9]/g, '_')}_${recordTypeInSpanish}_${format(parseISO(record.record_date), 'yyyy_MM_dd', { locale: es })}.pdf`;
            doc.save(fileName);
            
            toast({
                title: "PDF Generado",
                description: `El registro de ${pet.name} se ha descargado correctamente.`,
            });
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                title: "Error",
                description: "No se pudo generar el PDF. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    return { generateHistoryPdf };
};