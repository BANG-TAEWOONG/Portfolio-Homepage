
import React from 'react';
import type { Work } from '../types';

interface ModalProps {
    work: Work;
    onClose: () => void;
    onNavigate: (direction: number) => void;
}

const SpecItem: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <div>
        <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1 sm:mb-2">{title}</h4>
        <p className="text-sm sm:text-base font-semibold text-[#2a2a2a] leading-relaxed tracking-tight">{value}</p>
    </div>
);

const Modal: React.FC<ModalProps> = ({ work, onClose, onNavigate }) => {
    const renderSpecs = () => {
        if (work.productionType === 'produced') {
            return (
                <>
                    <SpecItem title="Role" value={work.role} />
                    <SpecItem title="Set Up" value={work.setup} />
                    <SpecItem title="Running Time" value={work.runtime} />
                    <SpecItem title="Edit Tool" value={work.editTool} />
                </>
            );
        } else if (work.productionType === 'participated') {
            return (
                 <>
                    {work.client && <SpecItem title="Client / Project By" value={work.client} />}
                    <SpecItem title="My Role" value={work.role} />
                    <SpecItem title="Running Time" value={work.runtime} />
                </>
            )
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
            <button onClick={(e) => { e.stopPropagation(); onNavigate(-1); }} className="absolute top-1/2 -translate-y-1/2 left-2 md:left-8 lg:left-16 w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white text-3xl md:text-4xl font-light cursor-pointer z-50 transition-colors hover:bg-white/40 flex items-center justify-center rounded-full" aria-label="Previous work">&#x2039;</button>
            <div className="bg-white w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] relative flex flex-col" style={{ animation: 'modalSlideIn 0.4s ease-out both' }} onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full aspect-video bg-black flex-shrink-0">
                    <iframe key={work.id} className="w-full h-full border-none" src={work.videoUrl} title={work.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
                </div>
                <div className="p-6 sm:p-8 md:p-12 lg:p-14 overflow-y-auto">
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold mb-1 sm:mb-2 text-[#2a2a2a] tracking-tighter">{work.title}</h2>
                    <p className="text-xs sm:text-sm font-semibold text-[#7a7a7a] tracking-widest uppercase mb-6 sm:mb-8">{work.category}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 sm:gap-x-14 sm:gap-y-8 mb-8 sm:mb-10">{renderSpecs()}</div>
                    <div className="pt-6 sm:pt-8 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3 sm:mb-4">Description</h4>
                        <p className="text-xs sm:text-sm font-medium text-[#595959] leading-relaxed sm:leading-loose tracking-tight">{work.description}</p>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 sm:top-4 sm:right-4 sm:w-10 sm:h-10 bg-[#2a2a2a] text-white text-xl sm:text-2xl cursor-pointer flex items-center justify-center z-20 transition-colors hover:bg-[#595959]" aria-label="Close modal">&times;</button>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onNavigate(1); }} className="absolute top-1/2 -translate-y-1/2 right-2 md:right-8 lg:right-16 w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white text-3xl md:text-4xl font-light cursor-pointer z-50 transition-colors hover:bg-white/40 flex items-center justify-center rounded-full" aria-label="Next work">&#x203A;</button>
        </div>
    );
};

export default Modal;
