import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Trophy, RotateCw, Maximize, Minimize } from 'lucide-react';
import confetti from 'canvas-confetti';

const AnniversaryWheelPage = () => {
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const wheelRef = useRef(null);
  const containerRef = useRef(null);
  
  // Crear efectos de sonido usando Web Audio API
  const audioContextRef = useRef(null);
  
  useEffect(() => {
    // Inicializar AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Función para crear sonido de tick mientras gira
  const playTickSound = () => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.05);
  };

  // Función para crear sonido de victoria
  const playWinSound = () => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    
    // Secuencia de notas para efecto de victoria
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do (octava alta)
    
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const startTime = context.currentTime + (index * 0.15);
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  };

  // Función para crear sonido de aplausos mejorado
  const playApplauseSound = () => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    
    // Crear múltiples capas de aplausos para un sonido más denso y realista
    const layers = 3; // Múltiples capas de aplausos
    const clapsPerLayer = 25; // Más palmadas por capa
    
    for (let layer = 0; layer < layers; layer++) {
      for (let i = 0; i < clapsPerLayer; i++) {
        setTimeout(() => {
          const bufferSize = context.sampleRate * 0.08; // Duración más corta para cada palmada
          const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
          const dataL = buffer.getChannelData(0);
          const dataR = buffer.getChannelData(1);
          
          // Generar ruido blanco estéreo
          for (let j = 0; j < bufferSize; j++) {
            const envelope = Math.exp(-j / (bufferSize * 0.3)); // Envelope más natural
            dataL[j] = (Math.random() * 2 - 1) * envelope;
            dataR[j] = (Math.random() * 2 - 1) * envelope;
          }
          
          const noise = context.createBufferSource();
          noise.buffer = buffer;
          
          // Filtro pasa-banda para simular el timbre de aplausos
          const filter = context.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 800 + Math.random() * 1500; // Rango de frecuencia más amplio
          filter.Q.value = 1 + Math.random() * 2; // Q variable para más naturalidad
          
          // Compresor para hacer el sonido más compacto
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -20;
          compressor.knee.value = 10;
          compressor.ratio.value = 12;
          compressor.attack.value = 0;
          compressor.release.value = 0.1;
          
          // Pan para distribuir en estéreo
          const panner = context.createStereoPanner();
          panner.pan.value = (Math.random() * 2 - 1) * 0.7; // Panear entre -0.7 y 0.7
          
          const gainNode = context.createGain();
          const volume = 0.08 + Math.random() * 0.06; // Volumen variable
          gainNode.gain.setValueAtTime(volume, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.08);
          
          noise.connect(filter);
          filter.connect(compressor);
          compressor.connect(panner);
          panner.connect(gainNode);
          gainNode.connect(context.destination);
          
          noise.start(context.currentTime);
          noise.stop(context.currentTime + 0.08);
        }, (i * 50) + (layer * 15)); // Timing más denso y con offset entre capas
      }
    }
  };

  // Función para crear sonido de "Buya!" (celebración con voz sintetizada)
  const playCelebrationSound = () => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    
    // Simular un grito de celebración con múltiples osciladores
    const frequencies = [300, 400, 500, 600];
    
    frequencies.forEach((baseFreq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Modulación de frecuencia para simular voz
      oscillator.frequency.setValueAtTime(baseFreq, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(baseFreq * 1.5, context.currentTime + 0.2);
      oscillator.frequency.linearRampToValueAtTime(baseFreq * 1.2, context.currentTime + 0.4);
      
      oscillator.type = 'sawtooth';
      
      const startTime = context.currentTime + (index * 0.05);
      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  };

  // Función para crear sonido de inicio de giro
  const playSpinStartSound = () => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(400, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.3);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  };

  useEffect(() => {
    fetchPrizes();
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    const { data, error } = await supabase
      .from('company_info')
      .select('logo')
      .single();

    if (!error && data?.logo) {
      setCompanyLogo(data.logo);
    }
  };

  const fetchPrizes = async () => {
    const { data, error } = await supabase
      .from('anniversary_prizes')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los premios', variant: 'destructive' });
    } else if (data && data.length > 0) {
      setPrizes(data);
    } else {
      toast({ title: 'Información', description: 'No hay premios configurados', variant: 'default' });
    }
  };

  const selectPrizeByProbability = () => {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const prize of prizes) {
      cumulative += parseFloat(prize.probability);
      if (random <= cumulative) {
        return prize;
      }
    }

    return prizes[prizes.length - 1];
  };

  const spinWheel = () => {
    if (isSpinning || prizes.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);

    // Sonido de inicio de giro
    playSpinStartSound();

    const winner = selectPrizeByProbability();
    const winnerIndex = prizes.findIndex(p => p.id === winner.id);
    
    // Los segmentos se dibujan desde -90° (arriba), y van en sentido horario
    // El segmento 0 está centrado en -90° (arriba)
    // El segmento 1 está en -90° + segmentAngle, etc.
    
    // Calculamos el ángulo donde está el centro del segmento ganador
    const segmentCenterAngle = -90 + (winnerIndex * segmentAngle) + (segmentAngle / 2);
    
    // Queremos que ese centro quede en -90° (donde apunta la flecha)
    // Entonces necesitamos rotar: -segmentCenterAngle (para llevarlo a 0) + (-90) (para ponerlo arriba)
    // Simplificado: queremos rotar -segmentCenterAngle - 90
    // Pero como rotamos en sentido horario positivo, invertimos: 90 + segmentCenterAngle
    // Y como queremos el resultado final en positivo: 
    const targetOffset = -segmentCenterAngle - 90;
    
    // Normalizar la rotación actual
    const currentNormalized = rotation % 360;
    
    // Calcular cuánto necesitamos rotar desde la posición actual
    let rotationNeeded = targetOffset - currentNormalized;
    
    // Asegurar que siempre gire hacia adelante (al menos 360°)
    while (rotationNeeded <= 0) {
      rotationNeeded += 360;
    }
    
    // Agregar vueltas completas (entre 5 y 7)
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = rotationNeeded + (360 * extraSpins);
    
    // Aplicar la rotación final
    const finalRotation = rotation + totalRotation;

    setRotation(finalRotation);

    // Reproducir sonidos de tick durante el giro
    let tickCount = 0;
    const maxTicks = 30;
    const tickInterval = setInterval(() => {
      if (tickCount < maxTicks) {
        playTickSound();
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      setSelectedPrize(winner);
      setIsSpinning(false);
      setShowResult(true);
      
      // Secuencia de sonidos de celebración
      playWinSound();
      
      // Aplauso después de 300ms
      setTimeout(() => {
        playApplauseSound();
      }, 300);
      
      // "Buya!" después de 500ms
      setTimeout(() => {
        playCelebrationSound();
      }, 500);
      
      // Confetti después de los primeros sonidos
      setTimeout(() => {
        triggerConfetti();
      }, 200);
      
      savePrizeToHistory(winner);
    }, 4000);
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const savePrizeToHistory = async (prize) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('anniversary_winners').insert([{
        user_id: user.id,
        prize_id: prize.id,
        prize_name: prize.name,
      }]);
    }
  };

  const resetWheel = () => {
    setShowResult(false);
    setSelectedPrize(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 60;

  if (prizes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0378A6] via-purple-600 to-[#F26513] flex items-center justify-center">
        <div className="text-center text-white">
          <Gift className="w-24 h-24 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Ruleta no configurada</h2>
          <p>Por favor, configura los premios en el panel de administración</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-[#0378A6] via-purple-600 to-[#F26513] relative overflow-hidden">
      {/* Botón Fullscreen */}
      <Button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30"
        size="icon"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </Button>

      {/* Logo de la empresa */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg">
        {companyLogo ? (
          <img 
            src={companyLogo} 
            alt="Logo" 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        ) : (
          <Gift className="w-16 h-16 md:w-20 md:h-20 text-[#0378A6]" />
        )}
      </div>

      {/* Partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            initial={{ x: Math.random() * window.innerWidth, y: -20 }}
            animate={{
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 font-heading flex items-center justify-center gap-4">
            <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />
            Ruleta de Premios
            <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />
          </h1>
          <p className="text-xl md:text-2xl text-white/90">¡Gira y gana increíbles premios!</p>
        </motion.div>

        {/* Ruleta y Lista de Premios */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8 w-full max-w-7xl">
          {/* Ruleta */}
          <div className="relative">
            {/* Indicador */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-yellow-400 drop-shadow-lg" />
            </div>

          {/* Borde decorativo exterior */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse" style={{ padding: '8px' }}>
            <div className="w-full h-full rounded-full bg-white" />
          </div>

          {/* La ruleta */}
          <motion.div
            ref={wheelRef}
            className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full overflow-hidden shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {prizes.map((prize, index) => {
              const startAngle = index * segmentAngle;
              const midAngle = startAngle + segmentAngle / 2;
              
              return (
                <div
                  key={prize.id}
                  className="absolute w-full h-full"
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startAngle + segmentAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle + segmentAngle - 90) * Math.PI / 180)}%)`,
                    backgroundColor: prize.color,
                  }}
                >
                  {/* Texto del premio */}
                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `rotate(${midAngle}deg)`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <div
                      className="text-white font-extrabold text-center"
                      style={{
                        transform: 'translateX(50px) translateY(-10px)',
                        width: '100px',
                        textShadow: '2px 2px 6px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.6)',
                        WebkitTextStroke: '0.5px rgba(0,0,0,0.4)',
                        fontSize: 'clamp(10px, 2.2vw, 14px)',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                      }}
                    >
                      {prize.name}
                    </div>
                  </div>

                  {/* Borde interior del segmento para mejor definición */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)`,
                    }}
                  />
                </div>
              );
            })}

            {/* Centro decorativo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Gift className="w-8 h-8 md:w-12 md:h-12 text-white" />
            </div>
          </motion.div>
          </div>

          {/* Lista de Premios */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 w-full max-w-sm"
          >
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Premios Disponibles
            </h3>
            <div className="space-y-3">
              {prizes.map((prize) => (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 shadow-lg border-2 border-white/30"
                    style={{ backgroundColor: prize.color }}
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm leading-tight">{prize.name}</p>
                    {prize.description && (
                      <p className="text-white/70 text-xs mt-1">{prize.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <Button
            onClick={spinWheel}
            disabled={isSpinning}
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpinning ? (
              <>
                <RotateCw className="w-6 h-6 mr-2 animate-spin" />
                Girando...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2" />
                ¡GIRAR!
              </>
            )}
          </Button>

          {showResult && (
            <Button
              onClick={resetWheel}
              size="lg"
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white hover:bg-white/30 font-bold text-xl px-12 py-6 rounded-full shadow-2xl"
            >
              Intentar de Nuevo
            </Button>
          )}
        </div>

        {/* Modal de resultado */}
        <AnimatePresence>
          {showResult && selectedPrize && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowResult(false)}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
                  </motion.div>

                  <h2 className="text-4xl font-bold mb-4 text-gray-800">¡Felicidades!</h2>
                  
                  <div 
                    className="mb-6 p-6 rounded-2xl"
                    style={{ backgroundColor: `${selectedPrize.color}20` }}
                  >
                    <div
                      className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: selectedPrize.color }}
                    >
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-3xl font-bold mb-2" style={{ color: selectedPrize.color }}>
                      {selectedPrize.name}
                    </p>
                    {selectedPrize.description && (
                      <p className="text-gray-600">{selectedPrize.description}</p>
                    )}
                  </div>

                  <p className="text-gray-600 mb-6">
                    Muestra este premio en tienda para reclamarlo
                  </p>

                  <Button
                    onClick={() => setShowResult(false)}
                    className="w-full bg-gradient-to-r from-[#0378A6] to-[#F26513] hover:from-[#0378A6]/90 hover:to-[#F26513]/90 text-white font-bold py-3"
                  >
                    Cerrar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnniversaryWheelPage;
