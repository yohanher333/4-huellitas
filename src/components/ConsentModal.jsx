import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

const ConsentModal = ({ isOpen, onConfirm, loading, userData, setUserData }) => {
    const sigCanvas = useRef({});
    const [accepted, setAccepted] = useState(false);
    const [step, setStep] = useState(1);

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleConfirm = () => {
        if (sigCanvas.current.isEmpty()) {
            toast({ title: "Firma requerida", description: "Por favor, firma en el recuadro.", variant: "destructive" });
            return;
        }
        if (!accepted) {
            toast({ title: "Aceptación requerida", description: "Debes aceptar los términos para continuar.", variant: "destructive" });
            return;
        }
        if (!userData.document_number || !userData.address) {
            toast({ title: "Datos incompletos", description: "Por favor, completa tu número de documento y dirección.", variant: "destructive" });
            setStep(1); // Go back to data step
            return;
        }
        const signature = sigCanvas.current.toDataURL('image/png');
        onConfirm(signature);
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    const direction = 1;

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl p-0 overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="p-6"
                    >
                        {step === 1 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Paso 1: Confirma tus Datos</DialogTitle>
                                </DialogHeader>
                                <div className="grid sm:grid-cols-2 gap-4 py-4">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-gray-500">CLIENTE</h3>
                                        <div><Label>Nombre Completo</Label><Input value={userData.name || ''} disabled /></div>
                                        <div><Label>Número de Contacto</Label><Input value={userData.phone || ''} disabled /></div>
                                        <div><Label>Número de Documento <span className="text-red-500">*</span></Label><Input value={userData.document_number || ''} onChange={(e) => setUserData({ ...userData, document_number: e.target.value })} /></div>
                                        <div><Label>Dirección <span className="text-red-500">*</span></Label><Input value={userData.address || ''} onChange={(e) => setUserData({ ...userData, address: e.target.value })} /></div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-gray-500">MASCOTA</h3>
                                        <div><Label>Nombre</Label><Input value={userData.petName || ''} disabled /></div>
                                        <div><Label>Raza</Label><Input value={userData.breedName || ''} disabled /></div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleNext}>Siguiente</Button>
                                </DialogFooter>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Paso 2: Reglamento y Condiciones</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <ScrollArea className="h-72 border rounded-md p-4 text-sm text-gray-600">
                                        <p className="font-bold mb-2">“LA PELUQUERIA CANINA ES EL ACTO POR EL CUAL UNA PERSONA DISPONE DE UN ANIMAL PARA SU ASEO, BAÑO, CEPILLADO, CORTE O ARREGLO ESTETICO, ADAPTADO A LOS DISTINTOS TIPOS DE PELOS DE CADA RAZA. EL GROOMER DOMINA LOS INSTRUMENTOS Y TECNICAS ESPECIALES PARA EL TRABAJO SOBRE PERROS Y GATOS”</p>
                                        <h4 className="font-bold mt-4 mb-2">Reglamento del SPA</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>En el SPA prevalece la paciencia, respeto, confianza e higiene para tu mascota.</li>
                                            <li>Se atiende con cita programada, y solo se tiene un cupo limitado por día para brindar calidad en nuestro servicio.</li>
                                            <li>Su mascota durante su estancia en las instalaciones nunca se quedará solo.</li>
                                            <li>No se utilizan anestésicos.</li>
                                            <li>Su mascota jamás será maltratada.</li>
                                        </ul>
                                        <h4 className="font-bold mt-4 mb-2">Condiciones del SPA</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>El centro veterinario 4 Huellitas, así como sus médicos y auxiliares desconocen el estado de salud de las mascotas ingresadas al servicio de peluquería canina.</li>
                                            <li>Al tratarse de animales y seres vivos se hace imposible su total inmovilización por lo que pueden someterse a cortes, pellizcos, hematomas y lesiones leves accidentales ajenas a la predisposición para con los animales a los que se les dará un trato adecuado.</li>
                                            <li>Al sacar los animales de su entorno, están dispuestos a sufrir ataques de pánico, escapismos, convulsiones y hasta muertes súbitas debido a la falta de costumbre, presencia de otros animales, ruidos ajenos etc...</li>
                                            <li>Si eventualmente se llegara a presentar alguna anomalía dentro de la peluquería canina. Serán avisado a sus propietarios, y de parte del centro veterinario 4huellitas se hará el respectivo seguimiento a la evolución de la mascota.</li>
                                            <li>No se admiten mascotas enfermas.</li>
                                            <li>Las mascotas pueden presentar después de la peluquería canina irritaciones en la piel o en los ojos ya sea por sensibilidad al shampoo, o por estrés.</li>
                                            <li>El dueño tiene la obligación de revisar su mascota en el momento de ser entregada, después de este tiempo 4huellitas no se hace responsable de cualquier problema que llegase a presentar en la misma.</li>
                                        </ul>
                                        <p className="mt-4">El animal debe ser retirado dentro de las 24 hs., siendo la postergación a cargo del dueño. En caso de no retirarlo, incurrirá en falta a la LEY 14436 de protección al animal, por abandono del mismo, dejando a la veterinaria libre de toda responsabilidad en el caso.</p>
                                        <p className="mt-4 font-bold">El propietario, por la presente, deja libre al CENTRO VETERINARIO 4HUELLITAS, sobre todo daño, robo, hurto, perjuicio o riesgo, debido a pérdida o muerte del animal que pudiera surgir por cualquier causa.</p>
                                    </ScrollArea>
                                </div>
                                <DialogFooter className="flex justify-between w-full">
                                    <Button variant="ghost" onClick={handlePrev}><ArrowLeft className="mr-2 h-4 w-4" /> Anterior</Button>
                                    <Button onClick={handleNext}>Siguiente</Button>
                                </DialogFooter>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Paso 3: Firma y Aceptación</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label>Firma <span className="text-red-500">*</span></Label>
                                        <div className="border rounded-md mt-1 bg-gray-50">
                                            <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{ className: 'w-full h-40' }} />
                                        </div>
                                        <Button variant="link" size="sm" onClick={() => sigCanvas.current.clear()} className="px-0">Limpiar firma</Button>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="accept-terms" checked={accepted} onCheckedChange={setAccepted} className="mt-1"/>
                                        <Label htmlFor="accept-terms" className="cursor-pointer text-sm font-normal">
                                            CONSIENTO Y MANIFIESTO MI CONFORMIDAD para que se le realice a mi mascota dicho servicio, y acepto el reglamento y las condiciones del SPA.
                                        </Label>
                                    </div>
                                </div>
                                <DialogFooter className="flex justify-between w-full">
                                    <Button variant="ghost" onClick={handlePrev}><ArrowLeft className="mr-2 h-4 w-4" /> Anterior</Button>
                                    <Button onClick={handleConfirm} disabled={loading}>{loading ? 'Confirmando...' : 'Confirmar y Agendar Cita'}</Button>
                                </DialogFooter>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};

export default ConsentModal;