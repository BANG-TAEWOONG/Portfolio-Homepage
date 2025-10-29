// IMPORTANT: Replace this URL with your own published Google Sheet CSV URL.
// See the guide in the app for instructions.
import { Work } from '../types';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub?output=csv';

const fallbackWorkData: { [key: string]: Work } = {
    '1': { id: '1', title: "Artist Name - Song Title", category: "Music Video", role: "연출, 촬영, 편집", setup: "Sony FX3 + 24-70mm f/2.8", runtime: "3:45", editTool: "DaVinci Resolve, After Effects", description: "뮤직비디오 프로젝트. 다이나믹한 카메라 무빙과 강렬한 조명 연출로 아티스트의 에너지를 표현했습니다.", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80", videoUrl: "https://player.vimeo.com/video/137804996", categoryFilter: "mv", productionType: 'produced' },
    '2': { id: '2', title: "Contemporary Dance Performance", category: "DANCE FILM", role: "연출, 촬영, 편집", setup: "BMPCC 6K PRO + Sigma 18-35mm", runtime: "4:20", editTool: "DaVinci Resolve", description: "현대 무용 퍼포먼스 영상. 자연광과 미니멀한 조명 설정으로 무용수의 움직임에 집중했습니다.", image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1200&q=80", videoUrl: "https://www.youtube.com/embed/Sj60-By_T50", categoryFilter: "dance-film", productionType: 'produced' },
    '3': { id: '3', title: "K-Pop Cover Dance", category: "Dance Cover", role: "연출, 촬영, 편집", setup: "Sony FX3 + 16-35mm f/2.8", runtime: "3:15", editTool: "Premiere Pro, After Effects", description: "K-Pop 커버 댄스 영상. 슬로우 모션과 컬러풀한 조명으로 역동적인 안무를 강조했습니다.", image: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=1200&q=80", videoUrl: "https://player.vimeo.com/video/12915013", categoryFilter: "cover-dance", productionType: 'produced' },
    '4': { id: '4', title: "Band Music Video", category: "Music Video", role: "촬영, 편집", client: "Indie Label 'Echo'", setup: "Sony FX3 + 85mm f/1.4", runtime: "4:05", editTool: "DaVinci Resolve", description: "밴드 뮤직비디오. 시네마틱한 톤과 실용 조명으로 감성적인 분위기를 연출했습니다.", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80", videoUrl: "https://www.youtube.com/embed/9Auq9mYEE", categoryFilter: "mv", productionType: 'participated' },
    '5': { id: '5', title: "Urban Dance Project", category: "DANCE FILM", role: "연출, 촬영, 편집", setup: "BMPCC 6K PRO + Canon 24-70mm", runtime: "2:50", editTool: "DaVinci Resolve", description: "어반 댄스 프로젝트. 거리의 조명을 활용하고 높은 대비로 도시적 무드를 표현했습니다.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80", videoUrl: "https://player.vimeo.com/video/232018247", categoryFilter: "dance-film", productionType: 'produced' },
    '6': { id: '6', title: "Dance Cover Series", category: "Dance Cover", role: "촬영, 편집", client: "1MILLION Dance Studio", setup: "Sony FX3 + Tamron 28-75mm", runtime: "3:30", editTool: "Premiere Pro", description: "댄스 커버 시리즈. 클린한 조명 설정과 안정적인 프레이밍으로 댄서의 퍼포먼스를 담았습니다.", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80", videoUrl: "https://www.youtube.com/embed/F9L9yCf-YxU", categoryFilter: "cover-dance", productionType: 'participated' }
};

const parseCSVtoWorkData = (csvText: string): { [id: string]: Work } => {
    const workData: { [id: string]: Work } = {};
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) return workData;

    const parseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result.map(v => v.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"'));
    };
    
    const headers = parseLine(lines[0]);
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const values = parseLine(lines[i]);
        if (values.length < headers.length) continue;
        
        // FIX: Explicitly type workItem as an object with string keys to resolve property access errors.
        const workItem: { [key: string]: string } = {};
        headers.forEach((header, index) => {
            workItem[header] = values[index] || '';
        });

        const typedWorkItem: Work = {
            id: workItem.id,
            title: workItem.title,
            category: workItem.category,
            role: workItem.role,
            setup: workItem.setup,
            runtime: workItem.runtime,
            editTool: workItem.editTool,
            description: workItem.description,
            image: workItem.thumbnail_url,
            videoUrl: workItem.videoUrl,
            categoryFilter: workItem.categoryFilter,
            productionType: workItem.productionType as 'produced' | 'participated',
            client: workItem.client || undefined,
        };

        if (typedWorkItem.id && (typedWorkItem.productionType === 'produced' || typedWorkItem.productionType === 'participated')) {
            workData[typedWorkItem.id] = typedWorkItem;
        }
    }
    return workData;
};


export const fetchWorkData = async (): Promise<{ [id: string]: Work }> => {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const csvText = await response.text();
        const parsedData = parseCSVtoWorkData(csvText);
        // Check if parsing resulted in any data, otherwise use fallback
        if (Object.keys(parsedData).length > 0) {
            return parsedData;
        }
        console.warn("CSV data was empty or failed to parse. Using fallback data.");
        return fallbackWorkData;
    } catch (error) {
        console.error("Error fetching or parsing Google Sheet, falling back to mock data:", error);
        return fallbackWorkData;
    }
};