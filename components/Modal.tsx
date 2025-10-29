import React from 'react';
import { Work } from '../types';

const SpecItem = ({ title, value }: { title: string, value: string | undefined }) => (
    React.createElement('div', null,
        React.createElement('h4', { className: "text-xs font-bold text-gray-400 tracking-widest uppercase mb-1 sm:mb-2" }, title),
        React.createElement('p', { className: "text-sm sm:text-base font-semibold text-[#2a2a2a] leading-relaxed tracking-tight" }, value)
    )
);

// FIX: Define and use a props interface to ensure type safety.
interface ModalProps {
    work: Work;
    onClose: () => void;
    onNavigate: (direction: number) => void;
}

const Modal = ({ work, onClose, onNavigate }: ModalProps) => {
    const renderSpecs = () => {
        if (work.productionType === 'produced') {
            return (
                React.createElement(React.Fragment, null,
                    React.createElement(SpecItem, { title: "Role", value: work.role }),
                    React.createElement(SpecItem, { title: "Set Up", value: work.setup }),
                    React.createElement(SpecItem, { title: "Running Time", value: work.runtime }),
                    React.createElement(SpecItem, { title: "Edit Tool", value: work.editTool })
                )
            );
        } else if (work.productionType === 'participated') {
            return (
                 React.createElement(React.Fragment, null,
                    work.client && React.createElement(SpecItem, { title: "Client / Project By", value: work.client }),
                    React.createElement(SpecItem, { title: "My Role", value: work.role }),
                    React.createElement(SpecItem, { title: "Running Time", value: work.runtime })
                )
            )
        }
        return null;
    }

    return React.createElement('div', { className: "fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4", onClick: onClose },
        React.createElement('button', {
            onClick: (e) => { e.stopPropagation(); onNavigate(-1); },
            className: "absolute top-1/2 -translate-y-1/2 left-2 md:left-8 lg:left-16 w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white text-3xl md:text-4xl font-light cursor-pointer z-50 transition-colors hover:bg-white/40 flex items-center justify-center rounded-full",
            'aria-label': "Previous work"
        }, "\u2039"),
        React.createElement('div', {
            className: "bg-white w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] relative flex flex-col",
            style: { animation: 'modalSlideIn 0.4s ease-out both' },
            onClick: (e: React.MouseEvent) => e.stopPropagation()
        },
            React.createElement('div', { className: "relative w-full aspect-video bg-black flex-shrink-0" },
                React.createElement('iframe', {
                    key: work.id,
                    className: "w-full h-full border-none",
                    src: work.videoUrl,
                    title: work.title,
                    allow: "autoplay; fullscreen; picture-in-picture",
                    allowFullScreen: true
                })
            ),
            React.createElement('div', { className: "p-6 sm:p-8 md:p-12 lg:p-14 overflow-y-auto" },
                React.createElement('h2', { className: "text-xl sm:text-2xl md:text-4xl font-extrabold mb-1 sm:mb-2 text-[#2a2a2a] tracking-tighter" }, work.title),
                React.createElement('p', { className: "text-xs sm:text-sm font-semibold text-[#7a7a7a] tracking-widest uppercase mb-6 sm:mb-8" }, work.category),
                React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 sm:gap-x-14 sm:gap-y-8 mb-8 sm:mb-10" }, renderSpecs()),
                React.createElement('div', { className: "pt-6 sm:pt-8 border-t border-gray-200" },
                    React.createElement('h4', { className: "text-xs font-bold text-gray-400 tracking-widest uppercase mb-3 sm:mb-4" }, "Description"),
                    React.createElement('p', { className: "text-xs sm:text-sm font-medium text-[#595959] leading-relaxed sm:leading-loose tracking-tight" }, work.description)
                )
            ),
            React.createElement('button', {
                onClick: onClose,
                className: "absolute top-3 right-3 w-8 h-8 sm:top-4 sm:right-4 sm:w-10 sm:h-10 bg-[#2a2a2a] text-white text-xl sm:text-2xl cursor-pointer flex items-center justify-center z-20 transition-colors hover:bg-[#595959]",
                'aria-label': "Close modal"
            }, "\u00d7")
        ),
        React.createElement('button', {
            onClick: (e) => { e.stopPropagation(); onNavigate(1); },
            className: "absolute top-1/2 -translate-y-1/2 right-2 md:right-8 lg:right-16 w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white text-3xl md:text-4xl font-light cursor-pointer z-50 transition-colors hover:bg-white/40 flex items-center justify-center rounded-full",
            'aria-label': "Next work"
        }, "\u203a")
    );
};

export default Modal;