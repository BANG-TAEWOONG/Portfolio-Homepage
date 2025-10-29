// Fix: Define Work and WorkData types for portfolio items.
export interface Work {
    id: string;
    title: string;
    category: string;
    role: string;
    client?: string;
    setup: string;
    runtime: string;
    editTool: string;
    description: string;
    image: string;
    videoUrl: string;
    categoryFilter: string;
    productionType: 'produced' | 'participated';
}

export type WorkData = { [key: string]: Work };
