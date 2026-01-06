import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LEVEL_MAPPING, SKILLS, TOOLS_DATA, EQUIPMENT_DATA } from '../constants';
import { Skill, SkillItem as SkillItemType } from '../types';
import { fetchSkillsData } from '../services/googleSheetService';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// ----------------------------------------------------------------------
// 1. 헬퍼 함수
// ----------------------------------------------------------------------

/**
 * 숙련도 점수(0~5)를 텍스트 등급(BEGINNER, EXPERT 등)으로 변환
 * @param level 숫자형 숙련도
 * @returns 매핑된 텍스트 레벨
 */
const renderLevel = (level: number) => {
  // 0~5 범위를 벗어나지 않도록 보정 및 반올림
  const safeLevel = Math.max(0, Math.min(5, Math.round(level)));
  return LEVEL_MAPPING[safeLevel] || 'BEGINNER';
};

// ----------------------------------------------------------------------
// 2. InteractiveSkillSection 컴포넌트
// (능력, 툴, 장비를 탭/필터 형태로 보여주는 인터랙티브 섹션)
// ----------------------------------------------------------------------

const InteractiveSkillSection: React.FC = () => {
  // 상태 관리
  const [skills, setSkills] = useState<SkillItemType[]>([]); // 불러온 스킬 데이터 저장
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // 각 카테고리별 현재 선택된 필터 상태 저장 (예: Tools 카테고리는 'Editing' 필터 선택 등)
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({
    Capabilities: 'All',
    Tools: 'All',
    Equipment: 'All'
  });

  // 데이터 로드 효과
  useEffect(() => {
    const loadSkills = async () => {
      let data = await fetchSkillsData();

      if (!data || data.length === 0) {
        // 로컬 데이터를 컴포넌트 상태 포맷에 맞게 변환하는 내부 헬퍼 함수
        const mapToSkillItem = (items: { name: string; level: number }[], category: string, filter: string): SkillItemType[] =>
          items.map((item, idx) => ({
            category,
            filter,
            name: item.name,
            level: item.level,
            order: idx
          }));

        data = [
          ...mapToSkillItem(SKILLS, 'Capabilities', 'Main'),
          ...mapToSkillItem(TOOLS_DATA, 'Tools', 'Main'),
          ...mapToSkillItem(EQUIPMENT_DATA, 'Equipment', 'Main')
        ];
      }

      setSkills(data);
      setLoading(false);
    };
    loadSkills();
  }, []);

  const categories = ['Capabilities', 'Tools', 'Equipment'];

  // 특정 카테고리의 유니크한 필터 목록 추출 (예: All, Editing, Color Grading...)
  const getFilters = (category: string) => {
    const categorySkills = skills.filter(s => s.category === category && !s.hidden);
    const filters = Array.from(new Set(categorySkills.map(s => s.filter))).filter(f => f);
    return ['All', ...filters];
  };

  // 화살표 버튼 클릭 시 필터 순환 이동
  const traverseFilters = (category: string, direction: 'next' | 'prev') => {
    const filters = getFilters(category);
    const currentFilter = activeFilters[category] || 'All';
    const currentIndex = filters.indexOf(currentFilter);

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filters.length;
    } else {
      newIndex = (currentIndex - 1 + filters.length) % filters.length;
    }

    const nextFilter = filters[newIndex];
    setActiveFilters(prev => ({ ...prev, [category]: nextFilter }));
  };

  // 'All' 뷰(개요)에서 보여줄 해당 필터 그룹의 평균 숙련도 계산
  const getAverageLevel = (filterName: string, category: string) => {
    const targetSkills = skills.filter(s => s.category === category && s.filter === filterName);
    if (!targetSkills.length) return 0;
    const total = targetSkills.reduce((acc, curr) => acc + curr.level, 0);
    return total / targetSkills.length;
  };

  // 로딩 중 표시
  if (loading) {
    return <div className="text-center py-20 text-slate-300 animate-pulse">Loading skills from database...</div>;
  }

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
    >
      {categories.map((category) => {
        // 현재 카테고리에 해당하는 스킬 필터링
        const categorySkills = skills.filter(s => s.category === category && !s.hidden);
        const currentFilter = activeFilters[category] || 'All';

        // 현재 선택된 필터에 따라 보여줄 아이템 결정 ('All'이면 전체, 아니면 해당 필터만)
        const displaySkills = currentFilter === 'All'
          ? categorySkills
          : categorySkills.filter(s => s.filter === currentFilter);

        const isOverview = currentFilter === 'All';
        const overviewItems = getFilters(category).filter(f => f !== 'All'); // 'All'을 제외한 서브 필터 목록

        return (
          <div key={category} className="flex flex-col h-full">
            {/* 카테고리 헤더 및 네비게이션 */}
            <div className="flex justify-between items-baseline mb-8 md:mb-12">
              <div
                className={`flex items-center gap-2 ${!isOverview ? 'cursor-pointer group/title' : ''}`}
                onClick={() => !isOverview && setActiveFilters(prev => ({ ...prev, [category]: 'All' }))}
              >
                <h4 className="text-xs md:text-sm font-bold tracking-[0.5em] text-slate-400 uppercase transition-colors group-hover/title:text-slate-900">
                  {category}
                </h4>
                {/* 필터 활성화 시 홈으로 돌아가기 표시 */}
                {!isOverview && (
                  <span className="text-[10px] text-slate-400 opacity-0 md:opacity-100 md:animate-in md:fade-in md:slide-in-from-right-2 font-medium tracking-normal animate-pulse">
                    ◀ Click home
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                {/* 현재 보고 있는 필터 이름 또는 안내 문구 */}
                {isOverview ? (
                  <span className="text-[9px] md:text-[10px] font-medium text-slate-300 tracking-widest uppercase">
                    Click each item
                  </span>
                ) : (
                  <span className="text-[9px] md:text-base font-bold tracking-[0.2em] uppercase text-slate-900 min-w-[80px] text-right">
                    {currentFilter}
                  </span>
                )}
              </div>
            </div>

            {/* 컨텐츠 영역 (최소 높이 지정으로 레이아웃 흔들림 방지) */}
            <div className="space-y-4 flex-1 min-h-[320px] transition-all duration-500 ease-in-out">
              {isOverview ? (
                // [VIEW 1] 개요 모드: 서브 필터 목록과 평균 점수 표시
                <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {overviewItems.map((filterName: string, idx: number) => {
                    const avgLevel = getAverageLevel(filterName, category);
                    return (
                      <div
                        key={filterName}
                        onClick={() => setActiveFilters(prev => ({ ...prev, [category]: filterName }))} // 클릭 시 해당 필터 상세 보기로 이동
                        className="group cursor-pointer border-b border-slate-100 py-4 flex justify-between items-center hover:border-slate-900 transition-all duration-500 stagger-item"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {filterName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* 평균 레벨 표시 */}
                          <div className="flex flex-col items-end group-hover:transform group-hover:scale-105 transition-all duration-300">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                              AVG. {renderLevel(avgLevel)}
                            </span>
                          </div>
                          {/* 호버 시 나타나는 + 아이콘 */}
                          <span className="text-[10px] text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            +
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // [VIEW 2] 상세 모드: 개별 스킬 이름과 프로그레스 바 표시
                <div
                  key={currentFilter}
                  className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
                >
                  {displaySkills.map((skill, i) => (
                    <div
                      key={`${skill.name}-${i}`}
                      className="group stagger-item relative"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider group-hover:text-slate-900 transition-colors">
                          {renderLevel(skill.level)}
                        </span>
                      </div>

                      {/* 스킬 프로그레스 바 */}
                      <div className="h-[1px] w-full bg-slate-100 relative overflow-hidden">
                        {/* 검은색 바 (실제 숙련도) */}
                        <div
                          className="absolute top-0 left-0 h-full bg-slate-900 transition-all duration-[1.5s] ease-out w-0 group-hover:w-full"
                          style={{ width: `${(skill.level / 5) * 100}%` }}
                        />
                        {/* 배경 애니메이션 바 (회색) */}
                        <div
                          className="h-full bg-slate-200 w-0 animate-[growWidth_1s_ease-out_forwards]"
                          style={{ width: `${(skill.level / 5) * 100}%`, animationDelay: `${(i * 100) + 300}ms` }}
                        />
                      </div>
                    </div>
                  ))}

                  {displaySkills.length === 0 && (
                    <div className="text-xs text-slate-300 py-4">No items found in this category.</div>
                  )}

                  {/* 개요(전체 목록)로 돌아가는 버튼 */}
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, [category]: 'All' }))}
                    className="mt-8 text-[10px] font-bold text-slate-400 hover:text-slate-900 underline underline-offset-4 transition-all hover:tracking-widest"
                  >
                    BACK TO OVERVIEW
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. About 메인 컴포넌트
// ----------------------------------------------------------------------

const About: React.FC = () => {
  const [textRef, isTextVisible] = useIntersectionObserver({ threshold: 0.15 });

  return (
    <div className="w-full px-6">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-10 md:mb-20">ABOUT</h2>

      <div className="space-y-24 md:space-y-36">

        {/* 1. 소개 섹션 (Intro Section) */}
        <div ref={textRef} className="py-8 md:py-16">
          <div className="flex flex-col space-y-12">

            {/* 타이틀: Storyteller (그라데이션 텍스트 효과 포함) */}
            <div className="overflow-hidden">
              <h3
                className={`
                  text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] 
                  break-words w-full
                  transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) 
                  ${isTextVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                `}
              >
                <span className="text-slate-900 inline-block mr-4">I AM A</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-500 to-slate-900 bg-[length:200%_auto] hover:bg-right transition-all duration-500 inline-block">
                  STORYTELLER.
                </span>
              </h3>
            </div>

            <div className="flex flex-col gap-10 pt-8">
              {/* 인용구 섹션 (Quote) - 왼쪽에서 등장 애니메이션 */}
              <div className={`transition-all duration-1000 delay-300 ${isTextVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="border-l-2 border-slate-900 pl-6 py-2">
                  <p className="text-lg md:text-2xl text-slate-500 font-light italic leading-relaxed">
                    "카메라는 도구일 뿐, 감동을 만드는 것은 그 프레임 안에 담긴 진심입니다."
                  </p>
                </div>
              </div>

              {/* 설명 본문 (Description) - 아래에서 위로 등장 애니메이션 */}
              <div className={`transition-all duration-1000 delay-500 ${isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <p className="text-sm md:text-lg text-slate-800 font-light leading-loose break-keep">
                  단순히 기록하는 것을 넘어, 매 순간의 감정과 분위기를 가장 완벽한 톤으로 담아내고자 합니다.<br className="hidden md:block" />
                  다양한 댄스 필름과 뮤직비디오 프로젝트를 거치며 시각적 리듬감과 역동적인 연출력을 쌓아왔습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 스킬 섹션 (위에서 정의한 인터랙티브 컴포넌트 삽입) */}
        <InteractiveSkillSection />

        {/* 3. 핵심 가치 섹션 (Values Section) - 4개의 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pb-20">
          {[
            { n: '01', t: 'Clear Communication', d: '아이디어가 현실이 되는 과정에서 가장 중요한 것은 상호 이해입니다.' },
            { n: '02', t: 'On-time Delivery', d: '약속된 시간을 철저히 지켜 프로젝트의 완성을 보장합니다.' },
            { n: '03', t: 'Extreme Detail', d: '프레임 한 장, 색감 한 스탑의 차이가 영상의 본질을 결정합니다.' },
            { n: '04', t: 'Flexible Solution', d: '현장의 변수 속에서도 최선의 결과를 위한 대안을 신속하게 찾습니다.' }
          ].map((v) => (
            <div key={v.n} className="group p-6 md:p-10 bg-white border border-slate-100 transition-all duration-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 cursor-default">
              <span className="text-[9px] font-bold text-slate-200 group-hover:text-black transition-colors duration-500 mb-2 block tracking-widest">{v.n}</span>
              <h5 className="font-bold text-slate-900 mb-2 text-[11px] md:text-sm tracking-tight">{v.t}</h5>
              <p className="text-[9px] md:text-xs text-slate-400 leading-relaxed font-light">{v.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;