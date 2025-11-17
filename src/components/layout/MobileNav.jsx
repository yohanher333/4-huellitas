import React from 'react';
import { Home, Calendar, Search, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const { session } = useAuth();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio', guest: true, user: true, color: 'text-sky-500' },
    { to: '/book-appointment', icon: Calendar, label: 'Agendar', guest: true, user: true, color: 'text-amber-500' },
    { to: '/check-appointment', icon: Search, label: 'Verificar', guest: true, user: true, color: 'text-violet-500' },
    { to: '/login', icon: User, label: 'Perfil', guest: true, user: false, color: 'text-emerald-500' },
    { to: '/dashboard', icon: User, label: 'Perfil', guest: false, user: true, color: 'text-emerald-500' },
  ];

  const itemsToShow = navItems.filter(item => (session ? item.user : item.guest));

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 z-50">
       <div className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl h-full">
         <div className="flex justify-around items-center h-full">
          {itemsToShow.map((item, index) => (
            <NavLink
              key={item.label + item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-300 relative z-10 ${
                  isActive ? 'text-[#0378A6]' : 'text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className={`w-6 h-6 transition-all duration-300 ${isActive ? item.color : ''}`} />
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-glow"
                        className={`absolute -inset-2 rounded-full ${item.color.replace('text', 'bg')}/20 blur-md`}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-all duration-300 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;