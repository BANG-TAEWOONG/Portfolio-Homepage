import React, { useState, useRef, useEffect } from 'react';
import { useSiteTexts } from '../integrations/useSiteTexts';
import EditableText from '../ui/EditableText';
import { smoothScrollTo } from '../integrations/smoothScroll';

interface HomeProps {
  isHeroRevealed?: boolean;
}

const HERO_CYCLING_WORDS = ['MOVE', 'RESONATE', 'LAST'] as const;

const detectInitialPublicPrefix = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.endsWith('local_preview.html');
};

const HomeSection: React.FC<HomeProps> = ({ isHeroRevealed = true }) => {
  const { isEditMode } = useSiteTexts();

  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoNum, setCurrentVideoNum] = useState<1 | 2>(1);
  const [usePublicPrefix, setUsePublicPrefix] = useState<boolean>(detectInitialPublicPrefix);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [prevWordIndex, setPrevWordIndex] = useState<number | null>(null);
  const [enteredText, setEnteredText] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackAttemptedRef = useRef(false);

  // Trigger unhurried staggered Hero typography choreography the moment the `'S'` portal finishes passing through
  useEffect(() => {
    if (!isHeroRevealed) {
      setEnteredText(false);
      setWordIndex(0);
      setPrevWordIndex(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setEnteredText(true);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isHeroRevealed]);

  // Smooth vertical masked roll (`MOVE -> RESONATE -> LAST`) every 3.6s after initial text choreography settles
  useEffect(() => {
    if (!enteredText) return;
    let intervalId = 0;
    let clearPrevTimer = 0;

    const startDelay = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setWordIndex((current) => {
          setPrevWordIndex(current);
          window.clearTimeout(clearPrevTimer);
          clearPrevTimer = window.setTimeout(() => setPrevWordIndex(null), 1380);
          return (current + 1) % HERO_CYCLING_WORDS.length;
        });
      }, 3600);
    }, 1800);

    return () => {
      window.clearTimeout(startDelay);
      window.clearTimeout(clearPrevTimer);
      window.clearInterval(intervalId);
    };
  }, [enteredText]);

  // Bidirectional Scroll Recede (Scrolling Down into WORKS) & Expansion Return (Scrolling Back Up to Showreel!)
  useEffect(() => {
    if (isEditMode) {
      setScrollProgress(0);
      return;
    }

    let rafId = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const vh = window.innerHeight || 1;
        const progress = Math.min(1, Math.max(0, window.scrollY / vh));
        setScrollProgress(progress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [isEditMode]);

  const paddedNum = currentVideoNum === 2 ? '02' : '01';
  const videoSrc = `${usePublicPrefix ? '/public' : ''}/2026Showreel${paddedNum}.mp4`;

  // Play cleanly without redundant `video.load()` on initial mount so there is zero frame-0 decode stutter
  const prevSrcRef = useRef<string>(videoSrc);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prevSrcRef.current !== videoSrc) {
      prevSrcRef.current = videoSrc;
      video.load();
    }
    video.play().catch(() => {});
  }, [videoSrc]);

  const handleVideoEnded = () => {
    fallbackAttemptedRef.current = false;
    setCurrentVideoNum((prev) => (prev === 1 ? 2 : 1));
  };

  const handleVideoError = () => {
    if (!fallbackAttemptedRef.current) {
      fallbackAttemptedRef.current = true;
      setUsePublicPrefix((prev) => !prev);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const scrollToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isEditMode) {
      e.stopPropagation();
      return;
    }
    smoothScrollTo('work', 12, 1350);
  };

  // Architectural Hero Scroll Recede & Reverse-Scroll Return
  const frameScale = 1 - scrollProgress * 0.055;
  const frameTranslateY = scrollProgress * 46;
  const heroInnerVideoParallax = scrollProgress * 116;
  const heroTextFade = Math.max(0, 1 - Math.pow(scrollProgress * 1.35, 1.15));
  const heroTextShift = -scrollProgress * 46;

  return (
    <div
      className={`p-1.5 sm:p-2 h-screen min-h-[100svh] w-full overflow-hidden transition-colors duration-700 ${
        isHeroRevealed ? 'bg-white' : 'bg-[#0A0A0B]'
      }`}
    >
      {/* Full-Bleed Architectural Showreel Viewport Frame (`rounded-[10px]` -> expands radius gently as it recedes) */}
      <div
        className="overflow-hidden relative w-full h-full bg-[#0A0A0B] will-change-transform"
        style={{
          borderRadius: `${10 + scrollProgress * 14}px`,
          transform: `translate3d(0, ${frameTranslateY.toFixed(1)}px, 0) scale(${frameScale.toFixed(4)})`,
        }}
      >
        <div
          className="w-full h-full will-change-transform"
          style={{
            transform: `translate3d(0, ${heroInnerVideoParallax.toFixed(1)}px, 0)`,
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            muted={isMuted}
            autoPlay
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Unhurried Editorial Gradient Scrim */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/15 to-black/25 transition-opacity duration-[1800ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] ${
            enteredText ? 'opacity-100' : 'opacity-25'
          }`}
        />

        {/* Rich Multi-Layered Hero Typography & Controls (`1.50s – 1.55s` wowtapes.com rhythm) */}
        <div
          style={{
            opacity: heroTextFade,
            transform: `translate3d(0, ${heroTextShift.toFixed(1)}px, 0)`,
          }}
          className={`pointer-events-none absolute inset-x-4 sm:inset-x-7 md:inset-x-9 bottom-5 sm:bottom-8 md:bottom-10 z-10 flex flex-col-reverse lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10 will-change-transform ${
            enteredText ? 'hero-revealed' : ''
          }`}
        >
          {/* Bottom-Left: Ambient Eyebrow + Expanding Rule + Studio Intro + Pills */}
          <div className="pointer-events-auto max-w-lg">
            <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
              <span className="hero-line-mask !pb-0 !mb-0">
                <span
                  className="hero-line-inner font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/60"
                  style={{ animationDelay: '140ms' }}
                >
                  FILM &amp; VISUAL DIRECTION
                </span>
              </span>
              <span
                aria-hidden="true"
                className="hero-rule-grow h-px w-10 bg-white/40 hidden sm:inline-block"
                style={{ animationDelay: '260ms' }}
              />
            </div>

            <div
              className="hero-stagger-fade"
              style={{ animationDelay: '520ms' }}
            >
              <EditableText
                textKey="homeDescription"
                as="p"
                className="text-xs sm:text-sm md:text-[15px] text-white/90 font-normal leading-relaxed whitespace-pre-line break-keep block"
              />
            </div>

            <div
              className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3 hero-stagger-fade"
              style={{ animationDelay: '700ms' }}
            >
              <a
                href="#work"
                onClick={scrollToWork}
                className="group relative inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white text-[#0A0A0B] hover:bg-[#F4F4F2] font-mono-tech text-[11px] font-semibold tracking-[0.14em] uppercase transition-all shadow-sm overflow-hidden"
              >
                <EditableText textKey="homeButtonText" />
                <span
                  aria-hidden="true"
                  className="transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </a>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute showreel audio' : 'Mute showreel audio'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 hover:border-white/40 text-white font-mono-tech text-[11px] font-medium tracking-[0.15em] uppercase transition-all cursor-pointer"
              >
                {isMuted ? (
                  <span>SOUND OFF</span>
                ) : (
                  <>
                    <span>SOUND ON</span>
                    <span className="inline-flex items-end gap-[2px] h-3" aria-hidden="true">
                      <span className="w-[1.5px] bg-white rounded-full animate-wave-1" />
                      <span className="w-[1.5px] bg-white rounded-full animate-wave-2" />
                      <span className="w-[1.5px] bg-white rounded-full animate-wave-3" />
                      <span className="w-[1.5px] bg-white rounded-full animate-wave-4" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom-Right: Monumental Stacked Condensed Display Headline (Staggered Line Masks + Rolling 3rd Word) */}
          <div className="text-right select-none">
            <h1 className="text-white font-display text-[clamp(3.3rem,8.8vw,8.8rem)] leading-[0.94] tracking-[-0.01em] uppercase">
              <span className="hero-line-mask">
                <span
                  className="hero-line-inner"
                  style={{ animationDelay: '160ms' }}
                >
                  WE FRAME
                </span>
              </span>
              <span className="hero-line-mask">
                <span
                  className="hero-line-inner"
                  style={{ animationDelay: '340ms' }}
                >
                  STORIES THAT
                </span>
              </span>
              <span className="hero-line-mask !pb-[0.16em] !mb-0">
                <span
                  className="hero-line-inner"
                  style={{ animationDelay: '520ms' }}
                >
                  <span className="inline-grid overflow-hidden align-bottom justify-items-end">
                    {prevWordIndex !== null && (
                      <span
                        key={`exit-${HERO_CYCLING_WORDS[prevWordIndex]}`}
                        aria-hidden="true"
                        className="col-start-1 row-start-1 inline-block animate-hero-word-exit"
                      >
                        {HERO_CYCLING_WORDS[prevWordIndex]}
                      </span>
                    )}
                    <span
                      key={`enter-${HERO_CYCLING_WORDS[wordIndex]}`}
                      className={`col-start-1 row-start-1 inline-block ${
                        prevWordIndex !== null ? 'animate-hero-word-enter' : ''
                      }`}
                    >
                      {HERO_CYCLING_WORDS[wordIndex]}
                    </span>
                  </span>
                </span>
              </span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
