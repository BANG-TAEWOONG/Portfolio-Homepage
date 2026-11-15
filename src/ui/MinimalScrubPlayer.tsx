import React, { useState, useRef, useEffect } from 'react';
import { getYouTubeId, getVimeoId, getInstagramId, getVideoPlatform } from '../integrations/youtubeParser';

interface MinimalScrubPlayerProps {
  videoUrl: string;
  externalUrl?: string;
  isVertical?: boolean;
  title: string;
}

const isDirectVideoFile = (url: string): boolean =>
  /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url);

const formatTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Singleton loader for YouTube IFrame API (`window.YT`)
let ytApiPromise: Promise<any> | null = null;
export const loadYouTubeIframeApi = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const win = window as any;
  if (win.YT && win.YT.Player) return Promise.resolve(win.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    const prevCallback = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      resolve(win.YT);
    };
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
};

/**
 * Wow Tapes–Homage Minimal Video Player (`WATCH` Stage)
 * - Hides cluttered native YouTube/HTML5 chrome and presents ONLY a clean, ultra-minimal bottom scrub/progress bar (`재생 바`)
 *   paired with Play/Pause, Sound Toggle, and Timecode that gently auto-hides during playback and reappears on pointer movement.
 */
const MinimalScrubPlayer: React.FC<MinimalScrubPlayerProps> = ({
  videoUrl,
  externalUrl,
  isVertical = false,
  title,
}) => {
  const [localMp4Failed, setLocalMp4Failed] = useState(false);

  useEffect(() => {
    setLocalMp4Failed(false);
  }, [videoUrl]);

  const effectiveUrl = localMp4Failed && externalUrl ? externalUrl : videoUrl;
  const externalPlatform = getVideoPlatform(externalUrl || videoUrl);
  const ytId = getYouTubeId(effectiveUrl);
  const isMp4 = isDirectVideoFile(effectiveUrl);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isDraggingBar, setIsDraggingBar] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mp4Ref = useRef<HTMLVideoElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const idleTimerRef = useRef<number | null>(null);

  const wakeControls = () => {
    setControlsVisible(true);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2200);
  };

  useEffect(() => {
    wakeControls();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ── YouTube chromeless player (`controls: 0`) + custom progress sync ──
  useEffect(() => {
    if (!ytId || isMp4) return;

    let cancelled = false;
    let pollTimer = 0;

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !YT || !ytHostRef.current) return;

      const mountDiv = document.createElement('div');
      ytHostRef.current.innerHTML = '';
      ytHostRef.current.appendChild(mountDiv);

      const player = new YT.Player(mountDiv, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (ev: any) => {
            if (cancelled) return;
            ytPlayerRef.current = ev.target;
            try {
              const dur = ev.target.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
              ev.target.playVideo?.();
              setIsMuted(Boolean(ev.target.isMuted?.()));
            } catch {
              // ignore
            }
          },
          onStateChange: (ev: any) => {
            if (cancelled) return;
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
            if (ev.data === 1) {
              setIsPlaying(true);
              const dur = ev.target.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
            } else if (ev.data === 2 || ev.data === 0) {
              setIsPlaying(false);
              setControlsVisible(true);
            }
          },
        },
      });

      pollTimer = window.setInterval(() => {
        const p = ytPlayerRef.current;
        if (!p || typeof p.getCurrentTime !== 'function') return;
        const cur = p.getCurrentTime() || 0;
        const dur = p.getDuration?.() || 0;
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      }, 150);

      void player;
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      ytPlayerRef.current = null;
    };
  }, [ytId, isMp4]);

  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    wakeControls();

    if (isMp4 && mp4Ref.current) {
      if (mp4Ref.current.paused) {
        mp4Ref.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        mp4Ref.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const p = ytPlayerRef.current;
    if (p) {
      const state = p.getPlayerState?.();
      if (state === 1) {
        p.pauseVideo?.();
        setIsPlaying(false);
      } else {
        p.playVideo?.();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    wakeControls();

    if (isMp4 && mp4Ref.current) {
      const next = !mp4Ref.current.muted;
      mp4Ref.current.muted = next;
      setIsMuted(next);
      return;
    }

    const p = ytPlayerRef.current;
    if (p) {
      if (p.isMuted?.()) {
        p.unMute?.();
        setIsMuted(false);
      } else {
        p.mute?.();
        setIsMuted(true);
      }
    }
  };

  const seekToClientX = (clientX: number) => {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetSec = ratio * duration;
    setCurrentTime(targetSec);

    if (isMp4 && mp4Ref.current) {
      mp4Ref.current.currentTime = targetSec;
      return;
    }

    const p = ytPlayerRef.current;
    if (p && typeof p.seekTo === 'function') {
      p.seekTo(targetSec, true);
    }
  };

  useEffect(() => {
    if (!isDraggingBar) return;

    const onMove = (ev: PointerEvent) => {
      seekToClientX(ev.clientX);
    };
    const onUp = () => {
      setIsDraggingBar(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingBar, duration, isMp4]);

  // Fallback for Instagram / Vimeo embeds that don't expose seek APIs without external SDKs
  if (!isMp4 && !ytId) {
    const instaId = getInstagramId(effectiveUrl);
    const vimeoId = getVimeoId(effectiveUrl);
    const embedSrc = instaId
      ? `https://www.instagram.com/p/${instaId}/embed/`
      : vimeoId
        ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`
        : effectiveUrl;

    return (
      <iframe
        src={embedSrc}
        title={title}
        className="w-full h-full absolute inset-0 bg-black animate-dissolve"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
    );
  }

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const showBar = controlsVisible || !isPlaying || isDraggingBar;

  return (
    <div
      ref={stageRef}
      onMouseMove={wakeControls}
      onMouseEnter={wakeControls}
      onClick={() => togglePlayPause()}
      className="relative w-full h-full bg-black select-none overflow-hidden cursor-pointer"
    >
      {isMp4 ? (
        <video
          ref={mp4Ref}
          src={effectiveUrl}
          width={isVertical ? 1080 : 1920}
          height={isVertical ? 1920 : 1080}
          preload="auto"
          muted={isMuted}
          playsInline
          onError={() => {
            if (externalUrl && effectiveUrl !== externalUrl) {
              setLocalMp4Failed(true);
            }
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            setDuration(vid.duration || 0);
            wakeControls();
            const playPromise = vid.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {
                vid.muted = true;
                setIsMuted(true);
                vid.play().catch(() => {
                  setIsPlaying(false);
                });
              });
            }
          }}
          onLoadedData={() => wakeControls()}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain bg-black pointer-events-none"
        />
      ) : (
        /* Overscaled vertical wrapper (`h-[146%] -top-[23%]`) pushes YouTube's top title banner & bottom watermark cleanly outside the `overflow-hidden` cinema frame so ONLY our minimal scrub bar appears! */
        <div className="absolute inset-x-0 -top-[23%] h-[146%] pointer-events-none overflow-hidden">
          <div
            ref={ytHostRef}
            className="w-full h-full pointer-events-none [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
          />
        </div>
      )}

      {/* Subtle Bottom Scrim ONLY while the minimal scrub bar is visible */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          showBar ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Wow Tapes–Style Minimal Scrub Bar (`재생 바` + Play/Pause + Sound) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-4 sm:inset-x-7 md:inset-x-9 bottom-4 sm:bottom-6 z-20 flex items-center gap-4 sm:gap-5 transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          showBar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Minimal Play / Pause Toggle */}
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          className="font-mono-tech text-[11px] font-semibold tracking-[0.14em] uppercase text-white hover:opacity-75 transition-opacity shrink-0 cursor-pointer min-w-[62px] text-left"
        >
          {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
        </button>

        {/* Interactive Scrub / Progress Bar (`재생 바`) */}
        <div
          ref={barRef}
          role="slider"
          aria-label="Video playback progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsDraggingBar(true);
            seekToClientX(e.clientX);
          }}
          className="group/scrub relative flex-1 py-3 flex items-center cursor-pointer touch-none"
        >
          <div className="w-full h-[2px] group-hover/scrub:h-[4px] bg-white/25 rounded-full overflow-hidden transition-all duration-200 relative">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Crisp Minimal Scrub Thumb */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md scale-0 group-hover/scrub:scale-100 transition-transform duration-150 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Compact Timecode */}
        <span className="font-mono-tech text-[11px] text-white/80 tabular-nums shrink-0 hidden sm:inline">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Minimal Sound Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="font-mono-tech text-[11px] font-semibold tracking-[0.14em] uppercase text-white/85 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          {isMuted ? 'SOUND OFF' : 'SOUND ON'}
        </button>

        {(externalPlatform === 'youtube' || externalPlatform === 'instagram') && (externalUrl || videoUrl) && (
          <a
            href={externalUrl || videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={externalPlatform === 'instagram' ? 'Instagram 원본 릴스 열기' : 'YouTube 원본 화질로 열기'}
            className="font-mono-tech text-[11px] text-white/55 hover:text-white transition-colors shrink-0 hidden md:inline"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
};

export default MinimalScrubPlayer;
