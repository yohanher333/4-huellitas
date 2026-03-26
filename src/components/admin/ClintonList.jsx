import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, Phone, Mail } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ClintonList = () => {
  const [clintonListUsers, setClintonListUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClintonList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_in_clinton_list', true)
      .order('name', { ascending: true });
      
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar la Lista Negra.", variant: "destructive" });
    } else {
      setClintonListUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClintonList();
  }, [fetchClintonList]);

  const handleRemoveFromList = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_in_clinton_list: false })
      .eq('id', userId);

    if (error) {
      toast({ title: "Error", description: "No se pudo quitar al usuario de la lista.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Usuario removido de la Lista Negra." });
      fetchClintonList();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-red-500"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#0378A6]/10 p-6 border border-[#0378A6]/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UserX className="text-red-500"/> Lista Negra</h2>
      </div>
      {clintonListUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-[#0378A6] to-[#025d80]">
              <tr>
                <th className="p-3 text-white font-semibold">Nombre</th>
                <th className="p-3 text-white font-semibold hidden md:table-cell">Teléfono</th>
                <th className="p-3 text-white font-semibold hidden lg:table-cell">Email</th>
                <th className="p-3 text-white font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clintonListUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3 hidden md:table-cell flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/>{user.phone}</td>
                  <td className="p-3 hidden lg:table-cell flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/>{user.email}</td>
                  <td className="p-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">Quitar de la lista</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Quitar a {user.name} de la Lista Negra?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción permitirá al usuario volver a agendar citas normalmente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveFromList(user.id)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
            <UserX className="w-16 h-16 mx-auto text-gray-300"/>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">¡La lista está vacía!</h3>
            <p className="text-gray-500">No hay usuarios marcados por no asistir a sus citas.</p>
        </div>
      )}
    </motion.div>
  );
};

export default ClintonList;