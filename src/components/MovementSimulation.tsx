import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movement } from '../types';
import { Play, Pause, Activity, RefreshCw, Upload, Trash2, Video, Eye } from 'lucide-react';

const meridianMap: Record<string, { meridian: string; pointName: string; pointCode: string }> = {
  m1: { meridian: "Triple Burner (San Jiao)", pointName: "Baihui", pointCode: "GV-20" },
  m2: { meridian: "Lung (Hand Taiyin)", pointName: "Zhongfu", pointCode: "LU-1" },
  m3: { meridian: "Governing (Du Mai)", pointName: "Mingmen", pointCode: "GV-4" },
  m4: { meridian: "Heart (Hand Shaoyin)", pointName: "Shanzhong", pointCode: "CV-17" },
  m5: { meridian: "Gallbladder (Foot Shaoyang)", pointName: "Yongquan", pointCode: "KI-1" },
  m6: { meridian: "Kidney (Foot Shaoyin)", pointName: "Shenshu", pointCode: "BL-23" },
  m7: { meridian: "Liver (Foot Jueyin)", pointName: "Taichong", pointCode: "LR-3" },
  m8: { meridian: "Conception (Ren Mai)", pointName: "Dantian", pointCode: "CV-4" },
};

// Module-level cache to persist custom uploaded video URLs across component remounts
const customVideosMap: Record<string, string> = {};

interface MovementSimulationProps {
  movement: Movement;
  isGlobalActive: boolean;
  isGlobalPracticing: boolean;
  globalIsBreathingIn: boolean;
  currentRep: number;
}

export default function MovementSimulation({
  movement,
  isGlobalActive,
  isGlobalPracticing,
  globalIsBreathingIn,
  currentRep
}: MovementSimulationProps) {
  const isInk = movement.tone === 'ink';
  const activeOrPracticing = isGlobalActive || isGlobalPracticing;
  const currentMeridian = meridianMap[movement.id] || { meridian: "Ren & Du Channels", pointName: "Dantian", pointCode: "CV-4" };

  // View modes: 'video' (real human demonstration/custom clip) or 'simulation' (skeletal vector tracing)
  const [viewMode, setViewMode] = useState<'simulation' | 'video'>('video');

  // Local loop states for when the global session is not actively driving this card
  const [localPlaying, setLocalPlaying] = useState(true);
  const [localTime, setLocalTime] = useState(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Video playback states & references
  const [videoError, setVideoError] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync custom video URL from global map on movement change
  useEffect(() => {
    setCustomVideoUrl(customVideosMap[movement.id] || null);
    setVideoError(false);
  }, [movement.id]);

  const videoSrc = customVideoUrl || (
    (movement.id === 'm1' && !videoError) ? '/style1.mp4' :
    (movement.id === 'm2' && !videoError) ? '/style2.mp4' : null
  );

  // Drag-and-drop file upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      customVideosMap[movement.id] = url;
      setCustomVideoUrl(url);
      setViewMode('video');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      customVideosMap[movement.id] = url;
      setCustomVideoUrl(url);
      setViewMode('video');
    }
  };

  const clearCustomVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customVideosMap[movement.id]) {
      URL.revokeObjectURL(customVideosMap[movement.id]);
      delete customVideosMap[movement.id];
    }
    setCustomVideoUrl(null);
  };

  // Synchronize video playback with playing state
  const isPlaying = activeOrPracticing || (!activeOrPracticing && localPlaying);
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(err => {
          console.warn("Video playback paused or blocked:", err);
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, videoSrc, viewMode]);

  // Calculate local breathing state if not driven globally
  const halfCycle = movement.breath / 2; // e.g., 4 seconds for inhale, 4 for exhale

  // Smooth local animation progress (0 to 1, where 0 is full start of inhale, 1 is peak of inhale/start of exhale)
  const [progress, setProgress] = useState(0);
  const [isBreathingIn, setIsBreathingIn] = useState(true);

  // Synchronize with either global breathing rhythm or run local frame-based physics loop
  useEffect(() => {
    if (activeOrPracticing) {
      // Synchronized with global practitioner breath
      setIsBreathingIn(globalIsBreathingIn);
      // Let framer-motion or a simple lerp guide the SVG transition smoothly
      let start: number | null = null;
      let duration = halfCycle * 1000;
      
      const animateGlobal = (timestamp: number) => {
        if (!start) start = timestamp;
        // Simple progression tracking for sub-phases
        const elapsed = (timestamp - start) % duration;
        const currentProgress = elapsed / duration;
        
        // We want progress to smoothly move 0 -> 1 during Inhale, and 1 -> 0 during Exhale
        if (globalIsBreathingIn) {
          setProgress(Math.min(currentProgress, 1));
        } else {
          setProgress(Math.max(1 - currentProgress, 0));
        }
        
        requestRef.current = requestAnimationFrame(animateGlobal);
      };
      
      requestRef.current = requestAnimationFrame(animateGlobal);
    } else {
      // Local demo loop
      if (!localPlaying) {
        setProgress(0.2); // Static elegant preview posture
        setIsBreathingIn(true);
        return;
      }

      const animateLocal = (time: number) => {
        if (lastTimeRef.current !== null) {
          const delta = (time - lastTimeRef.current) / 1000;
          setLocalTime(prev => {
            const next = prev + delta;
            const cycleDuration = movement.breath;
            const currentPosition = next % cycleDuration;
            
            const localInhale = currentPosition < halfCycle;
            setIsBreathingIn(localInhale);
            
            // Calculate 0 to 1 progress smoothly
            const progressInPhase = (currentPosition % halfCycle) / halfCycle;
            const smoothProgress = localInhale ? progressInPhase : 1 - progressInPhase;
            setProgress(smoothProgress);
            
            return next;
          });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animateLocal);
      };
      
      requestRef.current = requestAnimationFrame(animateLocal);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [activeOrPracticing, globalIsBreathingIn, localPlaying, movement.breath, halfCycle]);

  // Determine active phase display text
  const phaseText = isBreathingIn ? "Inhale &bull; Rise" : "Exhale &bull; Settle";
  const actionDescription = isBreathingIn 
    ? "Gathering Qi & stretching upward" 
    : "Sinking down, grounding energy";

  // Statically pick the color accents
  const primaryColor = isInk ? '#C5A880' : '#496B58'; // Brass vs Jade
  const secondaryColor = isInk ? '#E5DDC8' : '#3E3B32'; // Soft paper vs Ink dark
  const qiBallColor = isInk ? 'rgba(197, 168, 128, 0.5)' : 'rgba(73, 107, 88, 0.4)';
  const qiPulseColor = isInk ? 'rgba(197, 168, 128, 0.15)' : 'rgba(73, 107, 88, 0.15)';

  // Let's build the SVG dynamic coordinates based on movement type and progress
  const renderInteractiveVector = () => {
    const width = 200;
    const height = 200;
    
    // Joint calculations
    const headX = width / 2;
    let headY = 65;
    let spineYStart = 78;
    let spineYEnd = 135;
    let pelvisY = 135;
    
    // Feet positions
    let leftFootX = 75;
    let rightFootX = 125;
    let footY = 175;
    
    // Knee heights
    let leftKneeX = 78;
    let leftKneeY = 155;
    let rightKneeX = 122;
    let rightKneeY = 155;

    // Shoulder line
    const leftShoulderX = 80;
    const rightShoulderX = 120;
    const shoulderY = 82;

    // Default hand coordinates
    let leftHandX = 85;
    let leftHandY = 125;
    let rightHandX = 115;
    let rightHandY = 125;

    let leftElbowX = 70;
    let leftElbowY = 105;
    let rightElbowX = 130;
    let rightElbowY = 105;

    let specialGlowElement = null;
    let labelOverlay = null;

    // Modify joint positions dynamically based on movement index and progress (0 to 1)
    switch (movement.id) {
      case "m1": // Two Hands Hold Up the Heavens
        // Rise slightly onto toes at peak progress
        headY -= progress * 10;
        spineYStart -= progress * 10;
        spineYEnd -= progress * 7;
        pelvisY -= progress * 7;
        leftKneeY -= progress * 7;
        rightKneeY -= progress * 7;
        footY -= progress * 4; // rise look
        
        // Hands start at lower belly, move up through center to press straight overhead
        if (progress < 0.5) {
          // Raising through chest
          const subp = progress * 2; // 0 to 1
          leftHandX = width / 2 - 12;
          rightHandX = width / 2 + 12;
          leftHandY = 130 - subp * 60;
          rightHandY = 130 - subp * 60;
          leftElbowX = width / 2 - 25;
          rightElbowX = width / 2 + 25;
          leftElbowY = 140 - subp * 50;
          rightElbowY = 140 - subp * 50;
        } else {
          // Pressing overhead, turning outward
          const subp = (progress - 0.5) * 2; // 0 to 1
          leftHandX = (width / 2 - 12) - subp * 25;
          rightHandX = (width / 2 + 12) + subp * 25;
          leftHandY = 70 - subp * 40;
          rightHandY = 70 - subp * 40;
          leftElbowX = 70 - subp * 15;
          rightElbowX = 130 + subp * 15;
          leftElbowY = 90 - subp * 45;
          rightElbowY = 90 - subp * 45;
        }

        // Heaven Qi energy lines
        specialGlowElement = (
          <g>
            {/* Column of light rising */}
            <line x1={width/2} y1={20} x2={width/2} y2={180} stroke={primaryColor} strokeWidth="2" strokeDasharray="4 6" opacity={0.3 + progress * 0.4} />
            {/* Glowing sphere of Qi overhead */}
            <circle cx={width / 2} cy={headY - 25} r={8 + progress * 15} fill={qiBallColor} filter="blur(1px)" />
            <circle cx={width / 2} cy={headY - 25} r={18 + progress * 20} fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={progress * 0.6} />
          </g>
        );
        break;

      case "m2": // Drawing the Bow
        // Wide horse stance
        leftFootX = 60;
        rightFootX = 140;
        // lower center of gravity
        headY += 10;
        spineYStart += 10;
        spineYEnd += 8;
        pelvisY += 8;
        leftKneeX = 58;
        leftKneeY = 160;
        rightKneeX = 142;
        rightKneeY = 160;

        // Pull bow left and right alternating
        const isLeftBow = isGlobalActive ? (globalIsBreathingIn ? true : false) : (Math.floor(localTime / movement.breath) % 2 === 0);

        if (isLeftBow) {
          // Extend Left Hand straight, draw Right Elbow back sharply
          leftHandX = leftShoulderX - 25 - progress * 35;
          leftHandY = shoulderY;
          leftElbowX = leftShoulderX - 15 - progress * 20;
          leftElbowY = shoulderY;

          rightHandX = rightShoulderX + 5 - progress * 5;
          rightHandY = shoulderY + 5;
          rightElbowX = rightShoulderX + 22 + progress * 18;
          rightElbowY = shoulderY - 2;
        } else {
          // Extend Right Hand straight, draw Left Elbow back sharply
          rightHandX = rightShoulderX + 25 + progress * 35;
          rightHandY = shoulderY;
          rightElbowX = rightShoulderX + 15 + progress * 20;
          rightElbowY = shoulderY;

          leftHandX = leftShoulderX - 5 + progress * 5;
          leftHandY = shoulderY + 5;
          leftElbowX = leftShoulderX - 22 - progress * 18;
          leftElbowY = shoulderY - 2;
        }

        specialGlowElement = (
          <g>
            {/* Draw a subtle tension bow laser string line */}
            {isLeftBow ? (
              <line 
                x1={leftHandX} y1={leftHandY} 
                x2={rightElbowX} y2={rightElbowY} 
                stroke={isInk ? '#E23E57' : '#C5A880'} 
                strokeWidth={0.5 + progress * 1.5} 
                opacity={0.1 + progress * 0.8} 
              />
            ) : (
              <line 
                x1={rightHandX} y1={rightHandY} 
                x2={leftElbowX} y2={leftElbowY} 
                stroke={isInk ? '#E23E57' : '#C5A880'} 
                strokeWidth={0.5 + progress * 1.5} 
                opacity={0.1 + progress * 0.8} 
              />
            )}
            {/* Small spark in front of the extended arm */}
            <circle cx={isLeftBow ? leftHandX : rightHandX} cy={shoulderY} r={3 + progress * 8} fill={primaryColor} opacity={0.2 + progress * 0.6} />
          </g>
        );
        break;

      case "m3": // Separate Heaven and Earth
        // One hand presses straight up, the other presses down
        const isLeftUp = isGlobalActive ? (currentRep % 2 !== 0) : (Math.floor(localTime / movement.breath) % 2 === 0);

        if (isLeftUp) {
          // Left hand up
          leftHandX = leftShoulderX - 5;
          leftHandY = shoulderY - 10 - progress * 40;
          leftElbowX = leftShoulderX - 15;
          leftElbowY = shoulderY - 5 - progress * 20;

          // Right hand down
          rightHandX = rightShoulderX + 10;
          rightHandY = pelvisY + 5 + progress * 35;
          rightElbowX = rightShoulderX + 18;
          rightElbowY = pelvisY + progress * 15;
        } else {
          // Right hand up
          rightHandX = rightShoulderX + 5;
          rightHandY = shoulderY - 10 - progress * 40;
          rightElbowX = rightShoulderX + 15;
          rightElbowY = shoulderY - 5 - progress * 20;

          // Left hand down
          leftHandX = leftShoulderX - 10;
          leftHandY = pelvisY + 5 + progress * 35;
          leftElbowX = leftShoulderX - 18;
          leftElbowY = pelvisY + progress * 15;
        }

        specialGlowElement = (
          <g>
            {/* Dual opposing streams of energy */}
            <circle cx={isLeftUp ? leftHandX : rightHandX} cy={shoulderY - 10 - progress * 40} r={6 + progress * 10} fill={qiBallColor} opacity={0.4} />
            <circle cx={isLeftUp ? rightHandX : leftHandX} cy={pelvisY + 5 + progress * 35} r={6 + progress * 10} fill={isInk ? 'rgba(73, 107, 88, 0.4)' : 'rgba(197, 168, 128, 0.4)'} opacity={0.4} />
            <line x1={width/2} y1={40} x2={width/2} y2={160} stroke={primaryColor} strokeWidth="1" strokeDasharray="3,3" opacity={0.3} />
          </g>
        );
        break;

      case "m4": // The Wise Owl Gazes Backward
        // Head rotates left and right, torso rotates slightly
        const lookLeft = isGlobalActive ? (currentRep % 2 !== 0) : (Math.floor(localTime / movement.breath) % 2 === 0);
        
        // Rotate gaze indicator line
        const lookAngle = lookLeft 
          ? -45 - progress * 115  // Rotate far back left
          : 45 + progress * 115;  // Rotate far back right

        const lookRad = (lookAngle * Math.PI) / 180;
        const lookX = headX + Math.sin(lookRad) * 35;
        const lookY = headY - Math.cos(lookRad) * 20;

        specialGlowElement = (
          <g>
            {/* Gaze sightline of Wise Owl */}
            <line 
              x1={headX} y1={headY} 
              x2={lookX} y2={lookY} 
              stroke={primaryColor} 
              strokeWidth="1.5" 
              strokeDasharray="2,2"
              opacity={0.3 + progress * 0.7} 
            />
            {/* Strain releasing circular ripple waves from the neck */}
            <circle cx={headX} cy={headY + 12} r={10 + progress * 25} fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={progress * 0.5} />
            <circle cx={headX} cy={headY + 12} r={20 + progress * 40} fill="none" stroke={primaryColor} strokeWidth="0.25" opacity={progress * 0.3} />
          </g>
        );

        // Arms stay calmly flat/relaxed down at sides
        leftHandX = leftShoulderX - 10;
        leftHandY = shoulderY + 45;
        rightHandX = rightShoulderX + 10;
        rightHandY = shoulderY + 45;
        break;

      case "m5": // Shake the Head and Swing the Tail
        // Very wide stance, hands on knees
        leftFootX = 50;
        rightFootX = 150;
        leftKneeX = 55;
        leftKneeY = 165;
        rightKneeX = 145;
        rightKneeY = 165;
        
        // Let spine sway in a circle
        const angle = localPlaying ? (localTime * Math.PI * 1.5) : (progress * Math.PI * 2);
        const swayRadiusX = 22;
        const swayRadiusY = 10;
        
        const swayX = Math.cos(angle) * swayRadiusX;
        const swayY = Math.sin(angle) * swayRadiusY;

        headY += 12 + swayY;
        spineYStart += 12 + swayY;
        pelvisY += 3 - swayY;
        
        // Sway body head coordinates
        const headSwayX = headX + swayX;
        const pelvisSwayX = headX - swayX * 0.7; // Tailbone swings opposite direction!

        // Arms resting on bent knees
        leftHandX = leftKneeX + 5;
        leftHandY = leftKneeY - 10;
        rightHandX = rightKneeX - 5;
        rightHandY = rightKneeY - 10;

        specialGlowElement = (
          <g>
            {/* Water Cooling rings under the feet to clear "heart fire" */}
            <ellipse cx={leftFootX} cy={footY} rx={10 + progress * 15} ry={3 + progress * 5} fill="none" stroke="#5FA8D3" strokeWidth="0.5" opacity={0.6} />
            <ellipse cx={rightFootX} cy={footY} rx={10 + progress * 15} ry={3 + progress * 5} fill="none" stroke="#5FA8D3" strokeWidth="0.5" opacity={0.6} />
            {/* Internal spine motion trail */}
            <path d={`M ${pelvisSwayX} ${pelvisY} Q ${width/2} ${shoulderY + 15} ${headSwayX} ${headY}`} fill="none" stroke={primaryColor} strokeWidth="1" strokeDasharray="3 3" opacity={0.5} />
          </g>
        );
        break;

      case "m6": // Two Hands Hold the Feet to Strengthen the Kidneys
        // Inhale: reaching high. Exhale: reaching down to toes.
        if (isBreathingIn) {
          // Raising arms high
          const p = progress;
          headY -= p * 8;
          leftHandX = leftShoulderX - 5 - p * 15;
          leftHandY = shoulderY - p * 45;
          rightHandX = rightShoulderX + 5 + p * 15;
          rightHandY = shoulderY - p * 45;
        } else {
          // Bending all the way down
          const p = 1 - progress; // bending more as progress goes to 0 (which is peak of exhale)
          headY += p * 60;
          spineYStart += p * 45;
          pelvisY += p * 10;
          
          leftHandX = leftFootX - 5;
          leftHandY = footY - 15 + p * 15;
          rightHandX = rightFootX + 5;
          rightHandY = footY - 15 + p * 15;
        }

        specialGlowElement = (
          <g>
            {/* Highlight Lower Back (Kidneys) region */}
            <circle cx={width/2} cy={pelvisY - 10} r={5 + (1-progress) * 12} fill={qiBallColor} opacity={0.2 + (1-progress)*0.5} filter="blur(2px)" />
            <circle cx={width/2} cy={pelvisY - 10} r={10} fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={1-progress} />
          </g>
        );
        break;

      case "m7": // Clench the Fists and Glare Fiercely
        // Horse stance
        leftFootX = 65;
        rightFootX = 135;
        headY += 5;
        
        // Punching arm fires out on Exhale, back on Inhale
        const punchLeft = isGlobalActive ? (currentRep % 2 !== 0) : (Math.floor(localTime / movement.breath) % 2 === 0);
        
        // Punch stroke length is sharp
        const punchP = isBreathingIn ? (1 - progress) : progress; // punch extends on exhale

        if (punchLeft) {
          // Left punch extended
          leftHandX = leftShoulderX - 10 - punchP * 45;
          leftHandY = shoulderY;
          leftElbowX = leftShoulderX - 5 - punchP * 25;
          leftElbowY = shoulderY + 1;

          // Right arm prepared on hip
          rightHandX = rightShoulderX + 12;
          rightHandY = pelvisY - 15;
          rightElbowX = rightShoulderX + 15;
          rightElbowY = pelvisY - 10;
        } else {
          // Right punch extended
          rightHandX = rightShoulderX + 10 + punchP * 45;
          rightHandY = shoulderY;
          rightElbowX = rightShoulderX + 5 + punchP * 25;
          rightElbowY = shoulderY + 1;

          // Left arm prepared on hip
          leftHandX = leftShoulderX - 12;
          leftHandY = pelvisY - 15;
          leftElbowX = leftShoulderX - 15;
          leftElbowY = pelvisY - 10;
        }

        specialGlowElement = (
          <g>
            {/* Glaring Eye indicators */}
            <circle cx={headX - 4} cy={headY} r="1.5" fill={isInk ? '#FF5E5B' : '#C45A45'} opacity={0.8} />
            <circle cx={headX + 4} cy={headY} r="1.5" fill={isInk ? '#FF5E5B' : '#C45A45'} opacity={0.8} />
            
            {/* Impact fire circle ring at fist */}
            {punchP > 0.6 && (
              <circle 
                cx={punchLeft ? leftHandX : rightHandX} 
                cy={shoulderY} 
                r={(punchP - 0.6) * 45} 
                fill="none" 
                stroke={isInk ? '#FF5E5B' : '#C45A45'} 
                strokeWidth="1.5" 
                opacity={1 - punchP} 
              />
            )}
          </g>
        );
        break;

      case "m8": // Bouncing on the Toes to Shake Off a Hundred Ills
        // Rising up and dropping
        const dropPhase = !isBreathingIn && progress < 0.25; // sharp drop
        
        let verticalOffset = 0;
        if (isBreathingIn) {
          verticalOffset = -progress * 14; // Rising up high on toes
        } else if (progress >= 0.25) {
          verticalOffset = -(progress - 0.25) * 18; // Suspension state before heel drop
        } else {
          verticalOffset = 0; // Dropped to floor!
        }

        headY += verticalOffset;
        spineYStart += verticalOffset;
        spineYEnd += verticalOffset * 0.8;
        pelvisY += verticalOffset * 0.8;
        shoulderY + verticalOffset;
        leftHandY += verticalOffset * 0.5;
        rightHandY += verticalOffset * 0.5;

        // Hands resting relaxed
        leftHandX = leftShoulderX - 10;
        rightHandX = rightShoulderX + 10;

        specialGlowElement = (
          <g>
            {/* Heel Drop impact wave ring */}
            {!isBreathingIn && progress < 0.15 && (
              <ellipse 
                cx={width/2} 
                cy={footY} 
                rx={10 + (0.15 - progress) * 260} 
                ry={3 + (0.15 - progress) * 80} 
                fill="none" 
                stroke={primaryColor} 
                strokeWidth="2" 
                opacity={1 - progress/0.15} 
              />
            )}
            
            {/* Shaking energy particles floating down to ground */}
            {!isBreathingIn && (
              <g opacity={1 - progress}>
                <circle cx={width/2 - 25} cy={height/2 - 20 + progress * 50} r="1.5" fill={primaryColor} opacity={0.4} />
                <circle cx={width/2 + 25} cy={height/2 - 10 + progress * 60} r="1.2" fill={primaryColor} opacity={0.4} />
                <circle cx={width/2 - 10} cy={height/2 + 10 + progress * 40} r="1" fill={primaryColor} opacity={0.3} />
              </g>
            )}
          </g>
        );
        break;

      default:
        break;
    }

    // 1. Moving Qi Beads along Meridians
    const spineT = (localTime * 0.25) % 1.0;
    const spineX = width / 2;
    const spineY = pelvisY - spineT * (pelvisY - headY + 10);

    const armT = (localTime * 0.45) % 1.0;
    let leftArmQiX = leftShoulderX;
    let leftArmQiY = shoulderY;
    if (armT < 0.5) {
      const t = armT * 2;
      leftArmQiX = leftShoulderX + (leftElbowX - leftShoulderX) * t;
      leftArmQiY = shoulderY + (leftElbowY - shoulderY) * t;
    } else {
      const t = (armT - 0.5) * 2;
      leftArmQiX = leftElbowX + (leftHandX - leftElbowX) * t;
      leftArmQiY = leftElbowY + (leftHandY - leftElbowY) * t;
    }

    let rightArmQiX = rightShoulderX;
    let rightArmQiY = shoulderY;
    if (armT < 0.5) {
      const t = armT * 2;
      rightArmQiX = rightShoulderX + (rightElbowX - rightShoulderX) * t;
      rightArmQiY = shoulderY + (rightElbowY - shoulderY) * t;
    } else {
      const t = (armT - 0.5) * 2;
      rightArmQiX = rightElbowX + (rightHandX - rightElbowX) * t;
      rightArmQiY = rightElbowY + (rightHandY - rightElbowY) * t;
    }

    // 2. Translucent robes (Silk flowing outlines)
    const robeFill = isInk ? 'rgba(197, 168, 128, 0.05)' : 'rgba(73, 107, 88, 0.04)';
    const robeStroke = isInk ? 'rgba(197, 168, 128, 0.15)' : 'rgba(73, 107, 88, 0.12)';

    // Dynamic scale for the glowing aura
    const auraRadiusX = 65 + progress * 10;
    const auraRadiusY = 80 + progress * 12;

    return (
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.22" />
            <stop offset="60%" stopColor={primaryColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dantianInk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F6D55C" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#D8B168" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dantianJade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#68B0AB" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#7FA99B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#496B58" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Traditional Artistic Zen Ink Wash backdrop circle */}
        <circle cx={width/2} cy={height/2 + 5} r="70" fill={isInk ? 'rgba(197, 168, 128, 0.03)' : 'rgba(73, 107, 88, 0.02)'} />
        <circle cx={width/2} cy={height/2 + 5} r="52" fill={isInk ? 'rgba(30, 25, 20, 0.05)' : 'rgba(73, 107, 88, 0.03)'} />
        <ellipse cx={width/2} cy={footY} rx={60} ry={8} fill={isInk ? 'rgba(30, 25, 20, 0.08)' : 'rgba(73, 107, 88, 0.06)'} filter="blur(2px)" />

        {/* Pulsating Qi Field Aura surrounding the practitioner */}
        <ellipse 
          cx={width / 2} 
          cy={height / 2 + 5} 
          rx={auraRadiusX} 
          ry={auraRadiusY} 
          fill="none" 
          stroke={primaryColor} 
          strokeWidth="0.75" 
          strokeDasharray="3,7" 
          opacity={0.08 + progress * 0.15} 
        />

        {/* Energy Background pulse */}
        <circle cx={width / 2} cy={height / 2 + 10} r={40 + progress * 25} fill="url(#innerGlow)" />

        {/* Floor Line */}
        <line x1="25" y1={footY} x2="175" y2={footY} stroke={primaryColor} strokeWidth="1" strokeLinecap="round" opacity="0.35" />

        {/* Ambient Qi flow path / Spine energy canal */}
        <path 
          d={`M ${width/2} ${footY} L ${width/2} ${pelvisY} L ${width/2} ${spineYStart} Q ${width/2} ${(spineYStart + headY)/2} ${headX} ${headY}`} 
          fill="none" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          opacity="0.25" 
          strokeDasharray="1,2"
        />

        {/* Ground shadow beneath the feet */}
        <ellipse cx={width / 2} cy={footY} rx={45} ry={4} fill={isInk ? '#1d221b' : '#d2cbb5'} opacity="0.85" />

        {/* Translucent loose silk Qigong robes drape & sleeves */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Torso Wrap / Overlap robe */}
          <path 
            d={`M ${leftShoulderX} ${shoulderY} L ${rightShoulderX} ${shoulderY} L ${rightShoulderX + 4} ${pelvisY} Q ${width/2} ${pelvisY + 8} ${leftShoulderX - 4} ${pelvisY} Z`} 
            fill={robeFill} 
            stroke={robeStroke} 
            strokeWidth="0.85" 
          />
          {/* Left sleeve flowing drape */}
          <path 
            d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY} Q ${leftElbowX - 16} ${leftElbowY + 22} ${leftShoulderX - 7} ${shoulderY + 16} Z`} 
            fill={robeFill} 
            stroke={robeStroke} 
            strokeWidth="0.85" 
          />
          {/* Right sleeve flowing drape */}
          <path 
            d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY} Q ${rightElbowX + 16} ${rightElbowY + 22} ${rightShoulderX + 7} ${shoulderY + 16} Z`} 
            fill={robeFill} 
            stroke={robeStroke} 
            strokeWidth="0.85" 
          />
        </g>

        {/* Special effects and energy flow shapes */}
        {specialGlowElement}

        {/* INTERACTIVE RESPIRATORY LUNGS (Breathing expand/contract wave) */}
        <g opacity={0.15 + progress * 0.45} filter="blur(1px)">
          <ellipse cx={width/2 - 6} cy={shoulderY + 14} rx={3.5 + progress * 4.5} ry={6.5 + progress * 6.5} fill={primaryColor} />
          <ellipse cx={width/2 + 6} cy={shoulderY + 14} rx={3.5 + progress * 4.5} ry={6.5 + progress * 6.5} fill={primaryColor} />
        </g>

        {/* ACTIVE MERIDIAN QI BEADS */}
        <g filter="blur(0.5px)">
          {/* Du Meridian rising up spine */}
          <circle cx={spineX} cy={spineY} r="2.5" fill={isInk ? '#F6D55C' : '#68B0AB'} opacity={0.85} />
          {/* Left Arm meridian flow */}
          <circle cx={leftArmQiX} cy={leftArmQiY} r="2" fill={isInk ? '#FF5E5B' : '#E23E57'} opacity={0.75} />
          {/* Right Arm meridian flow */}
          <circle cx={rightArmQiX} cy={rightArmQiY} r="2" fill={isInk ? '#FF5E5B' : '#E23E57'} opacity={0.75} />
        </g>

        {/* THE HUMAN BODY VECTOR WITH 3D VOLUMETRIC CYLINDRICAL SHADING */}
        <g strokeLinecap="round" strokeLinejoin="round">
          
          {/* == LAYER 1: BACKING VOLUMETRIC MUSCLE CORE (Thick translucent sheath) == */}
          <g stroke={isInk ? 'rgba(30, 25, 20, 0.45)' : 'rgba(73, 107, 88, 0.35)'}>
            {/* Left Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${leftKneeX} ${leftKneeY} L ${leftFootX} ${footY}`} fill="none" strokeWidth="6" />
            {/* Right Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${rightKneeX} ${rightKneeY} L ${rightFootX} ${footY}`} fill="none" strokeWidth="6" />
            {/* Spine */}
            <line x1={width/2} y1={pelvisY} x2={width/2} y2={shoulderY} strokeWidth="7" />
            {/* Shoulders */}
            <line x1={leftShoulderX} y1={shoulderY} x2={rightShoulderX} y2={shoulderY} strokeWidth="6.5" />
            {/* Left Arm */}
            <path d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY}`} fill="none" strokeWidth="5" />
            {/* Right Arm */}
            <path d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY}`} fill="none" strokeWidth="5" />
          </g>

          {/* == LAYER 2: PRIMARY SKELETAL PATHS (Medium solid color) == */}
          <g stroke={primaryColor}>
            {/* Left Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${leftKneeX} ${leftKneeY} L ${leftFootX} ${footY}`} fill="none" strokeWidth="3" opacity="0.9" />
            {/* Right Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${rightKneeX} ${rightKneeY} L ${rightFootX} ${footY}`} fill="none" strokeWidth="3" opacity="0.9" />
            {/* Spine */}
            <line x1={width/2} y1={pelvisY} x2={width/2} y2={shoulderY} strokeWidth="3.5" opacity="0.95" />
            {/* Shoulders */}
            <line x1={leftShoulderX} y1={shoulderY} x2={rightShoulderX} y2={shoulderY} strokeWidth="3.5" opacity="0.95" />
            {/* Left Arm */}
            <path d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY}`} fill="none" strokeWidth="2.5" opacity="0.9" />
            {/* Right Arm */}
            <path d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY}`} fill="none" strokeWidth="2.5" opacity="0.9" />
          </g>

          {/* == LAYER 3: INNER REFLECTION HIGHLIGHTS (Thin white/brass light beam) == */}
          <g stroke={isInk ? '#E5DDC8' : '#FFFFFF'} opacity="0.75">
            {/* Left Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${leftKneeX} ${leftKneeY} L ${leftFootX} ${footY}`} fill="none" strokeWidth="0.8" />
            {/* Right Leg */}
            <path d={`M ${width/2} ${pelvisY} L ${rightKneeX} ${rightKneeY} L ${rightFootX} ${footY}`} fill="none" strokeWidth="0.8" />
            {/* Spine */}
            <line x1={width/2} y1={pelvisY} x2={width/2} y2={shoulderY} strokeWidth="1" />
            {/* Shoulders */}
            <line x1={leftShoulderX + 2} y1={shoulderY} x2={rightShoulderX - 2} y2={shoulderY} strokeWidth="1" />
            {/* Left Arm */}
            <path d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY}`} fill="none" strokeWidth="0.7" />
            {/* Right Arm */}
            <path d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY}`} fill="none" strokeWidth="0.7" />
          </g>

          {/* 6. Head (Polished 3D-feeling circular head brush) */}
          <circle 
            cx={headX} 
            cy={headY} 
            r="9.5" 
            fill={isInk ? '#2B2E2A' : '#EAE3D2'} 
            stroke={primaryColor}
            strokeWidth="2.5" 
          />
          {/* Head inner shine crescent */}
          <circle 
            cx={headX - 2.5} 
            cy={headY - 2.5} 
            r="3" 
            fill={isInk ? '#3D413B' : '#FBF9F5'} 
            opacity="0.65" 
            stroke="none"
          />

          {/* Traditional Scholar Hair Bun (Topknot) with stick hairpin */}
          <circle cx={headX} cy={headY - 9.5} r="3.5" fill={isInk ? '#2B2E2A' : '#EAE3D2'} stroke={primaryColor} strokeWidth="1.5" />
          <line x1={headX - 6} y1={headY - 10.5} x2={headX + 6} y2={headY - 8.5} stroke={primaryColor} strokeWidth="1" />
          
          {/* == ACUPRESSURE TARGET NODES (Baihui, Laogong, Yongquan, Mingmen) == */}
          {/* Baihui (Crown of Head) */}
          <circle cx={headX} cy={headY - 13.5} r={3 + Math.sin(localTime * 4.5) * 1.5} fill="none" stroke={isInk ? '#F6D55C' : '#68B0AB'} strokeWidth="0.6" opacity={0.5 + Math.sin(localTime * 4.5) * 0.3} />
          <circle cx={headX} cy={headY - 13.5} r="1.2" fill={isInk ? '#F6D55C' : '#68B0AB'} />

          {/* Laogong (Palms) */}
          <circle cx={leftHandX} cy={leftHandY} r={3.2 + Math.sin(localTime * 4.5) * 1.2} fill="none" stroke={isInk ? '#FF5E5B' : '#E23E57'} strokeWidth="0.6" opacity={0.6} />
          <circle cx={leftHandX} cy={leftHandY} r="1" fill={isInk ? '#FF5E5B' : '#E23E57'} />
          <circle cx={rightHandX} cy={rightHandY} r={3.2 + Math.sin(localTime * 4.5) * 1.2} fill="none" stroke={isInk ? '#FF5E5B' : '#E23E57'} strokeWidth="0.6" opacity={0.6} />
          <circle cx={rightHandX} cy={rightHandY} r="1" fill={isInk ? '#FF5E5B' : '#E23E57'} />

          {/* Yongquan (Feet Sole Gateways) */}
          <circle cx={leftFootX} cy={footY - 2.5} r={2.5 + Math.sin(localTime * 3) * 1} fill="none" stroke={isInk ? '#68B0AB' : '#496B58'} strokeWidth="0.5" opacity={0.5} />
          <circle cx={leftFootX} cy={footY - 2.5} r="0.8" fill={isInk ? '#68B0AB' : '#496B58'} />
          <circle cx={rightFootX} cy={footY - 2.5} r={2.5 + Math.sin(localTime * 3) * 1} fill="none" stroke={isInk ? '#68B0AB' : '#496B58'} strokeWidth="0.5" opacity={0.5} />
          <circle cx={rightFootX} cy={footY - 2.5} r="0.8" fill={isInk ? '#68B0AB' : '#496B58'} />

          {/* Mingmen (Life Gate back center) */}
          <circle cx={width/2} cy={pelvisY - 30} r="1.5" fill={primaryColor} />
          <circle cx={width/2} cy={pelvisY - 30} r={4 + Math.sin(localTime * 3) * 1.2} fill="none" stroke={primaryColor} strokeWidth="0.5" strokeDasharray="1,2" opacity={0.5} />

          {/* Lower Dan Tian (Pulsing energy center) */}
          <circle cx={width/2} cy={pelvisY - 15} r={9 + progress * 5} fill="none" stroke={isInk ? '#C5A880' : '#496B58'} strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3" />
          <circle cx={width/2} cy={pelvisY - 15} r={3.5 + progress * 4.5} fill={isInk ? 'url(#dantianInk)' : 'url(#dantianJade)'} opacity={0.75 + progress * 0.25} />
        </g>
      </svg>
    );
  };

  return (
    <div 
      className={`absolute inset-0 w-full h-full flex flex-col justify-between p-4 select-none transition-colors duration-300 ${
        isInk ? 'bg-[#151714] text-paper' : 'bg-paper text-ink'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for custom video selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />

      {/* Drag overlay indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 border-4 border-dashed border-jade m-2 rounded-lg text-center"
          >
            <Upload className="w-10 h-10 text-jade animate-bounce mb-3" />
            <p className="font-serif text-lg text-white">Drop your custom video here</p>
            <p className="font-mono text-xs text-white/60 mt-1">Accepts any MP4 or standard video clip</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Screen Wrapper */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg">
        
        {/* VIEW 1: Video Mode (Custom uploaded MP4 OR YouTube Looping Embed fallback) */}
        {viewMode === 'video' ? (
          <div className="absolute inset-0 w-full h-full bg-black">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                onError={() => {
                  console.warn("Video failed to load, falling back to YouTube demo clip.");
                  setVideoError(true);
                }}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full object-cover z-0 scale-[1.05] pointer-events-none"
                src={`https://www.youtube.com/embed/ifZX3tSiBzI?start=${movement.startSeconds || 70}&end=${movement.endSeconds || 155}&autoplay=1&mute=1&loop=1&playlist=ifZX3tSiBzI&controls=0&modestbranding=1&rel=0&showinfo=0`}
                title={movement.en}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
              />
            )}
            
            {/* Dark vignette to improve HUD legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 z-0 pointer-events-none" />
          </div>
        ) : (
          /* VIEW 2: Skeletal / Qi Flow Simulation Mode */
          <>
            {/* Living Grid / Traditional pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
              style={{
                backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }} 
            />
            {/* Main Center Vector Area */}
            <div className="w-full h-full max-w-[200px] max-h-[200px] flex items-center justify-center z-0">
              {renderInteractiveVector()}
            </div>
          </>
        )}

        {/* View Mode Switcher and Custom Upload Buttons Bar */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
          {/* Custom Upload Trigger */}
          {viewMode === 'video' && (
            <div className="flex items-center gap-1">
              {customVideoUrl && (
                <button
                  onClick={clearCustomVideo}
                  title="Clear custom video and reset to Master Demo"
                  className="w-7 h-7 rounded bg-black/60 border border-white/10 text-rose-400 hover:text-rose-300 hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                title={customVideoUrl ? "Change custom style video" : "Upload custom style video"}
                className="w-7 h-7 rounded bg-black/60 border border-white/10 text-jade hover:text-jade-light hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Toggle View Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'simulation' ? 'video' : 'simulation')}
            title={viewMode === 'simulation' ? "Show Master Video" : "Show Qi Flow"}
            className="w-7 h-7 rounded bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
          >
            {viewMode === 'simulation' ? (
              <Video className="w-3.5 h-3.5 text-jade" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-jade" />
            )}
          </button>

          {/* Local Loop Playback Button (Only when not globally active) */}
          {!activeOrPracticing && viewMode === 'video' && videoSrc && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalPlaying(!localPlaying);
              }}
              title={localPlaying ? "Pause preview video" : "Play preview video"}
              className="w-7 h-7 rounded bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
            >
              {localPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

      </div>

      {/* Synchronized Breathing Guide Drawer */}
      <div className={`mt-2 border-t pt-2 border-dashed ${isInk ? 'border-brass/15' : 'border-jade/15'} z-10`}>
        <div className="flex justify-between items-center text-[10px] font-mono tracking-wider uppercase opacity-80">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${
              isBreathingIn ? 'bg-emerald-500 animate-pulse' : 'bg-sky-400'
            }`} />
            <span dangerouslySetInnerHTML={{ __html: phaseText }} />
          </div>
          <span className="opacity-60">
            {activeOrPracticing ? "Active Practice" : "Auto Loop"}
          </span>
        </div>
        <div className={`text-[10px] truncate mt-0.5 ${isInk ? 'text-white/60' : 'text-ink/60'}`}>
          {actionDescription}
        </div>
      </div>
    </div>
  );
}
