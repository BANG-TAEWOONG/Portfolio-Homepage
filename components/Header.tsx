import React from 'react';

const Header = () => {
    const navLinks = [
        { href: '#home', label: 'Home' },
        { href: '#works', label: 'Work' },
        { href: '#about', label: 'About' },
        { href: '#contact', label: 'Contact' },
    ];

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (href === '#home' || !targetElement) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return React.createElement('header', {
        className: "fixed top-0 w-full px-4 sm:px-8 md:px-12 py-4 sm:py-5 md:py-7 flex justify-between items-center z-40 bg-white/90 backdrop-blur-md shadow-sm"
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
                // Fix: Add explicit type for the event parameter to resolve overload error for React.createElement.
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleScroll(e, link.href),
                className: "text-xs sm:text-sm text-[#595959] font-semibold tracking-tight transition-colors duration-300 hover:text-[#2a2a2a]"
            }, link.label))
        )
    );
};

export default Header;
