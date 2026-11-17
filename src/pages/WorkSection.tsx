import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Category, WorkType, WorkItem } from '../data/types';
import { useWorkItems } from '../integrations/useWorkItems';
import { useSiteTexts } from '../integrations/useSiteTexts';
import { useIntersectionObserver } from '../integrations/useIntersectionObserver';
import ProjectDetailModal from '../modals/ProjectDetailModal';
import MutedYouTubeTeaser from '../ui/MutedYouTubeTeaser';
import {
  buildThumbnailCandidates,
  getClientArtistDisplay,
  getInsideCardMeta,
  getListRoleAndCategory,
  getMutedPreviewEmbedUrl,
  getPrimaryEntityLabel,
  isWorkItemVertical,
  isYouTubePlaceholderDimension,
} from './workLayoutEngine';

type WorksViewMode = 'cinema' | 'list';
type TrackFilter = 'All' | WorkType;
type FormatFilter = 'horizontal' | 'vertical';

const PREDEFINED_CATEGORY_ORDER = [
  'Official MV',
  'Unofficial MV',
  'Dance Film',
  'Dance Cover',
  'Web Drama',
  'Short Movie',
  'Concept Video',
];

const parseCropMap = (raw?: string): Record<string, string> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore malformed JSON
  }
  return {};
};

const parseOrientationMap = (raw?: string): Record<string, 'horizontal' | 'vertical'> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const cleaned: Record<string, 'horizontal' | 'vertical'> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v === 'horizontal' || v === 'vertical') {
          cleaned[k] = v;
        }
      }
      return cleaned;
    }
  } catch {
    // ignore malformed JSON
  }
  return {};
};

const parsePosNumbers = (pos: string): { x: number; y: number } => {
  const matches = pos.match(/(-?\d+(?:\.\d+)?)%/g);
  if (matches && matches.length >= 2) {
    return {
      x: Math.min(100, Math.max(0, parseFloat(matches[0]))),
      y: Math.min(100, Math.max(0, parseFloat(matches[1]))),
    };
  }
  return { x: 50, y: 50 };
};

const parseWorkHashId = (hash: string): string | null => {
  if (!hash || !hash.startsWith('#work/')) return null;
  const raw = hash.slice('#work/'.length).trim();
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const syncUrlWorkHash = (workId: string | null, pushHistory: boolean): void => {
  if (typeof window === 'undefined') return;

  if (workId) {
    const nextHash = `#work/${encodeURIComponent(workId)}`;
    if (window.location.hash === nextHash) return;
    try {
      if (pushHistory) {
        window.history.pushState(null, '', nextHash);
      } else {
        window.history.replaceState(null, '', nextHash);
      }
    } catch {
      window.location.hash = nextHash;
    }
    return;
  }

  if (window.location.hash.startsWith('#work/')) {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    try {
      window.history.replaceState(null, '', cleanUrl || '#');
    } catch {
      window.location.hash = '';
    }
  }
};

const getTrackBadgeMeta = (type: WorkType) => {
  if (type === 'Created') {
    return {
      short: 'PERSONAL',
      detail: '연출 · 주도',
      pillClass:
        'bg-white/92 text-neutral-950 border border-white/40 shadow-xs backdrop-blur-md',
    };
  }
  return {
    short: 'PARTICIPATION',
    detail: '스태프 참여',
    pillClass:
      'bg-black/60 text-white border border-white/25 shadow-xs backdrop-blur-md',
  };
};

interface WorkThumbnailProps {
  item: WorkItem;
  isVertical?: boolean;
  priority?: boolean;
  variant?: 'card' | 'compact';
  className?: string;
  objectPosition?: string;
  onDimensionsDetected?: (workId: string, naturalWidth: number, naturalHeight: number) => void;
}

const WorkThumbnail: React.FC<WorkThumbnailProps> = ({
  item,
  isVertical = false,
  priority = false,
  variant = 'card',
  className = '',
  objectPosition = '50% 50%',
  onDimensionsDetected,
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
        return;
      }
      if (onDimensionsDetected && img.naturalWidth > 0 && img.naturalHeight > 0) {
        onDimensionsDetected(item.id, img.naturalWidth, img.naturalHeight);
      }
    },
    [advanceFallback, candidates, candidateIdx, item.id, onDimensionsDetected]
  );

  if (failed || candidates.length === 0) {
    const entity = getPrimaryEntityLabel(item);
    const slateFormatLabel = isVertical ? '9:16 REEL' : '16:9 FILM';

    if (variant === 'compact') {
      return (
        <div className="w-full h-full bg-neutral-900 flex flex-col justify-between p-4 select-none relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 60%)',
            }}
          />
          <div className="relative z-10 flex items-center justify-between gap-2 font-mono-tech text-[9px] tracking-[0.18em] uppercase text-white/45">
            <span>TWOONG STUDIO</span>
            <span>{slateFormatLabel}</span>
          </div>
          <div className="relative z-10">
            {entity && (
              <p className="font-mono-tech text-[10px] text-white/55 truncate mb-0.5">
                {entity}
              </p>
            )}
            <p className="text-xs font-semibold text-white leading-snug line-clamp-2">
              {item.title}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-neutral-900 relative overflow-hidden select-none flex flex-col justify-between p-5 sm:p-7">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(110% 90% at 50% 35%, rgba(38,38,42,0.95) 0%, rgba(10,10,12,1) 100%)',
          }}
        />
        <div className="absolute inset-4 sm:inset-5 rounded-xl border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 pt-6">
          <span className="font-mono-tech text-[10px] tracking-[0.22em] uppercase text-white/40">
            TWOONG STUDIO
          </span>
          <span className="font-mono-tech text-[10px] tracking-[0.18em] uppercase text-white/65 px-2.5 py-0.5 rounded bg-white/[0.06] border border-white/10">
            {slateFormatLabel}
          </span>
        </div>

        <div className="relative z-10 my-auto pb-8 flex flex-col items-center justify-center text-center px-4">
          {entity && (
            <span className="font-mono-tech text-[11px] tracking-[0.2em] uppercase text-white/50 mb-2">
              {entity}
            </span>
          )}
          <span className="font-display text-2xl sm:text-3xl md:text-4xl text-white/[0.18] uppercase tracking-tight leading-[0.95] line-clamp-2 max-w-[18ch]">
            {item.title}
          </span>
        </div>

        <div className="h-4" />
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
      style={{ objectPosition }}
      className={className}
    />
  );
};

interface InteractiveCropOverlayProps {
  focalPoint: string;
  onUpdateFocal: (nextPos: string) => void;
  isVerticalCard: boolean;
  onToggleOrientation: () => void;
}

/**
 * In-Browser Drag, Preset Focal Point & Orientation Controller (Active during `isEditMode` OR `isCropMode`)
 */
const InteractiveCropOverlay: React.FC<InteractiveCropOverlayProps> = ({
  focalPoint,
  onUpdateFocal,
  isVerticalCard,
  onToggleOrientation,
}) => {
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { x, y } = parsePosNumbers(focalPoint);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (ev: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = ev.clientX - start.clientX;
      const dy = ev.clientY - start.clientY;
      // Dragging image downward pulls upper part into frame (decreases Y%)
      const nextX = Math.round(
        Math.min(100, Math.max(0, start.startX - (dx / Math.max(120, start.width)) * 100))
      );
      const nextY = Math.round(
        Math.min(100, Math.max(0, start.startY - (dy / Math.max(120, start.height)) * 140))
      );
      onUpdateFocal(`${nextX}% ${nextY}%`);
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, onUpdateFocal]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        dragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          startX: x,
          startY: y,
          width: rect.width,
          height: rect.height,
        };
        setIsDragging(true);
      }}
      className={`absolute inset-0 z-30 border-2 border-dashed border-white/80 bg-black/20 flex flex-col justify-between p-4 touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Rule-of-Thirds Framing Grid */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-35">
        <div className="border-r border-b border-white/50" />
        <div className="border-r border-b border-white/50" />
        <div className="border-b border-white/50" />
        <div className="border-r border-b border-white/50" />
        <div className="border-r border-b border-white/50" />
        <div className="border-b border-white/50" />
        <div className="border-r border-white/50" />
        <div className="border-r border-white/50" />
        <div />
      </div>

      {/* Top Bar: Drag Hint + Live X/Y Coordinates + Quick Presets */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <span className="px-3 py-1 rounded-full bg-neutral-950/90 text-white font-mono-tech text-[10.5px] tracking-[0.08em] shadow-md">
          ✥ 드래그하여 보여줄 위치 이동 ({x}% · {y}%)
        </span>

        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex flex-wrap items-center gap-1 rounded-full bg-neutral-950/90 p-1 shadow-md border border-white/15"
        >
          {[
            { label: '상단', pos: '50% 15%' },
            { label: '중앙', pos: '50% 50%' },
            { label: '하단', pos: '50% 85%' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateFocal(preset.pos);
              }}
              className={`px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] transition-colors cursor-pointer ${
                focalPoint === preset.pos
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <span className="h-3 w-px bg-white/20 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOrientation();
            }}
            title="가로 와이드 카드와 세로 9:16 릴스 카드 간 배치를 전환합니다"
            className="px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] text-amber-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            {isVerticalCard ? '↔ 가로 전환' : '↕ 세로 전환'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface WidescreenStoryCardProps {
  item: WorkItem;
  priority?: boolean;
  focalPoint: string;
  isFramingActive: boolean;
  isAutoPreviewActive?: boolean;
  isCascadeResetting?: boolean;
  cascadeDelayMs?: number;
  onUpdateFocal: (id: string, pos: string) => void;
  onToggleOrientation: (id: string) => void;
  onDimensionsDetected: (id: string, w: number, h: number) => void;
  onSelect: (item: WorkItem) => void;
}

/**
 * Full-Bleed Cinema Card with:
 * 1. Bidirectional Scroll Reveal Entrance (`cubic-bezier(0.165, 0.84, 0.44, 1)`) + Track Cascade Wave
 * 2. Wow Tapes Inner Media Parallax (`-7.5%` oversize + live scroll RAF shift)
 * 3. Per-Card Custom Focal Point (`object-position`) & Drag-to-Reposition Framing + Orientation Toggle
 */
const WidescreenStoryCard: React.FC<WidescreenStoryCardProps> = ({
  item,
  priority = false,
  focalPoint,
  isFramingActive,
  isAutoPreviewActive = false,
  isCascadeResetting = false,
  cascadeDelayMs = 0,
  onUpdateFocal,
  onToggleOrientation,
  onDimensionsDetected,
  onSelect,
}) => {
  const rightMeta = getInsideCardMeta(item, false);
  const badge = getTrackBadgeMeta(item.type);
  const previewMedia = useMemo(
    () => getMutedPreviewEmbedUrl(item),
    [item.id, item.videoUrl, item.previewUrl]
  );

  const [revealRef, isRevealed] = useIntersectionObserver({ threshold: 0.06, once: false });
  const articleRef = useRef<HTMLElement | null>(null);
  const parallaxLayerRef = useRef<HTMLDivElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  const shouldShowPreview =
    (isHovered || isAutoPreviewActive) && !isFramingActive && !previewFailed;

  useEffect(() => {
    setIsPreviewPlaying(false);
    setPreviewFailed(false);
  }, [item.id, previewMedia.src]);

  useEffect(() => {
    if (!shouldShowPreview) {
      setIsPreviewPlaying(false);
    }
  }, [shouldShowPreview]);

  const setCombinedRef = useCallback(
    (node: HTMLElement | null) => {
      articleRef.current = node;
      revealRef(node);
    },
    [revealRef]
  );

  // Wow Tapes Inner Media Scroll Parallax (`top: -7.5%`, `bottom: -7.5%`, GPU `translate3d(0, y, 0)`)
  useEffect(() => {
    let rafId = 0;

    const updateParallax = () => {
      const card = articleRef.current;
      const media = parallaxLayerRef.current;
      if (!card || !media) return;

      // Freeze parallax while user is actively dragging crop position so framing is 1:1 exact
      if (isFramingActive) {
        media.style.transform = 'translate3d(0, 0px, 0)';
        return;
      }

      const rect = card.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      if (rect.bottom < -120 || rect.top > vh + 120) return;

      const cardCenter = rect.top + rect.height * 0.5;
      const norm = Math.max(-1, Math.min(1, (cardCenter - vh * 0.5) / (vh * 0.65)));
      const shiftPx = -norm * Math.min(42, rect.height * 0.075);
      media.style.transform = `translate3d(0, ${shiftPx.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [isFramingActive]);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches) return;
    if (isFramingActive || previewMedia.kind === 'none' || previewFailed) return;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, 90);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
    setIsPreviewPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <article
      ref={setCombinedRef}
      data-work-card-id={item.id}
      onClick={() => {
        if (!isFramingActive) onSelect(item);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        !isCascadeResetting && isRevealed && cascadeDelayMs > 0
          ? { transitionDelay: `${cascadeDelayMs}ms` }
          : undefined
      }
      className={`work-card-reveal ${
        isCascadeResetting ? 'is-cascade-reset' : isRevealed ? 'is-inview' : ''
      } group relative w-full aspect-[16/9] sm:aspect-[2.35/1] md:aspect-[3.1/1] lg:aspect-[3.65/1] rounded-[10px] overflow-hidden bg-neutral-950 cursor-pointer select-none`}
    >
      {/* Inner Oversized Parallax Media Layer (`-top-[7.5%] -bottom-[7.5%]` just like `wowtapes.com` `.c-works__item-media`!) */}
      <div
        ref={parallaxLayerRef}
        className="absolute inset-x-0 -top-[7.5%] -bottom-[7.5%] will-change-transform"
      >
        <WorkThumbnail
          item={item}
          isVertical={false}
          priority={priority}
          variant="card"
          objectPosition={focalPoint}
          onDimensionsDetected={onDimensionsDetected}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
        />

        {previewMedia.kind === 'mp4' && shouldShowPreview && (
          <video
            src={previewMedia.src}
            width={1280}
            height={720}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            onCanPlay={() => setIsPreviewPlaying(true)}
            onPlaying={() => setIsPreviewPlaying(true)}
            onError={() => setPreviewFailed(true)}
            style={{ objectPosition: focalPoint }}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${
              isPreviewPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {previewMedia.kind === 'youtube' && isHovered && !isFramingActive && (
          <MutedYouTubeTeaser
            videoUrl={item.videoUrl}
            cropClassName="absolute top-1/2 left-1/2 w-[116%] h-[230%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            className="hidden md:block"
          />
        )}
      </div>

      {/* Subtle Bottom Gradient Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10 pointer-events-none" />

      {/* Top-Left Track Indicator Badge (`PERSONAL` vs `PARTICIPATION`) */}
      {!isFramingActive && (
        <div
          className={`absolute left-5 sm:left-8 md:left-10 top-4 sm:top-6 z-10 pointer-events-none transition-all duration-[1100ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isRevealed ? 'opacity-100 translate-y-0 delay-[140ms]' : 'opacity-0 -translate-y-2 delay-0'
          }`}
        >
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono-tech text-[10px] font-semibold tracking-[0.12em] uppercase ${badge.pillClass}`}
          >
            <span>{badge.short}</span>
            <span className="opacity-65 hidden sm:inline">· {badge.detail}</span>
          </span>
        </div>
      )}

      {/* Inside-Card Bottom Split Typography */}
      <div
        className={`absolute left-5 sm:left-8 md:left-10 right-5 sm:right-8 md:right-10 bottom-5 sm:bottom-7 md:bottom-8 z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-6 pointer-events-none transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isRevealed ? 'opacity-100 translate-y-0 delay-[180ms]' : 'opacity-0 translate-y-4 delay-0'
        }`}
      >
        <h3 className="text-lg sm:text-2xl md:text-[27px] font-semibold tracking-tight text-white drop-shadow-xs leading-snug break-keep transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1.5">
          {item.title}
        </h3>
        <span className="font-mono-tech text-xs sm:text-[13px] text-white/90 tracking-wide shrink-0">
          {rightMeta}
        </span>
      </div>

      {/* Interactive Drag-to-Crop Focal Point & Orientation Overlay */}
      {isFramingActive && (
        <InteractiveCropOverlay
          focalPoint={focalPoint}
          onUpdateFocal={(pos) => onUpdateFocal(item.id, pos)}
          isVerticalCard={false}
          onToggleOrientation={() => onToggleOrientation(item.id)}
        />
      )}
    </article>
  );
};

interface VerticalReelCardProps {
  item: WorkItem;
  index?: number;
  focalPoint: string;
  isFramingActive: boolean;
  isAutoPreviewActive?: boolean;
  isCascadeResetting?: boolean;
  cascadeDelayMs?: number;
  onUpdateFocal: (id: string, pos: string) => void;
  onToggleOrientation: (id: string) => void;
  onDimensionsDetected: (id: string, w: number, h: number) => void;
  onSelect: (item: WorkItem) => void;
}

const VerticalReelCard: React.FC<VerticalReelCardProps> = ({
  item,
  index = 0,
  focalPoint,
  isFramingActive,
  isAutoPreviewActive = false,
  isCascadeResetting = false,
  cascadeDelayMs = 0,
  onUpdateFocal,
  onToggleOrientation,
  onDimensionsDetected,
  onSelect,
}) => {
  const rightMeta = getInsideCardMeta(item, true);
  const badge = getTrackBadgeMeta(item.type);
  const previewMedia = useMemo(
    () => getMutedPreviewEmbedUrl(item),
    [item.id, item.videoUrl, item.previewUrl]
  );
  const [revealRef, isRevealed] = useIntersectionObserver({ threshold: 0.06, once: false });
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const effectiveDelayMs = cascadeDelayMs > 0 ? cascadeDelayMs : (index % 4) * 105;

  const shouldShowPreview =
    (isHovered || isAutoPreviewActive) && !isFramingActive && !previewFailed;

  useEffect(() => {
    setIsPreviewPlaying(false);
    setPreviewFailed(false);
  }, [item.id, previewMedia.src]);

  useEffect(() => {
    if (!shouldShowPreview) {
      setIsPreviewPlaying(false);
    }
  }, [shouldShowPreview]);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches) return;
    if (isFramingActive || previewMedia.kind !== 'mp4' || previewFailed) return;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, 90);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
    setIsPreviewPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <article
      ref={revealRef}
      data-work-card-id={item.id}
      onClick={() => {
        if (!isFramingActive) onSelect(item);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        !isCascadeResetting && isRevealed && effectiveDelayMs > 0
          ? { transitionDelay: `${effectiveDelayMs}ms` }
          : undefined
      }
      className={`work-card-reveal ${
        isCascadeResetting ? 'is-cascade-reset' : isRevealed ? 'is-inview' : ''
      } group relative w-full aspect-[9/16] rounded-[10px] overflow-hidden bg-neutral-950 cursor-pointer select-none`}
    >
      <WorkThumbnail
        item={item}
        isVertical
        variant="card"
        objectPosition={focalPoint}
        onDimensionsDetected={onDimensionsDetected}
        className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
      />

      {previewMedia.kind === 'mp4' && shouldShowPreview && (
        <video
          src={previewMedia.src}
          width={540}
          height={960}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          onCanPlay={() => setIsPreviewPlaying(true)}
          onPlaying={() => setIsPreviewPlaying(true)}
          onError={() => setPreviewFailed(true)}
          style={{ objectPosition: focalPoint }}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${
            isPreviewPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

      {!isFramingActive && (
        <div
          className={`absolute left-4 sm:left-5 top-4 sm:top-5 z-10 pointer-events-none transition-all duration-[1100ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isRevealed ? 'opacity-100 translate-y-0 delay-[140ms]' : 'opacity-0 -translate-y-2 delay-0'
          }`}
        >
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono-tech text-[9.5px] font-semibold tracking-[0.12em] uppercase ${badge.pillClass}`}
          >
            <span>{badge.short}</span>
          </span>
        </div>
      )}

      <div
        className={`absolute left-5 sm:left-6 right-5 sm:right-6 bottom-5 sm:bottom-6 z-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3 pointer-events-none transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isRevealed ? 'opacity-100 translate-y-0 delay-[180ms]' : 'opacity-0 translate-y-4 delay-0'
        }`}
      >
        <h3 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-white drop-shadow-xs leading-snug break-keep">
          {item.title}
        </h3>
        <span className="font-mono-tech text-[11px] sm:text-xs text-white/90 tracking-wide shrink-0">
          {rightMeta}
        </span>
      </div>

      {isFramingActive && (
        <InteractiveCropOverlay
          focalPoint={focalPoint}
          onUpdateFocal={(pos) => onUpdateFocal(item.id, pos)}
          isVerticalCard={true}
          onToggleOrientation={() => onToggleOrientation(item.id)}
        />
      )}
    </article>
  );
};

interface ListArchiveRowProps {
  item: WorkItem;
  index?: number;
  isHovered: boolean;
  isDimmed: boolean;
  isCascadeResetting?: boolean;
  cascadeDelayMs?: number;
  onHover: (
    item: WorkItem,
    e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>
  ) => void;
  onSelect: (item: WorkItem) => void;
}

const ListArchiveRow: React.FC<ListArchiveRowProps> = ({
  item,
  index = 0,
  isDimmed,
  isCascadeResetting = false,
  cascadeDelayMs = 0,
  onHover,
  onSelect,
}) => {
  const [rowRef, isRowVisible] = useIntersectionObserver({ threshold: 0.04, once: false });
  const clientArtist =
    getClientArtistDisplay(item) ||
    (item.type === 'Created' ? 'Original Project' : '—');
  const roleAndCategory = getListRoleAndCategory(item);
  const effectiveDelayMs = cascadeDelayMs > 0 ? cascadeDelayMs : Math.min(index, 14) * 55;

  return (
    <div
      ref={rowRef}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return;
        onHover(item, e);
      }}
      onMouseEnter={(e) => onHover(item, e)}
      onMouseMove={(e) => onHover(item, e)}
      onClick={() => onSelect(item)}
      style={
        !isCascadeResetting && isRowVisible && effectiveDelayMs > 0
          ? { transitionDelay: `${effectiveDelayMs}ms` }
          : undefined
      }
      className={`work-card-reveal pointer-events-auto ${
        isCascadeResetting ? 'is-cascade-reset' : isRowVisible ? 'is-inview' : ''
      } group py-4 md:py-5 px-1 sm:px-2 cursor-pointer select-none`}
    >
      <div
        className={`transition-opacity duration-300 ${
          isDimmed ? 'md:opacity-45' : 'opacity-100'
        }`}
      >
      <div className="hidden md:grid md:grid-cols-12 gap-6 items-center">
        <div className="col-span-5 min-w-0 flex items-center gap-3">
          <span
            className={`shrink-0 px-2 py-0.5 rounded font-mono-tech text-[9.5px] font-semibold uppercase tracking-[0.08em] ${
              item.type === 'Created'
                ? 'bg-neutral-950 text-white'
                : 'bg-[#F4F4F2] text-neutral-600 border border-black/10'
            }`}
          >
            {item.type === 'Created' ? 'PERSONAL' : 'PARTICIPATION'}
          </span>
          <span className="block text-base lg:text-[18px] font-semibold tracking-tight text-neutral-950 truncate transition-transform duration-300 group-hover:translate-x-1">
            {item.title}
          </span>
        </div>

        <div className="col-span-3 min-w-0">
          <span className="block text-sm text-neutral-600 truncate">
            {clientArtist}
          </span>
        </div>

        <div className="col-span-3 min-w-0">
          <span className="block font-mono-tech text-xs text-neutral-500 truncate">
            {roleAndCategory}
          </span>
        </div>

        <div className="col-span-1 flex items-center justify-end gap-2">
          <span className="font-mono-tech text-xs text-neutral-400 tabular-nums hidden xl:inline">
            {item.year || ''}
          </span>
          <span className="w-8 h-8 rounded-md bg-neutral-950 text-white group-hover:translate-x-0.5 transition-transform flex items-center justify-center text-xs shrink-0">
            ↗
          </span>
        </div>
      </div>

      <div className="flex md:hidden items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`shrink-0 px-2 py-0.5 rounded font-mono-tech text-[9px] font-semibold uppercase tracking-[0.08em] ${
                item.type === 'Created'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-[#F4F4F2] text-neutral-600 border border-black/10'
              }`}
            >
              {item.type === 'Created' ? 'PERSONAL' : 'PARTICIPATION'}
            </span>
            <span className="font-mono-tech text-[11px] text-neutral-400 truncate">
              {item.category}
            </span>
          </div>
          <span className="block text-[15px] sm:text-base font-semibold text-neutral-950 truncate">
            {item.title}
          </span>
          <span className="block mt-0.5 font-mono-tech text-[11px] text-neutral-500 truncate">
            {clientArtist !== '—' ? clientArtist : roleAndCategory}
          </span>
        </div>

        <span className="w-8 h-8 shrink-0 rounded-md bg-neutral-950 text-white flex items-center justify-center text-xs">
          ↗
        </span>
      </div>
      </div>
    </div>
  );
};

const WorkSection: React.FC = () => {
  const { items: workItems, loading, error } = useWorkItems();
  const { texts, updateText, isEditMode } = useSiteTexts();

  const [headerRef, isHeaderVisible] = useIntersectionObserver({ threshold: 0.06, once: false });
  const [tracksRef, isTracksVisible] = useIntersectionObserver({ threshold: 0.08, once: false });

  const [activeTrack, setActiveTrack] = useState<TrackFilter>('All');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('horizontal');
  const [viewMode, setViewMode] = useState<WorksViewMode>('cinema');

  // Dedicated Admin-Only Image Framing & Orientation Adjuster Toggle
  const [isCropAdjustMode, setIsCropAdjustMode] = useState(false);

  useEffect(() => {
    if (!isEditMode || viewMode !== 'cinema') {
      setIsCropAdjustMode(false);
    }
  }, [isEditMode, viewMode]);
  const [localCropMap, setLocalCropMap] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('tw_work_crop_positions_v1');
      return saved ? parseCropMap(saved) : {};
    } catch {
      return {};
    }
  });

  const [localOrientationMap, setLocalOrientationMap] = useState<
    Record<string, 'horizontal' | 'vertical'>
  >(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('tw_work_orientation_overrides_v1');
      return saved ? parseOrientationMap(saved) : {};
    } catch {
      return {};
    }
  });
  const [detectedAspectMap, setDetectedAspectMap] = useState<
    Record<string, 'horizontal' | 'vertical'>
  >({});

  // Merge Google Sheets `siteTexts.workCropPositions` + local browser adjustments
  const sheetCropMap = useMemo(
    () => parseCropMap(texts.workCropPositions),
    [texts.workCropPositions]
  );
  const sheetOrientationMap = useMemo(
    () => parseOrientationMap(texts.workOrientationOverrides),
    [texts.workOrientationOverrides]
  );

  const effectiveCropMap = useMemo(
    () => ({ ...sheetCropMap, ...localCropMap }),
    [sheetCropMap, localCropMap]
  );
  const effectiveOrientationMap = useMemo(
    () => ({ ...sheetOrientationMap, ...localOrientationMap }),
    [sheetOrientationMap, localOrientationMap]
  );

  const checkIsVertical = useCallback(
    (item: WorkItem): boolean =>
      isWorkItemVertical(item, effectiveOrientationMap[item.id], detectedAspectMap[item.id]),
    [effectiveOrientationMap, detectedAspectMap]
  );

  const getFocalForWork = useCallback(
    (item: WorkItem): string => {
      return effectiveCropMap[item.id] || item.focalPoint || '50% 50%';
    },
    [effectiveCropMap]
  );

  const handleDimensionsDetected = useCallback(
    (workId: string, w: number, h: number) => {
      const aspect: 'horizontal' | 'vertical' = h > w * 1.08 ? 'vertical' : 'horizontal';
      setDetectedAspectMap((prev) => {
        if (prev[workId] === aspect) return prev;
        return { ...prev, [workId]: aspect };
      });
    },
    []
  );

  const handleUpdateFocal = useCallback(
    (workId: string, nextPos: string) => {
      setLocalCropMap((prev) => {
        const merged = { ...sheetCropMap, ...prev, [workId]: nextPos };
        try {
          localStorage.setItem('tw_work_crop_positions_v1', JSON.stringify(merged));
        } catch {
          // ignore storage quota
        }
        // Sync into `SiteTexts` so clicking "구글 시트에 저장하기" persists all framing positions permanently to Google Sheets!
        updateText('workCropPositions', JSON.stringify(merged));
        return merged;
      });
    },
    [sheetCropMap, updateText]
  );

  const handleToggleOrientation = useCallback(
    (workId: string) => {
      const targetItem = workItems.find((w) => w.id === workId);
      if (!targetItem) return;
      const currentlyVertical = isWorkItemVertical(
        targetItem,
        effectiveOrientationMap[workId],
        detectedAspectMap[workId]
      );
      const nextOrientation: 'horizontal' | 'vertical' = currentlyVertical
        ? 'horizontal'
        : 'vertical';

      setLocalOrientationMap((prev) => {
        const merged = { ...sheetOrientationMap, ...prev, [workId]: nextOrientation };
        try {
          localStorage.setItem('tw_work_orientation_overrides_v1', JSON.stringify(merged));
        } catch {
          // ignore storage quota
        }
        updateText('workOrientationOverrides', JSON.stringify(merged));
        return merged;
      });
    },
    [workItems, effectiveOrientationMap, detectedAspectMap, sheetOrientationMap, updateText]
  );

  const isFramingActive = isEditMode && viewMode === 'cinema' && isCropAdjustMode;

  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | 'init'>('init');
  const [hoveredListRow, setHoveredListRow] = useState<WorkItem | null>(null);
  const [activeMobilePreviewId, setActiveMobilePreviewId] = useState<string | null>(null);
  const activeMobilePreviewIdRef = useRef<string | null>(null);
  activeMobilePreviewIdRef.current = activeMobilePreviewId;

  const sectionTopRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isInitialMountRef = useRef(true);
  const hasHydratedDeepLinkRef = useRef(false);
  const cursorPreviewRef = useRef<HTMLDivElement>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0, initialized: false });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });
  const [isCascadeResetting, setIsCascadeResetting] = useState(false);
  const [isCascadeStaggerActive, setIsCascadeStaggerActive] = useState(false);

  const personalCount = useMemo(
    () => workItems.filter((item) => item.type === 'Created').length,
    [workItems]
  );
  const participationCount = useMemo(
    () => workItems.filter((item) => item.type === 'Participated').length,
    [workItems]
  );

  const trackFilteredItems = useMemo(() => {
    return workItems.filter((item) => {
      if (activeTrack !== 'All' && item.type !== activeTrack) return false;
      return true;
    });
  }, [workItems, activeTrack]);

  const horizontalTrackCount = useMemo(
    () => trackFilteredItems.filter((item) => !checkIsVertical(item)).length,
    [trackFilteredItems, checkIsVertical]
  );

  const verticalTrackCount = useMemo(
    () => trackFilteredItems.filter((item) => checkIsVertical(item)).length,
    [trackFilteredItems, checkIsVertical]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    trackFilteredItems.forEach((item) => {
      const isVert = checkIsVertical(item);
      if (formatFilter === 'vertical' ? !isVert : isVert) return;
      if (item.category) cats.add(item.category);
    });

    const sorted = Array.from(cats).sort((a, b) => {
      const idxA = PREDEFINED_CATEGORY_ORDER.indexOf(a);
      const idxB = PREDEFINED_CATEGORY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['All', ...sorted];
  }, [trackFilteredItems, formatFilter, checkIsVertical]);

  useEffect(() => {
    if (activeCategory !== 'All' && !availableCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [availableCategories, activeCategory]);

  const filteredItems = useMemo(() => {
    return trackFilteredItems.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      return true;
    });
  }, [trackFilteredItems, activeCategory]);

  const horizontalItems = useMemo(
    () => filteredItems.filter((item) => !checkIsVertical(item)),
    [filteredItems, checkIsVertical]
  );

  const verticalItems = useMemo(
    () => filteredItems.filter((item) => checkIsVertical(item)),
    [filteredItems, checkIsVertical]
  );

  const displayedItems = useMemo(
    () => (formatFilter === 'vertical' ? verticalItems : horizontalItems),
    [formatFilter, verticalItems, horizontalItems]
  );

  // Mobile/touch center-band single-card auto-preview ("1번 방식")
  // Activates strictly on non-hover / coarse-pointer devices or mobile (< 768px) viewports,
  // preserving desktop fine-pointer mouse hover untouched.
  useEffect(() => {
    if (
      loading ||
      viewMode !== 'cinema' ||
      Boolean(selectedWork) ||
      isFramingActive ||
      displayedItems.length === 0
    ) {
      setActiveMobilePreviewId(null);
      return;
    }

    const isMobileAutoPreviewEligible = (): boolean => {
      if (typeof window === 'undefined') return false;
      const hasCoarseOrNoHover =
        window.matchMedia?.('(hover: none), (pointer: coarse)').matches ?? false;
      return hasCoarseOrNoHover || window.innerWidth < 768;
    };

    const pickCenteredCardId = (): string | null => {
      if (!isMobileAutoPreviewEligible() || !stageRef.current) return null;
      const vh = window.innerHeight || 0;
      if (vh <= 0) return null;

      const bandTop = vh * 0.18;
      const bandBottom = vh * 0.82;
      const viewportCenter = vh * 0.5;
      const cards = stageRef.current.querySelectorAll<HTMLElement>('[data-work-card-id]');

      let bestId: string | null = null;
      let bestDistance = Infinity;

      cards.forEach((el) => {
        const id = el.dataset.workCardId;
        if (!id) return;
        const rect = el.getBoundingClientRect();
        if (rect.height <= 0 || rect.width <= 0) return;

        const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        const minVisible = Math.min(rect.height * 0.5, vh * 0.35);
        if (visiblePx < minVisible) return;

        const cardCenter = rect.top + rect.height * 0.5;
        if (cardCenter < bandTop || cardCenter > bandBottom) return;

        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = id;
        }
      });

      return bestId;
    };

    const checkImmediateClear = () => {
      if (!isMobileAutoPreviewEligible()) {
        if (activeMobilePreviewIdRef.current !== null) {
          setActiveMobilePreviewId(null);
        }
        return;
      }

      const currentId = activeMobilePreviewIdRef.current;
      if (!currentId || !stageRef.current) return;

      const vh = window.innerHeight || 0;
      const activeEl = Array.from(
        stageRef.current.querySelectorAll<HTMLElement>('[data-work-card-id]')
      ).find((el) => el.dataset.workCardId === currentId);

      if (!activeEl) {
        setActiveMobilePreviewId(null);
        return;
      }

      const rect = activeEl.getBoundingClientRect();
      const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const minKeepVisible = Math.min(rect.height * 0.35, vh * 0.25);
      const cardCenter = rect.top + rect.height * 0.5;

      if (visiblePx < minKeepVisible || cardCenter < vh * 0.1 || cardCenter > vh * 0.9) {
        setActiveMobilePreviewId(null);
      }
    };

    let settleTimer: number | null = null;
    let rafId = 0;

    const scheduleSettlePick = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(checkImmediateClear);
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const nextId = pickCenteredCardId();
        setActiveMobilePreviewId((prev) => (prev === nextId ? prev : nextId));
      }, 160);
    };

    scheduleSettlePick();

    const pointerMql = window.matchMedia?.('(hover: none), (pointer: coarse)');

    window.addEventListener('scroll', scheduleSettlePick, { passive: true });
    window.addEventListener('resize', scheduleSettlePick, { passive: true });
    pointerMql?.addEventListener?.('change', scheduleSettlePick);

    return () => {
      window.removeEventListener('scroll', scheduleSettlePick);
      window.removeEventListener('resize', scheduleSettlePick);
      pointerMql?.removeEventListener?.('change', scheduleSettlePick);
      window.cancelAnimationFrame(rafId);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [
    loading,
    displayedItems,
    viewMode,
    formatFilter,
    activeTrack,
    activeCategory,
    selectedWork,
    isFramingActive,
  ]);

  useEffect(() => {
    setHoveredListRow(null);

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    setIsCascadeResetting(true);
    setIsCascadeStaggerActive(true);

    let raf1 = 0;
    let raf2 = 0;
    const clearStaggerTimer = window.setTimeout(() => {
      setIsCascadeStaggerActive(false);
    }, 2600);

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setIsCascadeResetting(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(clearStaggerTimer);
    };
  }, [activeTrack, activeCategory, viewMode, formatFilter]);

  useEffect(() => {
    if (workItems.length === 0) return;

    const applyHashState = () => {
      const hashWorkId = parseWorkHashId(window.location.hash);
      if (hashWorkId) {
        const matched = workItems.find((w) => w.id === hashWorkId);
        if (matched) {
          setNavDirection('init');
          setSelectedWork((prev) => (prev?.id === matched.id ? prev : matched));
        }
      } else {
        setSelectedWork((prev) => {
          if (!prev) return null;
          setNavDirection('init');
          return null;
        });
      }
    };

    if (!hasHydratedDeepLinkRef.current) {
      hasHydratedDeepLinkRef.current = true;
      applyHashState();
    }

    window.addEventListener('hashchange', applyHashState);
    window.addEventListener('popstate', applyHashState);
    return () => {
      window.removeEventListener('hashchange', applyHashState);
      window.removeEventListener('popstate', applyHashState);
    };
  }, [workItems]);

  const navigationPool = useMemo(() => {
    if (!selectedWork) return displayedItems;
    if (displayedItems.some((item) => item.id === selectedWork.id)) return displayedItems;
    return filteredItems.some((item) => item.id === selectedWork.id)
      ? filteredItems
      : workItems;
  }, [selectedWork, displayedItems, filteredItems, workItems]);

  const currentIndex = useMemo(() => {
    if (!selectedWork) return -1;
    return navigationPool.findIndex((item) => item.id === selectedWork.id);
  }, [selectedWork, navigationPool]);

  const nextWork = useMemo<WorkItem | null>(() => {
    if (!selectedWork || navigationPool.length <= 1 || currentIndex === -1) {
      return null;
    }
    return navigationPool[(currentIndex + 1) % navigationPool.length] || null;
  }, [selectedWork, navigationPool, currentIndex]);

  const openModal = useCallback((item: WorkItem) => {
    setNavDirection('init');
    setSelectedWork(item);
    syncUrlWorkHash(item.id, true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedWork(null);
    setNavDirection('init');
    syncUrlWorkHash(null, false);
  }, []);

  const handleNext = useCallback(() => {
    if (navigationPool.length === 0) return;
    setNavDirection('next');
    const nextIdx = currentIndex < navigationPool.length - 1 ? currentIndex + 1 : 0;
    const target = navigationPool[nextIdx];
    if (target) {
      setSelectedWork(target);
      syncUrlWorkHash(target.id, false);
    }
  }, [currentIndex, navigationPool]);

  const handlePrev = useCallback(() => {
    if (navigationPool.length === 0) return;
    setNavDirection('prev');
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : navigationPool.length - 1;
    const target = navigationPool[prevIdx];
    if (target) {
      setSelectedWork(target);
      syncUrlWorkHash(target.id, false);
    }
  }, [currentIndex, navigationPool]);

  const syncPointerCoords = useCallback((clientX: number, clientY: number) => {
    const target = pointerTargetRef.current;
    target.x = clientX;
    target.y = clientY;
    if (!target.initialized) {
      target.initialized = true;
      pointerCurrentRef.current.x = clientX;
      pointerCurrentRef.current.y = clientY;
    }
  }, []);

  const handleRowHover = useCallback(
    (
      item: WorkItem,
      e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>
    ) => {
      if ('pointerType' in e && e.pointerType === 'touch') return;
      if (
        Number.isFinite(e.clientX) &&
        Number.isFinite(e.clientY) &&
        (e.clientX !== 0 || e.clientY !== 0)
      ) {
        syncPointerCoords(e.clientX, e.clientY);
      }
      setHoveredListRow((prev) => (prev?.id === item.id ? prev : item));
    },
    [syncPointerCoords]
  );

  // Track live cursor across entire window while in Index List so entering any row or toggling views never lacks coordinates
  useEffect(() => {
    if (viewMode !== 'list' || typeof window === 'undefined') return;
    const onWinMove = (ev: MouseEvent) => {
      syncPointerCoords(ev.clientX, ev.clientY);
    };
    window.addEventListener('mousemove', onWinMove, { passive: true });
    return () => window.removeEventListener('mousemove', onWinMove);
  }, [viewMode, syncPointerCoords]);

  // Warm browser image cache for all visible rows in Index List so hover preview appears instantaneously
  useEffect(() => {
    if (viewMode !== 'list' || typeof window === 'undefined') return;
    displayedItems.forEach((item) => {
      const candidates = buildThumbnailCandidates(item);
      if (candidates[0]) {
        const img = new Image();
        img.decoding = 'async';
        img.src = candidates[0];
      }
    });
  }, [viewMode, displayedItems]);

  useEffect(() => {
    if (viewMode !== 'list' || !hoveredListRow) {
      return;
    }

    let rafId = 0;
    const isVert = checkIsVertical(hoveredListRow);

    const computeClampedPosition = (rawX: number, rawY: number, el: HTMLDivElement | null) => {
      const w = el?.offsetWidth || (isVert ? 192 : Math.min(340, window.innerWidth * 0.44));
      const h = el?.offsetHeight || (isVert ? 341 : Math.round(w * (9 / 16)));
      const margin = 16;
      const maxX = Math.max(margin, window.innerWidth - w - margin);
      const maxY = Math.max(margin, window.innerHeight - h - margin);
      const preferredX =
        rawX + 24 + w <= window.innerWidth - margin ? rawX + 24 : Math.max(margin, rawX - w - 24);
      const clampedX = Math.max(margin, Math.min(maxX, preferredX));
      const clampedY = Math.max(margin, Math.min(maxY, rawY - h * 0.5));
      return { clampedX, clampedY };
    };

    if (cursorPreviewRef.current && pointerTargetRef.current.initialized) {
      const { clampedX, clampedY } = computeClampedPosition(
        pointerCurrentRef.current.x,
        pointerCurrentRef.current.y,
        cursorPreviewRef.current
      );
      cursorPreviewRef.current.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`;
    }

    const tick = () => {
      const previewEl = cursorPreviewRef.current;
      const target = pointerTargetRef.current;
      const current = pointerCurrentRef.current;

      if (previewEl && target.initialized) {
        current.x += (target.x - current.x) * 0.22;
        current.y += (target.y - current.y) * 0.22;

        const { clampedX, clampedY } = computeClampedPosition(current.x, current.y, previewEl);
        previewEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [viewMode, hoveredListRow, checkIsVertical]);

  const handleListPointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      syncPointerCoords(e.clientX, e.clientY);
    },
    [syncPointerCoords]
  );

  if (error) {
    return (
      <div className="w-full px-3 sm:px-5 md:px-7 lg:px-9 py-24 text-center">
        <p className="font-mono-tech text-xs tracking-[0.2em] uppercase text-neutral-400">
          Unable to load stories. Please refresh the page.
        </p>
      </div>
    );
  }

  const hoveredListIsVertical = hoveredListRow
    ? checkIsVertical(hoveredListRow)
    : false;

  const trackCards: {
    id: TrackFilter;
    step: string;
    title: string;
    koreanLabel: string;
    subtext: string;
    count: number;
  }[] = [
    {
      id: 'All',
      step: 'ALL',
      title: 'ALL WORKS',
      koreanLabel: '전체 필모그래피',
      subtext: '개인 연출 · 참여작 통합',
      count: workItems.length,
    },
    {
      id: 'Created',
      step: '01',
      title: 'PERSONAL',
      koreanLabel: '연출 · 주도 프로젝트',
      subtext: '메인 디렉팅',
      count: personalCount,
    },
    {
      id: 'Participated',
      step: '02',
      title: 'PARTICIPATION',
      koreanLabel: '프로덕션 참여작',
      subtext: '촬영 · 조명 · 후반 크루',
      count: participationCount,
    },
  ];

  return (
    <div ref={sectionTopRef} className="w-full px-2 sm:px-4 md:px-6 lg:px-8 relative">
      <div className="w-full">
        {/* ════════════════════════════════════════════════════════════════
           1. UNIFIED WORKS HEADER (Bidirectional Scroll-Down & Scroll-Up Choreography)
           ════════════════════════════════════════════════════════════════ */}
        <header className="mb-5 sm:mb-6 md:mb-8 px-1">
          <div
            ref={headerRef}
            className={`section-choreo ${isHeaderVisible ? 'is-inview' : ''} flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-5 mb-4 sm:mb-5 md:mb-6`}
          >
            <div>
              <p className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-2 choreo-fade">
                Complete Filmography · 전체 포트폴리오 아카이브
              </p>
              <div className="flex items-start gap-3">
                <h2 className="font-display text-[clamp(3.2rem,7.2vw,6.8rem)] leading-[0.88] text-neutral-950 uppercase select-none o-line-mask">
                  <span className="o-line-item">WORKS</span>
                </h2>
                {!loading && displayedItems.length > 0 && (
                  <span className="font-mono-tech text-xs sm:text-sm text-neutral-400 mt-1.5 tabular-nums choreo-fade">
                    ({displayedItems.length})
                  </span>
                )}
              </div>
            </div>

            {/* Secondary Controls: Admin-Only Image Crop Adjuster + Category Filter + [CINEMA VIEW | INDEX LIST] + [16:9 WIDE | 9:16 VERTICAL] */}
            <div className="flex flex-wrap items-center gap-2.5 choreo-fade" style={{ transitionDelay: '180ms' }}>
              {isEditMode && viewMode === 'cinema' && (
                <button
                  type="button"
                  onClick={() => setIsCropAdjustMode((prev) => !prev)}
                  title="각 썸네일을 드래그하여 크롭 위치를 맞추거나 가로/세로 카드 배치를 전환합니다"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-mono-tech uppercase tracking-[0.08em] border transition-colors cursor-pointer ${
                    isFramingActive
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                      : 'bg-[#F4F4F2] text-neutral-700 border-black/8 hover:border-neutral-950 hover:text-neutral-950'
                  }`}
                >
                  <span>{isFramingActive ? '✓ 위치 조절 완료' : '✥ 썸네일 위치 조절'}</span>
                </button>
              )}

              <select
                aria-label="Filter works by category"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="rounded-lg bg-[#F4F4F2] text-neutral-900 border border-black/8 px-3.5 py-2 text-[11px] font-mono-tech uppercase tracking-[0.1em] focus:outline-none focus:border-neutral-950 cursor-pointer"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              <div
                role="group"
                aria-label="View layout"
                className="inline-flex items-center rounded-lg bg-[#F4F4F2] p-1 border border-black/8"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('cinema')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono-tech uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    viewMode === 'cinema'
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Cinema View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono-tech uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Index List
                </button>
              </div>

              <div
                role="group"
                aria-label="Format filter"
                className="inline-flex items-center rounded-lg bg-[#F4F4F2] p-1 border border-black/8"
              >
                <button
                  type="button"
                  onClick={() => setFormatFilter('horizontal')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono-tech uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    formatFilter === 'horizontal'
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  16:9 Wide ({horizontalTrackCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('vertical')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono-tech uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    formatFilter === 'vertical'
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  9:16 Vertical ({verticalTrackCount})
                </button>
              </div>
            </div>
          </div>

          {/* HIGH-VISIBILITY FLUID TRACK SWITCHER (Option A: Mobile 1×3 Compact Tabs <-> Desktop Clamp Cards) */}
          <div
            ref={tracksRef}
            role="tablist"
            aria-label="Filmography Track Filter"
            className={`section-choreo ${isTracksVisible ? 'is-inview' : ''} tw-track-grid`}
          >
            {trackCards.map((tab, idx) => {
              const isSelected = activeTrack === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTrack(tab.id)}
                  style={{ transitionDelay: `${idx * 120}ms` }}
                  className={`choreo-fade tw-track-card group relative text-left border transition-[background-color,border-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A0A0B] text-white border-[#0A0A0B] shadow-[0_10px_24px_rgba(10,10,11,0.14)]'
                      : 'bg-[#F4F4F2] hover:bg-[#EAEAE6] text-neutral-950 border-black/8 hover:border-neutral-950/35'
                  }`}
                >
                  <div className="tw-track-top">
                    <span
                      className={`tw-track-step font-mono-tech uppercase ${
                        isSelected ? 'text-white/55' : 'text-neutral-400'
                      }`}
                    >
                      {tab.step}
                    </span>
                    <span className="tw-track-title font-display tracking-tight uppercase">
                      {tab.title}
                    </span>
                    <span
                      className={`tw-track-pill inline-flex items-center justify-center rounded-full font-mono-tech font-semibold tabular-nums shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white text-[#0A0A0B]'
                          : 'bg-white/88 text-neutral-900 border border-black/8 group-hover:bg-neutral-950 group-hover:text-white'
                      }`}
                    >
                      {loading ? '…' : `${tab.count}편`}
                    </span>
                  </div>

                  <div className="tw-track-details border-t border-current/10">
                    <div className="min-w-0 truncate">
                      <span
                        className={`text-xs font-semibold tracking-tight ${
                          isSelected ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        {tab.koreanLabel}
                      </span>
                      <span
                        className={`tw-track-subtext text-[11px] ml-1.5 ${
                          isSelected ? 'text-white/62' : 'text-neutral-500'
                        }`}
                      >
                        {tab.subtext}
                      </span>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`font-mono-tech text-[11px] shrink-0 transition-transform duration-300 ${
                        isSelected
                          ? 'text-white'
                          : 'text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950'
                      }`}
                    >
                      {isSelected ? '● ACTIVE' : '보기 →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════
           2. UNLIMITED WORKS STAGE (Bidirectional Scroll-Revealed Cinema Strips)
           ════════════════════════════════════════════════════════════════ */}
        <div ref={stageRef}>
          {loading ? (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-7">
              {[0, 1, 2, 3].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="w-full aspect-[16/9] sm:aspect-[2.35/1] md:aspect-[3.1/1] lg:aspect-[3.65/1] rounded-[10px] bg-neutral-100 animate-pulse"
                />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-24 text-center border-y border-neutral-200">
              <p className="font-mono-tech text-xs uppercase tracking-[0.18em] text-neutral-400 mb-4">
                선택한 조건에 해당하는 {formatFilter === 'vertical' ? '세로형(9:16)' : '가로형(16:9)'} 작품이 없습니다.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {formatFilter === 'horizontal' && verticalTrackCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormatFilter('vertical')}
                    className="rounded-md bg-neutral-950 text-white px-4 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    9:16 세로형 작품 보기 ({verticalTrackCount})
                  </button>
                )}
                {formatFilter === 'vertical' && horizontalTrackCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormatFilter('horizontal')}
                    className="rounded-md bg-neutral-950 text-white px-4 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    16:9 가로형 작품 보기 ({horizontalTrackCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTrack('All');
                    setActiveCategory('All');
                    setFormatFilter('horizontal');
                  }}
                  className="rounded-md bg-[#F4F4F2] text-neutral-900 border border-black/10 px-4 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] hover:border-neutral-950 transition-colors cursor-pointer"
                >
                  전체 작품 보기로 초기화
                </button>
              </div>
            </div>
          ) : viewMode === 'cinema' ? (
            formatFilter === 'horizontal' ? (
              <div className="flex flex-col gap-5 sm:gap-7 md:gap-8">
                {horizontalItems.map((item, idx) => (
                  <WidescreenStoryCard
                    key={item.id}
                    item={item}
                    priority={idx < 3}
                    focalPoint={getFocalForWork(item)}
                    isFramingActive={isFramingActive}
                    isAutoPreviewActive={activeMobilePreviewId === item.id}
                    isCascadeResetting={isCascadeResetting}
                    cascadeDelayMs={isCascadeStaggerActive ? Math.min(idx, 7) * 125 : 0}
                    onUpdateFocal={handleUpdateFocal}
                    onToggleOrientation={handleToggleOrientation}
                    onDimensionsDetected={handleDimensionsDetected}
                    onSelect={openModal}
                  />
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-4 mb-5 px-1">
                  <span className="font-mono-tech text-xs tracking-[0.16em] uppercase text-neutral-400">
                    VERTICAL REELS &amp; SHORTS (9:16) · {verticalItems.length}편
                  </span>
                  <span className="h-px flex-1 bg-neutral-200 max-w-[180px] hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-7">
                  {verticalItems.map((item, idx) => (
                    <VerticalReelCard
                      key={item.id}
                      item={item}
                      index={idx}
                      focalPoint={getFocalForWork(item)}
                      isFramingActive={isFramingActive}
                      isAutoPreviewActive={activeMobilePreviewId === item.id}
                      isCascadeResetting={isCascadeResetting}
                      cascadeDelayMs={isCascadeStaggerActive ? Math.min(idx, 9) * 105 : 0}
                      onUpdateFocal={handleUpdateFocal}
                      onToggleOrientation={handleToggleOrientation}
                      onDimensionsDetected={handleDimensionsDetected}
                      onSelect={openModal}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            /* ── COMPACT INDEX LIST VIEW ── */
            <div
              onMouseMove={handleListPointerMove}
              onMouseLeave={() => setHoveredListRow(null)}
              className="w-full px-1"
            >
              <div className="hidden md:grid md:grid-cols-12 gap-6 pb-3 border-b border-neutral-200 font-mono-tech text-xs text-neutral-400 select-none">
                <div className="col-span-5">Story</div>
                <div className="col-span-3">Client / Artist</div>
                <div className="col-span-3">Track &amp; Role</div>
                <div className="col-span-1 text-right">Date</div>
              </div>

              <div className="divide-y divide-neutral-200 border-b border-neutral-200">
                {displayedItems.map((item, idx) => (
                  <ListArchiveRow
                    key={item.id}
                    item={item}
                    index={idx}
                    isHovered={hoveredListRow?.id === item.id}
                    isDimmed={hoveredListRow !== null && hoveredListRow?.id !== item.id}
                    isCascadeResetting={isCascadeResetting}
                    cascadeDelayMs={isCascadeStaggerActive ? Math.min(idx, 16) * 68 : 0}
                    onHover={handleRowHover}
                    onSelect={openModal}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Aspect-Aware Floating Thumbnail Preview in INDEX LIST View (Active Across All Desktop & Split-Pane Widths) ── */}
      {typeof document !== 'undefined' &&
        viewMode === 'list' &&
        hoveredListRow &&
        createPortal(
          <div
            ref={cursorPreviewRef}
            aria-hidden="true"
            style={{
              transform: pointerTargetRef.current.initialized
                ? `translate3d(${Math.max(16, Math.min(window.innerWidth - (hoveredListIsVertical ? 192 : 340) - 16, pointerCurrentRef.current.x + 24)).toFixed(1)}px, ${Math.max(16, Math.min(window.innerHeight - (hoveredListIsVertical ? 341 : 191) - 16, pointerCurrentRef.current.y - (hoveredListIsVertical ? 170 : 95))).toFixed(1)}px, 0)`
                : undefined,
            }}
            className="fixed top-0 left-0 z-[1500] pointer-events-none block will-change-transform"
          >
            <div
              className={`relative rounded-[10px] overflow-hidden bg-neutral-950 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] border border-black/10 transition-[width,height] duration-300 ease-out ${
                hoveredListIsVertical
                  ? 'w-36 sm:w-44 lg:w-48 aspect-[9/16]'
                  : 'w-56 sm:w-72 lg:w-[340px] aspect-video'
              }`}
            >
              <WorkThumbnail
                key={hoveredListRow.id}
                item={hoveredListRow}
                isVertical={hoveredListIsVertical}
                priority={true}
                variant="compact"
                objectPosition={getFocalForWork(hoveredListRow)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>,
          document.body
        )}

      {/* ── Full-Bleed White Sheet Slide-Up Case Study Overlay ── */}
      <ProjectDetailModal
        selectedWork={selectedWork}
        nextWork={nextWork}
        onClose={closeModal}
        onNext={handleNext}
        onPrev={handlePrev}
        navDirection={navDirection}
        focalPoint={selectedWork ? getFocalForWork(selectedWork) : undefined}
        isVerticalOverride={selectedWork ? checkIsVertical(selectedWork) : undefined}
      />
    </div>
  );
};

export default WorkSection;
