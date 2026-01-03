
export type Category = 'All' | 'MV' | 'Dance Film' | 'Dance Cover';
export type WorkType = 'Created' | 'Participated';

export interface WorkItem {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  category: Category;
  type: WorkType;
  description: string;
  runningTime: string;
  releaseDate: string;
  role: string;
  setup: string;
}

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface Tool {
  name: string;
  icon?: string;
}

export interface Equipment {
  category: string;
  items: string[];
}

export interface SkillItem {
  category: string; // Capabilities, Tools, Equipment
  filter: string;   // Director, Sony, Adobe...
  name: string;     // Scenario, A7S3...
  level: number;    // 1-5
  order?: number;
  hidden?: boolean;
}
