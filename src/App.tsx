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

const AdminSettingsModal = lazy(() => import('./modals/AdminSettingsModal'));

const INTRO_SPREAD_MS = 2350;
const INTRO_ZOOM_MS = 3150;
const INTRO_TOTAL_MS = INTRO_SPREAD_MS + INTRO_ZOOM_MS; // 5500ms
const HERO_REVEAL_MS = 5100; // Cleanly unlocks once `'S'` dilates & curtain releases!

/**
 * Zero-Hitch Persistent Single-SVG Vector Mask Portal (`0 -> 5.50s`)
 * - Measures exact SVG glyph extent (`getExtentOfChar(7)`) for `'S'` so the optical zoom spine center has 0.00px vertical sink.
 * - Uses alphabetic baseline + `dy="0.356em"` cap-height alignment so `'S'` spine stays pinned at viewport center.
 * - Applies progressive mask stroke dilation (`u = 0.30 -> 0.76`) + smooth curtain release (`u = 0.68 -> 0.92`) so `'S'` clears cleanly into playing Hero video with ZERO black flash!
 */
const IntroPortalOverlay: React.FC = React.memo(() => {
  const gaugeTextRef = useRef<SVGTextElement>(null);
  const sMeasureRef = useRef<SVGTSpanElement>(null);
  const tMeasureRef = useRef<SVGTSpanElement>(null);
  const maskZoomGroupRef = useRef<SVGGElement>(null);
  const maskTextRef = useRef<SVGTextElement>(null);
  const whiteZoomGroupRef = useRef<SVGGElement>(null);
  const curtainRectRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const mountTime = performance.now();
    let rafId: number | null = null;
    let measured = false;
    let px = 0;
    let py = 0;
    let vw = 1440;
    let vh = 900;
    let maxScale = 420;
    let computedSize = 60;

    const tick = (now: number) => {
      const elapsed = now - mountTime;
      const maskGroup = maskZoomGroupRef.current;
      const whiteGroup = whiteZoomGroupRef.current;
      const maskText = maskTextRef.current;
      const curtainRect = curtainRectRef.current;

      if (elapsed >= INTRO_SPREAD_MS && maskGroup && whiteGroup) {
        if (!measured) {
          measured = true;
          vw = window.innerWidth || 1440;
          vh = window.innerHeight || 900;
          const gaugeEl = gaugeTextRef.current;
          const sEl = sMeasureRef.current;
          const tEl = tMeasureRef.current;
          computedSize = sEl
            ? parseFloat(window.getComputedStyle(sEl).fontSize || '60') || 60
            : 60;

          let foundExactGlyph = false;
          if (gaugeEl && typeof gaugeEl.getExtentOfChar === 'function') {
            try {
              const ext = gaugeEl.getExtentOfChar(7); // Index 7 of "TWOONG STUDIO" === 'S'
              if (ext && ext.width > 0 && ext.height > 0) {
                px = ext.x + ext.width * 0.5;
                py = ext.y + ext.height * 0.5;
                foundExactGlyph = true;
              }
            } catch {
              // fallback below
            }
          }

          if (!foundExactGlyph) {
            const sRect = sEl?.getBoundingClientRect();
            const tRect = tEl?.getBoundingClientRect();
            const stepST = sRect && tRect ? tRect.left - sRect.left : 0;
            const sAdvance =
              stepST > 0
                ? Math.max(computedSize * 0.36, stepST - 0.6 * computedSize)
                : computedSize * 0.56;

            px = sRect && sRect.width > 0 ? sRect.left + sAdvance * 0.5 : vw * 0.525;
            py = vh * 0.5;
          }

          maxScale = Math.max(
            420,
            Math.ceil(Math.max((vh * 16) / computedSize, (vw * 7) / computedSize))
          );
        }

        const u = Math.min(1, (elapsed - INTRO_SPREAD_MS) / INTRO_ZOOM_MS);
        const ease = u * u * (3 - 2 * u);
        const scale = Math.pow(maxScale, ease);

        const tPan = Math.min(1, u / 0.34);
        const panAlpha = tPan * tPan * (3 - 2 * tPan);
        const targetX = px + (vw * 0.5 - px) * panAlpha;
        const targetY = py + (vh * 0.5 - py) * panAlpha;

        const tx = targetX - scale * px;
        const ty = targetY - scale * py;
        const tf = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`;

        maskGroup.setAttribute('transform', tf);
        whiteGroup.setAttribute('transform', tf);

        // Dilate `#000000` knockout stroke of `'S'` inside mask after white fill fades (`u = 0.30 -> 0.76`)
        if (maskText) {
          if (u > 0.3) {
            const uStroke = Math.min(1, (u - 0.3) / 0.46);
            const easeStroke = uStroke * uStroke * (3 - 2 * uStroke);
            maskText.style.strokeWidth = `${(easeStroke * computedSize * 0.48).toFixed(2)}px`;
          } else {
            maskText.style.strokeWidth = '0px';
          }
        }

        // Smooth curtain fade (`u = 0.68 -> 0.92`) guarantees ZERO black screen drop at end of zoom
        if (curtainRect) {
          if (u >= 0.68) {
            const uFade = Math.min(1, (u - 0.68) / 0.24);
            const easeFade = uFade * uFade * (3 - 2 * uFade);
            curtainRect.style.opacity = (1 - easeFade).toFixed(3);
          } else {
            curtainRect.style.opacity = '1';
          }
        }

        if (u >= 1) {
          rafId = null;
          return;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

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
      <svg className="w-full h-full block" preserveAspectRatio="none">
        {/* Stationary invisible coordinate gauge placed in the live SVG tree */}
        <text
          ref={gaugeTextRef}
          x="50%"
          y="50%"
          dy="0.356em"
          textAnchor="middle"
          dominantBaseline="alphabetic"
          opacity="0"
          className="portal-svg-title"
          style={{ letterSpacing: '0.6em', pointerEvents: 'none' }}
        >
          TWOONG <tspan ref={sMeasureRef}>S</tspan>
          <tspan ref={tMeasureRef}>T</tspan>UDIO
        </text>

        <defs>
          <mask id="tw-studio-portal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <g ref={maskZoomGroupRef}>
              <text
                ref={maskTextRef}
                x="50%"
                y="50%"
                dy="0.356em"
                textAnchor="middle"
                dominantBaseline="alphabetic"
                fill="black"
                stroke="#000000"
                strokeLinejoin="round"
                strokeLinecap="round"
                paintOrder="stroke fill"
                style={{ strokeWidth: '0px' }}
                className="portal-svg-title animate-portal-spread"
              >
                TWOONG STUDIO
              </text>
            </g>
          </mask>
        </defs>

        {/* Solid Black Cinema Curtain Punched Cleanly by `'S'` */}
        <rect
          ref={curtainRectRef}
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#000000"
          mask="url(#tw-studio-portal-mask)"
        />

        {/* Pure Black Veil behind text during initial spread -> softly reveals playing Showreel right before `'S'` push-in */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#000000"
          className="animate-portal-video-veil"
        />

        {/* Slim `font-medium` White Letters synchronizing identically with mask knockout */}
        <g
          ref={whiteZoomGroupRef}
          className="animate-portal-white-glyphs"
        >
          <text
            x="50%"
            y="50%"
            dy="0.356em"
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="#FFFFFF"
            className="portal-svg-title animate-portal-spread"
          >
            TWOONG STUDIO
          </text>
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
