import React, { useState } from 'react';
import { useSiteTexts } from '../integrations/useSiteTexts';
import { useIntersectionObserver } from '../integrations/useIntersectionObserver';
import EditableText from '../ui/EditableText';
import InquiryFormModal from '../modals/InquiryFormModal';

const ContactSection: React.FC = () => {
  const { texts, isEditMode } = useSiteTexts();
  const [showToast, setShowToast] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [ctaRef, isCtaVisible] = useIntersectionObserver({ threshold: 0.08, once: false });

  const handleEmailCopy = () => {
    if (texts.contactEmail) {
      navigator.clipboard?.writeText(texts.contactEmail).catch(() => {});
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2600);
    }
  };

  return (
    <div className="w-full px-3 sm:px-5 md:px-7 lg:px-9 relative">
      {/* Monochrome Clipboard Toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-[#0A0A0B] text-white text-xs font-mono-tech px-5 py-2.5 rounded-full shadow-2xl tracking-[0.06em] flex items-center gap-2.5 border border-white/15 animate-dissolve">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>COPIED — {texts.contactEmail}</span>
        </div>
      )}

      <div className="relative pt-16 md:pt-24">
        {/* 1. Left-Aligned Monumental Wow Tapes Editorial CTA (Unhurried Bidirectional Choreography) */}
        <div
          ref={ctaRef}
          className={`section-choreo ${isCtaVisible ? 'is-inview' : ''} relative`}
        >
          <span
            aria-hidden="true"
            className="choreo-hairline absolute top-0 inset-x-0 h-px bg-neutral-200 -mt-16 md:-mt-24"
          />

          <div className="max-w-4xl">
            <p className="font-mono-tech text-xs text-neutral-400 tracking-[0.08em] mb-4 choreo-fade">
              Inquiry &amp; Collaboration
            </p>

            <button
              type="button"
              onClick={() => {
                if (!isEditMode) setIsInquiryOpen(true);
              }}
              className="group text-left block cursor-pointer focus:outline-none"
            >
              <h2 className="font-display text-[clamp(3.2rem,7.5vw,6.8rem)] leading-[0.9] tracking-[-0.01em] text-neutral-950 uppercase">
                <span className="o-line-mask">
                  <span className="o-line-item" style={{ transitionDelay: '80ms' }}>
                    LET&apos;S WORK
                  </span>
                </span>
                <span className="o-line-mask">
                  <span
                    className="o-line-item inline-flex items-center gap-3 sm:gap-4"
                    style={{ transitionDelay: '240ms' }}
                  >
                    <span>TOGETHER</span>
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[12px] md:rounded-[16px] bg-neutral-950 text-white group-hover:bg-neutral-800 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 group-hover:-translate-y-1 shrink-0"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 17L17 7M9 7h8v8"
                        />
                      </svg>
                    </span>
                  </span>
                </span>
              </h2>
            </button>

            <div
              className="mt-5 md:mt-6 max-w-xl choreo-fade"
              style={{ transitionDelay: '400ms' }}
            >
              <EditableText
                textKey="contactSubText"
                className="text-neutral-600 text-sm sm:text-base md:text-[17px] font-normal leading-relaxed break-keep block"
                as="p"
              />
            </div>

            {/* 2. Two Clean Monochrome Inquiry Action Buttons */}
            <div
              className="mt-8 md:mt-10 flex flex-wrap items-center gap-3 choreo-fade"
              style={{ transitionDelay: '540ms' }}
            >
              <button
                type="button"
                onClick={() => setIsInquiryOpen(true)}
                className="px-6 py-3.5 bg-neutral-950 text-white border border-neutral-950 hover:bg-neutral-800 rounded-xl text-xs sm:text-[13px] font-semibold tracking-[0.06em] transition-colors duration-200 inline-flex items-center gap-2.5 cursor-pointer"
              >
                <span>웹에서 바로 신청하기</span>
                <span className="font-mono-tech text-xs opacity-75" aria-hidden="true">
                  ↗
                </span>
              </button>

              {texts.contactFormUrl && (
                <a
                  href={texts.contactFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-[#F9F9F8] text-neutral-950 border border-neutral-200 hover:border-neutral-950 hover:bg-white rounded-xl text-xs sm:text-[13px] font-semibold tracking-[0.06em] transition-colors duration-200 inline-flex items-center gap-2.5 cursor-pointer"
                >
                  <span>Google Form으로 신청하기</span>
                  <span className="font-mono-tech text-xs text-neutral-400" aria-hidden="true">
                    ↗
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* 3. Sleek Collapsible Google Calendar Availability Accordion */}
          {texts.contactCalendarUrl && (
            <div
              className="mt-12 md:mt-16 border-t border-neutral-200 pt-6 choreo-fade"
              style={{ transitionDelay: '660ms' }}
            >
              <button
                type="button"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                aria-expanded={isCalendarOpen}
                className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-4 px-4 py-2.5 rounded-lg bg-[#F9F9F8] hover:bg-[#F4F4F2] border border-neutral-200 text-neutral-900 transition-colors cursor-pointer"
              >
                <span className="font-mono-tech text-[11px] sm:text-xs font-medium tracking-[0.12em] uppercase">
                  PRODUCTION SCHEDULE · 촬영 가능 일정 보기
                </span>
                <span className="font-mono-tech text-sm leading-none text-neutral-500">
                  {isCalendarOpen ? '−' : '+'}
                </span>
              </button>

              {isCalendarOpen && (
                <div className="mt-5 w-full h-[420px] sm:h-[520px] md:h-[640px] bg-[#F9F9F8] rounded-[18px] overflow-hidden border border-neutral-200 animate-dissolve">
                  <iframe
                    src={texts.contactCalendarUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Production Schedule Calendar"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Grounded Static Centered Icon Footer (Email · Instagram · YouTube — Zero Scroll Animation) */}
        <div
          data-static-contact-footer="true"
          className="mt-20 md:mt-28 pt-12 md:pt-14 border-t border-neutral-200 text-center"
        >
          <div className="flex justify-center items-center gap-10 sm:gap-14 md:gap-20">
            {texts.contactEmail && (
              <a
                href={`mailto:${texts.contactEmail}`}
                onClick={handleEmailCopy}
                aria-label="Email"
                title={texts.contactEmail}
                className="group p-2 text-neutral-500 hover:text-neutral-950 transition-colors"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 stroke-current transition-transform duration-300 ease-out group-hover:scale-125"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
            )}

            {texts.contactInstagram && (
              <a
                href={texts.contactInstagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group p-2 text-neutral-500 hover:text-neutral-950 transition-colors"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current transition-transform duration-300 ease-out group-hover:scale-125"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}

            {texts.contactYoutube && (
              <a
                href={texts.contactYoutube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="group p-2 text-neutral-500 hover:text-neutral-950 transition-colors"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current transition-transform duration-300 ease-out group-hover:scale-125"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Direct Inquiry Modal */}
      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        contactEmail={texts.contactEmail}
      />
    </div>
  );
};

export default ContactSection;
