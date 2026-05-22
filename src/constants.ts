
import { Skill } from './types';



export const SKILLS: Skill[] = [
  { name: 'Cinematography', level: 95 },
  { name: 'Color Grading', level: 85 },
  { name: 'Motion Graphics', level: 75 },
  { name: 'Creative Directing', level: 90 },
  { name: 'Sound Design', level: 70 }
];

export const TOOLS_DATA: Skill[] = [
  { name: 'Premiere Pro', level: 95 },
  { name: 'After Effects', level: 85 },
  { name: 'DaVinci Resolve', level: 80 },
  { name: 'Final Cut Pro', level: 70 },
];

export const EQUIPMENT_DATA: Skill[] = [
  { name: 'Sony A7SIII', level: 95 },
  { name: 'Blackmagic 6K', level: 85 },
  { name: 'RED Komodo', level: 70 },
  { name: 'Aputure Light', level: 90 },
];





export const LEVEL_MAPPING: { [key: number]: string } = {
  0: 'BEGINNER',
  1: 'BASIC',
  2: 'INTERMEDIATE',
  3: 'ADVANCED',
  4: 'PROFESSIONAL',
  5: 'MASTER'
};

export interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export const TIMELINE_DATA: TimelineItem[] = [
  {
    year: '2023',
    title: 'TWOONG STUDIO 설립',
    description: '댄스 필름 및 독립 뮤직비디오 프로덕션으로 첫 발걸음을 떼며 다수의 인디 아티스트 협업 시작.'
  },
  {
    year: '2024',
    title: '포트폴리오 다각화 및 프로덕션 확장',
    description: '브랜드 필름, 광고 영상 및 댄스 스튜디오 협업 비디오 기획/연출 진행. 메인 시네마 카메라(FX3) 라인업 확보.'
  },
  {
    year: '2025',
    title: '장비 고도화 및 파트너십 구축',
    description: '실제 촬영 장비 라인업 대대적 확장. 현장 중심의 고품질 조명 및 리그 장비 구축 및 중규모 프로덕션 협업.'
  },
  {
    year: '2026',
    title: '프리미엄 비주얼 스튜디오 도약',
    description: '프리미엄 비주얼 스토리텔링 스튜디오로서 세련된 색감과 역동적인 연출력을 통해 감각적인 영상 크리에이션 지속.'
  }
];

