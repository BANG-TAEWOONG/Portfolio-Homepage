
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
