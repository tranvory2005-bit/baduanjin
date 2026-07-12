import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Printer, Download } from 'lucide-react';
import Hero from './components/Hero';
import Intro from './components/Intro';
import MovementCard from './components/MovementCard';
import Principles from './components/Principles';
import SessionBar from './components/SessionBar';
import CheatSheet from './components/CheatSheet';
import { movements } from './data/movements';

export default function App() {
  // Session / Practice Player States
  const [sessionMode, setSessionMode] = useState<'full' | 'single' | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [isBreathingIn, setIsBreathingIn] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [activeNavSection, setActiveNavSection] = useState<string>('top');
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);

  // Timer reference & Web Audio refs
  const timersRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{
    lowOsc1: OscillatorNode;
    lowOsc2: OscillatorNode;
    highOsc1: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null>(null);

  // Synchronized refs for safe async access (prevents closure stale-state bugs)
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);
  const currentIdxRef = useRef(currentIdx);
  const currentRepRef = useRef(currentRep);
  const sessionModeRef = useRef(sessionMode);
  const isBreathingInRef = useRef(isBreathingIn);
  const isMusicEnabledRef = useRef(isMusicEnabled);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { currentRepRef.current = currentRep; }, [currentRep]);
  useEffect(() => { sessionModeRef.current = sessionMode; }, [sessionMode]);
  useEffect(() => { isBreathingInRef.current = isBreathingIn; }, [isBreathingIn]);
  useEffect(() => { isMusicEnabledRef.current = isMusicEnabled; }, [isMusicEnabled]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Web Audio Context initialization
  const ensureAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        audioCtxRef.current = new AC();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Modulate ambient filter and gain in real-time to simulate inhalation and exhalation
  const modulateAmbientMusic = useCallback((isInhale: boolean) => {
    const nodes = musicNodesRef.current;
    if (!nodes) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const t = ctx.currentTime;
    const currentM = movements[currentIdxRef.current];
    const duration = currentM ? (currentM.breath / 2) : 4.0;

    nodes.filter.frequency.cancelScheduledValues(t);
    nodes.gain.gain.cancelScheduledValues(t);

    if (isInhale) {
      // Inhale: filter opens, volume swells gently representing drawing breath
      nodes.filter.frequency.exponentialRampToValueAtTime(360, t + duration);
      nodes.gain.gain.linearRampToValueAtTime(0.06, t + duration);
    } else {
      // Exhale: filter closes, volume calms down representing grounding
      nodes.filter.frequency.exponentialRampToValueAtTime(180, t + duration);
      nodes.gain.gain.linearRampToValueAtTime(0.02, t + duration);
    }
  }, []);

  // Real-time procedurally synthesized Zen music engine using Web Audio API
  const startAmbientMusic = useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    if (musicNodesRef.current) {
      return; // Already playing
    }

    try {
      const lowOsc1 = ctx.createOscillator();
      const lowOsc2 = ctx.createOscillator();
      const highOsc1 = ctx.createOscillator();
      
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Configure soft, warm low/mid oscillators
      lowOsc1.type = 'triangle';
      lowOsc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 low drone
      
      lowOsc2.type = 'sine';
      lowOsc2.frequency.setValueAtTime(98.00, ctx.currentTime); // G2 fifth drone

      highOsc1.type = 'sine';
      highOsc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 octave warmth

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      // Low volume to sit beautifully in the background
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      lowOsc1.connect(filter);
      lowOsc2.connect(filter);
      highOsc1.connect(filter);
      
      filter.connect(gain);
      gain.connect(ctx.destination);

      lowOsc1.start();
      lowOsc2.start();
      highOsc1.start();

      musicNodesRef.current = {
        lowOsc1,
        lowOsc2,
        highOsc1,
        filter,
        gain
      };

      // Modulate initially based on current breath state
      modulateAmbientMusic(isBreathingInRef.current);
    } catch (e) {
      console.warn("Failed to synthesize ambient music:", e);
    }
  }, [modulateAmbientMusic]);

  const stopAmbientMusic = useCallback(() => {
    if (musicNodesRef.current) {
      try {
        musicNodesRef.current.lowOsc1.stop();
        musicNodesRef.current.lowOsc2.stop();
        musicNodesRef.current.highOsc1.stop();
        musicNodesRef.current.lowOsc1.disconnect();
        musicNodesRef.current.lowOsc2.disconnect();
        musicNodesRef.current.highOsc1.disconnect();
        musicNodesRef.current.filter.disconnect();
        musicNodesRef.current.gain.disconnect();
      } catch (e) {
        // already stopped
      }
      musicNodesRef.current = null;
    }
  }, []);

  // Manage procedural background ambient music reactive flow
  useEffect(() => {
    if (isPlaying && isMusicEnabled) {
      startAmbientMusic();
    } else {
      stopAmbientMusic();
    }
    return () => {
      stopAmbientMusic();
    };
  }, [isPlaying, isMusicEnabled, startAmbientMusic, stopAmbientMusic]);

  // Synchronize dynamic breath modulation with the music soundscape
  useEffect(() => {
    if (isPlaying && isMusicEnabled) {
      modulateAmbientMusic(isBreathingIn);
    }
  }, [isBreathingIn, isPlaying, isMusicEnabled, modulateAmbientMusic]);

  // Pure sinus calming chimes (Disabled to remove background "ding" sound)
  const chime = useCallback((freq: number) => {
    // No-op to remove background chimes
  }, []);

  // Speech cues
  const speak = useCallback((text: string) => {
    if (isMutedRef.current) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    synth.speak(utterance);
  }, []);

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  // Main Breathing cycle logic loop
  const runRep = useCallback((idx: number, rep: number, isStartingWithInhale: boolean) => {
    if (!isPlayingRef.current) return;

    const m = movements[idx];
    const halfDuration = (m.breath / 2) * 1000;

    setCurrentRep(rep);
    setIsBreathingIn(isStartingWithInhale);

    if (isStartingWithInhale) {
      if (m.steps && rep - 1 < m.steps.length) {
        speak(m.steps[rep - 1]);
      } else {
        speak('Inhale');
      }
    } else {
      if (m.steps && rep - 1 < m.steps.length) {
        // Keep silent during exhale to allow the long step description to complete playing
      } else {
        speak('Exhale');
      }
    }
    chime(isStartingWithInhale ? 660 : 440);

    const t = window.setTimeout(() => {
      if (!isPlayingRef.current) return;

      if (isStartingWithInhale) {
        // Transition to Exhale phase of same rep
        runRep(idx, rep, false);
      } else {
        // Exhale completed! Check if movement is completed
        if (rep >= m.cycle) {
          if (sessionModeRef.current === 'full') {
            const nextIdx = idx + 1;
            if (nextIdx < movements.length) {
              startMovement(nextIdx);
            } else {
              stopSession('Session complete. Well done.');
            }
          } else {
            stopSession('Practice complete. Well done.');
          }
        } else {
          // Move to next rep Inhale
          runRep(idx, rep + 1, true);
        }
      }
    }, halfDuration);

    timersRef.current.push(t);
  }, [speak, chime]);

  // Transition to a movement
  const startMovement = useCallback((idx: number) => {
    clearAllTimers();
    setCurrentIdx(idx);
    setCurrentRep(1);
    setIsBreathingIn(true);

    const m = movements[idx];

    // Smooth scroll to card
    const element = document.getElementById(m.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Announce movement
    speak(`${m.num}. ${m.en}`);
    chime(520);

    const t = window.setTimeout(() => {
      if (!isPlayingRef.current) return;
      runRep(idx, 1, true);
    }, 3800);

    timersRef.current.push(t);
  }, [speak, chime, runRep]);

  // End guided session or practice
  const stopSession = useCallback((announcement?: string) => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setSessionMode(null);
    clearAllTimers();
    window.speechSynthesis?.cancel();
    if (announcement) {
      speak(announcement);
    }
  }, [speak]);

  // Start the Full guided 8-movement session
  const startFullSession = () => {
    ensureAudioCtx();
    stopSession();
    
    // Set state
    setSessionMode('full');
    setIsPlaying(true);
    isPlayingRef.current = true;
    setElapsedTime(0);

    // Scroll directly to first movement and boot the queue
    setTimeout(() => {
      startMovement(0);
    }, 100);
  };

  // Practice a single movement
  const handleTogglePractice = (idx: number) => {
    ensureAudioCtx();
    if (sessionMode === 'single' && currentIdx === idx && isPlaying) {
      stopSession();
    } else {
      stopSession();
      setSessionMode('single');
      setIsPlaying(true);
      isPlayingRef.current = true;
      setCurrentIdx(idx);
      
      setTimeout(() => {
        startMovement(idx);
      }, 100);
    }
  };

  // Play / Pause toggler
  const handlePlayPause = () => {
    if (!isPlaying) {
      ensureAudioCtx();
      setIsPlaying(true);
      isPlayingRef.current = true;
      
      // Resume current breathing phase
      runRep(currentIdx, currentRep, isBreathingIn);
    } else {
      setIsPlaying(false);
      isPlayingRef.current = false;
      clearAllTimers();
      window.speechSynthesis?.cancel();
    }
  };

  const handlePrev = () => {
    if (sessionMode !== 'full') return;
    const prevIdx = Math.max(0, currentIdx - 1);
    setIsPlaying(true);
    isPlayingRef.current = true;
    startMovement(prevIdx);
  };

  const handleNext = () => {
    if (sessionMode !== 'full') return;
    const nextIdx = currentIdx + 1;
    if (nextIdx < movements.length) {
      setIsPlaying(true);
      isPlayingRef.current = true;
      startMovement(nextIdx);
    } else {
      stopSession('Session complete. Well done.');
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      window.speechSynthesis?.cancel();
    }
  };

  const triggerIframePrint = useCallback(() => {
    const totalReps = movements.reduce((sum, m) => sum + m.cycle, 0);
    const totalSeconds = movements.reduce((sum, m) => sum + m.cycle * m.breath, 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const movementsHtml = movements.map(m => `
      <div class="card">
        <div class="number">${m.num}</div>
        <div class="card-content">
          <div class="header-row">
            <span class="cjk">${m.cjk}</span>
            <span class="pinyin">${m.pinyin}</span>
          </div>
          <div class="english">${m.en}</div>
          <p class="cue">"${m.cue}"</p>
          <div class="stats-row">
            <span>${m.cycle} Repetitions</span>
            <span>${m.breath}s Breath Cycle</span>
          </div>
        </div>
      </div>
    `).join('');

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baduanjin Qi Gong Quick Reference Cheat Sheet</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Noto+Serif+SC:wght@400;700&family=Libre+Franklin:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      
      body {
        font-family: "Libre Franklin", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #fcfbfa;
        color: #1b211d;
        padding: 40px 24px;
        margin: 0;
        max-width: 900px;
        margin: 0 auto;
      }
      
      header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 2px solid #1b211d;
        padding-bottom: 12px;
        margin-bottom: 24px;
      }

      h1 {
        font-family: "Fraunces", Georgia, serif;
        font-size: 26px;
        font-weight: 700;
        margin: 0;
      }

      .subtitle {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: #4a4f45;
        letter-spacing: 0.05em;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      @media (max-width: 680px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        border: 1px solid #cfc9b6;
        border-radius: 6px;
        padding: 16px;
        background-color: #ffffff;
        display: flex;
        gap: 16px;
        align-items: start;
        page-break-inside: avoid;
      }

      .number {
        font-family: "Noto Serif SC", serif;
        font-size: 16px;
        font-weight: 700;
        width: 30px;
        height: 30px;
        border: 2px solid #3f6b5c;
        color: #3f6b5c;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-color: #fcfbfa;
      }

      .card-content {
        flex: 1;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
      }

      .cjk {
        font-family: "Noto Serif SC", serif;
        font-size: 16px;
        font-weight: 700;
      }

      .pinyin {
        font-size: 11px;
        font-weight: 600;
        color: #3f6b5c;
        letter-spacing: 0.02em;
      }

      .english {
        font-family: "Fraunces", Georgia, serif;
        font-size: 13px;
        font-weight: 600;
        margin-top: 4px;
        color: #1b211d;
      }

      .cue {
        font-size: 12px;
        line-height: 1.5;
        margin: 8px 0;
        color: #4a4f45;
        font-style: italic;
        background: #fbf9f5;
        padding: 8px 12px;
        border-radius: 4px;
        border-left: 3px solid #cfc9b6;
      }

      .stats-row {
        display: flex;
        justify-content: space-between;
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        color: #5c6257;
        border-top: 1px dashed #cfc9b6;
        padding-top: 8px;
        margin-top: 8px;
      }

      footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #cfc9b6;
        font-size: 11px;
        line-height: 1.6;
        color: #5c6257;
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }

      .footer-col {
        flex: 1;
      }

      @media print {
        body {
          padding: 0;
          background-color: white;
        }
        .card {
          border-color: #1b211d;
          background-color: white;
        }
        .cue {
          background-color: #fcfcfc;
          border-left-color: #1b211d;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>八段錦 &bull; Baduanjin Quick Reference</h1>
      <div class="subtitle">
        PRACTICE ORDER &bull; ${totalReps} REPS &bull; ~${totalMinutes} MIN
      </div>
    </header>

    <div class="grid">
      ${movementsHtml}
    </div>

    <footer>
      <div class="footer-col">
        <strong>Practice Principles:</strong> Root your feet, gently tuck your tailbone, soften all joints, and coordinate each movement with slow, natural diaphragmatic breaths. Move slower than you think you need to.
      </div>
      <div class="footer-col" style="text-align: right;">
        <strong>Safety Advisory:</strong> Never strain or force any breath or pose. If you feel dizzy or experience discomfort, stop immediately and rest.
      </div>
    </footer>

    <script>
      window.onload = function() {
        window.focus();
        setTimeout(function() {
          window.print();
        }, 300);
      };
    </script>
  </body>
</html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
      } else {
        throw new Error('Popup blocked');
      }
    } catch (e) {
      console.warn("Popup blocked or failed, falling back to direct window.print", e);
      window.print();
    }
  }, []);

  const handleDownloadHtmlCheatSheet = useCallback(() => {
    const totalReps = movements.reduce((sum, m) => sum + m.cycle, 0);
    const totalSeconds = movements.reduce((sum, m) => sum + m.cycle * m.breath, 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const movementsHtml = movements.map(m => `
      <div class="card">
        <div class="number">${m.num}</div>
        <div class="card-content">
          <div class="header-row">
            <span class="cjk">${m.cjk}</span>
            <span class="pinyin">${m.pinyin}</span>
          </div>
          <div class="english">${m.en}</div>
          <p class="cue">"${m.cue}"</p>
          <div class="stats-row">
            <span>${m.cycle} Repetitions</span>
            <span>${m.breath}s Breath Cycle</span>
          </div>
        </div>
      </div>
    `).join('');

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baduanjin Qi Gong Quick Reference Cheat Sheet</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Noto+Serif+SC:wght@400;700&family=Libre+Franklin:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      
      body {
        font-family: "Libre Franklin", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #fcfbfa;
        color: #1b211d;
        padding: 40px 24px;
        margin: 0;
        max-width: 900px;
        margin: 0 auto;
      }
      
      .no-print-area {
        display: flex;
        gap: 12px;
        margin-bottom: 32px;
        align-items: center;
        background: #f3efe6;
        padding: 16px 20px;
        border-radius: 8px;
        border: 1px solid #cfc9b6;
      }
      
      .info-text {
        font-size: 13px;
        color: #4a4f45;
        flex: 1;
        line-height: 1.5;
        margin: 0;
      }

      .btn {
        padding: 10px 20px;
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid #3f6b5c;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .btn-primary {
        background-color: #3f6b5c;
        color: #fcfbfa;
      }
      
      .btn-primary:hover {
        background-color: #2e5145;
        border-color: #2e5145;
      }

      .btn-secondary {
        background-color: transparent;
        color: #3f6b5c;
      }
      
      .btn-secondary:hover {
        background-color: rgba(63, 107, 92, 0.1);
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 2px solid #1b211d;
        padding-bottom: 12px;
        margin-bottom: 24px;
      }

      h1 {
        font-family: "Fraunces", Georgia, serif;
        font-size: 26px;
        font-weight: 700;
        margin: 0;
      }

      .subtitle {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: #4a4f45;
        letter-spacing: 0.05em;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      @media (max-width: 680px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        border: 1px solid #cfc9b6;
        border-radius: 6px;
        padding: 16px;
        background-color: #ffffff;
        display: flex;
        gap: 16px;
        align-items: start;
        page-break-inside: avoid;
      }

      .number {
        font-family: "Noto Serif SC", serif;
        font-size: 16px;
        font-weight: 700;
        width: 30px;
        height: 30px;
        border: 2px solid #3f6b5c;
        color: #3f6b5c;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-color: #fcfbfa;
      }

      .card-content {
        flex: 1;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
      }

      .cjk {
        font-family: "Noto Serif SC", serif;
        font-size: 16px;
        font-weight: 700;
      }

      .pinyin {
        font-size: 11px;
        font-weight: 600;
        color: #3f6b5c;
        letter-spacing: 0.02em;
      }

      .english {
        font-family: "Fraunces", Georgia, serif;
        font-size: 13px;
        font-weight: 600;
        margin-top: 4px;
        color: #1b211d;
      }

      .cue {
        font-size: 12px;
        line-height: 1.5;
        margin: 8px 0;
        color: #4a4f45;
        font-style: italic;
        background: #fbf9f5;
        padding: 8px 12px;
        border-radius: 4px;
        border-left: 3px solid #cfc9b6;
      }

      .stats-row {
        display: flex;
        justify-content: space-between;
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        color: #5c6257;
        border-top: 1px dashed #cfc9b6;
        padding-top: 8px;
        margin-top: 8px;
      }

      footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #cfc9b6;
        font-size: 11px;
        line-height: 1.6;
        color: #5c6257;
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }

      .footer-col {
        flex: 1;
      }

      @media print {
        .no-print-area {
          display: none !important;
        }
        body {
          padding: 0;
          background-color: white;
        }
        .card {
          border-color: #1b211d;
          background-color: white;
        }
        .cue {
          background-color: #fcfcfc;
          border-left-color: #1b211d;
        }
      }
    </style>
  </head>
  <body>
    <div class="no-print-area">
      <p class="info-text">
        <strong>Print-Ready Helper:</strong> Since this app runs inside a secure workspace preview, your browser may block direct print commands. Click the <strong>Print Card</strong> button below to open your system's print dialog, or use the browser's standard print menu (Cmd+P / Ctrl+P) on this page!
      </p>
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: -1px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Card
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close Page
      </button>
    </div>

    <header>
      <h1>八段錦 &bull; Baduanjin Quick Reference</h1>
      <div class="subtitle">
        PRACTICE ORDER &bull; ${totalReps} REPS &bull; ~${totalMinutes} MIN
      </div>
    </header>

    <div class="grid">
      ${movementsHtml}
    </div>

    <footer>
      <div class="footer-col">
        <strong>Practice Principles:</strong> Root your feet, gently tuck your tailbone, soften all joints, and coordinate each movement with slow, natural diaphragmatic breaths. Move slower than you think you need to.
      </div>
      <div class="footer-col" style="text-align: right;">
        <strong>Safety Advisory:</strong> Never strain or force any breath or pose. If you feel dizzy or experience discomfort, stop immediately and rest.
      </div>
    </footer>
  </body>
</html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'baduanjin-cheatsheet.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handlePrintCheatSheet = () => {
    setIsCheatSheetOpen(true);
    setTimeout(() => {
      triggerIframePrint();
    }, 150);
  };

  // Scrollspy to update dot navigation rail
  useEffect(() => {
    const sections = ['top', 'intro', ...movements.map(m => m.id), 'principles'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveNavSection(id);
          }
        });
      }, { threshold: 0.35 });
      observer.observe(el);
      return { el, observer };
    });

    return () => {
      observers.forEach(obs => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  // Close cheatsheet on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCheatSheetOpen(false);
      }
    };
    if (isCheatSheetOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCheatSheetOpen]);

  // Time elapsed ticker (for full-session mode)
  useEffect(() => {
    let interval: number;
    if (sessionMode === 'full' && isPlaying) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionMode, isPlaying]);

  const totalSessionSeconds = movements.reduce((sum, m) => sum + m.cycle * m.breath, 0);
  const activeMovement = movements[currentIdx];

  // Prepare label details for SessionBar
  const barSubtitle = sessionMode === 'full' 
    ? `Rep ${currentRep} of ${activeMovement.cycle} &bull; Movement ${currentIdx + 1} of ${movements.length}`
    : `Single Practice Mode &bull; Rep ${currentRep} of ${activeMovement.cycle}`;

  return (
    <div className="bg-paper text-ink min-h-screen relative font-sans antialiased selection:bg-jade-light/20 selection:text-jade">
      
      {/* Desktop vertical dot navigation rail */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden lg:flex no-print" aria-label="Vertical Navigation">
        {[
          { id: 'top', label: 'Top' },
          { id: 'intro', label: 'Intro' },
          ...movements.map(m => ({ id: m.id, label: m.num })),
          { id: 'principles', label: 'Checklist' }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`w-2.5 h-2.5 rounded-full border border-jade bg-transparent p-0 cursor-pointer transition-all duration-300 hover:scale-125 hover:bg-jade ${
              activeNavSection === section.id 
                ? 'bg-cinnabar border-cinnabar scale-125' 
                : 'hover:border-cinnabar'
            }`}
            title={section.label}
            aria-label={`Scroll to ${section.label}`}
          />
        ))}
      </nav>

      {/* Main Sections */}
      <Hero onStartSession={startFullSession} />
      
      <Intro 
        onStartSession={startFullSession} 
        onPrintCheatSheet={handlePrintCheatSheet} 
      />

      {/* Movements Container */}
      <div id="movements-container">
        {movements.map((m, idx) => (
          <MovementCard
            key={m.id}
            movement={m}
            isActive={sessionMode === 'full' && currentIdx === idx && isPlaying}
            currentRep={currentIdx === idx ? currentRep : 1}
            isBreathingIn={currentIdx === idx ? isBreathingIn : true}
            isPracticing={sessionMode === 'single' && currentIdx === idx && isPlaying}
            onTogglePractice={() => handleTogglePractice(idx)}
          />
        ))}
      </div>

      <Principles />

      {/* FOOTER */}
      <footer className="bg-paper-2 py-20 border-t border-paper-soft no-print">
        <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-xl text-xs sm:text-sm leading-relaxed text-ink-soft">
              <strong className="block text-sm font-bold text-ink mb-3 uppercase tracking-wider">A note on safety</strong>
              Baduanjin is low-impact and widely practiced by older adults, but it is still physical exercise. If you're recovering from an injury, managing a chronic condition, or pregnant, check with a doctor or physical therapist before starting, and stop any movement that causes pain — mild muscle fatigue is normal, sharp pain is not.
            </div>
            <div className="text-right flex flex-col justify-end">
              <span className="font-cjk text-4xl text-jade leading-none font-bold">錦</span>
              <span className="font-mono text-[10px] text-ink-soft tracking-wider mt-2 block">
                brocade, woven whole
              </span>
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#CFC9B6] to-transparent my-10" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8A8570]">
            <span>A self-guided introduction to Baduanjin qigong</span>
            <span>Eight movements &bull; practiced in order &bull; ten minutes a day</span>
          </div>
        </div>
      </footer>

      {/* Bottom Session Player Controls */}
      <SessionBar
        isVisible={sessionMode !== null}
        isPlaying={isPlaying}
        isMuted={isMuted}
        isMusicOn={isMusicEnabled}
        currentTitle={`${activeMovement?.num}. ${activeMovement?.en}`}
        currentSubtitle={barSubtitle}
        elapsedTime={elapsedTime}
        totalTime={totalSessionSeconds}
        onPrev={handlePrev}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onToggleMute={handleToggleMute}
        onToggleMusic={() => setIsMusicEnabled(prev => !prev)}
        onStop={() => stopSession()}
      />

      {/* Hidden printable Cheat Sheet */}
      <CheatSheet />

      {/* Interactive Modal Cheat Sheet */}
      {isCheatSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print animate-fade-in">
          <div className="bg-[#EDE7D8] text-[#1B211D] max-w-[900px] w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl border border-[#CFC9B6] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#CFC9B6] bg-[#E4DCC7]">
              <div className="flex items-center gap-3">
                <span className="font-cjk text-2xl text-jade font-bold">錦</span>
                <div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-ink-2">
                    Baduanjin Quick Reference
                  </h3>
                  <p className="text-[10px] sm:text-xs font-mono text-ink-soft tracking-wider mt-0.5">
                    PRACTICE SEQUENCE &bull; {movements.reduce((sum, m) => sum + m.cycle, 0)} TOTAL REPS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerIframePrint}
                  className="px-3 py-1.5 border border-jade text-jade hover:bg-jade hover:text-paper font-mono text-[10px] sm:text-xs tracking-wider uppercase flex items-center gap-2 rounded transition-all duration-200 cursor-pointer"
                  title="Print Reference Card (Browser Print)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleDownloadHtmlCheatSheet}
                  className="px-3 py-1.5 border border-[#3F6B5C] bg-[#3F6B5C]/10 text-[#3F6B5C] hover:bg-[#3F6B5C] hover:text-paper font-mono text-[10px] sm:text-xs tracking-wider uppercase flex items-center gap-2 rounded transition-all duration-200 cursor-pointer"
                  title="Download premium print-ready HTML file (100% reliable)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Offline HTML</span>
                </button>
                <button
                  onClick={() => setIsCheatSheetOpen(false)}
                  className="w-8 h-8 sm:w-9 h-9 border border-[#CFC9B6] hover:border-cinnabar hover:text-cinnabar rounded-full flex items-center justify-center transition-all cursor-pointer text-ink-soft"
                  aria-label="Close reference"
                >
                  <X className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Cheat Sheet Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto">
              {/* Iframe Sandbox Hint */}
              <div className="mb-4 p-3 bg-jade/5 border border-jade/20 rounded text-xs text-[#3F6B5C] flex items-start gap-2 leading-relaxed">
                <span className="text-sm">💡</span>
                <div>
                  <strong>Workplace Sandbox Protection:</strong> Secure sandbox environments sometimes block direct print dialogs. If the <strong>Print</strong> button doesn't trigger your system dialog, click <strong>Save Offline HTML</strong> to download a beautifully styled, print-ready document to your computer!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movements.map((m) => (
                  <div key={m.id} className="border border-[#CFC9B6] p-4 rounded-lg bg-[#E4DCC7]/40 flex gap-4 items-start hover:bg-[#E4DCC7]/60 transition-all duration-200">
                    <div className="font-cjk font-bold text-lg w-8 h-8 border-2 border-[#3F6B5C] text-[#3F6B5C] rounded-full flex items-center justify-center flex-shrink-0 bg-[#EDE7D8]">
                      {m.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-cjk text-base font-bold text-[#1B211D]">{m.cjk}</span>
                        <span className="text-[10px] font-semibold text-[#3F6B5C] tracking-wide">{m.pinyin}</span>
                      </div>
                      <div className="text-xs font-serif font-semibold mt-0.5 text-[#242B25]">{m.en}</div>
                      <p className="text-xs leading-relaxed mt-2 text-[#4A4F45] bg-[#EDE7D8]/60 p-2.5 rounded border border-[#CFC9B6]/40 italic">
                        "{m.cue}"
                      </p>
                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[#4A4F45] border-t border-[#CFC9B6]/50 pt-2">
                        <span>{m.cycle} Repetitions</span>
                        <span>{m.breath}s Breath cycle</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* General Practice Tips */}
              <div className="mt-6 p-4 border border-[#3F6B5C]/20 bg-[#3F6B5C]/5 rounded-lg text-xs leading-relaxed text-[#4A4F45] flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <strong className="block text-[#3F6B5C] mb-1 font-semibold">Mindful Alignment:</strong>
                  Root the feet, tuck the tailbone gently, soften all joints, and let your movements float on the rhythm of your breath.
                </div>
                <div className="flex-1 sm:border-l sm:border-[#CFC9B6] sm:pl-4">
                  <strong className="block text-[#A8402B] mb-1 font-semibold">Health &amp; Safety:</strong>
                  Do not strain or hold your breath. If a movement causes sharp pain, immediately soft-limit the range or stop.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#CFC9B6] bg-[#E4DCC7]/50 text-center text-[10px] text-ink-soft font-mono">
              Press Escape or click the close button to return.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
