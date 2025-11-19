import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Trophy, RotateCw, X, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const WelcomeWheelModal = ({ isOpen, onClose, userId, userName }) => {
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const wheelRef = useRef(null);
  const audioContextRef = useRef(null);
  
  useEffect(() => {
    console.log('WelcomeWheelModal - isOpen:', isOpen, 'userId:', userId, 'userName:', userName);
    if (isOpen) {
      checkIfAlreadySpun();
      fetchPrizes();
      fetchCompanyInfo();
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isOpen, userId]);

  const checkIfAlreadySpun = async () => {
    if (!userId) {
      console.log('WelcomeWheelModal - No userId provided');
      return;
    }
    
    const { data, error } = await supabase
      .from('anniversary_winners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('WelcomeWheelModal - Check if already spun:', { data, error, hasSpun: !!data });
    if (!error && data) {
      setHasSpun(true);
    }
  };

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

    console.log('WelcomeWheelModal - Fetch prizes:', { prizesCount: data?.length, error });
    if (!error && data && data.length > 0) {
      setPrizes(data);
    }
  };

  // Funciones de sonido (copiadas del AnniversaryWheelPage)
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

  const playWinSound = () => {
    if (!audioContextRef.current) return;
    const context = audioContextRef.current;
    const notes = [523.25, 659.25, 783.99, 1046.50];
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

  const playApplauseSound = () => {
    if (!audioContextRef.current) return;
    const context = audioContextRef.current;
    const layers = 3;
    const clapsPerLayer = 25;
    
    for (let layer = 0; layer < layers; layer++) {
      for (let i = 0; i < clapsPerLayer; i++) {
        setTimeout(() => {
          const bufferSize = context.sampleRate * 0.08;
          const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
          const dataL = buffer.getChannelData(0);
          const dataR = buffer.getChannelData(1);
          
          for (let j = 0; j < bufferSize; j++) {
            const t = j / context.sampleRate;
            const envelope = Math.exp(-t * 50);
            dataL[j] = (Math.random() * 2 - 1) * envelope;
            dataR[j] = (Math.random() * 2 - 1) * envelope;
          }
          
          const source = context.createBufferSource();
          const gainNode = context.createGain();
          const panNode = context.createStereoPanner();
          const compressor = context.createDynamicsCompressor();
          const filter = context.createBiquadFilter();
          
          filter.type = 'bandpass';
          filter.frequency.value = 800 + Math.random() * 1500;
          filter.Q.value = 1;
          
          panNode.pan.value = (Math.random() * 2 - 1) * 0.8;
          compressor.threshold.value = -20;
          compressor.knee.value = 10;
          compressor.ratio.value = 4;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.05;
          
          source.buffer = buffer;
          gainNode.gain.value = 0.15 + (Math.random() * 0.1);
          
          source.connect(filter);
          filter.connect(panNode);
          panNode.connect(gainNode);
          gainNode.connect(compressor);
          compressor.connect(context.destination);
          
          source.start(context.currentTime);
        }, i * (40 + Math.random() * 30) + layer * 200);
      }
    }
  };

  const playCelebrationSound = () => {
    if (!audioContextRef.current) return;
    const context = audioContextRef.current;
    for (let i = 0; i < 4; i++) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.type = 'sawtooth';
      const startTime = context.currentTime + (i * 0.1);
      oscillator.frequency.setValueAtTime(300 + (i * 100), startTime);
      oscillator.frequency.exponentialRampToValueAtTime(600 + (i * 100), startTime + 0.3);
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    }
  };

  const playSpinStartSound = () => {
    if (!audioContextRef.current) return;
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
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
    if (isSpinning || prizes.length === 0 || hasSpun) return;

    setIsSpinning(true);
    setShowResult(false);
    playSpinStartSound();

    const winner = selectPrizeByProbability();
    const winnerIndex = prizes.findIndex(p => p.id === winner.id);
    const segmentAngle = 360 / prizes.length;
    const segmentCenterAngle = -90 + (winnerIndex * segmentAngle) + (segmentAngle / 2);
    const targetOffset = -segmentCenterAngle - 90;
    const currentNormalized = rotation % 360;
    let rotationNeeded = targetOffset - currentNormalized;
    
    while (rotationNeeded <= 0) {
      rotationNeeded += 360;
    }
    
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = rotationNeeded + (360 * extraSpins);
    const finalRotation = rotation + totalRotation;
    setRotation(finalRotation);

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
      
      // Si el premio es "Intenta de Nuevo", no marcar como hasSpun
      const isRetryPrize = winner.name.toLowerCase().includes('intenta') || 
                          winner.name.toLowerCase().includes('again');
      
      if (!isRetryPrize) {
        setHasSpun(true);
        savePrizeToHistory(winner);
      } else {
        console.log('Premio "Intenta de Nuevo" - permitiendo otra jugada');
      }
      
      playWinSound();
      setTimeout(() => playApplauseSound(), 300);
      setTimeout(() => playCelebrationSound(), 500);
      setTimeout(() => triggerConfetti(), 200);
    }, 4000);
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const savePrizeToHistory = async (prize) => {
    const now = new Date();
    await supabase.from('anniversary_winners').insert([{
      user_id: userId,
      prize_id: prize.id,
      prize_name: prize.name,
      won_at: now.toISOString()
    }]);
  };

  const handleClaimPrize = () => {
    if (!selectedPrize) return;
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const message = `¡Hola! Soy ${userName} y me gané el premio: *${selectedPrize.name}* 🎉\n\nFecha: ${formattedDate}\nHora: ${formattedTime}\n\nQuiero reclamar mi premio.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/573012635719?text=${encodedMessage}`, '_blank');
  };

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 60;

  console.log('WelcomeWheelModal - Render check:', { 
    isOpen, 
    prizesCount: prizes.length,
    userId,
    userName,
    hasSpun 
  });

  if (!isOpen) {
    console.log('WelcomeWheelModal - Not open, returning null');
    return null;
  }

  console.log('WelcomeWheelModal - MOSTRANDO MODAL! Premios:', prizes.length);

  return (
    <AnimatePresence>
      {prizes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-[#0378A6] via-purple-600 to-[#F26513] z-50 flex items-center justify-center"
        >
          <div className="text-center text-white">
            <Gift className="w-24 h-24 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold mb-2">Cargando premios...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </motion.div>
      ) : (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-[#0378A6] via-purple-600 to-[#F26513] z-50 overflow-y-auto"
      >
        {/* Botón cerrar */}
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30"
          size="icon"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Logo de la empresa */}
        <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-full p-2 sm:p-3 shadow-lg">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
          ) : (
            <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-[#0378A6]" />
          )}
        </div>

        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
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
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 font-heading flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300" />
              <span>¡Bienvenido!</span>
              <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300" />
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 px-4">
              {hasSpun ? '¡Ya has participado!' : '¡Gira la ruleta y gana tu premio!'}
            </p>
          </motion.div>

          {/* Ruleta y Lista de Premios */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-6 w-full max-w-7xl">
            {/* Contenedor de Ruleta + Botón Girar */}
            <div className="flex flex-col items-center gap-6">
              {/* Ruleta */}
              <div className="relative">
                {/* Indicador */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 sm:-translate-y-4 z-20">
                  <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-yellow-400 drop-shadow-lg" />
                </div>

                {/* Borde decorativo exterior */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse" style={{ padding: '6px' }}>
                  <div className="w-full h-full rounded-full bg-white" />
                </div>

                {/* La ruleta */}
                <motion.div
                  ref={wheelRef}
                  className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] rounded-full overflow-hidden shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 500 500">
                    {prizes.map((prize, index) => {
                      const startAngle = -90 + index * segmentAngle;
                      const endAngle = startAngle + segmentAngle;
                      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                      const startX = 250 + 250 * Math.cos((startAngle * Math.PI) / 180);
                      const startY = 250 + 250 * Math.sin((startAngle * Math.PI) / 180);
                      const endX = 250 + 250 * Math.cos((endAngle * Math.PI) / 180);
                      const endY = 250 + 250 * Math.sin((endAngle * Math.PI) / 180);

                      const textAngle = startAngle + segmentAngle / 2;
                      const textRadius = 160;
                      const textX = 250 + textRadius * Math.cos((textAngle * Math.PI) / 180);
                      const textY = 250 + textRadius * Math.sin((textAngle * Math.PI) / 180);

                      return (
                        <g key={prize.id}>
                          <path
                            d={`M 250 250 L ${startX} ${startY} A 250 250 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                            fill={prize.color}
                            stroke="white"
                            strokeWidth="3"
                          />
                          <text
                            x={textX}
                            y={textY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                            className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide"
                            fill="white"
                            style={{
                              paintOrder: 'stroke fill',
                              stroke: 'rgba(0,0,0,0.8)',
                              strokeWidth: '4px',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round',
                              textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7), 0 0 16px rgba(0,0,0,0.5)',
                              WebkitTextStroke: '2px rgba(0,0,0,0.8)',
                            }}
                          >
                            {prize.name}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="250" cy="250" r="40" fill="white" stroke="#FFD700" strokeWidth="4" />
                    <circle cx="250" cy="250" r="20" fill="#FFD700" />
                  </svg>
                </motion.div>
              </div>

              {/* Botón de Girar debajo de la ruleta */}
              {!hasSpun && !showResult && (
                <Button
                  onClick={spinWheel}
                  disabled={isSpinning || hasSpun}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSpinning ? (
                    <>
                      <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-spin" />
                      Girando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      ¡GIRAR!
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Lista de premios (responsive - oculta en móvil pequeño) */}
            <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl max-w-sm w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-center">Premios Disponibles</h3>
              <div className="space-y-2 sm:space-y-3">
                {prizes.map((prize, index) => (
                  <motion.div
                    key={prize.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm"
                  >
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: prize.color }}
                    />
                    <div className="flex-grow">
                      <p className="text-white font-semibold text-sm sm:text-base">{prize.name}</p>
                      {prize.description && (
                        <p className="text-white/70 text-xs sm:text-sm">{prize.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Botones de resultado (solo cuando ya giró) */}
          <div className="flex flex-col gap-4 items-center w-full max-w-md px-4">
            {showResult && selectedPrize && (
              <>
                {/* Si es "Intenta de Nuevo", mostrar botón para volver a girar */}
                {(selectedPrize.name.toLowerCase().includes('intenta') || 
                  selectedPrize.name.toLowerCase().includes('again')) ? (
                  <Button
                    onClick={() => {
                      setShowResult(false);
                      setSelectedPrize(null);
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full shadow-2xl w-full sm:w-auto"
                  >
                    <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    ¡Girar de Nuevo!
                  </Button>
                ) : (
                  <Button
                    onClick={handleClaimPrize}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full shadow-2xl w-full sm:w-auto"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    Reclamar mi Premio
                  </Button>
                )}
              </>
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
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Trophy className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 text-yellow-500" />
                    </motion.div>

                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">
                      {(selectedPrize.name.toLowerCase().includes('intenta') || 
                        selectedPrize.name.toLowerCase().includes('again')) 
                        ? '¡Una oportunidad más!' 
                        : '¡Felicidades!'}
                    </h2>
                    
                    <div 
                      className="mb-6 p-4 sm:p-6 rounded-2xl"
                      style={{ backgroundColor: `${selectedPrize.color}20` }}
                    >
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: selectedPrize.color }}
                      >
                        <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: selectedPrize.color }}>
                        {selectedPrize.name}
                      </p>
                      {selectedPrize.description && (
                        <p className="text-gray-600 text-sm sm:text-base">{selectedPrize.description}</p>
                      )}
                    </div>

                    <p className="text-gray-600 mb-6 text-sm sm:text-base">
                      {(selectedPrize.name.toLowerCase().includes('intenta') || 
                        selectedPrize.name.toLowerCase().includes('again')) 
                        ? '¡Tienes otra oportunidad de ganar! Presiona el botón para volver a girar.' 
                        : '¡Presiona el botón verde para reclamar tu premio vía WhatsApp!'}
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Si es "Intenta de Nuevo", mostrar solo botón para volver a girar */}
                      {(selectedPrize.name.toLowerCase().includes('intenta') || 
                        selectedPrize.name.toLowerCase().includes('again')) ? (
                        <>
                          <Button
                            onClick={() => {
                              setShowResult(false);
                              setSelectedPrize(null);
                            }}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3"
                          >
                            <RotateCw className="w-5 h-5 mr-2" />
                            ¡Girar de Nuevo!
                          </Button>
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="w-full"
                          >
                            Cerrar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleClaimPrize}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3"
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Reclamar por WhatsApp
                          </Button>
                          
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="w-full"
                          >
                            Cerrar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeWheelModal;
