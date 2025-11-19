import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  Trash2, 
  Plus, 
  Save, 
  Calendar, 
  Award,
  Percent,
  Palette,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  { value: '#0378A6', label: 'Azul Principal' },
  { value: '#F26513', label: 'Naranja Principal' },
  { value: '#10B981', label: 'Verde' },
  { value: '#8B5CF6', label: 'Púrpura' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#6B7280', label: 'Gris' },
];

const PrizeDialog = ({ isOpen, setIsOpen, prize, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    probability: '',
    color: '#F26513',
    is_active: true,
  });

  useEffect(() => {
    if (prize) {
      setFormData({
        name: prize.name || '',
        description: prize.description || '',
        probability: prize.probability || '',
        color: prize.color || '#F26513',
        is_active: prize.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        probability: '',
        color: '#F26513',
        is_active: true,
      });
    }
  }, [prize, isOpen]);

  const handleSubmit = () => {
    if (!formData.name || !formData.probability) {
      toast({ title: 'Error', description: 'Completa nombre y probabilidad', variant: 'destructive' });
      return;
    }

    const prob = parseFloat(formData.probability);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      toast({ title: 'Error', description: 'La probabilidad debe estar entre 0 y 100', variant: 'destructive' });
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{prize ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nombre del Premio *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Baño Gratis"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional del premio"
            />
          </div>

          <div>
            <Label htmlFor="probability">Probabilidad (%) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                placeholder="Ej: 15.5"
              />
              <Percent className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.value })}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    formData.color === colorOption.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Premio Activo</Label>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AnniversaryConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('anniversary_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración', variant: 'destructive' });
    } else if (data) {
      setConfig(data);
    }
  };

  const fetchPrizes = async () => {
    const { data, error } = await supabase
      .from('anniversary_prizes')
      .select('*')
      .order('order_position', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los premios', variant: 'destructive' });
    } else {
      setPrizes(data || []);
    }
  };

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPrizes()]).finally(() => setLoading(false));
  }, []);

  const handleToggleEnabled = async (enabled) => {
    const { error } = await supabase
      .from('anniversary_config')
      .update({ enabled })
      .eq('id', config.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    } else {
      setConfig({ ...config, enabled });
      toast({ title: 'Éxito', description: enabled ? 'Aniversario activado' : 'Aniversario desactivado' });
    }
  };

  const handleSaveConfig = async () => {
    const { error } = await supabase
      .from('anniversary_config')
      .update({
        title: config.title,
        description: config.description,
        start_date: config.start_date,
        end_date: config.end_date,
      })
      .eq('id', config.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Configuración guardada' });
    }
  };

  const handleSavePrize = async (prizeData) => {
    if (editingPrize) {
      // Actualizar
      const { error } = await supabase
        .from('anniversary_prizes')
        .update(prizeData)
        .eq('id', editingPrize.id);

      if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar el premio', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Premio actualizado' });
        fetchPrizes();
        setIsPrizeDialogOpen(false);
        setEditingPrize(null);
      }
    } else {
      // Crear
      const { error } = await supabase
        .from('anniversary_prizes')
        .insert([{ ...prizeData, order_position: prizes.length }]);

      if (error) {
        toast({ title: 'Error', description: 'No se pudo crear el premio', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Premio creado' });
        fetchPrizes();
        setIsPrizeDialogOpen(false);
      }
    }
  };

  const handleDeletePrize = async (prizeId) => {
    const { error } = await supabase
      .from('anniversary_prizes')
      .delete()
      .eq('id', prizeId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el premio', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Premio eliminado' });
      fetchPrizes();
    }
  };

  const totalProbability = prizes.reduce((sum, p) => sum + parseFloat(p.probability || 0), 0);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-[#F26513]" />
                Sistema de Aniversario
              </CardTitle>
              <CardDescription>Configura la ruleta de premios para celebrar el aniversario</CardDescription>
            </div>
            <Switch
              checked={config?.enabled || false}
              onCheckedChange={handleToggleEnabled}
              className="data-[state=checked]:bg-[#0378A6]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">
                <Calendar className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="prizes">
                <Award className="w-4 h-4 mr-2" />
                Premios ({prizes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={config?.title || ''}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={config?.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={config?.start_date ? new Date(config.start_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Fecha de Fin</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={config?.end_date ? new Date(config.end_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>

              <Button 
                onClick={() => navigate('/admin/anniversary-wheel')} 
                variant="outline" 
                className="w-full border-[#0378A6] text-[#0378A6] hover:bg-[#0378A6] hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a la Ruleta
              </Button>
            </TabsContent>

            <TabsContent value="prizes" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Probabilidad Total: <span className={`font-bold ${totalProbability === 100 ? 'text-green-600' : 'text-red-600'}`}>{totalProbability.toFixed(2)}%</span>
                  </p>
                  {totalProbability !== 100 && (
                    <p className="text-xs text-red-500">⚠️ La suma debe ser exactamente 100%</p>
                  )}
                </div>
                <Button onClick={() => { setEditingPrize(null); setIsPrizeDialogOpen(true); }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Premio
                </Button>
              </div>

              <div className="space-y-2">
                {prizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderLeftColor: prize.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: prize.color }}
                      >
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{prize.name}</p>
                        <p className="text-sm text-gray-600">{prize.probability}% de probabilidad</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prize.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingPrize(prize); setIsPrizeDialogOpen(true); }}
                      >
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar premio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará "{prize.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePrize(prize.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {prizes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay premios configurados</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PrizeDialog
        isOpen={isPrizeDialogOpen}
        setIsOpen={setIsPrizeDialogOpen}
        prize={editingPrize}
        onSave={handleSavePrize}
      />
    </motion.div>
  );
};

export default AnniversaryConfig;
