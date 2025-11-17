import React from 'react';
import { Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="hidden md:block bg-[#0D0D0D] text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/e00c42547df182c8547e11b986abb6b3.png"
                alt="4huellitas Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold">4huellitas</span>
            </div>
            <p className="text-gray-400">
              El mejor cuidado para tu mascota, con profesionales apasionados y servicios de primera.
            </p>
          </div>
          <div>
            <p className="font-bold text-lg mb-4">Navegación</p>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">Inicio</a></li>
              <li><a href="/services" className="hover:text-white">Servicios</a></li>
              <li><a href="/contact" className="hover:text-white">Tienda</a></li>
              <li><a href="/contact" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-lg mb-4">Servicios</p>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/services" className="hover:text-white">Consultas Veterinarias</a></li>
              <li><a href="/services" className="hover:text-white">Peluquería Canina</a></li>
              <li><a href="/services" className="hover:text-white">Vacunación</a></li>
              <li><a href="/services" className="hover:text-white">Urgencias</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-lg mb-4">Síguenos</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1FpzQyVFjT/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><Facebook /></a>
              <a href="https://www.instagram.com/4.huellitas/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><Instagram /></a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} 4huellitas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;