
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { useSiteTexts } from './hooks/useSiteTexts';

// 컴포넌트 레이지 로딩 (초기 로딩 속도 향상)
const Home = lazy(() => import('./components/sections/Home'));
const Work = lazy(() => import('./components/sections/Work'));
const About = lazy(() => import('./components/sections/About'));
const Contact = lazy(() => import('./components/sections/Contact'));

const Admin = lazy(() => import('./components/Admin'));

// 섹션 스켈레톤 (로딩 중 표시)
const SectionLoader = () => (
  <div className="w-full h-[60vh] flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const RevealSection: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section id={id} ref={ref} className={`${className} reveal-view ${isVisible ? 'visible' : ''}`}>
      {children}
    </section>
  );
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const { texts } = useSiteTexts();

  // ── 시네마틱 인트로 오버레이 상태 ──
  const [introActive, setIntroActive] = useState(false);
  const [introFading, setIntroFading] = useState(false);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('introPlayed');
    if (!hasPlayed) {
      setIntroActive(true);
      // 2.2초 동안 텍스트 애니메이션 진행 후 페이드 아웃 시작
      const fadeTimeout = setTimeout(() => {
        setIntroFading(true);
        // 1초간 페이드 아웃 완료 후 오버레이 완벽히 해제
        const removeTimeout = setTimeout(() => {
          setIntroActive(false);
          sessionStorage.setItem('introPlayed', 'true');
        }, 1000);
        return () => clearTimeout(removeTimeout);
      }, 2200);
      return () => clearTimeout(fadeTimeout);
    }
  }, []);

  // ── 개발자 모드: 푸터 5번 탭 감지 ──
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFooterTap = useCallback(() => {
    tapCountRef.current += 1;

    // 이전 타이머 리셋 (2초 이내에 5번 클릭해야 함)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowAdmin(true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  }, []);

  useEffect(() => {
    // IntersectionObserver를 사용한 효율적인 Scroll Spy 구현
    const sections = ['home', 'work', 'about', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // 화면 상단 20~30% 영역에 들어올 때 활성화
      threshold: 0
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

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      {/* Cinematic Intro Loader Overlay */}
      {introActive && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-1000 ease-in-out ${
            introFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            className={`text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-widest transition-all duration-[2200ms] ease-out ${
              introFading ? 'opacity-0 scale-[1.05] tracking-[1.5em]' : 'animate-letter-space'
            }`}
          >
            TWOONG STUDIO
          </div>
        </div>
      )}

      <Navbar activeSection={activeSection} />

      <main>
        <section id="home">
          <Suspense fallback={<SectionLoader />}>
            <Home />
          </Suspense>
        </section>

        <RevealSection id="work" className="py-16 md:py-32 bg-white">
          <Suspense fallback={<SectionLoader />}>
            <Work />
          </Suspense>
        </RevealSection>

        <RevealSection id="about" className="py-16 md:py-32 bg-slate-50">
          <Suspense fallback={<SectionLoader />}>
            <About />
          </Suspense>
        </RevealSection>

        <RevealSection id="contact" className="py-16 md:py-40">
          <Suspense fallback={<SectionLoader />}>
            <Contact />
          </Suspense>
        </RevealSection>
      </main>

      {/* 푸터 — copyright를 5번 빠르게 클릭하면 Admin 모달 활성화 */}
      <footer className="py-12 text-center border-t border-slate-100 text-slate-300 text-[10px] tracking-[0.2em] uppercase">
        <p
          onClick={handleFooterTap}
          className="cursor-default select-none"
        >
          &copy; {new Date().getFullYear()} {texts.footerCopyright}. All rights reserved.
        </p>
      </footer>

      {/* Admin 모달 오버레이 */}
      {showAdmin && (
        <Suspense fallback={null}>
          <Admin onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default App;
