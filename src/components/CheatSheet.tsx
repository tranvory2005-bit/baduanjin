import { movements } from '../data/movements';

export default function CheatSheet() {
  const totalReps = movements.reduce((sum, m) => sum + m.cycle, 0);
  const totalSeconds = movements.reduce((sum, m) => sum + m.cycle * m.breath, 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  return (
    <div id="cheatsheet" className="hidden print:block bg-white text-black p-4 font-sans text-xs w-full">
      <div className="flex justify-between items-baseline border-b-2 border-black pb-2 mb-4">
        <h2 className="font-serif font-bold text-2xl">八段錦 &bull; Baduanjin Quick Reference</h2>
        <span className="font-mono text-[10px] text-gray-700">
          PRACTICE IN ORDER &bull; {totalReps} TOTAL REPS &bull; ~{totalMinutes} MIN
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {movements.map((m) => (
          <div key={m.id} className="border border-black p-3 flex gap-3 items-start">
            <div className="font-cjk font-bold text-base w-6 h-6 border-1.5 border-black rounded flex items-center justify-center flex-shrink-0">
              {m.num}
            </div>
            <div>
              <div className="font-cjk text-sm font-bold">{m.cjk}</div>
              <div className="text-[10px] italic text-gray-600">{m.pinyin}</div>
              <div className="text-[10px] font-semibold mt-0.5">{m.en}</div>
              <div className="text-[10px] leading-relaxed mt-1 text-gray-800">{m.cue}</div>
              <div className="font-mono text-[9px] mt-1.5 text-gray-600">
                &times; {m.cycle} reps &bull; {m.breath}s per breath
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-3 border-t border-black text-[9px] text-gray-600 flex justify-between gap-4 leading-normal">
        <span>Root the feet &bull; breathe through the nose &bull; soften the joints &bull; move slower than feels needed.</span>
        <span>Consult a doctor before starting if recovering from injury, pregnant, or managing a chronic condition.</span>
      </div>
    </div>
  );
}
