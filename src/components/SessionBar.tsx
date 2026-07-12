import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Square, Music } from 'lucide-react';

interface SessionBarProps {
  isVisible: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  isMusicOn: boolean;
  currentTitle: string;
  currentSubtitle: string;
  elapsedTime: number;
  totalTime: number;
  onPrev: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onStop: () => void;
}

export default function SessionBar({
  isVisible,
  isPlaying,
  isMuted,
  isMusicOn,
  currentTitle,
  currentSubtitle,
  elapsedTime,
  totalTime,
  onPrev,
  onPlayPause,
  onNext,
  onToggleMute,
  onToggleMusic,
  onStop
}: SessionBarProps) {
  
  const mmss = (totalSeconds: number) => {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const progressPercentage = Math.min(100, (elapsedTime / totalTime) * 100);

  if (!isVisible) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 bg-ink text-paper border-t border-brass shadow-2xl no-print">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 height-[2px] bg-cinnabar transition-all duration-300 h-[2px]" style={{ width: `${progressPercentage}%` }} />
      
      <div className="max-w-[1080px] mx-auto px-6 h-18 flex items-center justify-between gap-4">
        
        {/* Label (Title & Reps) */}
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-semibold truncate text-paper">
            {currentTitle}
          </div>
          <div className="text-[10px] sm:text-xs font-mono text-jade-light mt-0.5" dangerouslySetInnerHTML={{ __html: currentSubtitle }} />
        </div>

        {/* Time Readout */}
        <div className="font-mono text-xs sm:text-sm text-paper-soft whitespace-nowrap px-2">
          {mmss(elapsedTime)} / {mmss(totalTime)}
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={onPrev}
            className="w-9 h-9 rounded-full border border-[#3a4038] hover:border-brass hover:text-brass flex items-center justify-center transition-all cursor-pointer text-paper"
            title="Previous Movement"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button 
            onClick={onPlayPause}
            className="w-11 h-11 rounded-full border-2 border-brass text-brass hover:bg-brass hover:text-ink flex items-center justify-center transition-all cursor-pointer font-bold"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
          </button>

          <button 
            onClick={onNext}
            className="w-9 h-9 rounded-full border border-[#3a4038] hover:border-brass hover:text-brass flex items-center justify-center transition-all cursor-pointer text-paper"
            title="Next Movement"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button 
            onClick={onToggleMute}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isMuted 
                ? 'border-cinnabar text-cinnabar bg-cinnabar/10 hover:bg-cinnabar/20' 
                : 'border-[#3a4038] hover:border-brass hover:text-brass text-paper'
            }`}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <button 
            onClick={onToggleMusic}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isMusicOn 
                ? 'border-jade text-jade bg-jade/10 hover:bg-jade/20' 
                : 'border-[#3a4038] hover:border-brass hover:text-brass text-paper'
            }`}
            title={isMusicOn ? "Mute Ambient Music" : "Play Ambient Music"}
          >
            <Music className="w-4 h-4" />
          </button>

          <button 
            onClick={onStop}
            className="w-9 h-9 rounded-full border border-cinnabar hover:bg-cinnabar hover:text-paper text-cinnabar flex items-center justify-center transition-all cursor-pointer"
            title="End Session"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>

      </div>
    </div>
  );
}
