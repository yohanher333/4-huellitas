import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Search } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="hidden md:block bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/e00c42547df182c8547e11b986abb6b3.png"
            alt="4huellitas Logo"
            className="h-16 w-16 object-contain"
          />
        </Link>
        <nav className="flex items-center gap-6 text-gray-700 font-medium">
          <Link to="/" className="hover:text-[#0378A6] transition-colors">Inicio</Link>
          <Link to="/services" className="hover:text-[#0378A6] transition-colors">Servicios</Link>
          <Link to="/contact" className="hover:text-[#0378A6] transition-colors">Contacto</Link>
          <Link to="/check-appointment" className="hover:text-[#0378A6] transition-colors flex items-center gap-1">
            <Search className="w-4 h-4" /> Verificar Cita
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                className="flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                {user.name}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={onLogout}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
              <Button onClick={() => navigate('/book-appointment')} className="bg-[#F26513] hover:bg-[#F26513]/90 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agendar Cita
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;