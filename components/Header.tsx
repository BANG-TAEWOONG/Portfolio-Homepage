import React, { useState, useEffect, useCallback } from 'react';

const Header = () => {
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const navLinks = [
        { href: '#home', label: 'Home' },
        { href: '#works', label: 'Work' },
        { href: '#about', label: 'About' },
        { href: '#contact', label: 'Contact' },
    ];

    const controlHeader = useCallback(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setVisible(false);
        } else {
            setVisible(true);
        }
        setLastScrollY(currentScrollY);
    }, [lastScrollY]);

    useEffect(() => {
        window.addEventListener('scroll', controlHeader, { passive: true });
        return () => {
            window.removeEventListener('scroll', controlHeader);
        };
    }, [controlHeader]);

    // FIX: Explicitly type event handler arguments to resolve createElement overload issues.
    const handleScroll = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (href === '#home' || !targetElement) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return React.createElement('header', {
        className: `fixed top-0 w-full px-4 sm:px-8 md:px-12 py-4 sm:py-5 md:py-7 flex justify-between items-center z-40 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-sm transition-transform duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'}`
    },
        React.createElement('a', {
            href: "#home",
            onClick: (e) => handleScroll(e, '#home'),
            className: "text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tighter text-[#2a2a2a]"
        }, "PORTFOLIO"),
        React.createElement('nav', { className: "flex gap-4 sm:gap-5 md:gap-10" },
            navLinks.map((link) => React.createElement('a', {
                key: link.href,
                href: link.href,
                onClick: (e) => handleScroll(e, link.href),
                className: "text-xs sm:text-sm text-[#595959] font-semibold tracking-tight transition-colors duration-300 hover:text-[#2a2a2a]"
            }, link.label))
        )
    );
};

export default Header;