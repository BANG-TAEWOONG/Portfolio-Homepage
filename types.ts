
export interface Work {
  id: string;
  title: string;
  category: string;
  role: string;
  setup: string;
  runtime: string;
  editTool: string;
  description: string;
  image: string;
  videoUrl: string;
  categoryFilter: string;
  productionType: 'produced' | 'participated';
  client?: string;
}

export type WorkData = Record<string, Work>;

export interface Tool {
    name: string;
    proficiency: 'Proficient' | 'Familiar';
    icon: string;
}

export interface Equipment {
    name: string;
    icon: string;
}

export interface AboutData {
    equipmentData: Equipment[];
    toolData: Tool[];
    workStyleData: string[];
}

export interface ContactLink {
    name: string;
    url: string;
    icon: string;
}
