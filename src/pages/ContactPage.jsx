import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Mail, Check, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ContactPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('contact_messages').insert([
                {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    status: 'nuevo',
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;

            setShowSuccessModal(true);
            setFormData({ name: '', email: '', message: '' });
            e.target.reset();
        } catch (error) {
            toast({
                title: "Error",
                description: "Hubo un problema al enviar tu mensaje. Intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const contactInfo = [
        { icon: MapPin, text: 'Cra. 22c #57DD-43' },
        { icon: Phone, text: '+57 301 263 5719' },
        { icon: Mail, text: 'contacto@4huellitas.com' },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-6 py-16">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-extrabold text-[#0378A6] mb-4 font-heading">
                        Ponte en Contacto
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        ¿Tienes preguntas o quieres saber más sobre nuestros servicios? Estamos aquí para ayudarte.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="bg-white p-8 rounded-2xl shadow-lg"
                    >
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 font-subheading">Envíanos un Mensaje</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Nombre</Label>
                                <Input 
                                    id="name" 
                                    type="text" 
                                    placeholder="Tu nombre completo" 
                                    required 
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="tu@correo.com" 
                                    required 
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="border-[#0378A6]/20 focus:border-[#0378A6] focus:ring-[#0378A6]/20"
                                />
                            </div>
                            <div>
                                <Label htmlFor="message">Mensaje</Label>
                                <textarea 
                                    id="message" 
                                    rows="5" 
                                    placeholder="Escribe tu mensaje aquí..." 
                                    required 
                                    onChange={(e) => handleInputChange('message', e.target.value)}
                                    className="w-full flex rounded-md border border-[#0378A6]/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0378A6]/20 focus-visible:ring-offset-2 focus-visible:border-[#0378A6] disabled:cursor-not-allowed disabled:opacity-50"
                                ></textarea>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full h-12 text-lg bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Enviar Mensaje
                                    </>
                                )}
                            </Button>
                        </form>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                           <h3 className="text-2xl font-bold text-gray-800 mb-4 font-subheading">Información de Contacto</h3>
                           <div className="space-y-4">
                               {contactInfo.map((info, index) => (
                                   <div key={index} className="flex items-center gap-4 text-gray-700">
                                       <info.icon className="w-6 h-6 text-[#0378A6]" />
                                       <span>{info.text}</span>
                                   </div>
                               ))}
                           </div>
                        </div>
                         <div className="bg-white p-8 rounded-2xl shadow-lg">
                             <h3 className="text-2xl font-bold text-gray-800 mb-4 font-subheading">Nuestra Ubicación</h3>
                             <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0986444300966!2d-75.54699232635204!3d6.250731426275795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e442930722f22b5%3A0x2ea07944cbc75d79!2sPELUQUERIA%20PARA%20PERROS%20%7C%20VETERINARIA%20CUATRO%20HUELLITAS%20%7C%20TIENDA%20DE%20MASCOTAS%20A%20DOMICILIO%20MEDELLIN!5e0!3m2!1ses-419!2sco!4v1761770106158!5m2!1ses-419!2sco" width="100%" height="350" style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modal de Confirmación */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-2xl border border-white/50"
                    >
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-gray-800">¡Mensaje Enviado!</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo te responderá lo antes posible.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-[#0378A6]/10 to-[#F26513]/10 rounded-2xl p-4 border border-[#0378A6]/20">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold text-[#0378A6]">Tiempo estimado de respuesta:</span> 2-4 horas hábiles
                                </p>
                            </div>

                            <Button 
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3"
                            >
                                Entendido
                            </Button>
                        </div>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContactPage;