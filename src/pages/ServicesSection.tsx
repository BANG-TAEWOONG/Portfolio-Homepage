import React from 'react';
import EditableText from '../ui/EditableText';
import { useIntersectionObserver } from '../integrations/useIntersectionObserver';

const SERVICE_STAGES = [
  {
    code: '01',
    title: 'PRE',
    subtitle: 'Pre-Production · 기획 및 프리 프로덕션',
    textKey: 'servicePreDesc' as const,
    tags: ['Concept & Direction', 'Script & Storyboard', 'Location Scouting', 'Production Plan'],
  },
  {
    code: '02',
    title: 'PRODUCTION',
    subtitle: 'Principal Photography · 현장 촬영 및 조명 연출',
    textKey: 'serviceProdDesc' as const,
    tags: ['Directing', 'Cinematography (DOP)', 'Camera & Movement', 'Lighting (Gaffer)'],
  },
  {
    code: '03',
    title: 'POST',
    subtitle: 'Post-Production · 편집 · 색보정 · VFX 피니싱',
    textKey: 'servicePostDesc' as const,
    tags: ['Editorial', 'DaVinci Resolve DI', 'VFX & Compositing', 'Sound Finishing'],
  },
] as const;

interface ServiceStageRowProps {
  stage: (typeof SERVICE_STAGES)[number];
  isLast: boolean;
}

const ServiceStageRow: React.FC<ServiceStageRowProps> = ({ stage, isLast }) => {
  const [rowRef, isRowVisible] = useIntersectionObserver({ threshold: 0.1, once: false });

  return (
    <div
      ref={rowRef}
      className={`section-choreo ${isRowVisible ? 'is-inview' : ''} relative py-14 md:py-20 lg:py-24 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-10 items-start`}
    >
      {/* Animated Top Hairline */}
      <span
        aria-hidden="true"
        className="choreo-hairline absolute top-0 inset-x-0 h-px bg-neutral-200"
      />
      {isLast && (
        <span
          aria-hidden="true"
          className="choreo-hairline absolute bottom-0 inset-x-0 h-px bg-neutral-200"
          style={{ transitionDelay: '220ms' }}
        />
      )}

      <div className="sm:col-span-4 sm:text-right sm:pr-2">
        <span className="block font-mono-tech text-[10px] tracking-[0.18em] text-neutral-400 mb-1.5 choreo-fade">
          STAGE {stage.code}
        </span>
        <h4 className="font-display text-3xl sm:text-[38px] md:text-[44px] leading-[0.9] tracking-[-0.01em] text-neutral-950 uppercase o-line-mask">
          <span className="o-line-item" style={{ transitionDelay: '110ms' }}>
            {stage.title}
          </span>
        </h4>
      </div>

      <div className="sm:col-span-8 space-y-4">
        <div className="o-line-mask !pb-1">
          <p
            className="o-line-item text-base sm:text-lg md:text-[20px] font-semibold tracking-tight text-neutral-950 leading-[1.35] break-keep"
            style={{ transitionDelay: '260ms' }}
          >
            {stage.subtitle}
          </p>
        </div>

        <div className="choreo-fade" style={{ transitionDelay: '450ms' }}>
          <EditableText
            textKey={stage.textKey}
            as="p"
            multiline
            className="text-[15px] md:text-[16.5px] text-neutral-700 font-normal leading-[1.72] whitespace-pre-line break-keep block"
          />
        </div>

        <div className="pt-1 flex flex-wrap gap-2">
          {stage.tags.map((tag, tagIdx) => (
            <span
              key={tag}
              style={{ transitionDelay: `${620 + tagIdx * 95}ms` }}
              className="choreo-pill-item px-3 py-1.5 rounded bg-[#F4F4F2] font-mono-tech text-[10.5px] tracking-[0.04em] text-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Studio Introduction & End-to-End Production Workflow (`#services`)
 * Bidirectional `wowtapes.com` `.o-text-reveal` staggered line choreography on both scroll-down and scroll-up.
 */
const ServicesSection: React.FC = () => {
  const [introRef, isIntroVisible] = useIntersectionObserver({ threshold: 0.08, once: false });
  const [headlineRef, isHeadlineVisible] = useIntersectionObserver({ threshold: 0.08, once: false });

  return (
    <div className="w-full px-3 sm:px-5 md:px-7 lg:px-9 relative">
      <div className="pt-16 md:pt-24 relative">
        {/* 1. Studio Brief Intro Statement (Bidirectional Line Mask + Hairline Sweep) */}
        <div
          ref={introRef}
          className={`section-choreo ${
            isIntroVisible ? 'is-inview' : ''
          } relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-16 md:pb-24 items-start`}
        >
          <span
            aria-hidden="true"
            className="choreo-hairline absolute top-0 inset-x-0 h-px bg-neutral-200 -mt-16 md:-mt-24"
          />

          <div className="lg:col-span-4">
            <p className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-2 choreo-fade">
              Studio &amp; Workflow · 스튜디오 소개
            </p>
            <div className="o-line-mask pt-1.5 -mt-1.5">
              <div className="o-line-item">
                <EditableText
                  textKey="aboutTitle"
                  as="h2"
                  className="font-display text-3xl sm:text-4xl md:text-5xl leading-[0.94] tracking-tight text-neutral-950 uppercase block"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 lg:col-start-5 space-y-5">
            <div className="choreo-fade" style={{ transitionDelay: '240ms' }}>
              <EditableText
                textKey="aboutQuote"
                as="p"
                className="text-lg sm:text-xl md:text-[23px] font-semibold tracking-tight text-neutral-950 leading-[1.45] break-keep block"
              />
            </div>
            <div className="choreo-fade" style={{ transitionDelay: '460ms' }}>
              <EditableText
                textKey="aboutDescription"
                as="p"
                multiline
                className="text-sm sm:text-base md:text-[17px] text-neutral-600 font-normal leading-[1.7] whitespace-pre-line break-keep block"
              />
            </div>
          </div>

          <span
            aria-hidden="true"
            className="choreo-hairline absolute bottom-0 inset-x-0 h-px bg-neutral-200"
            style={{ transitionDelay: '240ms' }}
          />
        </div>

        {/* 2. Wow Tapes Signature Asymmetric 12-Column Service Grid (`ALL-IN FOR STORIES` | Independent Bidirectional `PRE` / `PRODUCTION` / `POST` Rows) */}
        <div className="pt-16 md:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
          {/* Left 4 Columns: Monumental Condensed Display Title */}
          <div
            ref={headlineRef}
            className={`section-choreo ${
              isHeadlineVisible ? 'is-inview' : ''
            } lg:col-span-4 lg:sticky lg:top-24`}
          >
            <p className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-3 choreo-fade">
              End-to-End Capabilities · 제작 공정
            </p>
            <div className="o-line-mask pt-3 -mt-3">
              <div className="o-line-item">
                <EditableText
                  textKey="serviceHeadline"
                  as="h3"
                  multiline
                  className="font-display text-[clamp(3.2rem,6.6vw,6.4rem)] leading-[0.94] tracking-[-0.01em] text-neutral-950 uppercase whitespace-pre-line block"
                />
              </div>
            </div>
          </div>

          {/* Right 8 Columns (Cols 5–12): Generous Breathable Scroll-Responsive Stages */}
          <div className="lg:col-span-8 lg:col-start-5">
            {SERVICE_STAGES.map((stage, idx) => (
              <ServiceStageRow
                key={stage.title}
                stage={stage}
                isLast={idx === SERVICE_STAGES.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;
