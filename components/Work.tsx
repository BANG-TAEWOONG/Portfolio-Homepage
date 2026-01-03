import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Category, WorkType, WorkItem } from '../types';
import { useWorkItems } from '../hooks/useWorkItems';
import ProjectModal from './ProjectModal';

const Work: React.FC = () => {
  const { items: workItems, loading, error } = useWorkItems();
  const [activeType, setActiveType] = useState<WorkType>('Created');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [isGridUpdating, setIsGridUpdating] = useState(false);
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | 'init'>('init');

  const categories: Category[] = ['All', 'MV', 'Dance Film', 'Dance Cover'];
  const workTypes: WorkType[] = ['Created', 'Participated'];

  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const typeMatch = item.type === activeType;
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
      return typeMatch && categoryMatch;
    });
  }, [activeType, activeCategory, workItems]);

  const currentIndex = useMemo(() => {
    if (!selectedWork) return -1;
    return filteredItems.findIndex(item => item.id === selectedWork.id);
  }, [selectedWork, filteredItems]);

  const handleNext = useCallback(() => {
    setNavDirection('next');
    if (currentIndex < filteredItems.length - 1) {
      setSelectedWork(filteredItems[currentIndex + 1]);
    } else {
      setSelectedWork(filteredItems[0]);
    }
  }, [currentIndex, filteredItems]);

  const handlePrev = useCallback(() => {
    setNavDirection('prev');
    if (currentIndex > 0) {
      setSelectedWork(filteredItems[currentIndex - 1]);
    } else {
      setSelectedWork(filteredItems[filteredItems.length - 1]);
    }
  }, [currentIndex, filteredItems]);

  const closeModal = useCallback(() => {
    setSelectedWork(null);
    setNavDirection('init');
  }, []);

  useEffect(() => {
    if (selectedWork) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') closeModal();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedWork, handleNext, handlePrev, closeModal]);

  useEffect(() => {
    setIsGridUpdating(true);
    const timer = setTimeout(() => setIsGridUpdating(false), 50);
    return () => clearTimeout(timer);
  }, [activeType, activeCategory]);

  const openModal = (item: WorkItem) => {
    setNavDirection('init');
    setSelectedWork(item);
  };

  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);



  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-red-500">
        Failed to load projects. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="w-full px-6 relative">
      <div ref={textRef} className="flex flex-col items-center justify-center mb-16 md:mb-24 gap-8 md:gap-12">
        <div className="w-full text-center">
          <div className="overflow-hidden mb-8 md:mb-12">
            <h2 className={`text-4xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
              SELECTED PROJECTS
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
          <div className="relative flex bg-slate-50 p-1.5 rounded-full overflow-hidden border border-slate-100 shadow-sm">
            {workTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`relative z-10 px-6 py-2 md:px-8 md:py-2.5 text-[10px] md:text-xs font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-full whitespace-nowrap ${activeType === type ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {type === 'Created' ? 'Personal' : 'Participation'}
                {activeType === type && (
                  <div className="absolute inset-0 bg-slate-900 rounded-full -z-10 animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-bold tracking-widest transition-all duration-300 border-b-2 uppercase whitespace-nowrap ${activeCategory === cat
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-300 hover:text-slate-500 hover:border-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 min-h-[400px]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse aspect-[16/10] bg-slate-100"></div>
          ))}
        </div>
      ) : (
        <div
          key={activeCategory + activeType}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 min-h-[500px]"
        >
          {!isGridUpdating && filteredItems.map((item, index) => (
            <div
              key={`${item.id}-${activeType}-${activeCategory}`}
              className="stagger-item group cursor-pointer relative"
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => openModal(item)}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 transition-all duration-700">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.22, 1, 0.36, 1) group-hover:scale-105"
                />

                {/* Overlay: Custom behavior for Desktop (Hover) vs Mobile (Always Visible) */}
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
