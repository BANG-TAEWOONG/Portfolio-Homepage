import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WorkItem } from '../types';

interface ProjectModalProps {
    selectedWork: WorkItem | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    navDirection: 'next' | 'prev' | 'init';
}

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';

    // Handle already embedded URLs
    if (url.includes('embed/')) return url;

    // Extract ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

const ProjectModal: React.FC<ProjectModalProps> = ({ selectedWork, onClose, onNext, onPrev, navDirection }) => {
    const [transitionClass, setTransitionClass] = useState('animate-modal-container');

    useEffect(() => {
        if (navDirection === 'next') setTransitionClass('animate-slide-right');
        else if (navDirection === 'prev') setTransitionClass('animate-slide-left');
        else setTransitionClass('animate-modal-container');
    }, [navDirection, selectedWork?.id]);

    if (!selectedWork) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-4 overflow-y-auto pointer-events-none">
            <div
                className="fixed inset-0 bg-white/10 backdrop-blur-md animate-modal-overlay pointer-events-auto"
                onClick={onClose}
            ></div>

            <div
                key={selectedWork.id}
                className={`relative w-full max-w-xl bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-[2010] my-4 md:my-8 pointer-events-auto ${transitionClass}`}
            >
                {/* Video Section */}
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
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-[2030] p-1.5 text-white/50 hover:text-white transition-all duration-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className="w-full p-6 md:p-10 bg-white max-h-[60vh] overflow-y-auto no-scrollbar">
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <span className="text-[8px] md:text-[9px] font-bold tracking-[0.4em] text-slate-300 uppercase block mb-2">{selectedWork.category}</span>
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter leading-tight">{selectedWork.title}</h3>

                                <div className="flex items-center space-x-2 md:space-x-4 text-slate-300 shrink-0">
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
                            <div className="h-[2px] w-8 md:w-10 bg-slate-900 mt-4"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <section className="md:col-span-2">
                                <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">Role</h4>
                                <p className="text-[10px] md:text-xs font-semibold text-slate-900">{selectedWork.role}</p>
                            </section>

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

                            <section className="md:col-span-2">
                                <h4 className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">Description</h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-light whitespace-pre-line">{selectedWork.description}</p>
                            </section>
                        </div>

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
        </div>,
        document.body
    );
};

export default ProjectModal;
