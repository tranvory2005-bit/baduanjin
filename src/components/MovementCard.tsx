import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movement } from '../types';
import { Play, Square, Info, Activity } from 'lucide-react';
import MovementSimulation from './MovementSimulation';

interface MovementCardProps {
  movement: Movement;
  isActive: boolean;
  currentRep: number;
  isBreathingIn: boolean;
  isPracticing: boolean;
  onTogglePractice: () => void;
}

export default function MovementCard({
  movement,
  isActive,
  currentRep,
  isBreathingIn,
  isPracticing,
  onTogglePractice
}: MovementCardProps) {
  const isInk = movement.tone === 'ink';
  
  const [viewMode, setViewMode] = useState<'visualizer' | 'video'>('visualizer');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play / pause video when the practice state changes
  useEffect(() => {
    if (videoRef.current) {
      if (isActive || isPracticing) {
        videoRef.current.play().catch(err => {
          // Playback might be blocked by browser autoplay policy before user interaction
          console.log("Video playback auto-play was prevented:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPracticing, viewMode]);

  const getVideoSources = (id: string) => {
    const index = id.replace('m', '');
    const name = `style${index}`;
    return [
      `${name}.mp4`,
      `videos/${name}.mp4`,
      `assets/${name}.mp4`,
      // support potential typo in style8
      ...(index === '8' ? ['stye8.mp4', 'videos/stye8.mp4', 'assets/stye8.mp4'] : []),
      `${name}.webm`,
      `videos/${name}.webm`,
    ];
  };

  // Choose colors based on light (paper) or dark (ink) tone
  const bgClass = isInk ? 'bg-ink-2 text-paper' : 'bg-[#F2ECE0] text-ink';
  const borderClass = isInk ? 'border-[#3a4038]' : 'border-[#E2DBC8]';
  const sealClass = isInk ? 'border-brass text-brass' : 'border-cinnabar text-cinnabar';
  const pinyinClass = isInk ? 'text-jade-light' : 'text-jade';
  const stepNumClass = isInk ? 'border-jade text-jade-light' : 'border-jade text-jade';
  const benefitBgClass = isInk ? 'bg-brass/5 border-brass' : 'bg-cinnabar/5 border-cinnabar';
  const benefitLabelClass = isInk ? 'text-brass' : 'text-cinnabar';
  const stepTextClass = isInk ? 'text-[#D6D2C4]' : 'text-ink-soft';

  // State text for breathing
  const showActiveBreathing = isActive || isPracticing;
  const breathStateText = isBreathingIn ? 'Inhale' : 'Exhale';

  return (
    <section 
      id={movement.id}
      className={`py-16 md:py-24 border-b transition-all duration-500 no-print ${
        isInk ? 'bg-ink text-paper' : 'bg-paper text-ink'
      } ${showActiveBreathing ? 'ring-2 ring-inset ' + (isInk ? 'ring-brass' : 'ring-cinnabar') : ''}`}
    >
      <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
        
        {/* Header */}
        <div className="flex items-start gap-6 mb-10 md:mb-12">
          {/* Traditional Seal representation */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-md border-2 flex items-center justify-center font-cjk font-bold text-2xl sm:text-3xl rotate-[-2deg] flex-shrink-0 ${sealClass}`}>
            {movement.num}
          </div>
          <div>
            <h3 className="font-cjk font-bold text-3xl sm:text-4xl md:text-5xl leading-tight">
              {movement.cjk}
            </h3>
            <div className={`text-sm sm:text-base tracking-wider italic font-medium mt-1 ${pinyinClass}`}>
              {movement.pinyin}
            </div>
            <h4 className="font-serif font-medium text-lg sm:text-xl md:text-2xl mt-2 text-ink-2">
              {movement.en}
            </h4>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Animated Movement Simulator & Video Demonstration */}
          <div className="lg:col-span-6 space-y-4">
            {/* Tab selection */}
            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 border border-[#E2DBC8]/50 dark:border-[#3a4038]/50 rounded-lg w-fit no-print">
              <button
                onClick={() => setViewMode('visualizer')}
                className={`px-4 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === 'visualizer'
                    ? isInk
                      ? 'bg-brass text-ink font-semibold shadow-sm'
                      : 'bg-jade text-paper font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Qi Visualizer
              </button>
              <button
                onClick={() => setViewMode('video')}
                className={`px-4 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === 'video'
                    ? isInk
                      ? 'bg-brass text-ink font-semibold shadow-sm'
                      : 'bg-jade text-paper font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Video Demo
              </button>
            </div>

            <div className={`border p-3 rounded-lg overflow-hidden ${borderClass} bg-black/10 shadow-md`}>
              <div className="relative w-full h-[450px] sm:h-[550px] md:h-[650px] lg:h-[720px] rounded overflow-hidden bg-black/40">
                {viewMode === 'visualizer' ? (
                  <>
                    <MovementSimulation
                      movement={movement}
                      isGlobalActive={isActive}
                      isGlobalPracticing={isPracticing}
                      globalIsBreathingIn={isBreathingIn}
                      currentRep={currentRep}
                    />
                    {/* Visual Overlay indicator */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded text-white tracking-widest uppercase z-10 pointer-events-none">
                      Qi Visualizer
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      controls
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      {getVideoSources(movement.id).map((src, idx) => (
                        <source key={idx} src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                      ))}
                      Your browser does not support the video tag.
                    </video>
                    {/* Visual Overlay indicator */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded text-white tracking-widest uppercase z-10 pointer-events-none">
                      Video Demo
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-ink-soft leading-relaxed flex items-start gap-1.5 px-1">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-80" />
              <span>
                {viewMode === 'visualizer' 
                  ? `Interactive visualizer demonstrating the optimal physical posture, joint coordination, and breathing cycle of ${movement.en}.`
                  : `Video demonstration of ${movement.en}. Please save style1.mp4 to style8.mp4 inside your public/ folder (e.g. public/style1.mp4).`
                }
              </span>
            </p>
          </div>

          {/* Right Column: Instructions, Benefits, and Controls */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Steps List */}
            <ol className="space-y-4">
              {movement.steps.map((step, idx) => (
                <li key={idx} className="relative pl-10 text-sm sm:text-base leading-relaxed">
                  <span className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs ${stepNumClass}`}>
                    {idx + 1}
                  </span>
                  <span className={stepTextClass}>{step}</span>
                </li>
              ))}
            </ol>

            {/* Benefit Statement */}
            <div className={`p-4 border-l-2 rounded-r text-sm leading-relaxed ${benefitBgClass}`}>
              <b className={`font-mono text-[10px] sm:text-xs tracking-wider uppercase block mb-1.5 ${benefitLabelClass}`}>
                Why it's traditionally done
              </b>
              <p className={stepTextClass}>{movement.benefit}</p>
            </div>

            {/* Breathing Indicator & Interaction Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-dashed border-paper-soft">
              
              {/* Interactive Breathing widget */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center flex-shrink-0 ${isInk ? 'border-jade-light' : 'border-jade'}`}>
                  {showActiveBreathing ? (
                    <motion.div 
                      className={`w-6 h-6 rounded-full ${isInk ? 'bg-jade-light' : 'bg-jade'}`}
                      animate={{
                        scale: isBreathingIn ? [0.55, 1] : [1, 0.55],
                        opacity: isBreathingIn ? [0.55, 1] : [1, 0.55],
                      }}
                      transition={{
                        duration: movement.breath / 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full opacity-30 ${isInk ? 'bg-jade-light' : 'bg-jade'}`} />
                  )}
                </div>
                <div>
                  <span className="font-mono text-xs tracking-wider block text-jade mb-0.5">
                    {showActiveBreathing ? `Repeat &bull; Rep ${currentRep} of ${movement.cycle}` : `Repeat &bull; ${movement.cycle} Reps`}
                  </span>
                  <p className="text-xs sm:text-sm text-ink-soft">
                    {showActiveBreathing ? (
                      <span className="font-bold flex items-center gap-1.5">
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`w-1.5 h-1.5 rounded-full ${isBreathingIn ? 'bg-green-500' : 'bg-blue-400'}`}
                        />
                        {breathStateText} ({movement.breath / 2}s phase)
                      </span>
                    ) : (
                      <span>{movement.breath}s breath cycle. Follow the rhythm.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Practice button */}
              <button
                onClick={onTogglePractice}
                className={`px-4 py-2.5 border font-mono text-[11px] sm:text-xs tracking-wider uppercase rounded cursor-pointer transition-all duration-300 flex items-center gap-2 ${
                  isPracticing
                    ? 'bg-cinnabar border-cinnabar text-paper hover:bg-cinnabar/90'
                    : isInk
                      ? 'border-brass text-brass hover:bg-brass hover:text-ink'
                      : 'border-jade text-jade hover:bg-jade hover:text-paper'
                }`}
              >
                {isPracticing ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Practice
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Practice Movement
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
