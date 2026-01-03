import Papa from 'papaparse';
import { WorkItem, Category, WorkType, SkillItem } from '../types';

const GOOGLE_SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub';
const GOOGLE_SHEET_CSV_URL = `${GOOGLE_SHEET_BASE_URL}?output=csv`;
const SKILL_DB_GID = '865936350';
const GOOGLE_SHEET_SKILLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${SKILL_DB_GID}&output=csv`;

interface SheetRow {
    id: string;
    date: string;
    participation_level: string;
    project_type: string;
    artist: string;
    running_time: string;
    title: string;
    role: string;
    video_url: string;
    thumbnail_url: string;
    edit_tool: string;
    setup: string;
    hidden: string;
    description: string;
}

interface SkillSheetRow {
    category: string;
    filter: string;
    name: string;
    level: string;
    order: string;
    hidden?: string;
    remark?: string;
}

// ... (existing helper functions)

function mapCategory(type: string): Category {
    // ... (existing implementation)
    if (type.includes('Music Video') || type.includes('MV')) return 'MV';
    if (type.includes('Dance Film')) return 'Dance Film';
    if (type.includes('Dance Cover')) return 'Dance Cover';
    return 'All'; // Default fallback
}

const mapWorkType = (level: string): WorkType => {
    if (level.includes('Personal')) return 'Created';
    return 'Participated';
};

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeId(url);
    return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop';
};

export const fetchWorkItems = async (): Promise<WorkItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: (results) => {
                try {
                    const rows = results.data as SheetRow[];

                    const workItems: WorkItem[] = rows
                        .filter(row => row.id && row.title && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        .map(row => ({
                            id: row.id,
                            title: row.title,
                            thumbnail: row.thumbnail_url || getYouTubeThumbnail(row.video_url),
                            videoUrl: row.video_url,
                            category: mapCategory(row.project_type),
                            type: mapWorkType(row.participation_level),
                            runningTime: row.running_time,
                            releaseDate: row.date,
                            role: row.role,
                            setup: row.setup,
                            description: row.description
                        }));

                    resolve(workItems);
                } catch (err) {
                    reject(err);
                }
            },
            error: (err) => {
                reject(err);
            }
        });
    });
};

export const fetchSkillsData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_SKILLS_URL, {
            download: true,
            header: true,
            complete: (results) => {
                try {
                    const rows = results.data as SkillSheetRow[];
                    const skills: SkillItem[] = rows
                        .filter(row => row.category && row.name) // Basic validation
                        .map(row => ({
                            category: row.category,
                            filter: row.filter,
                            name: row.name,
                            level: parseInt(row.level) || 0,
                            order: parseInt(row.order) || 999,
                            hidden: row.hidden?.trim().toUpperCase() === 'TRUE'
                        }))
                        .sort((a, b) => (a.order || 999) - (b.order || 999));

                    resolve(skills);
                } catch (err) {
                    console.error('Error parsing skills:', err);
                    resolve([]); // Return empty array on error to prevent crash
                }
            },
            error: (err) => {
                console.error('Fetch error:', err);
                reject(err);
            }
        });
    });
};
