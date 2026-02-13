import React, { useState, useRef, useEffect } from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';

const Home: React.FC = () => {
  const { texts } = useSiteTexts();
  // ----------------------------------------------------------------------
  // 1. 상태 관리 (State Management)
  // ----------------------------------------------------------------------
  const [isRevealed, setIsRevealed] = useState(false);     // 마우스 오버 시 텍스트/버튼 표시 여부
  const [isMuted, setIsMuted] = useState(true);            // 비디오 음소거 상태 (기본값: 음소거)
  const [currentVideoNum, setCurrentVideoNum] = useState(1); // 현재 재생 중인 비디오 번호 (01, 02, ...)
  const videoRef = useRef<HTMLVideoElement>(null);         // 비디오 엘리먼트 직접 제어용 Ref

  // ----------------------------------------------------------------------
  // 2. 비디오 소스 관리
  // ----------------------------------------------------------------------
  // [중요] 로컬 파일/Vercel 배포 환경 모두에서 동작하도록 public 폴더 기준 상대 경로 사용
  const getVideoSrc = (num: number) => {
    const numStr = num.toString().padStart(2, '0'); // 1 -> "01", 2 -> "02" 변환
    return `/2026Showreel${numStr}`;
  };

  // ----------------------------------------------------------------------
  // 3. 비디오 재생 로직 (Effect & Handlers)
  // ----------------------------------------------------------------------

  // 비디오 번호가 바뀌면 새로운 영상을 로드하고 재생 시도
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e)); // 브라우저 정책상 자동재생 실패 시 에러 로그
    }
  }, [currentVideoNum]);

  // 현재 영상이 끝나면 번호를 1 증가시켜 다음 영상 재생
  const handleVideoEnded = () => {
    setCurrentVideoNum((prev) => prev + 1);
  };

  // 다음 번호의 영상이 없어서 에러가 발생하면 (즉, 마지막 영상까지 다 본 경우)
  // 다시 1번 영상으로 돌아가서 무한 루프를 구현함
  const handleVideoError = () => {
    if (currentVideoNum > 1) {
      console.log(`Video ${currentVideoNum} not found. looping back to 01.`);
      setCurrentVideoNum(1);
    }
  };

  // 소리 켜기/끄기 토글 핸들러
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // 배경 클릭 이벤트(텍스트 숨김/표시)가 발생하지 않도록 차단
    if (videoRef.current) {
      const nextMutedState = !isMuted;
      videoRef.current.muted = nextMutedState;
      setIsMuted(nextMutedState);
    }
  };

  // 'Explore Portfolio' 버튼 클릭 시 Work 섹션으로 부드럽게 스크롤 이동
  const scrollToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('work');
    if (element) {
      const headerOffset = 64; // 헤더 높이만큼 보정
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    // 전체 컨테이너: 화면 전체 높이(h-screen), 클릭 시 텍스트 공개/숨김 토글
    <div
      className="relative h-screen w-full overflow-hidden flex items-center justify-center cursor-default bg-black"
      onClick={() => setIsRevealed(!isRevealed)}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* A. 배경 비디오 영역 */}
      {/* ---------------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0">
        <video
          key={currentVideoNum}
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          // 텍스트가 보일 때(isRevealed) 비디오를 살짝 확대(scale-105)하여 깊이감 연출
          className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${isRevealed ? 'scale-105' : 'scale-100'}`}
        >
          {/* mov, mp4 포맷 지원 */}
          <source src={`${getVideoSrc(currentVideoNum)}.mp4`} type="video/mp4" />
        </video>

        {/* 비디오 위를 덮는 어두운 오버레이 (텍스트 가독성 확보용) */}
        {/* 텍스트가 보일 때는 더 어둡고 흐리게(backdrop-blur) 처리 */}
        <div className={`absolute inset-0 bg-black/30 transition-all duration-1000 ${isRevealed ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/20'}`}></div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* B. 중앙 텍스트 및 버튼 (Detection Area) */}
      {/* ---------------------------------------------------------------------- */}
      <div
        className="relative z-10 w-full max-w-5xl h-[70vh] flex items-center justify-center px-6"
        onMouseEnter={() => setIsRevealed(true)}  // 마우스 올리면 텍스트 표시
        onMouseLeave={() => setIsRevealed(false)} // 마우스 치우면 텍스트 숨김
      >
        {/* 텍스트 컨테이너: isRevealed 상태에 따라 아래에서 위로 올라오며 페이드인 */}
        <div className={`transition-all duration-[1500ms] cubic-bezier(0.22, 1, 0.36, 1) transform ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} text-center`}>
          {/* 메인 카피 문구 */}
          {/* 메인 카피 문구 */}
          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-white font-light leading-relaxed mb-8 md:mb-10 tracking-tight transition-all duration-[2000ms]">
            {texts.homeDescription.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br className="hidden md:block" />}
                {line}
              </React.Fragment>
            ))}
          </p>

          {/* 포트폴리오 바로가기 버튼 */}
          <a
            href="#work"
            onClick={scrollToWork}
            className="group relative inline-block px-8 py-3.5 sm:px-10 sm:py-4 md:px-12 md:py-5 overflow-hidden border border-white/30 text-white text-[10px] sm:text-xs font-bold tracking-[0.3em] transition-all duration-500 uppercase"
          >
            {/* 버튼 텍스트 */}
            <span className="relative z-10 transition-colors duration-500 group-hover:text-black">{texts.homeButtonText}</span>
            {/* 호버 시 아래에서 올라오는 흰색 배경 애니메이션 */}
            <div className="absolute inset-0 z-0 translate-y-full bg-white transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) group-hover:translate-y-0"></div>
          </a>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* C. 우측 하단 소리 조절 버튼 */}
      {/* ---------------------------------------------------------------------- */}
      <button
        onClick={toggleMute}
        className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-20 p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          // 음소거 아이콘 (Speaker X)
          <svg className="w-6 h-6 md:w-5 md:h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
          </svg>
        ) : (
          // 소리 켜짐 아이콘 (Speaker Wave)
          <svg className="w-6 h-6 md:w-5 md:h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* ---------------------------------------------------------------------- */}
      {/* D. 중앙 하단 스크롤 유도 아이콘 (애니메이션 포함) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-pulse cursor-pointer transition-opacity duration-1000" onClick={(e) => {
        e.stopPropagation();
        const workSec = document.getElementById('work');
        if (workSec) window.scrollTo({ top: workSec.offsetTop - 64, behavior: 'smooth' });
      }}>
        <div className="flex flex-col items-center">
          <span className="text-white/40 text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-4">Scroll</span>
          <div className="w-[1px] h-12 md:h-16 bg-white/20 relative">
            {/* 위에서 아래로 흐르는 하얀 점 애니메이션 */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-[scroll-dot_2s_infinite]"></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;