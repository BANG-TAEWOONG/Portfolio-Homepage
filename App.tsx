
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';

// 컴포넌트 레이지 로딩 (초기 로딩 속도 향상)
const Home = lazy(() => import('./components/Home'));
const Work = lazy(() => import('./components/Work'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));

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

      <footer className="py-12 text-center border-t border-slate-100 text-slate-300 text-[10px] tracking-[0.2em] uppercase">
        <p>&copy; {new Date().getFullYear()} Video Producer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
