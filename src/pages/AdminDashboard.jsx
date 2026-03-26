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
  FolderTree,
  Package,
  Store,
  Receipt,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
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
import ProductsManager from '@/components/admin/ProductsManager';
import ProductCategoriesManager from '@/components/admin/ProductCategoriesManager';
import ProductAttributesManager from '@/components/admin/ProductAttributesManager';
import ProductEditPage from '@/components/admin/ProductEditPage';
import OrdersManager from '@/components/admin/OrdersManager';
import OrderDetail from '@/components/admin/OrderDetail';
import ClientsManager from '@/components/admin/ClientsManager';
import InventoryManager from '@/components/admin/InventoryManager';
import { AdminPOS } from '@/components/admin/pos';
import { useCompany } from '@/contexts/CompanyContext';

const AdminDashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { logo } = useCompany();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'pos', label: 'POS Tienda', icon: Store, path: '/admin/pos' },
    { id: 'clients', label: 'Clientes Tienda', icon: UserCheck, path: '/admin/clients' },
    { id: 'orders', label: 'Pedidos', icon: Receipt, path: '/admin/orders' },
    { id: 'agendas', label: 'Agendas', icon: Calendar, path: '/admin/agendas' },
    { id: 'appointments', label: 'Citas', icon: ClipboardList, path: '/admin/appointments' },
    { id: 'owners', label: 'Propietarios', icon: Users, path: '/admin/owners' },
    { id: 'pets', label: 'Mascotas', icon: Dog, path: '/admin/pets' },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, path: '/admin/messages' },
    { id: 'clinton-list', label: 'Lista Negra', icon: UserX, path: '/admin/clinton-list' },
    { id: 'achievements', label: 'Logros', icon: Award, path: '/admin/achievements' },
    { id: 'services', label: 'Servicios', icon: Scissors, path: '/admin/services' },
    { id: 'products', label: 'Productos', icon: ShoppingBag, path: '/admin/products' },
    { id: 'inventory', label: 'Inventario', icon: Package, path: '/admin/inventory' },
  { id: 'settings', label: 'Configuración', icon: Settings, path: '/admin/settings' },
  ];

  const productsSubMenu = [
    { id: 'products-list', label: 'Todos los Productos', icon: Package, path: '/admin/products' },
    { id: 'products-categories', label: 'Categorías', icon: FolderTree, path: '/admin/products/categories' },
    { id: 'products-attributes', label: 'Atributos', icon: Settings, path: '/admin/products/attributes' },
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
      '/admin/pos',
      '/admin/clients',
      '/admin/orders',
      '/admin/owners', 
      '/admin/pets', 
      '/admin/services', 
      '/admin/appointments', 
      '/admin/agendas',
      '/admin/achievements',
      '/admin/clinton-list',
      '/admin/products',
      '/admin/products/categories',
      '/admin/products/attributes',
      '/admin/inventory',
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
    if (itemPath === '/admin/products' && location.pathname.startsWith('/admin/products')) {
        return true;
    }
    if (itemPath === '/admin' && location.pathname !== '/admin') {
      if (location.pathname.startsWith('/admin/add-history')) return false;
    }
    if (itemPath === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(itemPath);
  };

  const SidebarContent = ({ collapsed = false }) => (
    <div className={`p-4 flex flex-col h-full bg-gradient-to-b from-[#025d80] to-[#023d54] transition-all duration-300 ${collapsed ? 'items-center' : ''}`}>
      <div className={`flex items-center gap-3 mb-8 pb-6 border-b border-white/20 px-2 flex-shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        {collapsed ? (
          <div className="bg-white rounded-lg p-1.5 shadow-md">
            <img
              src={logo}
              alt="4huellitas"
              className="h-8 w-8 object-contain"
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-2 shadow-md">
            <img
              src={logo}
              alt="4huellitas"
              className="h-10 object-contain"
            />
          </div>
        )}
      </div>

      <div className={`flex-grow space-y-2 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent ${collapsed ? 'pr-0 mr-0 w-full' : ''}`}>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                to={item.path}
                onClick={() => handleMenuClick(item.path)}
                title={collapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${collapsed ? 'justify-center px-2' : ''} ${
                  getIsActive(item.path)
                    ? 'bg-white text-[#025d80] shadow-lg font-semibold'
                    : 'text-white/90 hover:bg-white/15'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.id === 'clinton-list' && !getIsActive(item.path) ? 'text-red-400' : ''}`} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
              {item.id === 'products' && getIsActive(item.path) && !collapsed && (
                <div className="pl-8 pt-2 space-y-1">
                  {productsSubMenu.map(subItem => (
                     <Link
                      key={subItem.id}
                      to={subItem.path}
                      onClick={() => handleMenuClick(subItem.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        location.pathname === subItem.path
                          ? 'bg-white/20 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
              {item.id === 'settings' && getIsActive(item.path) && !collapsed && (
                <div className="pl-8 pt-2 space-y-1">
                  {settingsSubMenu.map(subItem => (
                     <Link
                      key={subItem.id}
                      to={subItem.path}
                      onClick={() => handleMenuClick(subItem.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        getIsActive(subItem.path)
                          ? 'bg-white/20 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
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


      <div className="mt-8 pt-6 border-t border-white/20 flex-shrink-0">
        {collapsed ? (
          <Button
            onClick={onLogout}
            variant="outline"
            size="icon"
            className="w-full border-red-400 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-300"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-red-400 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-[#0378A6]/5 to-[#0378A6]/10 flex">
      {/* Sidebar Desktop - Colapsable */}
      <motion.div 
        className="hidden lg:block fixed h-full bg-gradient-to-b from-[#025d80] to-[#023d54] shadow-xl z-40"
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 288 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Botón toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white text-[#025d80] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0378A6] hover:text-white transition-colors z-50"
          title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.div>
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:hidden inset-y-0 left-0 w-72 bg-gradient-to-b from-[#025d80] to-[#023d54] shadow-xl z-40"
          >
            <SidebarContent collapsed={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}
      >
        <header className="bg-gradient-to-r from-white via-white to-[#0378A6]/5 shadow-sm sticky top-0 z-30 border-b border-[#0378A6]/10">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Botón móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            {/* Botón desktop para colapsar */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? <PanelLeft className="w-5 h-5 text-gray-600" /> : <PanelLeftClose className="w-5 h-5 text-gray-600" />}
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
            <Route path="pos" element={<AdminPOS />} />
            <Route path="orders" element={<OrdersManager />} />
            <Route path="orders/:orderId" element={<OrderDetail />} />
            <Route path="clients" element={<ClientsManager />} />
            <Route path="agendas" element={<AppointmentsCalendar />} />
            <Route path="owners" element={<OwnersList />} />
            <Route path="owners/:id" element={<OwnerProfile />} />
            <Route path="pets" element={<PetsList />} />
            <Route path="pets/:id" element={<PetProfile />} />
            <Route path="messages" element={<ContactMessagesList />} />
            <Route path="services" element={<ServicesList />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="products/new" element={<ProductEditPage />} />
            <Route path="products/edit/:productId" element={<ProductEditPage />} />
            <Route path="products/categories" element={<ProductCategoriesManager />} />
            <Route path="products/attributes" element={<ProductAttributesManager />} />
            <Route path="inventory" element={<InventoryManager />} />
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