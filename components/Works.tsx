import React, { useState, useMemo } from 'react';
import WorkItem from './WorkItem';
import { Work } from '../types';

// FIX: Add explicit types for component props to ensure type safety.
const Works = ({ workData, onOpenModal }: { workData: { [key: string]: Work }, onOpenModal: (workId: string, visibleIds: string[]) => void }) => {
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

    const handleProductionTypeChange = (type: 'produced' | 'participated') => {
        setActiveProductionType(type);
        setActiveFilter('all');
    };

    const handleItemClick = (workId: string) => {
        const visibleIds = filteredWorks.map(w => w.id);
        onOpenModal(workId, visibleIds);
    };

    return React.createElement('section', { className: "py-20 sm:py-28 md:py-36 px-4", id: "works" },
        React.createElement('div', { className: "max-w-screen-xl mx-auto" },
            React.createElement('h2', { className: "text-3xl sm:text-4xl md:text-6xl font-extrabold mb-12 text-center tracking-tighter text-[#2a2a2a]" }, "Work"),
            React.createElement('div', { className: "flex flex-row justify-center items-center gap-3 sm:gap-4 mb-10 md:mb-12" },
                productionTypes.map(({ label, type }) => React.createElement('button', {
                    key: type,
                    onClick: () => handleProductionTypeChange(type as 'produced' | 'participated'),
                    className: `py-3 px-6 text-sm sm:text-base sm:py-4 sm:px-10 font-bold tracking-tight transition-all duration-300 rounded-full ${activeProductionType === type ? 'bg-[#2a2a2a] text-[#F7F7F7]' : 'bg-transparent text-[#7a7a7a] hover:bg-[#e8e8e8]'}`
                }, label))
            ),
            React.createElement('div', { className: "flex flex-wrap justify-center gap-2 sm:gap-4 mb-10 md:mb-14" },
                filterButtons.map(({ label, filter }) => React.createElement('button', {
                    key: filter,
                    onClick: () => setActiveFilter(filter),
                    className: `py-2 px-5 text-xs sm:py-3 sm:px-8 sm:text-sm font-semibold tracking-tight transition-all duration-300 border-2 ${activeFilter === filter ? 'bg-[#2a2a2a] text-[#F7F7F7] border-[#2a2a2a]' : 'bg-transparent border-[#d0d0d0] text-[#7a7a7a] hover:bg-[#2a2a2a] hover:text-[#F7F7F7] hover:border-[#2a2a2a]'}`
                }, label))
            ),
            React.createElement('div', { key: `${activeProductionType}-${activeFilter}`, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" },
                filteredWorks.map((work, index) => React.createElement(WorkItem, { key: work.id, work: work, index: index, onClick: handleItemClick }))
            )
        )
    );
};

export default Works;