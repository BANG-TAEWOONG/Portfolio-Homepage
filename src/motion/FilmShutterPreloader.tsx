import React, { useEffect, useState } from 'react';

interface FilmShutterPreloaderProps {
  /** Called right as the horizontal shutter slit begins opening so the Showreel plays underneath */
  onRevealStart?: () => void;
  /** Called once the aperture has fully opened and the preloader unmounts */
  onComplete?: () => void;
}

const SESSION_KEY = 'introPlayed';
const TOTAL_STEPS = 48; // 00:00:00:00 -> 00:00:01:24 (24fps reel leader cadence)

function formatReelTimecode(step: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_STEPS, step));
  if (clamped === TOTAL_STEPS) {
    return '00:00:01:24';
  }
  const seconds = Math.floor(clamped / 24);
  const frames = clamped % 24;
  return `00:00:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export function hasSessionIntroPlayed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return window.sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

const FilmShutterPreloader: React.FC<FilmShutterPreloaderProps> = ({
  onRevealStart,
  onComplete,
}) => {
  const [visible, setVisible] = useState<boolean>(() => !hasSessionIntroPlayed());
  const [frameStep, setFrameStep] = useState(0);
  const [phase, setPhase] = useState<'count' | 'aperture'>('count');

  useEffect(() => {
    if (!visible) {
      onRevealStart?.();
      onComplete?.();
      return;
    }

    let rafId = 0;
    let apertureTriggered = false;
    const startTime = performance.now();
    const countDurationMs = 1120; // 0.00s -> 1.12s: crisp 24fps timecode run
    const totalDurationMs = 1800; // 1.12s -> 1.80s: horizontal shutter-slit aperture open

    const stepLoop = (now: number) => {
      const elapsed = now - startTime;
      const countProgress = Math.min(1, elapsed / countDurationMs);
      const nextStep = Math.round(countProgress * TOTAL_STEPS);
      setFrameStep(nextStep);

      if (elapsed >= countDurationMs && !apertureTriggered) {
        apertureTriggered = true;
        setPhase('aperture');
        onRevealStart?.();
      }

      if (elapsed < totalDurationMs) {
        rafId = window.requestAnimationFrame(stepLoop);
      } else {
        try {
          window.sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {
          // Ignore storage quota errors in private browsing
        }
        setVisible(false);
        onComplete?.();
      }
    };

    rafId = window.requestAnimationFrame(stepLoop);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [visible, onRevealStart, onComplete]);

  if (!visible) return null;

  const isOpening = phase === 'aperture';

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Upper 35mm Mechanical Shutter Blade — parts from center (50% -> 0%) */}
      <div
        className={`absolute top-0 inset-x-0 h-[50.2vh] bg-neutral-950 border-b transition-transform duration-[680ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
          isOpening
            ? '-translate-y-full border-white/40'
            : 'translate-y-0 border-white/10'
        }`}
      />

      {/* Lower 35mm Mechanical Shutter Blade — parts from center (50% -> 0%) */}
      <div
        className={`absolute bottom-0 inset-x-0 h-[50.2vh] bg-neutral-950 border-t transition-transform duration-[680ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
          isOpening
            ? 'translate-y-full border-white/40'
            : 'translate-y-0 border-white/10'
        }`}
      />

      {/* Center Lockup & Viewfinder HUD (opens via horizontal slit clip-path) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isOpening ? 'opacity-0' : 'animate-aperture-open opacity-100'
        }`}
      >
        {/* Subtle 35mm Viewfinder Gate Reticles */}
        <div className="absolute inset-6 md:inset-10 pointer-events-none">
          <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l border-white/25" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-white/25" />
          <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l border-white/25" />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r border-white/25" />

          <div className="absolute top-0 left-6 text-[9px] font-mono tracking-[0.28em] text-white/40 uppercase tabular-nums">
            35MM GATE // REEL 01
          </div>
          <div className="absolute top-0 right-6 text-[9px] font-mono tracking-[0.28em] text-white/40 uppercase tabular-nums">
            24 FPS
          </div>
        </div>

        {/* Center Studio Lockup + Running Frame Timecode */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-semibold tracking-[0.42em] uppercase mr-[-0.42em] mb-5">
            TWOONG STUDIO
          </div>

          {/* Shutter Slit Progress Line */}
          <div className="w-44 sm:w-56 h-[1px] bg-white/15 relative overflow-hidden mb-4">
            <div
              className="absolute inset-y-0 left-0 bg-white transition-[width] duration-75 ease-linear"
              style={{ width: `${(frameStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          <div className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.32em] text-white/75 tabular-nums">
            {formatReelTimecode(frameStep)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmShutterPreloader;
