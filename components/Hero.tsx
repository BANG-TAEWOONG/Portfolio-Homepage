
import React, { useState, useEffect } from 'react';

const Hero: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);
    const [textVisible, setTextVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.pageYOffset);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const transform = `translateY(${scrollY * 0.4}px)`;

    const handleTap = () => {
        // Tailwind's 'sm' breakpoint is 640px
        if (window.innerWidth < 640) {
            setTextVisible(prev => !prev);
        }
    };

    return (
        <section
            className="h-screen relative flex items-center justify-center bg-[#e8e8e8] overflow-hidden cursor-pointer sm:cursor-default"
            id="home"
            onClick={handleTap}
        >
            <video className="absolute w-full h-full object-cover opacity-30" autoPlay muted loop playsInline>
                <source src="https://cdn.pixabay.com/video/2023/05/02/159943-823979941_large.mp4" type="video/mp4" />
            </video>
            <div className="relative z-10 p-8 group">
                <div
                    className={`text-center transition-opacity duration-500 ease-in-out ${textVisible ? 'opacity-100' : 'opacity-0'} sm:opacity-0 sm:group-hover:opacity-100`}
                    style={{ transform }}
                >
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 sm:mb-6 text-[#2a2a2a] leading-tight">Performance Videographer</h1>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-[#7a7a7a] tracking-widest">IDOL & DANCER PERFORMANCE FILMS</p>
                </div>
            </div>
            <div className={`absolute bottom-10 text-center z-10 p-4 text-[#2a2a2a]/60 font-semibold animate-pulse transition-opacity duration-500 ${textVisible ? 'opacity-0' : 'opacity-100'} sm:hidden`}>
                Tap to show title
            </div>
        </section>
    );
};

export default Hero;
