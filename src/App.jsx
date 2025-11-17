import React, { useEffect, useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
    import LandingPage from '@/pages/LandingPage';
    import LoginPage from '@/pages/LoginPage';
    import RegisterPage from '@/pages/RegisterPage';
    import UserDashboard from '@/pages/UserDashboard';
    import AdminDashboard from '@/pages/AdminDashboard';
    import AppointmentPage from '@/pages/AppointmentPage';
    import ServicesPage from '@/pages/ServicesPage';
    import ContactPage from '@/pages/ContactPage';
    import CheckAppointmentPage from '@/pages/CheckAppointmentPage';
    import { Toaster } from '@/components/ui/toaster';
    import Header from '@/components/layout/Header';
    import Footer from '@/components/layout/Footer';
    import MobileNav from '@/components/layout/MobileNav';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import AchievementUnlockedModal from '@/components/AchievementUnlockedModal';
    import Confetti from '@/components/Confetti';

    function App() {
      const { user, session, loading: authLoading, signOut: supabaseSignOut } = useAuth();
      const navigate = useNavigate();
      const location = useLocation();
      const [profile, setProfile] = useState(null);
      const [profileLoading, setProfileLoading] = useState(true);
      const [showAchievementModal, setShowAchievementModal] = useState(false);
      const [showConfetti, setShowConfetti] = useState(false);
    
      useEffect(() => {
        const isNewUserRegistration = location.state?.isNewUser;
        if (isNewUserRegistration) {
          setShowConfetti(true);
          setTimeout(() => {
            setShowAchievementModal(true);
            setShowConfetti(false);
          }, 3000); // Show confetti for 3 seconds
          navigate(location.pathname, { replace: true, state: {} });
        }
      }, [location.state, navigate]);
    
      useEffect(() => {
        if (authLoading) {
          setProfileLoading(true);
          return;
        }
    
        const fetchProfile = async () => {
          if (user && session) {
            setProfileLoading(true);
            const { data, error } = await supabase
              .from('profiles')
              .select('*, user_achievements(count)')
              .eq('id', user.id)
              .single();
            
            if (data) {
              setProfile(data);
              const targetPath = data.role === 'admin' ? '/admin' : '/dashboard';
              if (['/login', '/register', '/', '/check-appointment', '/contact'].includes(location.pathname)) {
                 if (location.pathname === '/book-appointment' && data.role === 'user') {
                   // do nothing, let them book
                 } else {
                    navigate(targetPath, { replace: true });
                 }
              }
            } else if (error) {
              console.error("Error fetching profile:", error);
              supabaseSignOut().catch(console.error); // Add catch for safety
            }
            setProfileLoading(false);
          } else {
            setProfile(null);
            setProfileLoading(false);
            if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) {
              navigate('/login', { replace: true });
            }
          }
        };
        
        fetchProfile();
    
      }, [user, session, authLoading, navigate, location.pathname, supabaseSignOut]);
    
      const handleLogout = async () => {
        const { error } = await supabaseSignOut();
        if (error && error.message !== 'session_not_found') {
          console.error("Logout Error:", error);
        }
        setProfile(null);
        navigate('/');
      };
    
      const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
      const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
    
      if (authLoading || profileLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div>
          </div>
        );
      }
    
      const userWithProfile = profile ? { ...user, ...profile } : null;
    
      const showHeader = !isAuthPage && !isDashboard;
      const showFooter = !isAuthPage && !isDashboard;
      const showMobileNav = !isDashboard;
    
      return (
        <>
          <Helmet>
            <title>4huellitas - Centro Veterinario</title>
            <meta name="description" content="Centro veterinario completo con consultas, peluquería canina y tienda para mascotas" />
          </Helmet>
          {showConfetti && <Confetti />}
          <div className={`app-container flex flex-col min-h-screen ${isDashboard && profile?.role === 'user' ? 'bg-gray-50' : 'bg-white'}`}>
            {showHeader && <Header user={userWithProfile} onLogout={handleLogout} />}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/book-appointment" element={<AppointmentPage user={userWithProfile}/>} />
                <Route path="/check-appointment" element={<CheckAppointmentPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={!session ? <LoginPage /> : <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
                <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard/*" element={session && profile?.role === 'user' ? <UserDashboard user={userWithProfile} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />

                <Route path="/admin/*" element={session && profile?.role === 'admin' ? <AdminDashboard user={userWithProfile} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
              </Routes>
            </main>
            {showFooter && <Footer />}
            {showMobileNav && !isDashboard && <MobileNav />}
          </div>
          <Toaster />
          <AchievementUnlockedModal 
            isOpen={showAchievementModal} 
            onClose={() => setShowAchievementModal(false)}
          />
        </>
      );
    }
    
    export default App;