import { motion } from 'motion/react';
import { Compass, Wind, Layers, Sliders } from 'lucide-react';

export default function Principles() {
  const items = [
    {
      icon: <Compass className="w-5 h-5 text-brass" />,
      title: "Root the feet",
      desc: "Stand with feet hip-width, weight even across both soles. This is where every movement's stability comes from."
    },
    {
      icon: <Wind className="w-5 h-5 text-brass" />,
      title: "Breathe through nose",
      desc: "In and out through the nose, low into the belly rather than the chest, unless a step says otherwise."
    },
    {
      icon: <Layers className="w-5 h-5 text-brass" />,
      title: "Soften the joints",
      desc: "Knees, elbows, and the jaw stay slightly unlocked. Tension in one place shows up as strain elsewhere."
    },
    {
      icon: <Sliders className="w-5 h-5 text-brass" />,
      title: "Move slower than needed",
      desc: "There is no tempo to keep. Half-speed is closer to correct than full-speed for almost every step here."
    }
  ];

  return (
    <section id="principles" className="py-24 bg-ink text-paper relative no-print">
      <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
        
        <div className="text-center mb-16">
          <span className="font-mono text-xs tracking-[0.22em] text-brass uppercase mb-3 block">
            Before Every Session
          </span>
          <motion.h2 
            className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl leading-tight max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Four things to check before you move
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              className="bg-ink-2 p-6 sm:p-8 rounded-lg border border-[#3a4038] hover:border-brass/35 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="w-10 h-10 rounded bg-[#2D352F] flex items-center justify-center mb-5 border border-[#3e4841]">
                {item.icon}
              </div>
              <h4 className="font-serif font-bold text-lg mb-3 text-paper">
                {item.title}
              </h4>
              <p className="text-xs sm:text-sm text-paper-soft leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
