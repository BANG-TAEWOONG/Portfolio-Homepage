import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Category, WorkType, WorkItem } from '../types';
import { useWorkItems } from '../hooks/useWorkItems';
import ProjectModal from './ProjectModal';

const Work: React.FC = () => {
  // 1. 커스텀 훅을 통해 전체 작업물 데이터 가져오기
  const { items: workItems, loading, error } = useWorkItems();

  // 2. 상태(State) 관리
  const [activeType, setActiveType] = useState<WorkType>('Created'); // 현재 선택된 작업 유형 (제작/참여)
  const [activeCategory, setActiveCategory] = useState<Category>('All'); // 현재 선택된 카테고리 (MV/Dance 등)
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null); // 모달에 띄울 현재 선택된 작업물
  const [isGridUpdating, setIsGridUpdating] = useState(false); // 필터 변경 시 그리드 깜빡임 효과 제어
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | 'init'>('init'); // 모달 슬라이드 애니메이션 방향

  // 필터 옵션 상수 정의
  const categories: Category[] = ['All', 'MV', 'Dance Film', 'Dance Cover'];
  const workTypes: WorkType[] = ['Created', 'Participated'];

  // 3. 필터링 로직 (useMemo: 의존성 값이 변할 때만 재연산하여 성능 최적화)
  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const typeMatch = item.type === activeType; // 작업 유형 일치 여부 확인
      // 'All'이면 모든 카테고리 통과, 아니면 해당 카테고리만 통과
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
      return typeMatch && categoryMatch;
    });
  }, [activeType, activeCategory, workItems]);

  // 현재 모달에 떠있는 아이템이 필터링된 목록 중 몇 번째인지 인덱스 계산
  const currentIndex = useMemo(() => {
    if (!selectedWork) return -1;
    return filteredItems.findIndex(item => item.id === selectedWork.id);
  }, [selectedWork, filteredItems]);

  // 4. 네비게이션 핸들러 (다음/이전 프로젝트 이동)
  const handleNext = useCallback(() => {
    setNavDirection('next'); // 애니메이션 방향: 오른쪽에서 등장
    // 마지막 항목이면 처음으로, 아니면 다음 항목으로
    if (currentIndex < filteredItems.length - 1) {
      setSelectedWork(filteredItems[currentIndex + 1]);
    } else {
      setSelectedWork(filteredItems[0]); // 루프(Loop) 처리
    }
  }, [currentIndex, filteredItems]);

  const handlePrev = useCallback(() => {
    setNavDirection('prev'); // 애니메이션 방향: 왼쪽에서 등장
    // 첫 항목이면 마지막으로, 아니면 이전 항목으로
    if (currentIndex > 0) {
      setSelectedWork(filteredItems[currentIndex - 1]);
    } else {
      setSelectedWork(filteredItems[filteredItems.length - 1]); // 루프(Loop) 처리
    }
  }, [currentIndex, filteredItems]);

  // 모달 닫기 핸들러
  const closeModal = useCallback(() => {
    setSelectedWork(null);
    setNavDirection('init'); // 방향 초기화
  }, []);

  // 5. 키보드 이벤트 리스너 (화살표 키로 이동, ESC로 닫기)
  useEffect(() => {
    if (selectedWork) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') closeModal();
      };

      window.addEventListener('keydown', handleKeyDown);
      // 컴포넌트 언마운트 시 리스너 제거 (메모리 누수 방지)
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedWork, handleNext, handlePrev, closeModal]);

  // 6. 필터 변경 시 그리드 재렌더링 효과 (깜빡임 애니메이션)
  useEffect(() => {
    setIsGridUpdating(true);
    // 50ms 동안 잠깐 숨겼다가 다시 보여줘서(fade-in) 전환 효과를 줌
    const timer = setTimeout(() => setIsGridUpdating(false), 50);
    return () => clearTimeout(timer);
  }, [activeType, activeCategory]);

  // 썸네일 클릭 시 모달 열기
  const openModal = (item: WorkItem) => {
    setNavDirection('init');
    setSelectedWork(item);
  };

  // 7. 스크롤 감지 (제목 애니메이션용)
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // IntersectionObserver: 요소가 화면에 보이는지 감지
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // 요소가 10% 보이면 트리거
    );
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);

  // 에러 발생 시 UI 처리
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-red-500">
        Failed to load projects. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="w-full px-6 relative">
      {/* A. 상단 헤더 영역 (제목 + 필터 버튼들) */}
      <div ref={textRef} className="flex flex-col items-center justify-center mb-16 md:mb-24 gap-8 md:gap-12">
        <div className="w-full text-center">
          <div className="overflow-hidden mb-8 md:mb-12">
            {/* 스크롤 시 아래에서 위로 올라오는 제목 애니메이션 */}
            <h2 className={`text-4xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
              SELECTED PROJECTS
            </h2>
          </div>
        </div>

        {/* 필터 컨트롤 영역 */}
        <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
          {/* 1. 작업 유형 필터 (Created / Participated) - 캡슐 모양 버튼 */}
          <div className="relative flex bg-slate-50 p-1.5 rounded-full overflow-hidden border border-slate-100 shadow-sm">
            {workTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`relative z-10 px-6 py-2 md:px-8 md:py-2.5 text-[10px] md:text-xs font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-full whitespace-nowrap ${activeType === type ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {type === 'Created' ? 'Personal' : 'Participation'}
                {/* 선택된 버튼 뒤에 따라다니는 검은색 배경 애니메이션 */}
                {activeType === type && (
                  <div className="absolute inset-0 bg-slate-900 rounded-full -z-10 animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>
            ))}
          </div>

          {/* 2. 카테고리 필터 (MV / Dance Film 등) - 텍스트 탭 형태 */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-bold tracking-widest transition-all duration-300 border-b-2 uppercase whitespace-nowrap ${activeCategory === cat
                  ? 'border-slate-900 text-slate-900' // 선택됨: 진한 글씨 + 밑줄
                  : 'border-transparent text-slate-300 hover:text-slate-500 hover:border-slate-200' // 미선택: 연한 글씨
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* B. 그리드 컨텐츠 영역 */}
      {loading ? (
        // 로딩 중일 때 스켈레톤 UI (회색 박스 깜빡임) 표시
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 min-h-[400px]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse aspect-[16/10] bg-slate-100"></div>
          ))}
        </div>
      ) : (
        // 데이터 로드 완료 시 실제 그리드 렌더링
        <div
          key={activeCategory + activeType} // 키값이 바뀌면 컴포넌트가 새로 그려지며 애니메이션 리셋됨
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 min-h-[500px]"
        >
          {!isGridUpdating && filteredItems.map((item, index) => (
            <div
              key={`${item.id}-${activeType}-${activeCategory}`}
              className="stagger-item group cursor-pointer relative"
              style={{ animationDelay: `${index * 80}ms` }} // 순차적으로 나타나는 애니메이션 딜레이
              onClick={() => openModal(item)}
            >
              {/* 이미지 컨테이너 */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 transition-all duration-700">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.22, 1, 0.36, 1) group-hover:scale-105"
                />

                {/* 호버 오버레이 (모바일: 항상 보임 / 데스크탑: 호버 시 보임) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 md:p-8">
                  <div className="transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] text-white/70 uppercase block mb-2">{item.category}</span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-4 leading-tight">{item.title}</h3>
                    <div className="hidden md:flex items-center text-[10px] text-white/80 font-medium tracking-widest uppercase">
                      <span>View Project</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* C. 프로젝트 상세 모달 (조건부 렌더링) */}
      <ProjectModal
        selectedWork={selectedWork}
        onClose={closeModal}
        onNext={handleNext}
        onPrev={handlePrev}
        navDirection={navDirection}
      />
    </div>
  );
};

export default Work;
