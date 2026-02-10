
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Work from './components/Work';
import About from './components/About';
import Contact from './components/Contact';

const RevealSection: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={`${className} reveal-view ${isVisible ? 'visible' : ''}`}>
      {children}
    </section>
  );
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'work', 'about', 'contact'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <Navbar activeSection={activeSection} />
      
      <main>
        <section id="home">
          <Home />
        </section>
        
        <RevealSection id="work" className="py-16 md:py-32 bg-white">
          <Work />
        </RevealSection>
        
        <RevealSection id="about" className="py-16 md:py-32 bg-slate-50">
          <About />
        </RevealSection>
        
        <RevealSection id="contact" className="py-16 md:py-40">
          <Contact />
        </RevealSection>
      </main>

      <footer className="py-12 text-center border-t border-slate-100 text-slate-300 text-[10px] tracking-[0.2em] uppercase">
        <p>&copy; {new Date().getFullYear()} Video Producer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
