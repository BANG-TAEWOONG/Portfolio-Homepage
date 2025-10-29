import React from 'react';

const WorkItem = ({ work, index, onClick }) => {
    return React.createElement('div', {
        className: "relative aspect-video bg-[#e8e8e8] overflow-hidden cursor-pointer transition-transform duration-300 ease-in-out hover:-translate-y-2 group work-item-animate",
        style: { '--stagger-delay': `${index * 80}ms` },
        onClick: () => onClick(work.id)
    },
        React.createElement('img', {
            src: work.image,
            alt: work.title,
            className: "w-full h-full object-cover transition-all duration-400 ease-in-out group-hover:scale-105 group-hover:brightness-60"
        }),
        React.createElement('div', { className: "absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/75 to-transparent transition-opacity duration-400 opacity-0 group-hover:opacity-100" },
            React.createElement('h3', { className: "text-base sm:text-lg md:text-xl font-bold text-white tracking-tight mb-1 sm:mb-2" }, work.title),
            React.createElement('p', { className: "text-xs font-medium text-gray-300 tracking-widest uppercase" }, work.category)
        )
    );
};

export default WorkItem;