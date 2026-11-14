import React, { useState, useEffect } from 'react';
import { smoothScrollTo } from '../integrations/smoothScroll';
import { useSiteTexts } from '../integrations/useSiteTexts';

interface NavbarProps {
  activeSection: string;
  isIntroActive?: boolean;
}

const MENU_LINKS = [
  { label: 'HOME', sub: 'Showreel', id: 'home', offset: 0 },
  { label: 'WORKS', sub: '전체 필모그래피 · Personal & Participation', id: 'work', offset: 12 },
  { label: 'SERVICES', sub: '스튜디오 소개 · Pre / Production / Post', id: 'services', offset: 12 },
  { label: 'CONTACT', sub: '촬영 및 협업 문의', id: 'contact', offset: 12 },
] as const;

const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  isIntroActive = false,
}) => {
  const { texts } = useSiteTexts();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight || 800;
      const y =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setIsPastHero(y > vh * 0.52);
    };
    handleScroll();
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    window.addEventListener('tw:programmatic-scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('tw:programmatic-scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleNavigate = (
    e: React.MouseEvent,
    id: (typeof MENU_LINKS)[number]['id'],
    label: string,
    offset: number
  ) => {
    e.preventDefault();
    setIsMenuOpen(false);

    // Trigger unhurried Wow Tapes–style page curtain (`1.72s cubic-bezier(0.76, 0, 0.24, 1)`)
    window.dispatchEvent(
      new CustomEvent('tw:nav-transition', {
        detail: { label, targetId: id, offset },
      })
    );
  };

  const showLightPillWordmark = isPastHero;

  return (
    <>
      {/* Full-Bleed Minimal Floating Header: Wordmark (Left) + MENU Pill (Right) */}
      <header
        className={`fixed top-3.5 sm:top-4 md:top-5 inset-x-0 z-[160] px-4 sm:px-6 md:px-8 lg:px-10 pointer-events-none flex items-center justify-between transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isIntroActive ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Top-Left: Clean TWOONG STUDIO Wordmark (Public Editorial Header) */}
        <div
          className={`pointer-events-auto inline-flex items-center transition-all duration-300 ${
            showLightPillWordmark
              ? 'px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-black/12 shadow-sm text-[#0A0A0B]'
              : 'py-1 text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.42)]'
          }`}
        >
          <a
            href="#home"
            onClick={(e) => handleNavigate(e, 'home', 'TWOONG STUDIO', 0)}
            className="font-display text-[20px] sm:text-[23px] md:text-[26px] leading-none tracking-[0.02em] uppercase hover:opacity-75 transition-opacity select-none"
          >
            TWOONG STUDIO
          </a>
        </div>

        {/* Top-Right: Compact Rounded MENU Pill (`72px × 28px`) */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`h-7 px-4 rounded-full text-[12px] font-mono-tech font-medium tracking-[0.08em] uppercase transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isMenuOpen
                ? 'bg-white text-[#0A0A0B] shadow-xs hover:bg-neutral-200'
                : 'bg-[#F4F4F2] text-[#0E0E0E] border border-black/10 shadow-xs hover:bg-[#0E0E0E] hover:text-white'
            }`}
          >
            {isMenuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </header>

      {/* Transparent Light-Dismiss Backdrop when Compact Menu Card is Open */}
      {isMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-[149] bg-black/20 backdrop-blur-[1px] transition-opacity"
        />
      )}

      {/* Wow Tapes Compact Top-Right Navigation Card (`HOME` · `WORKS` · `SERVICES` · `CONTACT`) */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Site Navigation"
        className={`fixed top-2 right-2 sm:top-2.5 sm:right-2.5 z-[155] w-[calc(100vw-16px)] sm:w-[420px] md:w-[440px] rounded-[10px] bg-[#0E0E0E] text-white border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.48)] px-7 pt-16 pb-7 flex flex-col justify-between min-h-[460px] sm:min-h-[504px] origin-top-right transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isMenuOpen
            ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-3 invisible pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-end gap-3.5 text-right mt-1">
          {MENU_LINKS.map((item, idx) => {
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavigate(e, item.id, item.label, item.offset)}
                style={{
                  transitionDelay: isMenuOpen ? `${70 + idx * 75}ms` : '0ms',
                }}
                className={`group flex flex-col items-end transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <span
                  className={`font-display text-[42px] sm:text-[50px] leading-[0.88] tracking-[-0.01em] uppercase transition-all duration-200 group-hover:-translate-x-1.5 ${
                    isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
                <span className="font-mono-tech text-[10px] tracking-[0.06em] text-white/40 group-hover:text-white/75 transition-colors mt-1">
                  {item.sub}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Bottom-Right Direct Channels */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-end justify-end gap-4">
          <div className="flex flex-col items-end gap-1.5 font-mono-tech text-[13px] text-white/75">
            {texts.contactYoutube && (
              <a
                href={texts.contactYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                YouTube
              </a>
            )}
            {texts.contactInstagram && (
              <a
                href={texts.contactInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
            {texts.contactEmail && (
              <a
                href={`mailto:${texts.contactEmail}`}
                className="hover:text-white transition-colors text-xs text-white/60"
              >
                {texts.contactEmail}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Navbar);
