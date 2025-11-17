import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password, metadata) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      toast({
        title: 'Error de Registro',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { data: null, error };
    }
        
    setLoading(false);
    return { data, error: null };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: 'Error de Inicio de Sesión',
        description: error.message,
        variant: 'destructive',
      });
    }
    setLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error && error.message !== 'Auth session not found') {
      toast({
        title: 'Error al Cerrar Sesión',
        description: error.message,
        variant: 'destructive',
      });
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};