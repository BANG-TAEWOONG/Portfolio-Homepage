import React from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';

const Contact: React.FC = () => {
  const { texts } = useSiteTexts();

  return (
    // 전체 컨테이너: 텍스트 중앙 정렬(text-center) 및 좌우 패딩(px-6)
    <div className="w-full px-6 text-center">

      {/* 1. 섹션 헤더 영역 */}
      {/* 제목: CONTACT (반응형 폰트 크기 적용) */}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-6 md:mb-8">CONTACT</h2>
      {/* 서브 텍스트: 협업 제안 메시지 (연한 회색, 얇은 폰트) */}
      <p className="text-slate-400 text-xs md:text-sm font-light mb-12 md:mb-16 tracking-tight">{texts.contactSubText}</p>

      {/* 2. 소셜 미디어 아이콘 링크 영역 */}
      {/* 아이콘들을 가로로 정렬하고 간격을 띄움 (space-x-8) */}
      <div className="flex justify-center items-center space-x-8 md:space-x-16">

        {/* A. 이메일 (mailto 링크) */}
        {/* group 클래스: 부모(a태그)에 마우스를 올렸을 때 자식(svg)의 스타일을 바꾸기 위해 사용 */}
        <a href={`mailto:${texts.contactEmail}`} className="group" aria-label="Email">
          {/* 아이콘 래퍼: 호버 시 크기 확대 (scale-125) */}
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            {/* SVG 아이콘: 기본 회색(text-slate-300) -> 호버 시 검정색(text-slate-900)으로 변경 */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </a>

        {/* B. 인스타그램 (새 탭으로 열기) */}
        <a href={texts.contactInstagram} target="_blank" rel="noopener noreferrer" className="group" aria-label="Instagram">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
        </a>

        {/* C. 유튜브 (새 탭으로 열기) */}
        <a href={texts.contactYoutube} target="_blank" rel="noopener noreferrer" className="group" aria-label="YouTube">
          <div className="flex items-center justify-center transition-all duration-500 transform group-hover:scale-125">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300 transition-colors duration-500 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </a>

        {/* D. 비메오 (비활성 — 실제 URL 설정 시 활성화) */}
        <span className="group cursor-not-allowed opacity-40" aria-label="Vimeo (준비 중)">
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.396 7.158c-.093 2.026-1.507 4.799-4.245 8.32C15.477 18.961 13.028 20.71 10.9 20.71c-1.314 0-2.424-1.213-3.33-3.64l-1.81-6.623c-.682-2.5-1.414-3.75-2.193-3.75-.155 0-.696.325-1.62.977l-.971-1.254c1.022-.898 2.019-1.799 2.99-2.701 1.362-1.208 2.383-1.854 3.064-1.938 1.612-.185 2.6 1.05 2.962 3.704.417 3.061.696 4.962.835 5.7.325 1.701.682 2.551 1.066 2.551.278 0 .898-.588 1.855-1.764.958-1.176 1.477-2.072 1.554-2.689.154-1.237-.356-1.855-1.53-1.855-.541 0-1.1.123-1.67.37 1.114-3.649 3.232-5.419 6.355-5.311 2.321.077 3.404 1.562 3.25 4.456z" />
            </svg>
          </div>
        </span>
      </div>

      {/* 2-B. 촬영 문의하기 (CTA Button) */}
      <div className="mt-12 md:mt-16">
        <a
          href={texts.contactFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 md:px-10 md:py-4 border border-slate-200 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
        >
          Project Inquiry
        </a>
      </div>

      {/* 3. 하단 정보 섹션 */}
      {/* 활동 지역 및 가능 여부 표시 */}
      <div className="mt-20 md:mt-32 pt-8 md:pt-12">
        <p className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.4em]">{texts.contactLocation}</p>
        <p className="text-[9px] md:text-[10px] text-slate-300 mt-2 md:mt-3 uppercase tracking-widest font-light">{texts.contactAvailability}</p>
      </div>
    </div>
  );
};

export default Contact;