import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { ArrowLeft, User, Mail, Phone, Home, Lock, Dog, Plus, Trash2, Camera, HeartPulse, Bone, Cat, AlertTriangle } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { assignWelcomePoints } from '@/lib/utils';    const StepIndicator = ({ currentStep, totalSteps }) => (
      <div className="flex justify-center items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full ${index + 1 <= currentStep ? 'bg-[#F26513]' : 'bg-gray-300'}`}
            initial={{ width: 0 }}
            animate={{ width: '2rem' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        ))}
      </div>
    );

    const PetForm = ({ pet, index, onPetChange, onPhotoChange, onRemove, breeds }) => (
        <div className="space-y-4 p-4 border rounded-lg relative bg-gray-50">
            {onRemove && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onRemove}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
            <div className="grid grid-cols-2 gap-4">
                <div className="relative"><Input name="name" placeholder="Nombre *" value={pet.name} onChange={(e) => onPetChange(index, e)} required className="pl-10" /><Dog className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                <Select onValueChange={(value) => onPetChange(index, { target: { name: 'species', value }})} value={pet.species}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Perro"><div className="flex items-center gap-2"><Dog className="w-4 h-4" /> Perro</div></SelectItem>
                        <SelectItem value="Gato"><div className="flex items-center gap-2"><Cat className="w-4 h-4" /> Gato</div></SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="relative"><Bone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Select onValueChange={(value) => onPetChange(index, { target: { name: 'breed_id', value }})} value={pet.breed_id}><SelectTrigger className="pl-10"><SelectValue placeholder="Raza *" /></SelectTrigger><SelectContent>{breeds.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="relative"><HeartPulse className="absolute left-3 top-3 text-gray-400" /><Textarea name="medical_issues" placeholder="Discapacidad o problema médico *" value={pet.medical_issues} onChange={(e) => onPetChange(index, e)} required className="pl-10" /></div>
            <div className="flex items-center gap-4">
                {pet.photoPreview && <img src={pet.photoPreview} alt="preview" className="w-12 h-12 rounded-full object-cover" />}
                <Label htmlFor={`photo-${index}`} className="flex-grow cursor-pointer"><div className="flex items-center justify-center w-full h-10 border-2 border-dashed rounded-lg text-gray-500"><Camera className="w-5 h-5 mr-2" />Subir foto</div></Label>
                <Input id={`photo-${index}`} type="file" accept="image/*" onChange={(e) => onPhotoChange(index, e)} className="hidden" />
            </div>
        </div>
    );
    
    const RegisterPage = () => {
      const navigate = useNavigate();
      const { signUp } = useAuth();
      const [step, setStep] = useState(1);
      const [loading, setLoading] = useState(false);
      const [breeds, setBreeds] = useState([]);
      const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', password: '', confirmPassword: ''
      });
      const [pets, setPets] = useState([
        { name: '', species: 'Perro', age: '', breed_id: '', medical_issues: '', photoFile: null, photoPreview: null }
      ]);
      const [phoneExists, setPhoneExists] = useState(false);
    
      useEffect(() => {
        const fetchBreeds = async () => {
          const { data, error } = await supabase.from('breeds').select('id, name').order('name');
          if (error) toast({ title: "Error", description: "No se pudieron cargar las razas.", variant: "destructive" });
          else setBreeds(data);
        };
        fetchBreeds();
      }, []);

      const handlePhoneBlur = async () => {
        if (formData.phone.length > 8) {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('id').eq('phone', formData.phone).maybeSingle();
            setPhoneExists(!!data);
            setLoading(false);
        }
      };
    
      const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
      const handlePetChange = (index, e) => {
        const newPets = [...pets];
        const { name, value } = e.target;
        newPets[index][name] = value;
        setPets(newPets);
      };

      const handlePetPhotoChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
          const newPets = [...pets];
          newPets[index].photoFile = file;
          newPets[index].photoPreview = URL.createObjectURL(file);
          setPets(newPets);
        }
      };
      const addPet = () => setPets([...pets, { name: '', species: 'Perro', age: '', breed_id: '', medical_issues: '', photoFile: null, photoPreview: null }]);
      const removePet = (index) => setPets(pets.filter((_, i) => i !== index));
    
      const nextStep = () => setStep(s => s + 1);
      const prevStep = () => setStep(s => s - 1);
    
      const validateStep1 = () => {
        if (!formData.name || !formData.phone) {
          toast({ title: "¡Un momento!", description: "Tu nombre y teléfono son necesarios para continuar.", variant: "destructive" });
          return false;
        }
        if (phoneExists) return;
        nextStep();
      };
    
      const validateStep2 = () => {
        if (pets.some(p => !p.name || !p.breed_id || !p.medical_issues)) {
          toast({ title: "¡Casi!", description: "Asegúrate de darnos el nombre, la raza y el estado de salud de tu mascota.", variant: "destructive" });
          return false;
        }
        nextStep();
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (step !== 3) return;

        if (phoneExists) {
            toast({ title: "Teléfono ya registrado", description: "Este número de teléfono ya tiene una cuenta. Por favor, inicia sesión.", variant: "destructive" });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
          return;
        }
        if (!formData.password) {
            toast({ title: "Error", description: "La contraseña es obligatoria.", variant: "destructive" });
            return;
        }
        setLoading(true);

        const { data: authData, error: authError } = await signUp(formData.email, formData.password, {
          name: formData.name, phone: formData.phone, address: formData.address
        });
    
        if (authError || !authData.user) { 
            toast({ title: "Error de registro", description: authError ? authError.message : "No se pudo crear el usuario.", variant: "destructive" });
            setLoading(false); 
            return; 
        }
    
        const userId = authData.user.id;
        const petPromises = pets.map(async (pet) => {
          let photoUrl = null;
          if (pet.photoFile) {
            const fileName = `pet-photos/${userId}/${Date.now()}-${pet.photoFile.name}`;
            const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, pet.photoFile);
            if (uploadError) { 
              toast({ title: "Error de carga", description: `No se pudo subir la foto de ${pet.name}.`, variant: "destructive" }); 
              return null;
            }
            const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
            photoUrl = publicUrl;
          }
          
          // Obtener comportamiento por defecto de la raza
          let defaultBehavior = null;
          if (pet.breed_id) {
            const { data: selectedBreed } = await supabase
              .from('breeds')
              .select('behavior_color')
              .eq('id', pet.breed_id)
              .single();
            
            if (selectedBreed?.behavior_color) {
              const behaviorMap = {
                '🟥': '🟥 Agresivo / Defensivo',
                '🟧': '🟧 Nervioso / Desconfiado', 
                '🟩': '🟩 Sociable / Cooperativo',
                '🟦': '🟦 Tranquilo / Obediente'
              };
              defaultBehavior = behaviorMap[selectedBreed.behavior_color];
            }
          }
          
          return {
            owner_id: userId, name: pet.name, species: pet.species,
            birth_date: pet.age ? new Date(new Date().setFullYear(new Date().getFullYear() - pet.age)).toISOString().split('T')[0] : null,
            breed_id: pet.breed_id, medical_issues: pet.medical_issues, photo_url: photoUrl,
            behavior_override: defaultBehavior
          };
        });

        const petsToInsert = (await Promise.all(petPromises)).filter(p => p !== null);

        if(petsToInsert.length > 0){
          const { error: petsError } = await supabase.from('pets').insert(petsToInsert);
          if (petsError) {
            toast({ title: "Error al guardar mascotas", description: petsError.message, variant: "destructive" });
          }
        }
        
        // Asignar puntos de bienvenida automáticamente
        const pointsResult = await assignWelcomePoints(userId);
        if (!pointsResult.success) {
          console.error('Error assigning welcome points:', pointsResult.error);
          // No mostramos error al usuario, los puntos son secundarios
        }
        
        setLoading(false);
        navigate('/dashboard', { 
          state: { 
            isNewUser: true, 
            showWelcomeModal: pointsResult.success 
          } 
        });
      };
    
      const renderStepContent = () => {
        const variants = {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
        };
    
        switch (step) {
          case 1:
            return (
              <motion.div key="step1" variants={variants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-center">¡Hola! Empecemos por ti</h2>
                <p className="text-center text-gray-600 -mt-4">Cuéntanos un poco sobre quién eres.</p>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input id="name" name="name" placeholder="Tu nombre completo *" value={formData.name} onChange={handleFormChange} required className="pl-10" /></div>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input id="phone" name="phone" type="tel" placeholder="Tu teléfono *" value={formData.phone} onChange={handleFormChange} onBlur={handlePhoneBlur} required className="pl-10" />
                </div>
                 {phoneExists && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Teléfono ya registrado</AlertTitle>
                        <AlertDescription>
                           Este número ya tiene una cuenta. Por favor, <button onClick={() => navigate('/login')} className="font-bold underline">inicia sesión</button>.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input id="email" name="email" type="email" placeholder="Tu correo *" value={formData.email} onChange={handleFormChange} required className="pl-10" /></div>
                <div className="relative"><Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input id="address" name="address" placeholder="Tu dirección (opcional)" value={formData.address} onChange={handleFormChange} className="pl-10" /></div>
                <Button onClick={validateStep1} className="w-full h-12 text-lg" disabled={phoneExists || loading}>{loading ? 'Verificando...' : 'Siguiente'}</Button>
              </motion.div>
            );
          case 2:
            return (
              <motion.div key="step2" variants={variants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-center">Ahora, tus compañeros peludos</h2>
                <p className="text-center text-gray-600 -mt-4">Añade a todas tus mascotas.</p>
                {pets.map((pet, index) => (
                  <PetForm key={index} pet={pet} index={index} onPetChange={handlePetChange} onPhotoChange={handlePetPhotoChange} onRemove={() => removePet(index)} breeds={breeds} />
                ))}
                <Button type="button" variant="outline" onClick={addPet} className="w-full"><Plus className="w-4 h-4 mr-2" />Añadir otra mascota</Button>
                <Button onClick={validateStep2} className="w-full h-12 text-lg">Siguiente</Button>
              </motion.div>
            );
          case 3:
            return (
              <motion.div key="step3" variants={variants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-center">Casi listos...</h2>
                <p className="text-center text-gray-600 -mt-4">Solo falta crear tu contraseña.</p>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input id="password" name="password" type="password" placeholder="Contraseña *" value={formData.password} onChange={handleFormChange} required className="pl-10" /></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirmar contraseña *" value={formData.confirmPassword} onChange={handleFormChange} required className="pl-10" /></div>
                <Button onClick={handleSubmit} className="w-full h-12 text-lg" disabled={loading}>{loading ? 'Creando cuenta...' : '¡Finalizar Registro!'}</Button>
              </motion.div>
            );
          default: return null;
        }
      };
    
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#F26513] to-[#0378A6] flex flex-col justify-center items-center p-4 pb-32">
          <div className="w-full max-w-md">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <Button variant="ghost" onClick={step === 1 ? () => navigate('/') : prevStep} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5 mr-2" /> {step === 1 ? 'Volver al inicio' : 'Atrás'}
              </Button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <StepIndicator currentStep={step} totalSteps={3} />
                  <AnimatePresence mode="wait">
                    {renderStepContent()}
                  </AnimatePresence>
                {step === 1 && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600">¿Ya tienes cuenta?{' '}<button onClick={() => navigate('/login')} className="text-[#0378A6] font-semibold hover:underline">Inicia sesión</button></p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      );
    };
    
    export default RegisterPage;