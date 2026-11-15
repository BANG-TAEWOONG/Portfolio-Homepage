import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Navbar from './ui/Navbar';
import HomeSection from './pages/HomeSection';
import WorkSection from './pages/WorkSection';
import ServicesSection from './pages/ServicesSection';
import ContactSection from './pages/ContactSection';
import { useSiteTexts } from './integrations/useSiteTexts';
import { SiteTextsProvider } from './integrations/SiteTextsContext';
import { initSmoothWheelScroll } from './integrations/smoothScroll';
import EditableText from './ui/EditableText';
import {
  BRAND_WORDMARK_GLYPHS,
  G_STROKE_ANCHOR_X,
  G_STROKE_ANCHOR_Y,
  G_STROKE_CLEARANCE_NORM,
  VectorCmd,
} from './data/brandWordmarkVectors';

const AdminSettingsModal = lazy(() => import('./modals/AdminSettingsModal'));

const INTRO_SPREAD_MS = 2250;
const INTRO_ZOOM_MS = 1000;
const INTRO_TOTAL_MS = INTRO_SPREAD_MS + INTRO_ZOOM_MS; // 3250ms
const HERO_REVEAL_MS = 3000; // Unlocks hero choreography cleanly right as `'G'` clears viewport

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Exact cubic-bezier(0.16, 1, 0.3, 1) solver for letter-spread easing. */
const easeSpreadCubicBezier = (x: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * 0.16;
  const bx = 3 * (0.3 - 0.16) - cx;
  const ax = 1 - cx - bx;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const err = sampleX(t) - x;
    if (Math.abs(err) < 1e-5) break;
    const dx = sampleDX(t);
    if (Math.abs(dx) < 1e-6) break;
    t -= err / dx;
  }
  t = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - t, 3);
};

interface GlyphPlacement {
  xOffsetNorm: number;
}

const computeSpreadLayout = (
  tSpread: number
): { placements: GlyphPlacement[]; totalWidthNorm: number } => {
  const placements: GlyphPlacement[] = [];
  let cursor = 0;
  for (let i = 0; i < BRAND_WORDMARK_GLYPHS.length; i++) {
    const g = BRAND_WORDMARK_GLYPHS[i];
    if (i > 0) {
      const gap =
        i === 6
          ? lerp(0.28, 1.785, tSpread) // Space between TWOONG and STUDIO
          : lerp(0.04, Math.max(0.68, g.baseGapPrev), tSpread);
      cursor += gap;
    }
    placements.push({ xOffsetNorm: cursor });
    cursor += g.w;
  }
  return { placements, totalWidthNorm: cursor };
};

const serializeTransformedGlyph = (
  cmds: VectorCmd[],
  gx0: number,
  tx: number,
  ty: number,
  capScale: number
): string => {
  let out = '';
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    switch (cmd[0]) {
      case 'M':
        out += `M${(tx + capScale * (gx0 + cmd[1])).toFixed(2)} ${(ty + capScale * cmd[2]).toFixed(2)}`;
        break;
      case 'L':
        out += `L${(tx + capScale * (gx0 + cmd[1])).toFixed(2)} ${(ty + capScale * cmd[2]).toFixed(2)}`;
        break;
      case 'C':
        out += `C${(tx + capScale * (gx0 + cmd[1])).toFixed(2)} ${(ty + capScale * cmd[2]).toFixed(2)} ${(tx + capScale * (gx0 + cmd[3])).toFixed(2)} ${(ty + capScale * cmd[4]).toFixed(2)} ${(tx + capScale * (gx0 + cmd[5])).toFixed(2)} ${(ty + capScale * cmd[6]).toFixed(2)}`;
        break;
      case 'Z':
        out += 'Z';
        break;
    }
  }
  return out;
};

/**
 * Resolution-Independent Vector Portal (`0 -> 2.25s` Spread -> `0s` Gap -> `1.0s` `2000x` Zoom Into `'G'` Stroke)
 * - Uses pure screen-space SVG compound `<path fillRule="evenodd">` Bézier geometry directly from the
 *   TWOONG STUDIO brand outline vector file so edges stay razor-sharp even at `2000x` scale (0% mask pixelation).
 * - Preserves `tw-studio-portal-mask` + `animate-portal-spread` structural hooks without raster HTML canvas elements.
 */
const IntroPortalOverlay: React.FC = React.memo(() => {
  const svgRef = useRef<SVGSVGElement>(null);
  const curtainPathRef = useRef<SVGPathElement>(null);
  const whiteGlyphsPathRef = useRef<SVGPathElement>(null);
  const whiteFadeGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const mountTime = performance.now();
    let rafId: number | null = null;
    let lockedSpread = false;
    let lockedPx = 0;
    let lockedPy = 0;
    let lockedCapPx = 43.8;
    let maxScale = 2000;
    const fullSpreadLayout = computeSpreadLayout(1);

    const tick = (now: number) => {
      const elapsed = now - mountTime;
      const svgEl = svgRef.current;
      const curtainEl = curtainPathRef.current;
      const whiteEl = whiteGlyphsPathRef.current;
      const whiteGroupEl = whiteFadeGroupRef.current;

      if (!svgEl || !curtainEl || !whiteEl) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      svgEl.setAttribute('viewBox', `0 0 ${vw} ${vh}`);

      const desiredFontPx = vw >= 1024 ? 60 : vw >= 768 ? 48 : vw >= 640 ? 36 : 24;
      const baseCapPx = desiredFontPx * 0.73;
      const capPx = Math.min(
        baseCapPx,
        (vw * 0.88) / Math.max(1, fullSpreadLayout.totalWidthNorm)
      );

      let scale = 1;
      let tx = 0;
      let ty = vh * 0.5;
      let activeCapScale = capPx;
      let layoutToRender: GlyphPlacement[];

      if (elapsed < INTRO_SPREAD_MS) {
        const uSpread = Math.min(1, Math.max(0, elapsed / INTRO_SPREAD_MS));
        const tSpread = easeSpreadCubicBezier(uSpread);
        const { placements, totalWidthNorm } = computeSpreadLayout(tSpread);
        layoutToRender = placements;
        tx = vw * 0.5 - totalWidthNorm * capPx * 0.5;
        ty = vh * 0.5;
        activeCapScale = capPx;
        curtainEl.style.opacity = '1';
      } else {
        layoutToRender = fullSpreadLayout.placements;
        if (!lockedSpread || Math.abs(lockedCapPx - capPx) > 0.5) {
          lockedSpread = true;
          lockedCapPx = capPx;
          const spreadOriginX = vw * 0.5 - fullSpreadLayout.totalWidthNorm * capPx * 0.5;
          const gOffsetNorm = fullSpreadLayout.placements[5].xOffsetNorm;
          lockedPx = spreadOriginX + (gOffsetNorm + G_STROKE_ANCHOR_X) * capPx;
          lockedPy = vh * 0.5 + G_STROKE_ANCHOR_Y * capPx;

          const cornerRadius = Math.hypot(vw * 0.5, vh * 0.5);
          const minNeeded = Math.ceil(
            (cornerRadius * 1.45) / (capPx * G_STROKE_CLEARANCE_NORM)
          );
          maxScale = Math.max(2000, minNeeded);
        }

        const uZoom = Math.min(1, Math.max(0, (elapsed - INTRO_SPREAD_MS) / INTRO_ZOOM_MS));
        const easeZoom = Math.pow(uZoom, 2.2);
        scale = Math.pow(maxScale, easeZoom);

        const tPan = Math.min(1, uZoom / 0.36);
        const panAlpha = tPan * tPan * (3 - 2 * tPan);
        const targetX = lockedPx + (vw * 0.5 - lockedPx) * panAlpha;
        const targetY = lockedPy + (vh * 0.5 - lockedPy) * panAlpha;

        const spreadOriginX = vw * 0.5 - fullSpreadLayout.totalWidthNorm * capPx * 0.5;
        const originToScreenX = targetX - scale * lockedPx;
        const originToScreenY = targetY - scale * lockedPy;

        tx = originToScreenX + scale * spreadOriginX;
        ty = originToScreenY + scale * (vh * 0.5);
        activeCapScale = capPx * scale;

        if (uZoom >= 0.94) {
          const uFade = Math.min(1, (uZoom - 0.94) / 0.06);
          const easeFade = uFade * uFade * (3 - 2 * uFade);
          curtainEl.style.opacity = (1 - easeFade).toFixed(3);
        } else {
          curtainEl.style.opacity = '1';
        }
      }

      let glyphSubpaths = '';
      const margin = 80;
      for (let i = 0; i < BRAND_WORDMARK_GLYPHS.length; i++) {
        const g = BRAND_WORDMARK_GLYPHS[i];
        const xOffNorm = layoutToRender[i].xOffsetNorm;
        const sx0 = tx + activeCapScale * xOffNorm;
        const sx1 = sx0 + activeCapScale * g.w;
        const sy0 = ty + activeCapScale * g.minY;
        const sy1 = ty + activeCapScale * g.maxY;
        if (sx1 < -margin || sx0 > vw + margin || sy1 < -margin || sy0 > vh + margin) {
          continue;
        }
        glyphSubpaths += serializeTransformedGlyph(g.cmds, xOffNorm, tx, ty, activeCapScale);
      }

      const outerRect = `M-4 -4H${vw + 4}V${vh + 4}H-4Z`;
      curtainEl.setAttribute('d', glyphSubpaths ? `${outerRect}${glyphSubpaths}` : outerRect);
      whiteEl.setAttribute('d', glyphSubpaths);

      if (whiteGroupEl) {
        if (elapsed < 315) {
          whiteGroupEl.style.opacity = Math.min(1, elapsed / 315).toFixed(3);
        } else if (elapsed < 2200) {
          whiteGroupEl.style.opacity = '1';
        } else {
          const uW = Math.min(1, (elapsed - 2200) / 500);
          whiteGroupEl.style.opacity = (1 - uW * uW * (3 - 2 * uW)).toFixed(3);
        }
      }

      if (elapsed >= INTRO_TOTAL_MS) {
        rafId = null;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    tick(mountTime);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none animate-portal-finish"
    >
      <svg ref={svgRef} className="w-full h-full block" preserveAspectRatio="none">
        {/* Preserved Contract 3 SVG mask signature (pure vector SVG path, zero raster canvas) */}
        <defs>
          <mask id="tw-studio-portal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <text
              x="50%"
              y="50%"
              dy="0.356em"
              textAnchor="middle"
              dominantBaseline="alphabetic"
              fill="black"
              className="portal-svg-title animate-portal-spread"
            >
              TWOONG STUDIO
            </text>
          </mask>
        </defs>

        {/* Pure Black Veil behind wordmark during initial spread -> illuminates Showreel right before `'G'` entry */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#000000"
          className="animate-portal-video-veil"
        />

        {/* Infinite-Resolution Compound Vector Cinema Curtain Punched by `TWOON'G' STUDIO` */}
        <path
          ref={curtainPathRef}
          fill="#000000"
          fillRule="evenodd"
          d="M0 0H1440V900H0Z"
        />

        {/* Crisp Vector White Glyphs crossfading cleanly into transparent Showreel window on `'G'` stroke entry */}
        <g ref={whiteFadeGroupRef}>
          <path
            ref={whiteGlyphsPathRef}
            fill="#FFFFFF"
            fillRule="evenodd"
            d=""
          />
        </g>
      </svg>
    </div>
  );
});

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [navCurtainKey, setNavCurtainKey] = useState<number | null>(null);
  const [navCurtainLabel, setNavCurtainLabel] = useState<string>('');
  const [routeEnterKeys, setRouteEnterKeys] = useState<Record<string, number>>({
    home: 0,
    work: 0,
    services: 0,
    contact: 0,
  });

  const [isIntroDone, setIsIntroDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.location.hash.startsWith('#work/');
  });
  const [isHeroReadyForPortalEnd, setIsHeroReadyForPortalEnd] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.location.hash.startsWith('#work/');
  });

  const {
    hasChanges,
    isSaving,
    saveChanges,
    discardChanges,
    pendingChanges,
    isEditMode,
    setIsEditMode,
  } = useSiteTexts();

  // Initialize inertial desktop smooth-scroll engine + top-of-page reset
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (!window.location.hash.startsWith('#work/')) {
      window.scrollTo(0, 0);
      delete document.documentElement.dataset.hasScrolled;
      document.documentElement.dataset.scrollDir = 'down';
    } else {
      document.documentElement.dataset.hasScrolled = 'true';
    }

    const cleanupScroll = initSmoothWheelScroll();
    return () => {
      cleanupScroll();
    };
  }, []);

  // Orchestrate Single-SVG Portal (`0 -> 5050ms` unlock & Hero reveal -> `5350ms` clean overlay unmount)
  useEffect(() => {
    if (isIntroDone) {
      delete document.documentElement.dataset.introLocked;
      return;
    }

    document.documentElement.dataset.introLocked = 'true';

    const heroTimer = window.setTimeout(() => {
      delete document.documentElement.dataset.introLocked;
      setIsHeroReadyForPortalEnd(true);
    }, HERO_REVEAL_MS);

    const doneTimer = window.setTimeout(() => {
      setIsIntroDone(true);
      try {
        sessionStorage.setItem('tw_intro_portal_played_v5', 'true');
      } catch {
        // ignore storage quota errors
      }
    }, INTRO_TOTAL_MS);

    return () => {
      window.clearTimeout(heroTimer);
      window.clearTimeout(doneTimer);
      delete document.documentElement.dataset.introLocked;
    };
  }, [isIntroDone]);

  // Unhurried Wow Tapes Route Curtain (`1720ms` sweep, re-triggering destination entrance choreography at `720ms`)
  useEffect(() => {
    const timers: number[] = [];

    const handleNavTransition = (e: Event) => {
      const detail = (
        e as CustomEvent<{ label?: string; targetId?: string; offset?: number }>
      ).detail;
      const label = detail?.label || '';
      const targetId = detail?.targetId || 'home';
      const offset = detail?.offset ?? 0;

      setNavCurtainLabel(label);
      setNavCurtainKey(Date.now());

      const midTimer = window.setTimeout(() => {
        if (targetId === 'home') {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        } else {
          document.documentElement.dataset.hasScrolled = 'true';
          const el = document.getElementById(targetId);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: Math.max(0, top), behavior: 'instant' as ScrollBehavior });
          }
        }

        window.dispatchEvent(new CustomEvent('tw:programmatic-scroll'));

        setRouteEnterKeys((prev) => ({
          ...prev,
          [targetId]: (prev[targetId] || 0) + 1,
        }));
      }, 720);

      const endTimer = window.setTimeout(() => {
        setNavCurtainKey(null);
      }, 1740);

      timers.push(midTimer, endTimer);
    };

    window.addEventListener('tw:nav-transition', handleNavTransition);
    return () => {
      window.removeEventListener('tw:nav-transition', handleNavTransition);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    const sections = ['home', 'work', 'services', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      alert(
        '구글 시트 전송 완료! 실시간 반영까지 1분 이내 소요될 수 있으며, 현재 화면에는 즉시 반영되었습니다.'
      );
      setIsEditMode(false);
    } else if (!localStorage.getItem('vite_google_script_url') && !import.meta.env.VITE_GOOGLE_SCRIPT_URL) {
      setShowAdmin(true);
    }
  };

  // Hidden Admin Shortcut (`Ctrl + Shift + A` / `Cmd + Shift + A`) & URL Param (`?admin=1` or `#admin`)
  useEffect(() => {
    const checkUrlAdmin = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        setShowAdmin(true);
        if (window.location.hash === '#admin') {
          try {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          } catch {
            // ignore
          }
        }
      }
    };
    checkUrlAdmin();

    const handleAdminShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdmin(true);
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);
    window.addEventListener('hashchange', checkUrlAdmin);
    return () => {
      window.removeEventListener('keydown', handleAdminShortcut);
      window.removeEventListener('hashchange', checkUrlAdmin);
    };
  }, []);

  const pendingCount = Object.keys(pendingChanges).length;
  const isHeroRevealed = isHeroReadyForPortalEnd && navCurtainKey === null;

  return (
    <div className="min-h-screen bg-white text-[#0A0A0B] selection:bg-[#0A0A0B] selection:text-white">
      {/* 1. Persistent Single-SVG Vector Mask Portal (`Zero Hitch` & 100% Full `'S'` Pass-Through) */}
      {!isIntroDone && <IntroPortalOverlay />}

      {/* 2. Unhurried Wow Tapes–Style Menu Route Curtain (`1.72s` + Masked Title Slide) */}
      {navCurtainKey !== null && (
        <div
          key={navCurtainKey}
          aria-hidden="true"
          className="fixed inset-0 z-[9000] pointer-events-none bg-[#0E0E0E] text-white flex flex-col items-center justify-center shadow-2xl animate-nav-curtain"
        >
          <span className="font-mono-tech text-[10px] tracking-[0.24em] uppercase text-white/45 mb-3 animate-curtain-sub">
            TWOONG STUDIO
          </span>
          {navCurtainLabel && (
            <div className="overflow-hidden py-1">
              <span className="block font-display text-5xl sm:text-7xl md:text-8xl tracking-tight uppercase text-white select-none animate-curtain-title">
                {navCurtainLabel}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Wow Tapes Minimal Floating Header (Public Visitors See Zero Admin Clutter) */}
      <Navbar
        activeSection={activeSection}
        isIntroActive={!isHeroReadyForPortalEnd}
      />

      <main>
        <section id="home" key={`home-${routeEnterKeys.home}`}>
          <HomeSection isHeroRevealed={isHeroRevealed} />
        </section>

        <section
          id="work"
          className="pt-20 sm:pt-22 md:pt-24 pb-16 md:pb-28 bg-white scroll-mt-16 relative z-10"
        >
          <div
            key={`work-${routeEnterKeys.work}`}
            className={routeEnterKeys.work > 0 ? 'animate-route-arrive' : ''}
          >
            <WorkSection />
          </div>
        </section>

        <section
          id="services"
          className="pb-16 md:pb-28 bg-white scroll-mt-16 relative z-10"
        >
          <div
            key={`services-${routeEnterKeys.services}`}
            className={routeEnterKeys.services > 0 ? 'animate-route-arrive' : ''}
          >
            <ServicesSection />
          </div>
        </section>

        <section
          id="contact"
          className="pb-12 md:pb-16 bg-white scroll-mt-16 relative z-10"
        >
          <div
            key={`contact-${routeEnterKeys.contact}`}
            className={routeEnterKeys.contact > 0 ? 'animate-route-arrive' : ''}
          >
            <ContactSection />
          </div>
        </section>
      </main>

      {/* Static Grounded Architectural Copyright Bar */}
      <footer className="pb-8 pt-4 bg-white">
        <div className="w-full px-3 sm:px-5 md:px-7 lg:px-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono-tech text-[11px] text-neutral-400 tracking-[0.08em]">
          <p className="cursor-default select-none">
            &copy; {new Date().getFullYear()} <EditableText textKey="footerCopyright" />. All rights reserved.
          </p>
          <p className="select-none uppercase text-[10px] tracking-[0.16em] text-neutral-300">
            TWOONG STUDIO ARCHIVE
          </p>
        </div>
      </footer>

      {/* Thumbnail Crop Position & Orientation Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[8000] w-[calc(100vw-24px)] max-w-2xl bg-[#0A0A0B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider">프레이밍 변경사항 ({pendingCount}건)</span>
            <span className="text-[10px] text-neutral-400">문구·작품 데이터는 구글 시트에서 직접 수정하고, 썸네일 크롭·비율 설정만 여기서 저장합니다.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                discardChanges();
                setIsEditMode(false);
              }}
              disabled={isSaving}
              className="px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              disabled={isSaving}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              관리자 창
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-white text-[#0A0A0B] rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                '구글 시트에 저장하기'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Framing Mode Active Bar */}
      {!hasChanges && isEditMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[8000] w-[calc(100vw-24px)] max-w-xl bg-[#0A0A0B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-4 border border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider">썸네일 프레이밍 조절 모드</span>
              <span className="text-[10px] text-neutral-400">문구·작품 수정은 work 구글 시트 단일 마스터에서 관리합니다</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1ui6NN8gESJu5LC5EFGaXXMShPBkgd7_vf30lvLFgAQo/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-semibold transition-colors"
            >
              구글 시트 열기 ↗
            </a>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-3.5 py-1.5 bg-white text-[#0A0A0B] rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
            >
              조절 종료
            </button>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showAdmin && (
        <Suspense fallback={null}>
          <AdminSettingsModal onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SiteTextsProvider>
      <AppContent />
    </SiteTextsProvider>
  );
};

export default App;
