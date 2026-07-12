import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface HeroProps {
  onStartSession: () => void;
}

export default function Hero({ onStartSession }: HeroProps) {
  const scrollToIntro = () => {
    document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header id="top" className="relative min-h-screen bg-[radial-gradient(ellipse_at_50%_30%,var(--color-ink-2)_0%,var(--color-ink)_70%)] text-paper flex items-center justify-center overflow-hidden text-center p-6 sm:p-12 md:p-24 no-print">
      {/* Decorative circle with animated brush stroke ring effect using motion */}
      <div className="absolute inset-0 m-auto w-[min(70vw,640px)] h-[min(70vw,640px)] opacity-15 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <motion.circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke="var(--color-brass)"
            strokeWidth="3"
            initial={{ strokeDasharray: 1100, strokeDashoffset: 1100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 4.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-2xl px-4 flex flex-col items-center">
        <motion.span
          className="font-mono text-[10px] sm:text-xs tracking-[0.28em] text-jade-light uppercase mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          A Beginner's Path Into
        </motion.span>
        
        <motion.h1
          className="font-cjk font-bold text-6xl sm:text-7xl md:text-8xl leading-none text-paper drop-shadow"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          八段錦
        </motion.h1>

        <motion.div
          className="font-serif font-medium text-xl sm:text-2xl md:text-3xl text-jade-light mt-4 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Baduanjin — The Eight Pieces of Brocade
        </motion.div>

        <motion.p
          className="mt-6 text-sm sm:text-base leading-relaxed text-[#C8C3B4] font-light max-w-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          Eight gentle, repeatable movements, refined over roughly eight centuries of practice, woven together like a piece of brocade — each thread simple, the whole cloth strong. No mat, no equipment, ten minutes a day.
        </motion.p>

        <motion.div
          className="mt-8 sm:mt-10 flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <button
            onClick={scrollToIntro}
            className="px-6 py-3 border border-brass text-paper font-mono text-xs sm:text-sm tracking-widest uppercase hover:bg-brass hover:text-ink transition-all duration-300 rounded cursor-pointer"
          >
            Explore Movements &rarr;
          </button>
          <button
            onClick={onStartSession}
            className="px-6 py-3 bg-jade hover:bg-[#345a4d] text-paper font-mono text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2 transition-all duration-300 rounded cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Start Session
          </button>
        </motion.div>
      </div>

      {/* Scroll Cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest text-jade-light uppercase opacity-75 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span>Scroll</span>
        <motion.div
          className="w-[1px] bg-jade-light mt-2"
          initial={{ height: 0 }}
          animate={{ height: 34 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        />
      </motion.div>
    </header>
  );
}
