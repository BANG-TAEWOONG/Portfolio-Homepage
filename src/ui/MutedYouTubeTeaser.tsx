import React, { useEffect, useRef, useState } from 'react';
import { getYouTubeId } from '../integrations/youtubeParser';
import { loadYouTubeIframeApi } from './MinimalScrubPlayer';

interface MutedYouTubeTeaserProps {
  videoUrl: string;
  cropClassName: string;
  startSeconds?: number;
  className?: string;
}

const UI_HIDE_SETTLE_MS = 3150;

/**
 * Chromeless Muted YouTube Hover/Teaser Player
 * - Uses `YT.Player` WITHOUT `playlist` parameter so playlist prev/next/pause clip overlays never mount.
 * - Keeps opacity at `0` until playback has been running continuously for `3150ms` (allowing YouTube's
 *   initial ~3s startup chrome & `.ytp-autohide` overlays to disappear cleanly while still invisible).
 * - Loops seamlessly via `seekTo` before `ENDED` triggers end-screen suggestions.
 */
const MutedYouTubeTeaser: React.FC<MutedYouTubeTeaserProps> = ({
  videoUrl,
  cropClassName,
  startSeconds = 4,
  className = '',
}) => {
  const ytId = getYouTubeId(videoUrl);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const settleTimerRef = useRef<number | null>(null);
  const hasRevealedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasRevealedRef.current = false;
    setReady(false);
    if (!ytId) return;

    let cancelled = false;
    let loopPollTimer = 0;

    const clearSettleTimer = () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };

    const scheduleReveal = () => {
      if (cancelled || hasRevealedRef.current || settleTimerRef.current !== null) return;
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        if (!cancelled) {
          hasRevealedRef.current = true;
          setReady(true);
        }
      }, UI_HIDE_SETTLE_MS);
    };

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !YT || !hostRef.current) return;

      const mountDiv = document.createElement('div');
      hostRef.current.innerHTML = '';
      hostRef.current.appendChild(mountDiv);

      const player = new YT.Player(mountDiv, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: startSeconds,
        },
        events: {
          onReady: (ev: any) => {
            if (cancelled) return;
            playerRef.current = ev.target;
            try {
              ev.target.mute?.();
              ev.target.playVideo?.();
              const dur = ev.target.getDuration?.() || 0;
              if (dur > 0 && dur <= startSeconds + 2) {
                ev.target.seekTo?.(0, true);
              }
            } catch {
              // ignore player init error
            }
          },
          onStateChange: (ev: any) => {
            if (cancelled) return;
            // YT.PlayerState: PLAYING = 1, ENDED = 0
            if (ev.data === 1) {
              scheduleReveal();
            } else if (ev.data === 0) {
              try {
                const dur = ev.target.getDuration?.() || 0;
                const safeStart = dur > 0 && dur <= startSeconds + 2 ? 0 : startSeconds;
                ev.target.seekTo?.(safeStart, true);
                ev.target.playVideo?.();
              } catch {
                // ignore
              }
            }
          },
        },
      });

      loopPollTimer = window.setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== 'function') return;
        try {
          const state = p.getPlayerState?.();
          if (state === 1 && !hasRevealedRef.current && settleTimerRef.current === null) {
            scheduleReveal();
          }
          const dur = p.getDuration?.() || 0;
          const cur = p.getCurrentTime?.() || 0;
          if (dur > 0 && cur >= dur - 0.8) {
            const safeStart = dur <= startSeconds + 2 ? 0 : startSeconds;
            p.seekTo?.(safeStart, true);
            p.playVideo?.();
          }
        } catch {
          // ignore transient iframe state errors
        }
      }, 250);

      void player;
    });

    return () => {
      cancelled = true;
      clearSettleTimer();
      window.clearInterval(loopPollTimer);
      try {
        playerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [ytId, startSeconds]);

  if (!ytId) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ease-out ${
        ready ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <div className={cropClassName}>
        <div
          ref={hostRef}
          className="w-full h-full pointer-events-none [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:pointer-events-none"
        />
      </div>
    </div>
  );
};

export default MutedYouTubeTeaser;
