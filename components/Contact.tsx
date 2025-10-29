import React from 'react';
import { contactData } from '../constants.js';

const Contact = () => {
    return React.createElement('section', { className: "py-20 sm:py-28 md:py-32 px-4 text-center bg-[#F7F7F7]", id: "contact" },
        React.createElement('h2', { className: "text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 sm:mb-8 tracking-tighter text-[#2a2a2a]" }, "Contact"),
        React.createElement('p', { className: "text-base sm:text-lg font-medium text-[#7a7a7a] mb-10 sm:mb-12 tracking-tight max-w-md mx-auto" },
            "Available for collaborations & projects"
        ),
        React.createElement('div', { className: "flex gap-5 sm:gap-7 justify-center" },
            contactData.map(item => (
                React.createElement('a', {
                    key: item.name,
                    href: item.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform duration-300 hover:scale-110 group",
                    title: item.name
                },
                    React.createElement('img', {
                        src: item.icon,
                        alt: `${item.name} icon`,
                        className: "w-6 h-6 sm:w-7 sm:h-7 object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
                    })
                )
            ))
        )
    );
};

export default Contact;