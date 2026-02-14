import React, { useState, useEffect } from 'react';

interface NavbarProps {
  activeSection: string; // 현재 화면에 보이는 섹션 ID (부모 컴포넌트로부터 전달받음)
}

const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  // 1. 상태 관리
  const [isScrolled, setIsScrolled] = useState(false); // 사용자가 스크롤을 내렸는지 여부
  const [isHovered, setIsHovered] = useState(false);   // 네비게이션 바에 마우스를 올렸는지 여부
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 모바일 사이드바 열림 상태

  // 네비게이션 메뉴 항목들 (라벨과 이동할 섹션 ID)
  const navItems = [
    { label: 'HOME', id: 'home' },
    { label: 'WORK', id: 'work' },
    { label: 'ABOUT', id: 'about' },
    { label: 'CONTACT', id: 'contact' },
  ];

  // 2. 스크롤 이벤트 리스너 (네비게이션 표시 로직용)
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 10px 이상 발생하면 isScrolled를 true로 설정
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    // 컴포넌트가 사라질 때 리스너 제거 (메모리 누수 방지)
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // 사이드바 열림 시 스크롤 잠금
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // 3. 특정 섹션으로 부드럽게 이동하는 함수 (Smooth Scroll)
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault(); // a 태그의 기본 동작(즉시 점프)을 막음
    const element = document.getElementById(id);

    if (element) {
      const headerOffset = 64; // 고정된 헤더 높이(64px)만큼 위치를 보정해줌
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      // 계산된 위치로 부드럽게 스크롤 이동
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-slate-100 ${isScrolled || isHovered
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full hover:opacity-100 hover:translate-y-0'
          }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full px-6 h-16 md:h-20 flex items-center justify-between">
          {/* 좌측 로고 */}
          <a
            href="#home"
            onClick={(e) => scrollToSection(e, 'home')}
            className="text-[15px] md:text-xl font-bold tracking-tighter text-slate-900 whitespace-nowrap"
          >
            TWOONG STUDIO
          </a>

          {/* 우측 메뉴 리스트 - 데스크탑 (md 이상) */}
          <div className="hidden md:flex md:space-x-12">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`text-xs font-semibold tracking-widest transition-colors duration-300 hover:text-slate-900 ${activeSection === item.id
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
                  : 'text-slate-400'
                  }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* 햄버거 아이콘 (모바일) */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-900 z-[201] relative cursor-pointer"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* 모바일 사이드바 드로어 — nav 바깥에 배치하여 fixed가 화면 전체에 적용 */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[200] shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col pt-24 px-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                scrollToSection(e, item.id);
                setIsSidebarOpen(false);
              }}
              className={`block py-4 px-2 text-sm font-semibold tracking-widest transition-colors duration-300 ${activeSection === item.id
                ? 'text-slate-900 border-l-2 border-slate-900 pl-4 bg-slate-50'
                : 'text-slate-400 hover:text-slate-900 pl-4'
                }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* 배경 오버레이 — nav 바깥에 배치 */}
      <div
        className={`fixed inset-0 z-[199] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export default React.memo(Navbar);