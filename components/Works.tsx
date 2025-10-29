
import React, { useState, useMemo } from 'react';
import type { WorkData } from '../types';
import WorkItem from './WorkItem';

interface WorksProps {
    workData: WorkData;
    onOpenModal: (workId: string, visibleIds: string[]) => void;
}

const Works: React.FC<WorksProps> = ({ workData, onOpenModal }) => {
    const productionTypes = [
        { label: 'Personal Projects', type: 'produced' },
        { label: 'Project Participation', type: 'participated' },
    ];
    const filterButtons = [
        { label: 'All', filter: 'all' },
        { label: 'Music Video', filter: 'mv' },
        { label: 'Dance Film', filter: 'dance-film' },
        { label: 'Dance Cover', filter: 'cover-dance' },
    ];
    const [activeProductionType, setActiveProductionType] = useState('produced');
    const [activeFilter, setActiveFilter] = useState('all');
    const allWorks = useMemo(() => Object.values(workData), [workData]);

    const filteredWorks = useMemo(() => {
        const worksInProductionType = allWorks.filter(work => work.productionType === activeProductionType);
        if (activeFilter === 'all') return worksInProductionType;
        return worksInProductionType.filter(work => work.categoryFilter === activeFilter);
    }, [activeFilter, activeProductionType, allWorks]);

    const handleProductionTypeChange = (type: string) => {
        setActiveProductionType(type);
        setActiveFilter('all');
    };

    const handleItemClick = (workId: string) => {
        const visibleIds = filteredWorks.map(w => w.id);
        onOpenModal(workId, visibleIds);
    };

    return (
        <section className="py-20 sm:py-28 md:py-36 px-4" id="works">
            <div className="max-w-screen-xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-12 text-center tracking-tighter text-[#2a2a2a]">Work</h2>
                <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 mb-10 md:mb-12">
                    {productionTypes.map(({ label, type }) => (<button key={type} onClick={() => handleProductionTypeChange(type)} className={`py-3 px-6 text-sm sm:text-base sm:py-4 sm:px-10 font-bold tracking-tight transition-all duration-300 rounded-full ${activeProductionType === type ? 'bg-[#2a2a2a] text-[#F7F7F7]' : 'bg-transparent text-[#7a7a7a] hover:bg-[#e8e8e8]'}`}>{label}</button>))}
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-10 md:mb-14">
                    {filterButtons.map(({ label, filter }) => (<button key={filter} onClick={() => setActiveFilter(filter)} className={`py-2 px-5 text-xs sm:py-3 sm:px-8 sm:text-sm font-semibold tracking-tight transition-all duration-300 border-2 ${activeFilter === filter ? 'bg-[#2a2a2a] text-[#F7F7F7] border-[#2a2a2a]' : 'bg-transparent border-[#d0d0d0] text-[#7a7a7a] hover:bg-[#2a2a2a] hover:text-[#F7F7F7] hover:border-[#2a2a2a]'}`}>{label}</button>))}
                </div>
                <div key={`${activeProductionType}-${activeFilter}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                    {filteredWorks.map((work, index) => (<WorkItem key={work.id} work={work} index={index} onClick={handleItemClick} />))}
                </div>
            </div>
        </section>
    );
};

export default Works;
