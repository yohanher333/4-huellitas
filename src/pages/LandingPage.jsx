import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Scissors, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const LandingPage = () => {
  const navigate = useNavigate();
  const [landingImage, setLandingImage] = useState('https://images.unsplash.com/photo-1548681528-6a5c45b66b42?q=80&w=2535&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
  const [loading, setLoading] = useState(true);
  
  // WhatsApp número de la empresa
  const whatsappNumber = "573012635719";

  useEffect(() => {
    const fetchLandingImage = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'landing_image_url')
        .maybeSingle();
      if (data && data.value) {
        setLandingImage(data.value);
      }
      setLoading(false);
    };
    fetchLandingImage();
  }, []);

  const handleServiceClick = (service) => {
    switch (service.action) {
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(service.message)}`;
        window.open(whatsappUrl, '_blank');
        break;
      case 'navigate':
        navigate(service.route);
        break;
      case 'alert':
        alert(service.message);
        break;
      default:
        break;
    }
  };

  const services = [
    {
      icon: Heart,
      title: 'Consultas Veterinarias',
      description: 'Evaluaciones de salud completa para tu mascota',
      color: 'bg-[#0378A6]',
      action: 'whatsapp',
      message: 'Hola, quiero más información sobre consulta veterinaria'
    },
    {
      icon: Scissors,
      title: 'Peluquería Canina',
      description: 'Estética y cuidado profesional',
      color: 'bg-[#F26513]',
      action: 'navigate',
      route: '/book-appointment'
    },
    {
      icon: ShoppingBag,
      title: 'Tienda',
      description: 'Productos de calidad para tu mejor amigo',
      color: 'bg-[#0D0D0D]',
      action: 'alert',
      message: 'Muy pronto disponible'
    }
  ];

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden min-h-screen bg-gradient-to-br from-[#0378A6]/10 via-white to-[#F26513]/10 flex flex-col">
        <div className="flex-grow px-6 py-8">
          <div className="flex justify-center mb-8">
            <motion.img
              src="https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/e00c42547df182c8547e11b986abb6b3.png"
              alt="4huellitas - Centro Veterinario"
              className="w-48 h-48 object-contain"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <p className="text-lg text-gray-600">
              El mejor cuidado para tu mascota, al alcance de tu mano.
            </p>
          </motion.div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleServiceClick(service)}
              >
                <div className="flex items-center gap-4">
                  <div className={`${service.color} p-3 rounded-xl`}>
                    <service.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {service.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white">
        <section className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-5xl font-extrabold text-[#0378A6] leading-tight mb-4 font-heading">
                Cuidado experto y con amor para tu mejor amigo
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                En 4huellitas, combinamos la pasión por los animales con la medicina veterinaria de vanguardia para ofrecer un servicio integral y de confianza.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/book-appointment?fresh=true')} size="lg" className="h-12 text-lg bg-[#F26513] hover:bg-[#F26513]/90">Agenda una cita</Button>
                <Button onClick={() => navigate('/services')} size="lg" variant="outline" className="h-12 text-lg">Nuestros Servicios</Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="relative">
                <div className="absolute -top-8 -left-8 w-48 h-48 bg-[#0378A6]/10 rounded-full" />
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#F26513]/10 rounded-full" />
                {loading ? (
                   <div className="rounded-3xl shadow-2xl relative z-10 w-full h-[450px] bg-gray-200 animate-pulse" />
                ) : (
                  <img alt="Happy dog being checked by a vet" className="rounded-3xl shadow-2xl relative z-10 object-cover w-full h-[450px]" src={landingImage} />
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-gray-50 py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Nuestros Servicios</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
              Ofrecemos una gama completa de servicios para asegurar que tu mascota esté siempre sana, feliz y luciendo genial.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg text-center hover:-translate-y-2 transition-transform cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className={`${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;