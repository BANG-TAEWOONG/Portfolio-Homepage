
import { WorkItem, Skill, Tool, Equipment } from './types';

export const WORK_ITEMS: WorkItem[] = [
  {
    id: '1',
    title: 'Modern Neon MV',
    thumbnail: 'https://images.unsplash.com/photo-1493238792040-e7141f0f023c?q=80&w=1470&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'MV',
    type: 'Created',
    runningTime: '03:45',
    releaseDate: '2024.02',
    role: 'Director / Editor',
    setup: 'Sony A7SIII, Sigma 24-70mm, DJI RS3 Pro',
    description: '네온 사인의 화려한 색감을 강조한 감각적인 뮤직비디오입니다. 밤의 도시를 배경으로 역동적인 인물의 움직임을 담아냈습니다.'
  },
  {
    id: '2',
    title: 'Urban Dance Film',
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=1374&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Dance Film',
    type: 'Created',
    runningTime: '02:15',
    releaseDate: '2023.11',
    role: 'Cinematographer / Colorist',
    setup: 'BMPCC 6K Pro, Sirui Anamorphic, Easyrig',
    description: '거친 콘크리트 질감의 공간에서 댄서의 움직임을 아나모픽 렌즈의 독특한 질감으로 포착했습니다.'
  },
  {
    id: '3',
    title: 'K-Pop Cover Video',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1469&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Dance Cover',
    type: 'Participated',
    runningTime: '03:30',
    releaseDate: '2024.01',
    role: 'Lighting Designer',
    setup: 'Aputure 600d, Nanlite Forza 60, Smoke Machine',
    description: 'K-Pop 아이돌의 퍼포먼스를 극대화하기 위해 화려한 조명 연출과 스모크 효과를 조화롭게 배치했습니다.'
  },
  {
    id: '4',
    title: 'Melodic Journey',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'MV',
    type: 'Participated',
    runningTime: '04:05',
    releaseDate: '2023.09',
    role: 'Assistant Director',
    setup: 'RED Komodo, Arri Master Primes',
    description: '서정적인 멜로디의 흐름에 맞춰 감성적인 스토리텔링을 구현한 프로젝트입니다.'
  },
  {
    id: '5',
    title: 'Sunset Dance Film',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Dance Film',
    type: 'Created',
    runningTime: '01:50',
    releaseDate: '2023.07',
    role: 'Director / DOP',
    setup: 'Sony A7SIII, Sony 35mm GM',
    description: '일몰 직전의 골든 아워를 활용하여 자연광의 따뜻한 느낌을 댄서의 선과 결합시켰습니다.'
  },
  {
    id: '6',
    title: 'Studio Performance',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1470&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Dance Cover',
    type: 'Created',
    runningTime: '02:50',
    releaseDate: '2023.12',
    role: 'Editor',
    setup: 'Premiere Pro, After Effects',
    description: '스튜디오 내의 정갈한 배경에서 퍼포먼스의 에너지를 빠른 컷 전환과 모션 그래픽으로 표현했습니다.'
  }
];

export const SKILLS: Skill[] = [
  { name: 'Cinematography', level: 95 },
  { name: 'Color Grading', level: 85 },
  { name: 'Motion Graphics', level: 75 },
  { name: 'Creative Directing', level: 90 },
  { name: 'Sound Design', level: 70 }
];

export const TOOLS: string[] = [
  'Adobe Premiere Pro',
  'DaVinci Resolve',
  'After Effects',
  'Final Cut Pro',
  'Cinema 4D',
  'Photoshop'
];

export const EQUIPMENTS: Equipment[] = [
  {
    category: 'Cameras',
    items: ['Sony A7SIII', 'BMPCC 6K Pro', 'RED Komodo (Rental)']
  },
  {
    category: 'Lenses',
    items: ['Sigma Art 18-35mm', 'Sony G Master 24-70mm', 'Sirui Anamorphic Set']
  },
  {
    category: 'Gimbal/Support',
    items: ['DJI RS3 Pro', 'Easyrig Minimax', 'Manfrotto Video Tripod']
  },
  {
    category: 'Lighting',
    items: ['Aputure 600d Pro', 'Amaran T4c Tubes', 'Nanlite Forza 60']
  }
];
