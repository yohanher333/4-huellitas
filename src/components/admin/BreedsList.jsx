import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Palette, DollarSign } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const behaviorOptions = [
  { value: '🟥', label: 'Rojo – Agresivo / Defensivo' },
  { value: '🟧', label: 'Naranja – Nervioso / Desconfiado' },
  { value: '🟩', label: 'Verde – Sociable / Cooperativo' },
  { value: '🟦', label: 'Azul – Tranquilo / Obediente' },
];

const BreedsList = () => {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    behavior_color: '🟩'
  });

  const [prices, setPrices] = useState({});
  const [haircutStyles, setHaircutStyles] = useState([]);

  const fetchBreeds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('breeds').select('*').order('name', { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las razas.", variant: "destructive" });
    } else {
      setBreeds(data);
    }
    setLoading(false);
  }, []);

  const fetchHaircutStyles = useCallback(async () => {
    const { data } = await supabase.from('haircut_styles').select('*');
    setHaircutStyles(data || []);
  }, []);

  useEffect(() => {
    fetchBreeds();
    fetchHaircutStyles();
  }, [fetchBreeds, fetchHaircutStyles]);
  
  const handlePriceChange = (styleId, value) => {
    setPrices(prev => ({ ...prev, [styleId]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "El nombre de la raza es obligatorio.", variant: "destructive" });
      return;
    }

    const breedData = { name: formData.name, behavior_color: formData.behavior_color };

    let breedId = editingBreed?.id;
    let error;

    if (editingBreed) {
      ({ error } = await supabase.from('breeds').update(breedData).eq('id', editingBreed.id));
    } else {
      const { data: newBreed, error: insertError } = await supabase.from('breeds').insert(breedData).select().single();
      error = insertError;
      if (newBreed) breedId = newBreed.id;
    }

    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la raza. Puede que ya exista.", variant: "destructive" });
      return;
    }

    if (breedId) {
        const pricesToUpsert = Object.entries(prices)
            .filter(([, price]) => price && !isNaN(parseFloat(price)))
            .map(([styleId, price]) => ({
                breed_id: breedId,
                style_id: styleId,
                price: parseFloat(price)
            }));
        
        if (pricesToUpsert.length > 0) {
            const { error: priceError } = await supabase.from('breed_style_prices').upsert(pricesToUpsert, { onConflict: 'breed_id,style_id' });
            if (priceError) {
                toast({ title: "Error", description: `Raza guardada, pero hubo un error al guardar los precios: ${priceError.message}`, variant: "destructive" });
                return;
            }
        }
    }

    toast({ title: "Éxito", description: `Raza ${editingBreed ? 'actualizada' : 'añadida'} correctamente.` });
    setIsDialogOpen(false);
    fetchBreeds();
  };
  
  const handleDelete = async (breedId) => {
    await supabase.from('breed_style_prices').delete().eq('breed_id', breedId);
    const { error } = await supabase.from('breeds').delete().eq('id', breedId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la raza.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Raza eliminada correctamente." });
      fetchBreeds();
    }
  };

  const openDialog = async (breed = null) => {
    setPrices({});
    if (breed) {
      setEditingBreed(breed);
      setFormData({ name: breed.name, behavior_color: breed.behavior_color });
      const { data: priceData } = await supabase.from('breed_style_prices').select('*').eq('breed_id', breed.id);
      const initialPrices = {};
      if (priceData) {
        priceData.forEach(p => { initialPrices[p.style_id] = p.price; });
      }
      setPrices(initialPrices);
    } else {
      setEditingBreed(null);
      setFormData({ name: '', behavior_color: '🟩' });
    }
    setIsDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#0378A6]/10 p-6 border border-[#0378A6]/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Razas</h2>
        <Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />Añadir Raza</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b"><th className="p-3">Nombre</th><th className="p-3 hidden md:table-cell">Comportamiento</th><th className="p-3">Acciones</th></tr>
          </thead>
          <tbody>
            {breeds.map(breed => (
              <tr key={breed.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{breed.name}</td>
                <td className="p-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{breed.behavior_color}</span>
                    <span className="text-sm">{behaviorOptions.find(b => b.value === breed.behavior_color)?.label.split('–')[1]}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(breed)}><Edit className="w-4 h-4 text-yellow-500" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará la raza y sus precios asociados.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(breed.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBreed ? 'Editar' : 'Añadir'} Raza</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Nombre de la raza" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Palette className="w-5 h-5 text-gray-600" />
                <span>Comportamiento</span>
              </label>
              <Select value={formData.behavior_color} onValueChange={(value) => setFormData({...formData, behavior_color: value})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {behaviorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2"><DollarSign className="w-5 h-5 text-gray-600"/> Precios por Estilo de Corte</h3>
              {haircutStyles.map(style => (
                <div key={style.id} className="flex items-center gap-2">
                  <label htmlFor={`price-${style.id}`} className="flex-1">{style.name}</label>
                  <Input id={`price-${style.id}`} type="number" placeholder="Valor" value={prices[style.id] || ''} onChange={e => handlePriceChange(style.id, e.target.value)} className="w-32" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleSave}>{editingBreed ? 'Actualizar' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BreedsList;