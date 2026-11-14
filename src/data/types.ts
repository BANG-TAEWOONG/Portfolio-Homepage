export type Category = string;
export type WorkType = 'Created' | 'Participated';

export interface CreditItem {
  role: string;
  name: string;
}

export interface WorkItem {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  previewUrl?: string;
  category: Category;
  type: WorkType;
  description: string;
  runningTime: string;
  releaseDate: string;
  role: string;
  setup: string;
  contributionRate?: string;
  pinned?: boolean;
  vertical?: boolean;
  explicitVertical?: boolean;
  // Case Study Extended Fields (Backward-Compatible)
  client?: string;
  artist?: string;
  industry?: string;
  medium?: string;
  year?: string;
  tools?: string;
  focalPoint?: string;
  scopePre?: string[];
  scopeProd?: string[];
  scopePost?: string[];
  hasExplicitScopes?: boolean;
  stills?: string[];
  credits?: CreditItem[];
}

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface SkillItem {
  category: string; // Capabilities, Tools, Equipment
  filter: string;   // Director, Sony, Adobe...
  name: string;     // Scenario, A7S3...
  level: number;    // 1-5
  order?: number;
  hidden?: boolean;
  brand?: string;
  model?: string;
  description?: string;
  keyComponents?: string;
  quantity?: number;
  condition?: string;
  remark?: string;
  owned?: boolean;
}
