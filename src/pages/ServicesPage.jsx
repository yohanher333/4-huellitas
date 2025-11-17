import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Scissors, ShoppingBag, Droplets, PawPrint, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesPage = () => {
    const navigate = useNavigate();

    const mainServices = [
        {
            icon: Heart,
            title: 'Consultas Veterinarias',
            description: 'Chequeos generales, vacunación, desparasitación y atención para emergencias. La salud de tu mascota es nuestra prioridad.',
            color: 'bg-[#0378A6]'
        },
        {
            icon: Scissors,
            title: 'Peluquería Canina Profesional',
            description: 'Cortes de raza, baños medicados, y estilismo completo para que tu amigo luzca y se sienta genial. Ofrecemos diferentes estilos.',
            color: 'bg-[#F26513]'
        },
        {
            icon: ShoppingBag,
            title: 'Tienda Especializada',
            description: 'Encuentra el mejor alimento, juguetes, accesorios y medicamentos. Todo lo que necesitas en un solo lugar.',
            color: 'bg-[#0D0D0D]'
        }
    ];

    const additionalServices = [
        { icon: Droplets, title: 'Baño Antipulgas' },
        { icon: PawPrint, title: 'Corte de Uñas y Limpieza de Oídos' },
        { icon: Sparkles, title: 'Tratamientos de Hidratación' }
    ];

    return (
        <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-16 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl font-extrabold text-[#0378A6] mb-4 font-heading"
                    >
                        Nuestros Servicios
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-gray-600 max-w-3xl mx-auto"
                    >
                        Ofrecemos un cuidado integral y de alta calidad para tu mascota, combinando experiencia, tecnología y mucho amor en cada uno de nuestros servicios.
                    </motion.p>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16">
                <section>
                    <div className="grid md:grid-cols-3 gap-8">
                        {mainServices.map((service, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                className="bg-white rounded-2xl p-8 shadow-lg text-center hover:-translate-y-2 transition-transform flex flex-col"
                            >
                                <div className={`${service.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                                    <service.icon className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="font-bold text-2xl text-gray-800 mb-3 font-subheading">
                                    {service.title}
                                </h3>
                                <p className="text-gray-600 flex-grow">
                                    {service.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>
                
                <section className="mt-24 text-center">
                     <h2 className="text-4xl font-bold text-gray-800 mb-4 font-heading">Servicios Adicionales</h2>
                     <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
                        Complementa el cuidado de tu mascota con nuestros tratamientos especializados. El costo y necesidad se confirman en tienda.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {additionalServices.map((service, index) => (
                             <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="bg-gray-100 rounded-xl p-6 flex items-center gap-4"
                            >
                                <service.icon className="w-6 h-6 text-[#F26513]"/>
                                <h4 className="font-semibold text-gray-700">{service.title}</h4>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="mt-24 bg-gradient-to-r from-[#0378A6] to-[#F26513] rounded-3xl p-12 text-white text-center">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-bold mb-4 font-heading"
                    >
                        ¿Listo para darle lo mejor?
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg opacity-90 mb-8 max-w-2xl mx-auto"
                    >
                        Agenda una cita hoy mismo y deja que nuestro equipo de expertos cuide de tu mejor amigo como se merece.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Button 
                            onClick={() => navigate('/book-appointment')} 
                            size="lg" 
                            className="h-14 text-lg bg-white text-[#0378A6] hover:bg-gray-200 shadow-lg"
                        >
                            Agendar Cita Ahora
                        </Button>
                    </motion.div>
                </section>
            </main>
        </div>
    );
};

export default ServicesPage;