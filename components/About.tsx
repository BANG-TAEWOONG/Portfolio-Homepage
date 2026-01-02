import React, { useState, useEffect, useRef } from 'react';
import { SKILLS, TOOLS_DATA, EQUIPMENT_DATA } from '../constants';
import { Skill } from '../types';

const SkillItem: React.FC<{ skill: Skill; index: number }> = ({ skill, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Clear any existing timers
          if (timerRef.current) clearInterval(timerRef.current);
          if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

          delayTimerRef.current = setTimeout(() => {
            setIsVisible(true);
            let start = 0;
            const end = skill.level;

            timerRef.current = setInterval(() => {
              start += 1.5;
              if (start >= end) {
                setCount(end);
                if (timerRef.current) clearInterval(timerRef.current);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }, index * 150);
        } else {
          // Reset state when out of view
          setIsVisible(false);
          setCount(0);
          if (timerRef.current) clearInterval(timerRef.current);
          if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };
  }, [skill.level, index]);

  return (
    <div ref={ref} className="mb-6 md:mb-10">
      <div className="flex justify-between text-[9px] md:text-[11px] font-bold text-slate-800 mb-2 md:mb-3 tracking-widest uppercase">
        <span>{skill.name}</span>
        <span>{count}%</span>
      </div>
      <div className="h-[1px] md:h-[2px] w-full bg-slate-200 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-black transition-all duration-[2000ms] cubic-bezier(0.22, 1, 0.36, 1)"
          style={{ width: isVisible ? `${skill.level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
};

const About: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full px-6">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-10 md:mb-20">ABOUT</h2>

      <div className="space-y-24 md:space-y-36">

        {/* Intro Section: Text Only with Sensuous Interaction */}
        <div ref={textRef} className="py-8 md:py-16">
          <div className="flex flex-col space-y-12">

            {/* Title with Staggered Reveal */}
            <div className="space-y-0">
              <div className="overflow-hidden">
                <h3 className={`text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter leading-[0.8] transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                  I AM A
                </h3>
              </div>
              <div className="overflow-hidden pt-2">
                <h3 className={`text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-500 to-slate-900 bg-[length:200%_auto] tracking-tighter leading-[0.8] transition-all duration-[1.2s] delay-100 cubic-bezier(0.16, 1, 0.3, 1) hover:bg-right ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  STORYTELLER.
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-8">
              {/* Quote Section */}
              <div className={`md:col-span-5 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="border-l-2 border-slate-900 pl-6 py-2">
                  <p className="text-lg md:text-2xl text-slate-500 font-light italic leading-relaxed">
                    "카메라는 도구일 뿐, 감동을 만드는 것은 그 프레임 안에 담긴 진심입니다."
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className={`md:col-span-7 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <p className="text-sm md:text-lg text-slate-800 font-light leading-loose">
                  단순히 기록하는 것을 넘어, 매 순간의 감정과 분위기를 가장 완벽한 톤으로 담아내고자 합니다.
                  다양한 댄스 필름과 뮤직비디오 프로젝트를 거치며 시각적 리듬감과 역동적인 연출력을 쌓아왔습니다.
                  빛과 그림자, 그리고 그 안의 움직임을 통해 당신의 이야기를 완성합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Tools Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          {/* Left: Capabilities */}
          <div>
            <h4 className="text-[7px] md:text-[10px] font-bold tracking-[0.5em] text-slate-300 mb-8 md:mb-16 uppercase">Capabilities</h4>
            <div className="space-y-1 md:space-y-2">
              {SKILLS.map((skill, i) => (
                <SkillItem key={skill.name} skill={skill} index={i} />
              ))}
            </div>
          </div>

          {/* Right: Tools & Equipment */}
          <div className="space-y-16 md:space-y-24">
            {/* Tools */}
            <div>
              <h4 className="text-[7px] md:text-[10px] font-bold tracking-[0.5em] text-slate-300 mb-8 md:mb-12 uppercase">Tools</h4>
              <div className="space-y-1 md:space-y-2">
                {TOOLS_DATA.map((skill, i) => (
                  <SkillItem key={skill.name} skill={skill} index={i} />
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h4 className="text-[7px] md:text-[10px] font-bold tracking-[0.5em] text-slate-300 mb-8 md:mb-12 uppercase">Equipment</h4>
              <div className="space-y-1 md:space-y-2">
                {EQUIPMENT_DATA.map((skill, i) => (
                  <SkillItem key={skill.name} skill={skill} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { n: '01', t: 'Clear Communication', d: '아이디어가 현실이 되는 과정에서 가장 중요한 것은 상호 이해입니다.' },
            { n: '02', t: 'On-time Delivery', d: '약속된 시간을 철저히 지켜 프로젝트의 완성을 보장합니다.' },
            { n: '03', t: 'Extreme Detail', d: '프레임 한 장, 색감 한 스탑의 차이가 영상의 본질을 결정합니다.' },
            { n: '04', t: 'Flexible Solution', d: '현장의 변수 속에서도 최선의 결과를 위한 대안을 신속하게 찾습니다.' }
          ].map((v) => (
            <div key={v.n} className="group p-6 md:p-10 bg-white border border-slate-100 transition-all duration-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 cursor-default">
              <span className="text-[9px] font-bold text-slate-200 group-hover:text-black transition-colors duration-500 mb-2 block tracking-widest">{v.n}</span>
              <h5 className="font-bold text-slate-900 mb-2 text-[11px] md:text-sm tracking-tight">{v.t}</h5>
              <p className="text-[9px] md:text-xs text-slate-400 leading-relaxed font-light">{v.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
