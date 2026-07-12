import { motion } from 'motion/react';
import { Play, Printer, Heart } from 'lucide-react';

interface IntroProps {
  onStartSession: () => void;
  onPrintCheatSheet: () => void;
}

export default function Intro({ onStartSession, onPrintCheatSheet }: IntroProps) {
  return (
    <section id="intro" className="py-20 bg-paper text-ink border-b border-paper-soft no-print">
      <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
        
        <div className="mb-12">
          <span className="font-mono text-xs tracking-[0.22em] text-jade uppercase mb-3 block">
            Before You Begin
          </span>
          <motion.h2 
            className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl leading-tight max-w-3xl"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            A short set, a long history — and a way of breathing that does most of the work.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: What is this */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-between"
          >
            <div>
              <h3 className="font-serif font-semibold text-xl sm:text-2xl mb-4 text-ink-2">
                What this practice is
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-ink-soft mb-6">
                Baduanjin is a form of qigong (气功) — a family of Chinese practices that pair slow movement with steady breath. Practitioners trace it back to the Song dynasty, and over the centuries it settled into the eight-movement sequence taught here. It was designed to be practiced by ordinary people, not martial specialists: soldiers, scholars, and elders alike used it to stay limber and to recover from illness. Unlike Taiji's flowing forms, each of the eight movements is closer to a held stretch, repeated a set number of times before moving to the next.
              </p>
            </div>
            
            <div className="p-5 border-l-2 border-jade bg-jade/5 rounded-r">
              <span className="font-mono text-xs uppercase text-jade tracking-wider font-semibold flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-jade" /> Low Impact, High Reward
              </span>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                By focusing on deep diaphragm breathing coupled with soft stretching, you stimulate internal organs, realign your posture, and clear residual mental tension.
              </p>
            </div>
          </motion.div>

          {/* Right Column: How to use & Breathing Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-serif font-semibold text-xl sm:text-2xl mb-4 text-ink-2">
                How to use this guide
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-ink-soft">
                Work through the eight movements in order — the sequence itself matters, moving from the torso and organs down to the joints and the whole body. For each one you'll find the traditional Chinese name, plain-English steps, and a dedicated breathing indicator: expand your inhale as it grows, release your exhale as it falls. Most movements are repeated 6–8 times. Move slower than feels necessary. If a step ever asks for more than feels comfortable, do less of it.
              </p>
            </div>

            {/* Breathing demonstration widget */}
            <div className="flex items-center gap-5 p-4 border border-paper-soft rounded bg-black/5">
              <div className="w-16 h-16 rounded-full border border-jade flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-jade breath-breathe-animation" />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-mono block text-[10px] text-jade font-semibold uppercase tracking-widest mb-1">
                  Inhale &bull; Exhale
                </span>
                Follow the circle — expand on the in-breath, settle on the out-breath. Everything else follows this rhythm.
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onStartSession}
                className="px-5 py-3 bg-jade hover:bg-[#345a4d] text-paper font-mono text-xs tracking-wider uppercase flex items-center gap-2 rounded transition-all duration-200 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Guided Session
              </button>
              <button
                onClick={onPrintCheatSheet}
                className="px-5 py-3 border border-cinnabar text-cinnabar hover:bg-cinnabar hover:text-paper font-mono text-xs tracking-wider uppercase flex items-center gap-2 rounded transition-all duration-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Cheat Sheet
              </button>
            </div>
          </motion.div>
        </div>

        {/* Video demonstration at the bottom of Intro */}
        <motion.div
          className="mt-16 pt-12 border-t border-paper-soft grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="lg:col-span-6 space-y-4 w-full">
            <div className="border border-[#E2DBC8] p-3 rounded-lg overflow-hidden bg-black/10 shadow-md">
              <div className="relative w-full h-[450px] sm:h-[550px] md:h-[650px] lg:h-[720px] rounded overflow-hidden bg-black/40">
                <iframe
                  className="absolute inset-0 w-full h-full object-cover z-0 scale-[1.05]"
                  src="https://www.youtube.com/embed/ifZX3tSiBzI?start=15&autoplay=0&mute=1&loop=1&playlist=ifZX3tSiBzI"
                  title="Baduanjin full sequence preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
                {/* Visual Overlay indicator */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded text-white tracking-widest uppercase z-10 pointer-events-none">
                  Full Demo Video
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-center h-full lg:pt-8">
            <span className="font-mono text-xs text-jade font-semibold tracking-wider uppercase">
              Full Sequence Preview
            </span>
            <h4 className="font-serif font-bold text-2xl sm:text-3xl text-ink-2">
              The Standard 12-Minute Health Qigong Set
            </h4>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
              Watching a real person move helps more than any diagram. This standard demonstration shows the complete sequence at a natural, meditative pace. In each movement section below, we have replaced the schematic skeletal animations with a real video loop clipped directly to each specific movement so you can focus on mastering the exact form and flow.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
