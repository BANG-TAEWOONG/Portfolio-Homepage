import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LEVEL_MAPPING, SKILLS, TOOLS_DATA, EQUIPMENT_DATA } from '../constants'; // Keeping for fallback if needed, or remove if fully replaced
import { Skill, SkillItem as SkillItemType } from '../types';
import { fetchSkillsData } from '../services/googleSheetService';

// Level rendering helper
// Level rendering helper
const renderLevel = (level: number) => {
  // Ensure level is within 0-5 range and rounded
  const safeLevel = Math.max(0, Math.min(5, Math.round(level)));
  return LEVEL_MAPPING[safeLevel] || 'BEGINNER';
};

const InteractiveSkillSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [skills, setSkills] = useState<SkillItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({
    Capabilities: 'All',
    Tools: 'All',
    Equipment: 'All'
  });

  useEffect(() => {
    // 스킬 데이터 로드 함수
    const loadSkills = async () => {
      let data = await fetchSkillsData();

      // [수정] 데이터가 비어있거나 로드 실패 시 로컬 상수를 사용하여 폴백 처리
      // constants.ts에 정의된 SKILLS, TOOLS_DATA, EQUIPMENT_DATA를 사용
      if (!data || data.length === 0) {
        console.log('Using fallback local data');
        // 로컬 데이터 포맷을 컴포넌트 상태에 맞게 변환하는 헬퍼 함수
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (!loading && sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [loading]);

  const categories = ['Capabilities', 'Tools', 'Equipment'];

  // 카테고리별 필터 목록 생성 (중복 제거 & Hidden 필터링)
  const getFilters = (category: string) => {
    // Hidden 아이템 제외
    const categorySkills = skills.filter(s => s.category === category && !s.hidden);
    const filters = Array.from(new Set(categorySkills.map(s => s.filter))).filter(f => f);
    return ['All', ...filters];
  };

  // 이전/다음 필터로 이동
  const traverseFilters = (category: string, direction: 'next' | 'prev') => {
    const filters = getFilters(category);
    // 현재 필터 찾기 (없으면 'All')
    const currentFilter = activeFilters[category] || 'All';
    const currentIndex = filters.indexOf(currentFilter);

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filters.length;
    } else {
      newIndex = (currentIndex - 1 + filters.length) % filters.length;
    }

    // 상태 업데이트
    const nextFilter = filters[newIndex];
    setActiveFilters(prev => ({ ...prev, [category]: nextFilter }));
  };

  const getAverageLevel = (filterName: string, category: string) => {
    const targetSkills = skills.filter(s => s.category === category && s.filter === filterName);
    if (!targetSkills.length) return 0;
    const total = targetSkills.reduce((acc, curr) => acc + curr.level, 0);
    return total / targetSkills.length;
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-300 animate-pulse">Loading skills from database...</div>;
  }

  return (
    <div
      ref={sectionRef}
      className={`grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
    >
      {categories.map((category) => {
        // [수정] Hidden 항목 필터링
        const categorySkills = skills.filter(s => s.category === category && !s.hidden);
        const currentFilter = activeFilters[category] || 'All';
        const displaySkills = currentFilter === 'All'
          ? categorySkills
          : categorySkills.filter(s => s.filter === currentFilter);

        const isOverview = currentFilter === 'All';
        const overviewItems = getFilters(category).filter(f => f !== 'All');

        return (
          <div key={category} className="flex flex-col h-full">
            <div className="flex justify-between items-baseline mb-8 md:mb-12">
              <h4 className="text-xs md:text-sm font-bold tracking-[0.5em] text-slate-400 uppercase">
                {category}
              </h4>

              <div className="flex items-center gap-4 md:gap-6">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); traverseFilters(category, 'prev'); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors group/btn"
                >
                  <span className="block text-lg group-hover/btn:-translate-x-0.5 transition-transform">←</span>
                </button>
                <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase min-w-[80px] text-center">
                  {currentFilter}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); traverseFilters(category, 'next'); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors group/btn"
                >
                  <span className="block text-lg group-hover/btn:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1 min-h-[320px] transition-all duration-500 ease-in-out">
              {isOverview ? (
                <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {overviewItems.map((filterName: string, idx: number) => {
                    const avgLevel = getAverageLevel(filterName, category);
                    return (
                      <div
                        key={filterName}
                        onClick={() => setActiveFilters(prev => ({ ...prev, [category]: filterName }))}
                        className="group cursor-pointer border-b border-slate-100 py-4 flex justify-between items-center hover:border-slate-900 transition-all duration-500 stagger-item"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {filterName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Proficiency Text Only */}
                          <div className="flex flex-col items-end group-hover:transform group-hover:scale-105 transition-all duration-300">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                              AVG. {renderLevel(avgLevel)}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            +
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
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
                      <div className="h-[1px] w-full bg-slate-100 relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-slate-900 transition-all duration-[1.5s] ease-out w-0 group-hover:w-full"
                          style={{ width: `${(skill.level / 5) * 100}%` }}
                        />
                        {/* Background track for subtle visibility */}
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

const About: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full px-6">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-10 md:mb-20">ABOUT</h2>

      <div className="space-y-24 md:space-y-36">

        {/* Intro Section */}
        <div ref={textRef} className="py-8 md:py-16">
          <div className="flex flex-col space-y-12">

            {/* Title Section */}
            <div className="overflow-hidden">
              <h3
                className={`
                  text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] 
                  break-words w-full
                  transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) 
                  ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                `}
              >
                <span className="text-slate-900 inline-block mr-4">I AM A</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-500 to-slate-900 bg-[length:200%_auto] hover:bg-right transition-all duration-500 inline-block">
                  STORYTELLER.
                </span>
              </h3>
            </div>

            <div className="flex flex-col gap-10 pt-8">
              {/* Quote Section */}
              <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="border-l-2 border-slate-900 pl-6 py-2">
                  <p className="text-lg md:text-2xl text-slate-500 font-light italic leading-relaxed">
                    "카메라는 도구일 뿐, 감동을 만드는 것은 그 프레임 안에 담긴 진심입니다."
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <p className="text-sm md:text-lg text-slate-800 font-light leading-loose break-keep">
                  단순히 기록하는 것을 넘어, 매 순간의 감정과 분위기를 가장 완벽한 톤으로 담아내고자 합니다.<br className="hidden md:block" />
                  다양한 댄스 필름과 뮤직비디오 프로젝트를 거치며 시각적 리듬감과 역동적인 연출력을 쌓아왔습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Tools & Equipment Layout (Interactive) */}
        <InteractiveSkillSection />

        {/* Values Section */}
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
