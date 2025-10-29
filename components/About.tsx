
import React, { useState, useMemo } from 'react';
import type { AboutData, Tool, Equipment } from '../types';

interface AboutProps {
    aboutData: AboutData;
}

const TextGridItem: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center justify-center p-3 sm:p-4 bg-[#F7F7F7] border-2 border-[#e8e8e8] text-center h-full">
        <span className="text-xs sm:text-sm font-semibold text-[#595959] tracking-tight">{name}</span>
    </div>
);

const ToolLogoItem: React.FC<{ item: Tool | Equipment }> = ({ item }) => (
    <div className="flex items-center justify-center p-2 aspect-square group transition-transform duration-300 hover:scale-110">
        <img src={item.icon} alt={`${item.name} logo`} className="h-12 w-12 object-contain" title={item.name} />
    </div>
);

const About: React.FC<AboutProps> = ({ aboutData }) => {
    const { equipmentData, toolData, workStyleData } = aboutData;
    const [toolFilter, setToolFilter] = useState('All');
    const coreRoles = ['기획', '연출', '촬영', '편집'];

    const filteredTools = useMemo(() => {
        if (toolFilter === 'All') return toolData;
        return toolData.filter(t => t.proficiency === toolFilter);
    }, [toolFilter, toolData]);

    const toolFilterOptions = [
        { value: 'All', label: 'All Tools' },
        { value: 'Proficient', label: 'Proficient in' },
        { value: 'Familiar', label: 'Familiar with' }
    ];

    return (
        <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12 bg-white" id="about">
            <div className="max-w-screen-xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-12 text-center sm:text-left tracking-tighter text-[#2a2a2a]">About</h2>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
                    <div className="lg:col-span-3">
                        <div className="mb-12 sm:mb-16">
                            <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Introduce</h3>
                            <p className="text-base font-medium text-[#595959] leading-relaxed tracking-tight italic">“퍼포먼스의 리듬과 카메라의 움직임으로 감정을 설계하는 비디오그래퍼.”</p>
                        </div>
                        <div className="mb-12 sm:mb-16">
                            <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Role Definition</h3>
                            <p className="text-sm font-medium text-[#7a7a7a] leading-relaxed tracking-tight mb-6">아이돌 및 댄서 퍼포먼스 영상 제작을 위해 기획부터 연출, 촬영, 편집까지 전 과정을 통합적으로 수행합니다.</p>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {coreRoles.map(item => <TextGridItem key={item} name={item} />)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Collaboration</h3>
                            <p className="text-sm font-medium text-[#7a7a7a] leading-relaxed tracking-tight mb-6">유연한 소통과 효율적인 협업을 통해 최고의 결과물을 만들어냅니다.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                {workStyleData.map(item => <TextGridItem key={item} name={item} />)}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="mb-12 sm:mb-16">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                                <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] tracking-tight mb-4 sm:mb-0">Tools</h3>
                                <select
                                    value={toolFilter}
                                    onChange={(e) => setToolFilter(e.target.value)}
                                    className="py-2 px-4 text-sm font-semibold text-[#595959] bg-[#F7F7F7] border-2 border-[#d0d0d0] cursor-pointer focus:outline-none focus:border-[#2a2a2a] w-full sm:w-auto"
                                >
                                    {toolFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                                {filteredTools.map(item => <ToolLogoItem key={item.name} item={item} />)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-8 tracking-tight">Equipment</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                                {equipmentData.map(item => <ToolLogoItem key={item.name} item={item} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
