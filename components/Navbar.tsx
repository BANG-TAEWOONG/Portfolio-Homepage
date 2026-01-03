import React, { useState, useEffect } from 'react';

interface NavbarProps {
  activeSection: string; // 현재 화면에 보이는 섹션 ID (부모 컴포넌트로부터 전달받음)
}

const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  // 1. 상태 관리
  const [isScrolled, setIsScrolled] = useState(false); // 사용자가 스크롤을 내렸는지 여부
  const [isHovered, setIsHovered] = useState(false);   // 네비게이션 바에 마우스를 올렸는지 여부

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

  // 3. 특정 섹션으로 부드럽게 이동하는 함수 (Smooth Scroll)
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault(); // a 태그의 기본 동작(즉시 점프)을 막음
    const element = document.getElementById(id);

    if (element) {
      const headerOffset = 64; // 고정된 헤더 높이(64px)만큼 위치를 보정해줌
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // 계산된 위치로 부드럽게 스크롤 이동
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav
      // 4. 네비게이션 컨테이너 스타일링 (동적 클래스 적용)
      // fixed top-0: 화면 상단에 고정
      // backdrop-blur-md bg-white/80: 배경을 반투명한 흰색 유리처럼 처리
      // 조건부 로직: 스크롤을 내렸거나(isScrolled) 마우스를 올렸을 때(isHovered)만 보임
      // 그렇지 않으면(맨 위 + 마우스 밖) 위로 숨겨짐(-translate-y-full)
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-slate-100 ${isScrolled || isHovered
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full hover:opacity-100 hover:translate-y-0'
        }`}
      onMouseEnter={() => setIsHovered(true)} // 마우스 올리면 강제로 표시
      onMouseLeave={() => setIsHovered(false)} // 마우스 치우면 스크롤 상태에 따라 결정
    >
      <div className="w-full px-6 h-16 md:h-20 flex items-center justify-between">
        {/* 좌측 로고 (클릭 시 최상단 Home으로 이동) */}
        <a
          href="#home"
          onClick={(e) => scrollToSection(e, 'home')}
          className="text-lg md:text-xl font-bold tracking-tighter text-slate-900"
        >
          PORTFOLIO.
        </a>

        {/* 우측 메뉴 리스트 - 모바일/데스크탑 모두 표시 */}
        <div className="flex space-x-4 md:space-x-12">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => scrollToSection(e, item.id)}
              // 현재 활성화된 섹션(activeSection)인 경우 스타일 강조
              // 활성: 진한 검정색(text-slate-900) + 밑줄(border-b-2)
              // 비활성: 연한 회색(text-slate-400)
              className={`text-[10px] md:text-xs font-semibold tracking-widest transition-colors duration-300 hover:text-slate-900 ${activeSection === item.id
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
                  : 'text-slate-400'
                }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
