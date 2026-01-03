import React, { useState, useRef, useEffect } from 'react';

const Home: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoNum, setCurrentVideoNum] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate filename based on current number (e.g., 2026Showreel01.mov)
  const getVideoSrc = (num: number) => {
    const numStr = num.toString().padStart(2, '0');
    return `https://raw.githubusercontent.com/BANG-TAEWOONG/Portfolio-Homepage/main/public/2026Showreel${numStr}`;
  };

  // Effect to reload video when number changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    }
  }, [currentVideoNum]);

  const handleVideoEnded = () => {
    // Try playing the next number
    setCurrentVideoNum((prev) => prev + 1);
  };

  const handleVideoError = () => {
    // If an error occurs (e.g., file not found), reset to the first video
    // This acts as the loop mechanism
    if (currentVideoNum > 1) {
      console.log(`Video ${currentVideoNum} not found. looping back to 01.`);
      setCurrentVideoNum(1);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMutedState = !isMuted;
      videoRef.current.muted = nextMutedState;
      setIsMuted(nextMutedState);
    }
  };

  const scrollToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('work');
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
    <div
      className="relative h-screen w-full overflow-hidden flex items-center justify-center cursor-default bg-black"
      onClick={() => setIsRevealed(!isRevealed)}
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${isRevealed ? 'scale-105' : 'scale-100'}`}
        >
          <source src={`${getVideoSrc(currentVideoNum)}.mov`} type="video/quicktime" />
          <source src={`${getVideoSrc(currentVideoNum)}.mp4`} type="video/mp4" />
        </video>
        <div className={`absolute inset-0 bg-black/30 transition-all duration-1000 ${isRevealed ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/20'}`}></div>
      </div>

      {/* Detection Area */}
      <div
        className="relative z-10 w-full max-w-5xl h-[70vh] flex items-center justify-center px-6"
        onMouseEnter={() => setIsRevealed(true)}
        onMouseLeave={() => setIsRevealed(false)}
      >
        <div className={`transition-all duration-[1500ms] cubic-bezier(0.22, 1, 0.36, 1) transform ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} text-center`}>
          <p className="text-lg md:text-2xl lg:text-3xl text-white font-light leading-relaxed mb-8 md:mb-10 tracking-tight transition-all duration-[2000ms]">
            세상을 프레임 속에 담아내는 영상 제작자입니다. <br className="hidden md:block" />
            감각적인 연출과 섬세한 편집으로 당신의 이야기를 시각화합니다.
          </p>
          <a
            href="#work"
            onClick={scrollToWork}
            className="group relative inline-block px-10 py-4 md:px-12 md:py-5 overflow-hidden border border-white/30 text-white text-[10px] md:text-xs font-bold tracking-[0.3em] transition-all duration-500 uppercase"
          >
            <span className="relative z-10 transition-colors duration-500 group-hover:text-black">Explore Portfolio</span>
            <div className="absolute inset-0 z-0 translate-y-full bg-white transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) group-hover:translate-y-0"></div>
          </a>
        </div>
      </div>

      {/* Sound Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-12 right-12 z-20 p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Scroll indicator with smoother bounce */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-pulse cursor-pointer transition-opacity duration-1000" onClick={(e) => {
        e.stopPropagation();
        const workSec = document.getElementById('work');
        if (workSec) window.scrollTo({ top: workSec.offsetTop - 64, behavior: 'smooth' });
      }}>
        <div className="flex flex-col items-center">
          <span className="text-white/40 text-[8px] tracking-[0.4em] uppercase mb-4">Scroll</span>
          <div className="w-[1px] h-12 md:h-16 bg-white/20 relative">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-[scroll-dot_2s_infinite]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-dot {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { transform: translateY(0%); opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;
