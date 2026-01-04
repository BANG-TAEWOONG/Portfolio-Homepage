import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { createPortal } from 'react-dom';
import { WorkItem } from '../types';

// 컴포넌트에서 사용할 Props 타입 정의
interface ProjectModalProps {
    selectedWork: WorkItem | null;  // 현재 선택된 프로젝트 데이터
    onClose: () => void;            // 모달 닫기 함수
    onNext: () => void;             // 다음 프로젝트로 이동
    onPrev: () => void;             // 이전 프로젝트로 이동
    navDirection: 'next' | 'prev' | 'init'; // 애니메이션 방향 결정 (다음/이전/초기)
}

/**
 * 유튜브 URL을 iframe에서 사용할 수 있는 임베드 URL로 변환하는 헬퍼 함수
 * @param url 원본 유튜브 링크
 * @returns 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1' 형태의 URL
 */
const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';

    // 이미 embed 형식인 경우 그대로 반환
    if (url.includes('embed/')) return url;

    // 다양한 유튜브 URL 포맷(youtu.be, watch?v= 등)에서 비디오 ID 추출을 위한 정규식
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    // ID가 11자리인지 확인하여 유효성 검사
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    // ID가 있으면 자동재생(autoplay=1) 옵션을 붙여서 반환
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

const ProjectModal: React.FC<ProjectModalProps> = ({ selectedWork, onClose, onNext, onPrev, navDirection }) => {
    // 애니메이션 효과를 위한 상태 관리
    const [transitionClass, setTransitionClass] = useState('animate-modal-container');

    // 네비게이션 방향이나 선택된 프로젝트가 바뀔 때마다 애니메이션 클래스 업데이트
    useEffect(() => {
        if (navDirection === 'next') setTransitionClass('animate-slide-right'); // 오른쪽에서 들어옴
        else if (navDirection === 'prev') setTransitionClass('animate-slide-left'); // 왼쪽에서 들어옴
        else setTransitionClass('animate-modal-container'); // 기본 페이드인
    }, [navDirection, selectedWork?.id]);

    // 스와이프 핸들러 정의 (터치 스와이프 감지)
    const handlers = useSwipeable({
        onSwipedLeft: () => onNext(),
        onSwipedRight: () => onPrev(),
        preventScrollOnSwipe: true,
        trackMouse: true // 마우스 및 터치 모두 지원
    });

    // 선택된 작업물이 없으면 렌더링하지 않음
    if (!selectedWork) return null;

    // React Portal을 사용하여 부모 컴포넌트의 DOM 계층구조를 벗어나 document.body에 직접 렌더링
    // (z-index 문제나 오버플로우 문제를 피하기 위함)
    return createPortal(
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-4 overflow-y-auto pointer-events-none">

            {/* 1. 배경 오버레이 (클릭 시 모달 닫힘) */}
            <div
                className="fixed inset-0 bg-white/10 backdrop-blur-md animate-modal-overlay pointer-events-auto"
                onClick={onClose}
            ></div>

            {/* 2. 모달 메인 컨텐츠 래퍼 */}
            <div
                {...handlers}
                key={selectedWork.id}
                // transitionClass에 따라 슬라이드 애니메이션 적용
                className={`relative w-full max-w-xl z-[2010] my-4 md:my-8 pointer-events-auto ${transitionClass} flex-shrink-0`}
            >
                {/* 3. 데스크탑용 사이드 네비게이션 버튼 (화살표) */}
                {/* e.stopPropagation(): 버튼 클릭 시 배경 클릭 이벤트(모달 닫기)가 발생하지 않도록 막음 */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="hidden md:flex absolute top-1/2 -left-16 -translate-y-1/2 z-[2030] p-2 text-slate-300 hover:text-slate-600 transition-all duration-300 hover:scale-110"
                    aria-label="Previous Project"
                >
                    <svg className="w-12 h-12 drop-shadow-lg filter" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="hidden md:flex absolute top-1/2 -right-16 -translate-y-1/2 z-[2030] p-2 text-slate-300 hover:text-slate-600 transition-all duration-300 hover:scale-110"
                    aria-label="Next Project"
                >
                    <svg className="w-12 h-12 drop-shadow-lg filter" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* 4. 내부 카드 컨테이너 (흰색 배경) */}
                <div className="w-full bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">

                    {/* A. 비디오 섹션 (상단) */}
                    <div className="w-full bg-black relative aspect-video shrink-0">
                        {selectedWork.videoUrl && (
                            <iframe
                                key={`${selectedWork.id}-iframe`}
                                src={getYouTubeEmbedUrl(selectedWork.videoUrl)}
                                className="w-full h-full"
                                title={selectedWork.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        )}
                        {/* 영상 우상단 닫기 버튼 (X 아이콘) */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-[2030] p-1.5 text-white/50 hover:text-white transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* B. 텍스트 컨텐츠 섹션 (하단, 스크롤 가능) */}
                    <div className="w-full p-6 md:p-10 bg-white max-h-[60vh] overflow-y-auto no-scrollbar">
                        <div className="space-y-6 md:space-y-8">

                            {/* 헤더: 카테고리 및 제목 */}
                            <div>
                                <span className="text-[7px] md:text-[9px] font-bold tracking-[0.4em] text-slate-300 uppercase block mb-2">{selectedWork.category}</span>
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-[12px] md:text-2xl font-bold text-slate-900 tracking-tighter leading-tight">{selectedWork.title}</h3>

                                    {/* 모바일용 네비게이션 버튼 (제목 옆에 작게 표시됨) */}
                                    <div className="flex items-center space-x-2 md:hidden text-slate-300 shrink-0">
                                        <button onClick={onPrev} className="hover:text-slate-900 transition-colors p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={onNext} className="hover:text-slate-900 transition-colors p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {/* 구분선 */}
                                <div className="h-[2px] w-8 md:w-10 bg-slate-900 mt-4"></div>
                            </div>

                            {/* 상세 정보 그리드 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {/* 역할 (Role) */}
                                <section className="md:col-span-2">
                                    <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Role</h4>
                                    <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.role}</p>
                                </section>

                                {/* 기간(Duration) 및 출시일(Release) */}
                                <div className="grid grid-cols-2 md:col-span-2 gap-4">
                                    <section>
                                        <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Duration</h4>
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.runningTime}</p>
                                    </section>
                                    <section>
                                        <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Release</h4>
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.releaseDate}</p>
                                    </section>
                                </div>

                                {/* 설명 (Description) - 줄바꿈 보존(whitespace-pre-line) */}
                                <section className="md:col-span-2">
                                    <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">Description</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-light whitespace-pre-line">{selectedWork.description}</p>
                                </section>
                            </div>

                            {/* 하단 닫기 버튼 (텍스트 형태) */}
                            <div className="pt-8 border-t border-slate-50 mt-8">
                                <button
                                    onClick={onClose}
                                    className="flex items-center text-[9px] font-bold tracking-[0.3em] text-slate-900 group"
                                >
                                    <span className="mr-3 group-hover:-translate-x-1 transition-transform">←</span>
                                    CLOSE PROJECT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body // Portal 타겟: body 태그 바로 아래
    );
};

export default ProjectModal;
