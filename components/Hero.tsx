import React, { useState } from 'react';

const Hero = () => {
    const [textVisible, setTextVisible] = useState(false);

    const handleTap = () => {
        if (window.innerWidth < 640) {
            setTextVisible(prev => !prev);
        }
    };

    return React.createElement('section', {
        className: "h-screen relative flex items-center justify-center overflow-hidden cursor-pointer sm:cursor-default",
        id: "home",
        onClick: handleTap
    },
        React.createElement('video', {
            className: "absolute w-full h-full object-cover opacity-30",
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true
        },
            React.createElement('source', { src: "https://cdn.pixabay.com/video/2023/05/02/159943-823979941_large.mp4", type: "video/mp4" })
        ),
        React.createElement('div', { className: "relative z-10 p-8 group" },
            React.createElement('div', {
                className: `text-center transition-opacity duration-500 ease-in-out ${textVisible ? 'opacity-100' : 'opacity-0'} sm:opacity-0 sm:group-hover:opacity-100`
            },
                React.createElement('h1', { className: "text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 sm:mb-6 text-[#2a2a2a] leading-tight" }, "Performance Videographer"),
                React.createElement('p', { className: "text-sm sm:text-base md:text-lg font-medium text-[#7a7a7a] tracking-widest" }, "IDOL & DANCER PERFORMANCE FILMS")
            )
        ),
        React.createElement('div', {
            className: `absolute bottom-10 text-center z-10 p-4 text-[#2a2a2a]/60 font-semibold animate-pulse transition-opacity duration-500 ${textVisible ? 'opacity-0' : 'opacity-100'} sm:hidden`
        }, "Tap to show title")
    );
};

export default Hero;