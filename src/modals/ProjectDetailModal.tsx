import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WorkItem } from '../data/types';
import { getVideoPlatform } from '../integrations/youtubeParser';
import {
  cleanFieldValue,
  getStillFallbackUrl,
  isMeaningfulValue,
  parseProjectStills,
  resolveProjectCredits,
} from '../integrations/mediaParser';
import {
  buildThumbnailCandidates,
  getClientArtistDisplay,
  getInsideCardMeta,
  getMutedPreviewEmbedUrl,
  getPrimaryEntityLabel,
  getWorkReleaseDate,
  isWorkItemVertical,
  isYouTubePlaceholderDimension,
  resolveCaseStudyStages,
  resolveEditorialDescription,
} from '../pages/workLayoutEngine';
import { useIntersectionObserver } from '../integrations/useIntersectionObserver';
import MinimalScrubPlayer from '../ui/MinimalScrubPlayer';

export interface ProjectModalProps {
  selectedWork: WorkItem | null;
  nextWork?: WorkItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  navDirection: 'next' | 'prev' | 'init';
  focalPoint?: string;
  isVerticalOverride?: boolean;
}

interface StillEntryState {
  src: string;
  status: 'loading' | 'ready' | 'failed';
  isPortrait: boolean;
}

const LANDSCAPE_GRID_CLASSES = [
  'md:col-span-8 md:col-start-5', // Still 1: Right-anchored 8-col (~66%) frame directly beneath HOW I WORKED
  'md:col-span-5 md:col-start-1', // Still 2: Left-anchored 5-col (~42%) frame
  'md:col-span-8 md:col-start-5', // Still 3: Right-anchored 8-col (~66%) cinema frame
];

const PORTRAIT_GRID_CLASSES = [
  'w-[82%] sm:w-[66%] md:w-full mx-auto md:mx-0 md:col-span-4 md:col-start-5',
  'w-[82%] sm:w-[66%] md:w-full mx-auto md:mx-0 md:col-span-4 md:col-start-2',
  'w-[82%] sm:w-[66%] md:w-full mx-auto md:mx-0 md:col-span-4 md:col-start-8 md:mt-12',
];

interface ModalThumbnailProps {
  item: WorkItem;
  isVertical?: boolean;
  priority?: boolean;
  variant: 'poster' | 'compact';
  className?: string;
  objectPosition?: string;
}

const ModalThumbnail: React.FC<ModalThumbnailProps> = ({
  item,
  isVertical = false,
  priority = false,
  variant,
  className = '',
  objectPosition,
}) => {
  const candidates = useMemo(
    () => buildThumbnailCandidates(item),
    [item.thumbnail, item.videoUrl]
  );

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(candidates.length === 0);
  }, [item.id, candidates]);

  const advanceFallback = useCallback(() => {
    setCandidateIdx((prev) => {
      if (prev + 1 < candidates.length) {
        return prev + 1;
      }
      setFailed(true);
      return prev;
    });
  }, [candidates.length]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const currentSrc = candidates[candidateIdx] || '';
      if (
        isYouTubePlaceholderDimension(img.naturalWidth, img.naturalHeight) ||
        (img.naturalWidth <= 120 && currentSrc.includes('maxresdefault.jpg'))
      ) {
        advanceFallback();
      }
    },
    [advanceFallback, candidates, candidateIdx]
  );

  if (failed || candidates.length === 0) {
    const entity = getPrimaryEntityLabel(item);
    const slateFormatLabel = isVertical ? '9:16 REEL' : '16:9 FILM';

    if (variant === 'compact') {
      return (
        <div className="w-full h-full bg-neutral-900 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.09), transparent 60%)',
            }}
          />
          <div className="relative z-10 flex items-center justify-between gap-2 font-mono-tech text-[9px] tracking-[0.16em] uppercase text-white/45">
            <span>TWOONG</span>
            <span>{isVertical ? '9:16' : '16:9'}</span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-semibold text-white leading-snug line-clamp-2">
              {item.title}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-neutral-900 relative overflow-hidden select-none flex flex-col justify-between p-6 sm:p-10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(110% 90% at 50% 35%, rgba(38,38,42,0.96) 0%, rgba(10,10,12,1) 100%)',
          }}
        />
        <div className="absolute inset-5 sm:inset-7 rounded-2xl border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <span className="font-mono-tech text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-white/40">
            TWOONG STUDIO // ARCHIVE
          </span>
          <span className="font-mono-tech text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-white/65 px-2.5 py-1 rounded bg-white/[0.06] border border-white/10">
            {slateFormatLabel}
          </span>
        </div>

        <div className="relative z-10 my-auto pb-10 flex flex-col items-center justify-center text-center px-4">
          {entity && (
            <span className="font-mono-tech text-xs tracking-[0.2em] uppercase text-white/50 mb-2">
              {entity}
            </span>
          )}
          <span className="font-display text-3xl sm:text-4xl md:text-5xl text-white/[0.16] uppercase tracking-tight leading-[0.95] line-clamp-2 max-w-[18ch]">
            {item.title}
          </span>
        </div>

        <div className="h-6" />
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIdx]}
      alt={item.title}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={handleLoad}
      onError={advanceFallback}
      style={objectPosition ? { objectPosition } : undefined}
      className={className}
    />
  );
};

const ProjectDetailModal: React.FC<ProjectModalProps> = ({
  selectedWork,
  nextWork,
  onClose,
  onNext,
  onPrev,
  navDirection,
  focalPoint,
  isVerticalOverride,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isClosingSheet, setIsClosingSheet] = useState(false);
  const [teaserReady, setTeaserReady] = useState(false);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);

  const [howRef, isHowVisible] = useIntersectionObserver({ threshold: 0.08, once: false, requireScroll: false });
  const [creditsRef, isCreditsVisible] = useIntersectionObserver({ threshold: 0.08, once: false, requireScroll: false });
  const [nextStoryRef, isNextStoryVisible] = useIntersectionObserver({ threshold: 0.08, once: false, requireScroll: false });

  // Unhurried, silky sheet closing animation (`980ms` matching Wow Tapes `cubic-bezier(0.23, 1, 0.32, 1)`)
  const triggerSmoothClose = useCallback(() => {
    if (isClosingSheet) return;
    setIsClosingSheet(true);
    window.setTimeout(() => {
      setIsClosingSheet(false);
      onClose();
    }, 980);
  }, [isClosingSheet, onClose]);

  // 1. Lock body scroll while Case Study overlay is mounted
  useEffect(() => {
    if (!selectedWork) return;
    setIsClosingSheet(false);
    setHasScrolledDown(false);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [selectedWork]);

  // 2. Smoothly scroll to top & reset Poster Stage on project change (PREV / NEXT / NEXT STORY)
  useEffect(() => {
    setIsPlayingVideo(false);
    setTeaserReady(false);
    setHasScrolledDown(false);
    if (selectedWork && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: navDirection === 'init' ? ('instant' as ScrollBehavior) : 'smooth',
      });
    }
  }, [selectedWork?.id, navDirection]);

  // 3. Track scroll position inside the Case Study sheet so bottom-right `CLOSE` never overlaps the top description or WATCH player!
  const handleSheetScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setHasScrolledDown(e.currentTarget.scrollTop > 420);
  }, []);

  // 4. Keyboard navigation (`Escape`, `ArrowLeft`, `ArrowRight`)
  useEffect(() => {
    if (!selectedWork) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        triggerSmoothClose();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedWork, triggerSmoothClose, onNext, onPrev]);

  // 5. Scene stills initialization & YouTube 120x90 placeholder filtering
  const candidateStills = useMemo(() => {
    if (!selectedWork) return [];
    if (Array.isArray(selectedWork.stills)) return selectedWork.stills;
    return parseProjectStills(undefined, selectedWork.videoUrl, selectedWork.id);
  }, [selectedWork]);

  const [stillStates, setStillStates] = useState<StillEntryState[]>([]);

  useEffect(() => {
    setStillStates(
      candidateStills.map((url) => ({
        src: url,
        status: 'loading',
        isPortrait: Boolean(selectedWork && isWorkItemVertical(selectedWork)),
      }))
    );
  }, [selectedWork, candidateStills]);

  const triggerStillFallbackOrHide = useCallback((index: number) => {
    setStillStates((prev) => {
      const current = prev[index];
      if (!current || current.status === 'failed') return prev;
      const fallback = getStillFallbackUrl(current.src, selectedWork?.videoUrl);
      const next = [...prev];
      if (fallback && fallback !== current.src) {
        next[index] = {
          ...current,
          src: fallback,
          status: 'loading',
        };
      } else {
        next[index] = {
          ...current,
          status: 'failed',
        };
      }
      return next;
    });
  }, []);

  const handleStillLoad = useCallback(
    (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (isYouTubePlaceholderDimension(img.naturalWidth, img.naturalHeight)) {
        triggerStillFallbackOrHide(index);
        return;
      }
      const isPortrait = img.naturalHeight > img.naturalWidth;
      setStillStates((prev) => {
        const current = prev[index];
        if (!current) return prev;
        const next = [...prev];
        next[index] = {
          ...current,
          status: 'ready',
          isPortrait,
        };
        return next;
      });
    },
    [triggerStillFallbackOrHide]
  );

  // 6. 3-Column `HOW I WORKED` (`Pre | Production | Post`)
  const stages = useMemo(() => {
    if (!selectedWork) return [];
    return resolveCaseStudyStages(selectedWork);
  }, [selectedWork]);

  // 7. True Film `CREDITS` list
  const creditsList = useMemo(() => {
    if (!selectedWork) return [];
    if (selectedWork.credits && selectedWork.credits.length > 0) {
      return selectedWork.credits;
    }
    return resolveProjectCredits({
      client: selectedWork.client,
      artist: selectedWork.artist,
      myRole: selectedWork.role,
      contributionRate: selectedWork.contributionRate,
      setUp: selectedWork.setup,
      useTools: selectedWork.tools,
      runningTime: selectedWork.runningTime,
      releaseDate: selectedWork.releaseDate,
      participationType: selectedWork.type,
    });
  }, [selectedWork]);

  const previewMedia = useMemo(() => {
    if (!selectedWork) return { kind: 'none' as const, src: '' };
    return getMutedPreviewEmbedUrl(selectedWork);
  }, [selectedWork]);

  if (!selectedWork) return null;

  const isVertical = isVerticalOverride ?? isWorkItemVertical(selectedWork);
  const platform = getVideoPlatform(selectedWork.videoUrl);
  const editorialDescription = resolveEditorialDescription(selectedWork);
  const resolvedFocal = focalPoint || selectedWork.focalPoint || '50% 50%';

  const clientDisplay =
    getClientArtistDisplay(selectedWork) || 'Original Project';
  const categoryDisplay = cleanFieldValue(selectedWork.category) || 'Film';
  const cleanRuntime = cleanFieldValue(selectedWork.runningTime);
  const baseFormat = isVertical ? '9:16 Vertical' : '16:9 Widescreen';
  const formatDisplay = cleanRuntime
    ? `${isVertical ? '9:16' : '16:9'} · ${cleanRuntime}`
    : baseFormat;
  const releaseDateDisplay = getWorkReleaseDate(selectedWork);

  const activeStills = stillStates
    .map((st, originalIndex) => ({ ...st, originalIndex }))
    .filter((st) => st.status !== 'failed');

  const hasAnyReadyStill = activeStills.some((st) => st.status === 'ready');

  let landscapeCounter = 0;
  let portraitCounter = 0;

  const storyTransitionClass =
    navDirection === 'next'
      ? 'animate-story-next'
      : navDirection === 'prev'
        ? 'animate-story-prev'
        : 'animate-story-init';

  const handleWatchTrigger = () => {
    if (!selectedWork.videoUrl) return;
    if (platform === 'other' && !/\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(selectedWork.videoUrl)) {
      window.open(selectedWork.videoUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setIsPlayingVideo(true);
  };

  const renderPosterStage = (compactTrigger: boolean) => {
    const hasPlayableUrl = Boolean(selectedWork.videoUrl);

    return (
      <div
        role={hasPlayableUrl ? 'button' : undefined}
        tabIndex={hasPlayableUrl ? 0 : undefined}
        onClick={hasPlayableUrl ? handleWatchTrigger : undefined}
        onKeyDown={
          hasPlayableUrl
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleWatchTrigger();
                }
              }
            : undefined
        }
        aria-label={hasPlayableUrl ? `Watch ${selectedWork.title}` : undefined}
        className={`group relative w-full h-full overflow-hidden bg-neutral-950 animate-media-dissolve ${
          hasPlayableUrl ? 'cursor-pointer' : ''
        }`}
      >
        <ModalThumbnail
          item={selectedWork}
          isVertical={isVertical}
          priority
          variant="poster"
          objectPosition={resolvedFocal}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.025]"
        />

        {/* Silent Muted Motion Preview Layer */}
        {previewMedia.kind === 'mp4' && (
          <video
            key={`${selectedWork.id}-teaser-mp4`}
            src={previewMedia.src}
            muted
            loop
            autoPlay
            playsInline
            onCanPlay={() => setTeaserReady(true)}
            style={{ objectPosition: resolvedFocal }}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${
              teaserReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {previewMedia.kind === 'youtube' && !isVertical && (
          <div
            aria-hidden="true"
            className={`hidden md:block absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ease-out ${
              teaserReady ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <iframe
              key={`${selectedWork.id}-teaser-yt`}
              src={previewMedia.src}
              title=""
              tabIndex={-1}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              onLoad={() => {
                window.setTimeout(() => setTeaserReady(true), 420);
              }}
              className="absolute top-1/2 left-1/2 w-[108%] h-[175%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        )}

        {/* Subtle Dark Cinema Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 pointer-events-none" />

        {/* Left-Aligned Monumental `▪ WATCH` Trigger */}
        {hasPlayableUrl && (
          <div
            className={`absolute z-10 flex items-center gap-3 sm:gap-4 select-none ${
              compactTrigger
                ? 'left-5 right-5 bottom-6'
                : 'left-5 sm:left-8 md:left-11 bottom-5 sm:bottom-8 md:bottom-10'
            }`}
          >
            <span className="inline-flex items-center gap-2.5 sm:gap-3.5 text-white transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1.5">
              <span
                aria-hidden="true"
                className="w-2.5 h-5 sm:w-3 sm:h-6 rounded-[2px] bg-white inline-block shrink-0 transition-transform duration-500 group-hover:scale-y-110"
              />
              <span
                className={`font-display tracking-tight uppercase leading-none text-white ${
                  compactTrigger
                    ? 'text-3xl sm:text-4xl'
                    : 'text-3xl sm:text-5xl md:text-[56px]'
                }`}
              >
                {platform === 'other' ? 'WATCH FILM ↗' : 'WATCH'}
              </span>
            </span>

            {cleanRuntime && !compactTrigger && (
              <span className="font-mono-tech text-xs text-white/75 tracking-wider ml-1 self-end mb-1 hidden sm:inline">
                {cleanRuntime}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const externalPlatformLabel =
    platform === 'youtube'
      ? 'Watch on YouTube ↗'
      : platform === 'instagram'
        ? 'Watch on Instagram ↗'
        : platform === 'vimeo'
          ? 'Watch on Vimeo ↗'
          : 'Watch Original Film ↗';

  const nextIsVertical = nextWork ? isWorkItemVertical(nextWork) : false;

  // Show bottom-right floating `CLOSE` ONLY after user scrolls past the header/intro area (and hide while closing)
  const showFloatingBottomRightClose = hasScrolledDown && !isClosingSheet;

  return createPortal(
    <div className="fixed inset-0 z-[2000] pointer-events-auto">
      {/* Subtle Dimming Scrim Behind the Rising White Sheet */}
      <div
        aria-hidden="true"
        onClick={triggerSmoothClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isClosingSheet ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Rising White Sheet Container (`1.08s cubic-bezier(0.23, 1, 0.32, 1)` — Silky, unhurried architectural rise!) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleSheetScroll}
        role="dialog"
        aria-modal="true"
        aria-label={selectedWork.title}
        className={`fixed inset-0 z-[2010] bg-white text-neutral-950 overflow-y-auto overscroll-contain selection:bg-neutral-950 selection:text-white shadow-[0_-24px_80px_rgba(0,0,0,0.35)] ${
          isClosingSheet ? 'animate-sheet-lower' : 'animate-sheet-rise'
        }`}
      >
        <article
          key={selectedWork.id}
          className={`w-full px-3 sm:px-5 md:px-7 lg:px-9 pt-4 md:pt-6 pb-32 ${storyTransitionClass}`}
        >
          {/* 1. Header Bar Inside Case Study */}
          <header className="flex items-center justify-between gap-4 pb-4 md:pb-6">
            <button
              type="button"
              onClick={triggerSmoothClose}
              className="font-display text-xl sm:text-2xl md:text-[26px] tracking-tight uppercase text-neutral-950 hover:opacity-70 transition-opacity cursor-pointer"
            >
              TWOONG STUDIO
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F4F2] px-4 py-1.5 font-mono-tech text-[11px] uppercase text-neutral-600 border border-black/5">
                <button
                  type="button"
                  onClick={onPrev}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  ← PREV
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  type="button"
                  onClick={onNext}
                  className="hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  NEXT →
                </button>
              </div>

              <button
                type="button"
                onClick={triggerSmoothClose}
                className="rounded-full bg-[#F4F4F2] hover:bg-neutral-950 hover:text-white px-4 py-1.5 font-mono-tech text-[11px] uppercase text-neutral-950 border border-black/5 transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </header>

          {/* 2. Top Full-Bleed Video Stage (`▪ WATCH` -> Minimal Scrub Bar Player with Zero Overlapping CLOSE Bug!) */}
          <section aria-label="Project Film">
            {!isVertical ? (
              <div
                className={`w-full ${
                  isPlayingVideo
                    ? 'aspect-video'
                    : 'aspect-video sm:aspect-[2.1/1] lg:aspect-[2.37/1]'
                } rounded-[10px] overflow-hidden bg-neutral-950 relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`}
              >
                {isPlayingVideo ? (
                  <MinimalScrubPlayer
                    key={`${selectedWork.id}-scrub-player`}
                    videoUrl={selectedWork.videoUrl}
                    title={selectedWork.title}
                  />
                ) : (
                  renderPosterStage(false)
                )}

                {platform === 'instagram' && selectedWork.videoUrl && !isPlayingVideo && (
                  <a
                    href={selectedWork.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-mono-tech text-[10px] uppercase tracking-[0.14em] backdrop-blur-md border border-white/20 transition-colors"
                  >
                    Open on Instagram ↗
                  </a>
                )}
              </div>
            ) : (
              <div className="w-full rounded-[10px] bg-neutral-950 py-6 md:py-10 flex items-center justify-center relative overflow-hidden">
                <div className="aspect-[9/16] h-[68vh] md:h-[78vh] max-w-[90vw] rounded-[10px] overflow-hidden bg-black shadow-2xl relative z-10 border border-white/10">
                  {isPlayingVideo ? (
                    <MinimalScrubPlayer
                      key={`${selectedWork.id}-scrub-player-v`}
                      videoUrl={selectedWork.videoUrl}
                      title={selectedWork.title}
                    />
                  ) : (
                    renderPosterStage(true)
                  )}
                </div>

                {platform === 'instagram' && selectedWork.videoUrl && (
                  <a
                    href={selectedWork.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono-tech text-[10px] uppercase tracking-[0.14em] backdrop-blur-md border border-white/15 transition-colors"
                  >
                    Open Reel ↗
                  </a>
                )}
              </div>
            )}
          </section>

          {/* 3. 2-Column Split: Giant Condensed Title (Left) + Narrative Summary (Right) */}
          <section className="py-12 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start px-1">
            <div className="md:col-span-6">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-[0.94] tracking-tight text-neutral-950 uppercase break-keep">
                {selectedWork.title}
              </h1>
            </div>

            <div className="md:col-span-5 md:col-start-8 md:pt-1">
              <p className="text-[15px] md:text-[17px] text-neutral-700 font-normal leading-[1.7] whitespace-pre-line break-keep">
                {editorialDescription}
              </p>
            </div>
          </section>

          {/* 4. Top Metadata Hairline Grid (`Client` | `Category` | `Format` | `Release Date`) */}
          <section aria-label="Project Metadata">
            <dl className="m-0 border-t border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-8 px-1">
              <div>
                <dt className="block font-mono-tech text-xs text-neutral-400 mb-2">
                  Client / Artist
                </dt>
                <dd className="m-0 text-[15px] md:text-base text-neutral-900 font-normal leading-snug break-keep">
                  {clientDisplay}
                </dd>
              </div>

              <div>
                <dt className="block font-mono-tech text-xs text-neutral-400 mb-2">
                  Category
                </dt>
                <dd className="m-0 text-[15px] md:text-base text-neutral-900 font-normal leading-snug">
                  {categoryDisplay}
                </dd>
              </div>

              <div>
                <dt className="block font-mono-tech text-xs text-neutral-400 mb-2">
                  Format
                </dt>
                <dd className="m-0 text-[15px] md:text-base text-neutral-900 font-normal leading-snug tabular-nums">
                  {formatDisplay}
                </dd>
              </div>

              <div>
                <dt className="block font-mono-tech text-xs text-neutral-400 mb-2">
                  Release Date
                </dt>
                <dd className="m-0 text-[15px] md:text-base text-neutral-900 font-normal leading-snug tabular-nums">
                  {releaseDateDisplay}
                </dd>
              </div>
            </dl>
          </section>

          {/* 5. `HOW I WORKED` (`Pre | Production | Post` — Pure `my_role` Only!) */}
          <section
            ref={howRef}
            className={`section-choreo ${isHowVisible ? 'is-inview' : ''} py-14 md:py-24 px-1`}
          >
            <h2 className="font-display text-3xl md:text-[44px] tracking-tight text-neutral-950 uppercase mb-8 o-line-mask">
              <span className="o-line-item">HOW I WORKED</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-8">
              {stages.map((stage, sIdx) => (
                <div
                  key={stage.label}
                  style={{ transitionDelay: `${160 + sIdx * 180}ms` }}
                  className="choreo-fade border-t border-neutral-200 pt-4"
                >
                  <h3 className="font-mono-tech text-[13px] text-neutral-400 mb-3 o-line-mask !pb-0.5">
                    <span
                      className="o-line-item"
                      style={{ transitionDelay: `${180 + sIdx * 180}ms` }}
                    >
                      {stage.label}
                    </span>
                  </h3>

                  {stage.items.length > 0 ? (
                    <ul className="space-y-1">
                      {stage.items.map((item, idx) => (
                        <li
                          key={`${stage.label}-${idx}`}
                          className="text-[14px] md:text-[15px] text-neutral-900 leading-[1.55]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[14px] text-neutral-300 leading-[1.55] select-none">
                      —
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 6. Full-Bleed Captured Scene Stills Gallery */}
          {activeStills.length > 0 && (
            <section
              aria-label="Captured Scene Stills"
              className={
                hasAnyReadyStill
                  ? 'py-4 md:py-10 grid grid-cols-1 md:grid-cols-12 gap-y-6 sm:gap-y-10 md:gap-y-14 md:gap-x-6 items-start'
                  : 'h-0 overflow-hidden opacity-0 pointer-events-none'
              }
            >
              {activeStills.map((still) => {
                const placementClass = still.isPortrait
                  ? PORTRAIT_GRID_CLASSES[portraitCounter++ % PORTRAIT_GRID_CLASSES.length]
                  : LANDSCAPE_GRID_CLASSES[
                      landscapeCounter++ % LANDSCAPE_GRID_CLASSES.length
                    ];

                return (
                  <figure
                    key={`${selectedWork.id}-still-${still.originalIndex}`}
                    className={`${placementClass} rounded-[10px] overflow-hidden bg-neutral-100 group transition-opacity duration-700 ${
                      still.status === 'ready' ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={still.src}
                      alt={`${selectedWork.title} — Scene ${still.originalIndex + 1}`}
                      loading="lazy"
                      onLoad={(e) => handleStillLoad(still.originalIndex, e)}
                      onError={() => triggerStillFallbackOrHide(still.originalIndex)}
                      className={`w-full ${
                        still.isPortrait ? 'h-auto' : 'aspect-video md:aspect-[2.37/1]'
                      } block object-cover object-center transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.02]`}
                    />
                  </figure>
                );
              })}
            </section>
          )}

          {/* 7. True Film End `CREDITS` Section */}
          {(creditsList.length > 0 || isMeaningfulValue(selectedWork.videoUrl)) && (
            <section
              ref={creditsRef}
              className={`section-choreo ${isCreditsVisible ? 'is-inview' : ''} pt-14 md:pt-24 px-1`}
            >
              <h2 className="font-display text-3xl md:text-[44px] uppercase text-neutral-950 mb-8 o-line-mask">
                <span className="o-line-item">CREDITS</span>
              </h2>

              {creditsList.length > 0 && (
                <dl
                  style={{ transitionDelay: '140ms' }}
                  className="m-0 choreo-fade border-t border-neutral-200 pt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8"
                >
                  {creditsList.map((credit, idx) => (
                    <div key={`${credit.role}-${idx}`}>
                      <dt className="block font-mono-tech text-xs text-neutral-400 mb-1.5">
                        {credit.role}
                      </dt>
                      <dd className="m-0 block text-[15px] md:text-base font-medium text-neutral-950 leading-snug break-keep">
                        {credit.name}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {isMeaningfulValue(selectedWork.videoUrl) && (
                <div className="mt-10 choreo-fade" style={{ transitionDelay: '220ms' }}>
                  <a
                    href={selectedWork.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.12em] text-neutral-500 hover:text-neutral-950 transition-colors"
                  >
                    {externalPlatformLabel}
                  </a>
                </div>
              )}
            </section>
          )}

          {/* 8. Interactive `NEXT STORY` Cinema Card Transition */}
          {nextWork && (
            <footer
              ref={nextStoryRef}
              className={`section-choreo ${isNextStoryVisible ? 'is-inview' : ''} border-t border-neutral-200 mt-16 md:mt-24 pt-12 md:pt-20 px-1`}
            >
              <button
                type="button"
                onClick={onNext}
                className="choreo-fade group relative w-full text-left rounded-[12px] p-5 sm:p-8 md:p-10 bg-[#F9F9F8] hover:bg-neutral-950 border border-neutral-200 hover:border-neutral-950 transition-colors duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8 cursor-pointer overflow-hidden"
              >
                <div className="max-w-3xl relative z-10">
                  <span className="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.16em] text-neutral-400 group-hover:text-white/60 transition-colors mb-3 md:mb-4">
                    <span>NEXT STORY</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2">
                      →
                    </span>
                  </span>

                  <h3 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[64px] text-neutral-950 group-hover:text-white uppercase leading-[0.92] tracking-tight transition-all duration-300 ease-out group-hover:translate-x-2 break-keep">
                    {nextWork.title}
                  </h3>

                  <p className="mt-3 font-mono-tech text-xs text-neutral-500 group-hover:text-white/70 transition-colors tracking-wide">
                    {getInsideCardMeta(nextWork, nextIsVertical)}
                  </p>
                </div>

                <div
                  className={`relative z-10 shrink-0 overflow-hidden rounded-[10px] bg-neutral-950 shadow-md transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04] ${
                    nextIsVertical
                      ? 'w-28 sm:w-32 aspect-[9/16]'
                      : 'w-full sm:w-72 md:w-84 aspect-[16/9]'
                  }`}
                >
                  <ModalThumbnail
                    key={nextWork.id}
                    item={nextWork}
                    isVertical={nextIsVertical}
                    variant="compact"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </button>
            </footer>
          )}
        </article>

        {/* Bottom-Right Floating `CLOSE` Pill:
            - Relocated from bottom-center to bottom-right (`right-6 sm:right-8 bottom-6`)
            - Automatically hides while watching the top video (`isPlayingVideo && !hasScrolledDown`) so it NEVER overlaps the video or scrub bar! */}
        <button
          type="button"
          onClick={triggerSmoothClose}
          className={`hidden md:inline-flex fixed bottom-6 right-6 lg:right-9 z-[2060] px-4.5 py-2 rounded-full bg-neutral-950/92 backdrop-blur-md text-white font-mono-tech text-[11px] font-semibold tracking-[0.14em] uppercase shadow-xl border border-white/15 hover:bg-neutral-800 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer ${
            showFloatingBottomRightClose
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          CLOSE ✕
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ProjectDetailModal;
