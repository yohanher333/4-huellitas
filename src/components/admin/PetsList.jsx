import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Eye, Edit, Trash2, Plus, Dog, Cat, Calendar, Heart, AlertTriangle, Palette, PawPrint } from 'lucide-react';
    import { useNavigate } from 'react-router-dom';
    import {
      AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
      AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog";
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

    const PetDialog = ({ isOpen, setIsOpen, pet, fetchPets, owners, breeds }) => {
      const [formData, setFormData] = useState({
        name: '',
        owner_id: '',
        breed_id: '',
        birth_date: '',
        species: 'Perro',
        gender: '',
        medical_issues: '',
        disabilities: '',
        behavior_override: '',
        custom_behavior: '',
        age_category: 'joven',
        weight: ''
      });

      useEffect(() => {
        if (pet) {
          setFormData({
            name: pet.name || '',
            owner_id: pet.owner_id || '',
            breed_id: pet.breed_id || '',
            birth_date: pet.birth_date || '',
            species: pet.species || 'Perro',
            gender: pet.gender || '',
            medical_issues: pet.medical_issues || '',
            disabilities: pet.disabilities || '',
            behavior_override: pet.behavior_override && 
              (pet.behavior_override.startsWith('🟥') || pet.behavior_override.startsWith('🟧') || 
               pet.behavior_override.startsWith('🟩') || pet.behavior_override.startsWith('🟦')) 
              ? pet.behavior_override : 'Personalizado',
            custom_behavior: pet.behavior_override && 
              !(pet.behavior_override.startsWith('🟥') || pet.behavior_override.startsWith('🟧') || 
                pet.behavior_override.startsWith('🟩') || pet.behavior_override.startsWith('🟦')) 
              ? pet.behavior_override : '',
            age_category: pet.age_category || 'joven',
            weight: pet.weight || ''
          });
        } else {
          setFormData({
            name: '',
            owner_id: '',
            breed_id: '',
            birth_date: '',
            species: 'Perro',
            gender: '',
            medical_issues: '',
            disabilities: '',
            behavior_override: '',
            custom_behavior: '',
            age_category: 'joven',
            weight: ''
          });
        }
      }, [pet, isOpen]);

      const handleSave = async () => {
        if (!formData.owner_id || !formData.name || !formData.breed_id) {
            toast({ title: "Error", description: "Propietario, nombre y raza son obligatorios.", variant: "destructive" });
            return;
        }

        // Limpiar datos antes del envío - convertir cadenas vacías en null para campos de fecha
        const cleanData = {
          name: formData.name,
          owner_id: formData.owner_id,
          breed_id: formData.breed_id,
          species: formData.species,
          gender: formData.gender,
          age_category: formData.age_category,
          birth_date: formData.birth_date && formData.birth_date.trim() !== '' ? formData.birth_date : null,
          medical_issues: formData.medical_issues && formData.medical_issues.trim() !== '' ? formData.medical_issues : null,
          disabilities: formData.disabilities && formData.disabilities.trim() !== '' ? formData.disabilities : null,
          behavior_override: formData.behavior_override === 'Personalizado' 
            ? (formData.custom_behavior && formData.custom_behavior.trim() !== '' ? formData.custom_behavior : null)
            : (formData.behavior_override && formData.behavior_override.trim() !== '' ? formData.behavior_override : null),
          weight: formData.weight && formData.weight.trim() !== '' ? parseFloat(formData.weight) : null
        };

        let error;
        if (pet) {
          ({ error } = await supabase.from('pets').update(cleanData).eq('id', pet.id));
        } else {
          ({ error } = await supabase.from('pets').insert(cleanData));
        }

        if (error) {
          toast({ title: "Error", description: `No se pudo guardar la mascota. ${error.message}`, variant: "destructive" });
        } else {
          toast({ title: "Éxito", description: `Mascota ${pet ? 'actualizada' : 'creada'} con éxito.` });
          setIsOpen(false);
          fetchPets();
        }
      };

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-[#0378A6] to-[#0378A6]/90 text-white rounded-t-xl p-6 -m-6 mb-6">
              <DialogTitle className="text-xl flex items-center gap-3 font-normal text-white drop-shadow-md">
                <Dog className="w-6 h-6" />
                {pet ? 'Editar' : 'Añadir'} Información de la Mascota
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Propietario */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-purple-700 font-medium mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                  Propietario <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, owner_id: value })} value={formData.owner_id}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue placeholder="Selecciona un propietario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre */}
              <div className="bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-indigo-700 font-medium mb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Dog className="w-4 h-4" />
                  </div>
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200"
                  placeholder="Nombre de la mascota"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="bg-white rounded-lg p-4 border border-blue-100 hover:border-[#0378A6]/30 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-[#0378A6] font-medium mb-3">
                  <div className="p-1.5 bg-[#0378A6]/10 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Fecha de Nacimiento
                </Label>
                <Input 
                  type="date" 
                  value={formData.birth_date} 
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="border-blue-200 focus:border-[#0378A6] focus:ring-blue-200"
                />
              </div>

              {/* Género */}
              <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-green-700 font-medium mb-3">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Género
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, gender: value })} value={formData.gender}>
                  <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-200">
                    <SelectValue placeholder="Selecciona el género..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Especie */}
              <div className="bg-white rounded-lg p-4 border border-orange-100 hover:border-orange-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-orange-700 font-medium mb-3">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Dog className="w-4 h-4" />
                  </div>
                  Especie
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, species: value })} value={formData.species}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perro">
                      <div className="flex items-center gap-2">
                        <Dog className="w-4 h-4" />
                        Perro
                      </div>
                    </SelectItem>
                    <SelectItem value="Gato">
                      <div className="flex items-center gap-2">
                        <Cat className="w-4 h-4" />
                        Gato
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Raza */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-purple-700 font-medium mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Raza <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, breed_id: value })} value={formData.breed_id}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue placeholder="Selecciona una raza..." />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoría de Edad */}
              <div className="bg-white rounded-lg p-4 border border-teal-100 hover:border-teal-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-teal-700 font-medium mb-3">
                  <div className="p-1.5 bg-teal-100 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Categoría de Edad
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, age_category: value })} value={formData.age_category}>
                  <SelectTrigger className="border-teal-200 focus:border-teal-500 focus:ring-teal-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cachorro">Cachorro</SelectItem>
                    <SelectItem value="joven">Joven</SelectItem>
                    <SelectItem value="adulto">Adulto</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Peso */}
              <div className="bg-white rounded-lg p-4 border border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-cyan-700 font-medium mb-3">
                  <div className="p-1.5 bg-cyan-100 rounded-lg">
                    <PawPrint className="w-4 h-4" />
                  </div>
                  Peso (kg)
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 12.5"
                  value={formData.weight} 
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-200"
                />
              </div>

              {/* Condiciones Médicas */}
              <div className="bg-white rounded-lg p-4 border border-red-100 hover:border-red-300 transition-colors shadow-sm lg:col-span-2">
                <Label className="flex items-center gap-2 text-red-700 font-medium mb-3">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Condiciones Médicas y Alergias
                </Label>
                <Input 
                  placeholder="Ej: Alergias alimentarias, medicamentos, condiciones crónicas..."
                  value={formData.medical_issues} 
                  onChange={(e) => setFormData({ ...formData, medical_issues: e.target.value })}
                  className="border-red-200 focus:border-red-500 focus:ring-red-200"
                />
              </div>

              {/* Discapacidades */}
              <div className="bg-white rounded-lg p-4 border border-pink-100 hover:border-pink-300 transition-colors shadow-sm">
                <Label className="flex items-center gap-2 text-pink-700 font-medium mb-3">
                  <div className="p-1.5 bg-pink-100 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  Discapacidades Físicas
                </Label>
                <Input 
                  placeholder="Ej: Ceguera, sordera, movilidad limitada..."
                  value={formData.disabilities} 
                  onChange={(e) => setFormData({ ...formData, disabilities: e.target.value })}
                  className="border-pink-200 focus:border-pink-500 focus:ring-pink-200"
                />
              </div>
              
              {/* Comportamiento */}
              <div className="bg-white rounded-lg p-4 border border-amber-100 hover:border-amber-300 transition-colors shadow-sm lg:col-span-2">
                <Label className="flex items-center gap-2 text-amber-700 font-medium mb-3">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  Comportamiento y Temperamento
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, behavior_override: value })} value={formData.behavior_override}>
                  <SelectTrigger className="border-amber-200 focus:border-amber-500 focus:ring-amber-200">
                    <SelectValue placeholder="Selecciona el comportamiento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="🟥 Agresivo / Defensivo">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🟥</span>
                        <span className="text-red-700 font-medium">Agresivo / Defensivo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="🟧 Nervioso / Desconfiado">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🟧</span>
                        <span className="text-orange-700 font-medium">Nervioso / Desconfiado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="🟩 Sociable / Cooperativo">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🟩</span>
                        <span className="text-green-700 font-medium">Sociable / Cooperativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="🟦 Tranquilo / Obediente">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🟦</span>
                        <span className="text-blue-700 font-medium">Tranquilo / Obediente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Personalizado">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✏️</span>
                        <span className="text-gray-700 font-medium">Comportamiento personalizado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.behavior_override === 'Personalizado' && (
                  <div className="mt-3">
                    <Textarea 
                      placeholder="Describe el comportamiento específico de la mascota..."
                      value={formData.custom_behavior || ''}
                      onChange={e => setFormData({...formData, custom_behavior: e.target.value})}
                      className="min-h-20 border-amber-200 focus:border-amber-500 focus:ring-amber-200"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-8 pt-6 border-t border-gray-200">
              <DialogClose asChild>
                <Button variant="ghost" className="hover:bg-gray-100">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white"
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    const PetsList = () => {
      const [pets, setPets] = useState([]);
      const [loading, setLoading] = useState(true);
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [editingPet, setEditingPet] = useState(null);
      const [relatedData, setRelatedData] = useState({ owners: [], breeds: [] });
      const navigate = useNavigate();

      const [filters, setFilters] = useState({ search: '', breed_id: 'all', species: 'all' });

      const fetchPets = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('pets')
          .select('*, owner:profiles(name), breed:breeds(name)')
          .order('created_at', { ascending: false });
        if (error) {
          toast({ title: "Error", description: "No se pudieron cargar las mascotas.", variant: "destructive" });
        } else {
          setPets(data);
        }
        setLoading(false);
      }, []);

      const fetchRelatedData = useCallback(async () => {
        const { data: owners } = await supabase.from('profiles').select('id, name').eq('role', 'user');
        const { data: breeds } = await supabase.from('breeds').select('id, name').order('name');
        setRelatedData({ owners: owners || [], breeds: breeds || [] });
      }, []);

      useEffect(() => {
        fetchPets();
        fetchRelatedData();
      }, [fetchPets, fetchRelatedData]);

      const handleOpenDialog = (pet = null) => {
        setEditingPet(pet);
        setIsDialogOpen(true);
      };

      const handleDelete = async (petId) => {
        await supabase.from('pet_history').delete().eq('pet_id', petId);
        const { error } = await supabase.from('pets').delete().eq('id', petId);
        if (error) {
          toast({ title: "Error", description: "No se pudo eliminar la mascota.", variant: "destructive" });
        } else {
          toast({ title: "Éxito", description: "Mascota eliminada correctamente." });
          fetchPets();
        }
      };

      const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            const searchMatch = filters.search.toLowerCase() === '' || 
                                pet.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                                pet.owner?.name?.toLowerCase().includes(filters.search.toLowerCase());
            const breedMatch = filters.breed_id === 'all' || pet.breed_id === filters.breed_id;
            const speciesMatch = filters.species === 'all' || pet.species === filters.species;
            return searchMatch && breedMatch && speciesMatch;
        });
      }, [pets, filters]);

      if (loading) return <div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#0378A6]"></div></div>;

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mascotas</h2>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Añadir Mascota
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <Input 
                placeholder="Buscar por nombre de mascota o dueño..." 
                value={filters.search} 
                onChange={e => setFilters({...filters, search: e.target.value})}
            />
            <Select value={filters.breed_id} onValueChange={value => setFilters({...filters, breed_id: value})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las Razas</SelectItem>
                    {relatedData.breeds.map(breed => <SelectItem key={breed.id} value={breed.id}>{breed.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.species} onValueChange={value => setFilters({...filters, species: value})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las Especies</SelectItem>
                    <SelectItem value="Perro"><div className="flex items-center gap-2"><Dog className="w-4 h-4"/>Perro</div></SelectItem>
                    <SelectItem value="Gato"><div className="flex items-center gap-2"><Cat className="w-4 h-4"/>Gato</div></SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3 w-16">Foto</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3 hidden md:table-cell">Propietario</th>
                  <th className="p-3 hidden lg:table-cell">Raza</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.map(pet => (
                  <tr key={pet.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                        <img 
                            src={pet.photo_url || 'https://horizons-cdn.hostinger.com/b8812eb8-c94d-4927-a06b-bd70992a5441/5b1a62d4e78298715d311910a3013c72.png'} 
                            alt={pet.name} 
                            className="w-12 h-12 object-cover rounded-full bg-gray-200"
                        />
                    </td>
                    <td className="p-3 font-medium">{pet.name}</td>
                    <td className="p-3 hidden md:table-cell">{pet.owner?.name || 'N/A'}</td>
                    <td className="p-3 hidden lg:table-cell">{pet.breed?.name || 'N/A'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/pets/${pet.id}`)}>
                          <Eye className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pet)}>
                          <Edit className="w-4 h-4 text-yellow-500" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la mascota y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(pet.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PetDialog 
            isOpen={isDialogOpen} 
            setIsOpen={setIsDialogOpen} 
            pet={editingPet}
            fetchPets={fetchPets}
            {...relatedData}
          />
        </motion.div>
      );
    };

    export default PetsList;