
import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-6 md:mb-8">CONTACT</h2>
      <p className="text-slate-400 text-xs md:text-sm font-light mb-12 md:mb-16 tracking-tight">함께 새로운 프로젝트를 시작해볼까요?</p>
      
      <div className="flex justify-center items-center space-x-8 md:space-x-16">
        {/* Email */}
        <a href="mailto:hello@example.com" className="group" aria-label="Email">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </a>

        {/* Instagram */}
        <a href="#" className="group" aria-label="Instagram">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
        </a>

        {/* YouTube */}
        <a href="#" className="group" aria-label="YouTube">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </a>

        {/* Vimeo */}
        <a href="#" className="group" aria-label="Vimeo">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.396 7.158c-.093 2.026-1.507 4.799-4.245 8.32C15.477 18.961 13.028 20.71 10.9 20.71c-1.314 0-2.424-1.213-3.33-3.64l-1.81-6.623c-.682-2.5-1.414-3.75-2.193-3.75-.155 0-.696.325-1.62.977l-.971-1.254c1.022-.898 2.019-1.799 2.99-2.701 1.362-1.208 2.383-1.854 3.064-1.938 1.612-.185 2.6 1.05 2.962 3.704.417 3.061.696 4.962.835 5.7.325 1.701.682 2.551 1.066 2.551.278 0 .898-.588 1.855-1.764.958-1.176 1.477-2.072 1.554-2.689.154-1.237-.356-1.855-1.53-1.855-.541 0-1.1.123-1.67.37 1.114-3.649 3.232-5.419 6.355-5.311 2.321.077 3.404 1.562 3.25 4.456z" />
            </svg>
          </div>
        </a>
      </div>

      <div className="mt-20 md:mt-32 pt-8 md:pt-12">
        <p className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.4em]">Seoul, South Korea</p>
        <p className="text-[9px] md:text-[10px] text-slate-300 mt-2 md:mt-3 uppercase tracking-widest font-light">Available for worldwide projects</p>
      </div>
    </div>
  );
};

export default Contact;
