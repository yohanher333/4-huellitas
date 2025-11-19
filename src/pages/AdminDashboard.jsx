import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings,
  Menu,
  X,
  LogOut,
  Dog,
  ClipboardList,
  Palette,
  Scissors,
  Calendar,
  Award,
  UserCheck,
  Clock,
  UserX,
  MessageSquare,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardHome from '@/components/admin/DashboardHome';
import OwnersList from '@/components/admin/OwnersList';
import OwnerProfile from '@/components/admin/OwnerProfile';
import PetsList from '@/components/admin/PetsList';
import PetProfile from '@/components/admin/PetProfile';
import ServicesList from '@/components/admin/ServicesList';
import AppointmentsList from '@/components/admin/AppointmentsList';
import BreedsList from '@/components/admin/BreedsList';
import AdditionalServicesList from '@/components/admin/AdditionalServicesList';
import AddHistoryPage from '@/pages/AddHistoryPage';
import AppointmentsCalendar from '@/components/admin/AppointmentsCalendar';
import AchievementsRanking from '@/components/admin/AchievementsRanking';
import ContactMessagesList from '@/components/admin/ContactMessagesList';

import ScheduleSettings from '@/components/admin/ScheduleSettings';
import CompanySettings from '@/components/admin/CompanySettings';
import ClintonList from '@/components/admin/ClintonList';
import ProfessionalsManagerNew from '@/components/admin/ProfessionalsManagerNew';
import CustomTimeSlotManager from '@/components/admin/CustomTimeSlotManager';
import AnniversaryConfig from '@/components/admin/AnniversaryConfig';

const AdminDashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'agendas', label: 'Agendas', icon: Calendar, path: '/admin/agendas' },
    { id: 'appointments', label: 'Citas', icon: ClipboardList, path: '/admin/appointments' },
    { id: 'owners', label: 'Propietarios', icon: Users, path: '/admin/owners' },
    { id: 'pets', label: 'Mascotas', icon: Dog, path: '/admin/pets' },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, path: '/admin/messages' },
    { id: 'clinton-list', label: 'Lista Negra', icon: UserX, path: '/admin/clinton-list' },
    { id: 'achievements', label: 'Logros', icon: Award, path: '/admin/achievements' },
    { id: 'services', label: 'Servicios', icon: Scissors, path: '/admin/services' },
    { id: 'products', label: 'Productos', icon: ShoppingBag, path: '/admin/products' },
  { id: 'settings', label: 'Configuración', icon: Settings, path: '/admin/settings' },
  ];
  
  const settingsSubMenu = [
  { id: 'company', label: 'Empresa', icon: Settings, path: '/admin/settings/company' },
  { id: 'schedule', label: 'Horarios', icon: Clock, path: '/admin/settings/schedule' },
  { id: 'custom-slots', label: 'Franjas Personalizadas', icon: Calendar, path: '/admin/settings/custom-slots' },
  { id: 'professionals-manage', label: 'Gestionar Profesionales', icon: UserCheck, path: '/admin/settings/professionals-manage' },
  { id: 'breeds', label: 'Razas y Precios', icon: Palette, path: '/admin/settings/breeds' },
  { id: 'additional-services', label: 'Servicios Adicionales', icon: Scissors, path: '/admin/settings/additional-services' },
  { id: 'anniversary', label: 'Aniversario', icon: Award, path: '/admin/settings/anniversary' },
  ];

  const handleMenuClick = (path) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    const availablePaths = [
      '/admin', 
      '/admin/owners', 
      '/admin/pets', 
      '/admin/services', 
      '/admin/appointments', 
      '/admin/agendas',
      '/admin/achievements',
      '/admin/clinton-list',
      '/admin/settings/breeds', 
      '/admin/settings/additional-services',
      '/admin/settings/professionals-manage',
      '/admin/settings/availability',
      '/admin/settings/schedule',
      '/admin/add-history'
    ];
    
    const isAvailable = availablePaths.some(p => path.startsWith(p));

    if (!isAvailable) {
      toast({
        title: "🚧 Sección en desarrollo",
        description: "¡Esta funcionalidad estará disponible pronto! 🚀",
      });
    }
  };

  const getIsActive = (itemPath) => {
    if (itemPath === '/admin/settings' && location.pathname.startsWith('/admin/settings')) {
        return true;
    }
    if (itemPath === '/admin' && location.pathname !== '/admin') {
      if (location.pathname.startsWith('/admin/add-history')) return false;
    }
    if (itemPath === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(itemPath);
  };

  const SidebarContent = () => (
    <div className="p-4 flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b px-2 flex-shrink-0">
        <img
          src="https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/e00c42547df182c8547e11b986abb6b3.png"
          alt="4huellitas"
          className="h-12 object-contain"
        />
      </div>

      <div className="flex-grow space-y-2 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                to={item.path}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  getIsActive(item.path)
                    ? 'bg-[#0378A6] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.id === 'clinton-list' && getIsActive(item.path) ? 'text-white' : item.id === 'clinton-list' ? 'text-red-500' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
              {item.id === 'settings' && getIsActive(item.path) && (
                <div className="pl-8 pt-2 space-y-1">
                  {settingsSubMenu.map(subItem => (
                     <Link
                      key={subItem.id}
                      to={subItem.path}
                      onClick={() => handleMenuClick(subItem.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        getIsActive(subItem.path)
                          ? 'bg-gray-200 text-[#0378A6] font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>


      <div className="mt-8 pt-6 border-t flex-shrink-0">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="hidden lg:block fixed w-72 h-full">
         <SidebarContent />
      </div>
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:hidden inset-y-0 left-0 w-72 bg-white shadow-lg z-40"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:pl-72 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-600">Administrador</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#0378A6] to-[#F26513] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-grow p-4 md:p-6 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendas" element={<AppointmentsCalendar />} />
            <Route path="owners" element={<OwnersList />} />
            <Route path="owners/:id" element={<OwnerProfile />} />
            <Route path="pets" element={<PetsList />} />
            <Route path="pets/:id" element={<PetProfile />} />
            <Route path="messages" element={<ContactMessagesList />} />
            <Route path="services" element={<ServicesList />} />
            <Route path="achievements" element={<AchievementsRanking />} />
            <Route path="appointments" element={<AppointmentsList />} />
            <Route path="clinton-list" element={<ClintonList />} />
            <Route path="settings/schedule" element={<ScheduleSettings />} />
            <Route path="settings/custom-slots" element={<CustomTimeSlotManager />} />
            <Route path="settings/professionals-manage" element={<ProfessionalsManagerNew />} />
            <Route path="settings/breeds" element={<BreedsList />} />
            <Route path="settings/additional-services" element={<AdditionalServicesList />} />
            <Route path="settings/anniversary" element={<AnniversaryConfig />} />
            <Route path="add-history/:petId/:recordType" element={<AddHistoryPage />} />
            <Route path="add-history/:petId/:recordType/:historyId" element={<AddHistoryPage />} />
            <Route path="settings/company" element={<CompanySettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;