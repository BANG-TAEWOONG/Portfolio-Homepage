import React, { useState, useEffect } from 'react';

interface NavbarProps {
  activeSection: string;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { label: 'HOME', id: 'home' },
    { label: 'WORK', id: 'work' },
    { label: 'ABOUT', id: 'about' },
    { label: 'CONTACT', id: 'contact' },
  ];

  // Handle scroll for visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-slate-100 ${isScrolled || isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full hover:opacity-100 hover:translate-y-0'
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full px-6 h-16 md:h-20 flex items-center justify-between">
        <a
          href="#home"
          onClick={(e) => scrollToSection(e, 'home')}
          className="text-lg md:text-xl font-bold tracking-tighter text-slate-900"
        >
          PORTFOLIO.
        </a>

        {/* Menu - Visible on all devices */}
        <div className="flex space-x-4 md:space-x-12">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => scrollToSection(e, item.id)}
              className={`text-[10px] md:text-xs font-semibold tracking-widest transition-colors duration-300 hover:text-slate-900 ${activeSection === item.id ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'text-slate-400'
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
