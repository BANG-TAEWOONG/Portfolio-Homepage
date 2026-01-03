import Papa from 'papaparse';
import { WorkItem, Category, WorkType, SkillItem } from '../types';

// ----------------------------------------------------------------------
// 1. 구글 시트 설정 및 상수 정의
// ----------------------------------------------------------------------

// '웹에 게시'된 구글 스프레드시트의 CSV 출력 URL
const GOOGLE_SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub';

// 메인 프로젝트 데이터 (첫 번째 시트) URL
const GOOGLE_SHEET_CSV_URL = `${GOOGLE_SHEET_BASE_URL}?output=csv`;

// 스킬/장비 데이터가 있는 시트의 GID (고유 ID)
const SKILL_DB_GID = '865936350';
const GOOGLE_SHEET_SKILLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${SKILL_DB_GID}&output=csv`;

// ----------------------------------------------------------------------
// 2. 데이터 인터페이스 (구글 시트 헤더와 1:1 매핑)
// ----------------------------------------------------------------------

// 프로젝트 시트의 행 데이터 타입 (Raw Data)
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

// 스킬 시트의 행 데이터 타입 (Raw Data)
interface SkillSheetRow {
    category: string;
    filter: string;
    name: string;
    level: string;
    order: string;
    hidden?: string;
    remark?: string;
}

// ----------------------------------------------------------------------
// 3. 헬퍼 함수 (데이터 변환 및 유틸리티)
// ----------------------------------------------------------------------

/**
 * 시트의 'project_type' 문자열을 앱 내부 'Category' 타입으로 변환
 */
function mapCategory(type: string): Category {
    if (type.includes('Music Video') || type.includes('MV')) return 'MV';
    if (type.includes('Dance Film')) return 'Dance Film';
    if (type.includes('Dance Cover')) return 'Dance Cover';
    return 'All'; // 매칭되는 게 없으면 기본값
}

/**
 * 시트의 'participation_level' 문자열을 'WorkType'으로 변환
 * (예: Personal -> Created / 그 외 -> Participated)
 */
const mapWorkType = (level: string): WorkType => {
    if (level.includes('Personal')) return 'Created';
    return 'Participated';
};

/**
 * 유튜브 URL에서 Video ID 추출 (정규식 사용)
 */
const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    // 다양한 유튜브 URL 포맷 지원 (youtu.be, watch?v=, embed 등)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * 썸네일 URL이 없을 경우 유튜브 ID를 기반으로 기본 썸네일 생성
 * 유튜브 링크도 없으면 Unsplash 랜덤 이미지 반환
 */
const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeId(url);
    return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop';
};

// ----------------------------------------------------------------------
// 4. 데이터 페칭 함수 (외부로 export)
// ----------------------------------------------------------------------

/**
 * 프로젝트 목록(Work Items) 가져오기
 * - PapaParse를 사용하여 CSV를 JSON으로 파싱
 * - 데이터 정제(Filtering) 및 매핑(Mapping) 수행
 */
export const fetchWorkItems = async (): Promise<WorkItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true, // URL에서 직접 다운로드
            header: true,   // 첫 번째 줄을 키(Key)로 사용
            complete: (results) => {
                try {
                    const rows = results.data as SheetRow[];

                    const workItems: WorkItem[] = rows
                        // 1. 유효성 검사: ID와 제목이 있고, 숨김 처리되지 않은 항목만 필터링
                        .filter(row => row.id && row.title && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        // 2. 데이터 매핑: Raw 데이터를 앱에서 사용하는 WorkItem 구조로 변환
                        .map(row => ({
                            id: row.id,
                            title: row.title,
                            // 썸네일이 비어있으면 유튜브 썸네일 자동 생성
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

/**
 * 스킬/장비 목록(Skill Items) 가져오기
 * - 별도의 시트(GID)에서 데이터 로드
 * - 정렬 순서(order)에 따라 데이터 정렬
 */
export const fetchSkillsData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_SKILLS_URL, {
            download: true,
            header: true,
            complete: (results) => {
                try {
                    const rows = results.data as SkillSheetRow[];
                    const skills: SkillItem[] = rows
                        // 1. 필수값 체크
                        .filter(row => row.category && row.name) 
                        // 2. 데이터 매핑 및 타입 변환
                        .map(row => ({
                            category: row.category,
                            filter: row.filter,
                            name: row.name,
                            level: parseInt(row.level) || 0, // 숫자로 변환, 실패 시 0
                            order: parseInt(row.order) || 999, // 정렬 순서
                            hidden: row.hidden?.trim().toUpperCase() === 'TRUE'
                        }))
                        // 3. 정렬: order 값이 낮은 순서대로 (오름차순)
                        .sort((a, b) => (a.order || 999) - (b.order || 999));

                    resolve(skills);
                } catch (err) {
                    console.error('Error parsing skills:', err);
                    resolve([]); // 에러 발생 시 빈 배열 반환하여 앱 충돌 방지
                }
            },
            error: (err) => {
                console.error('Fetch error:', err);
                reject(err);
            }
        });
    });
};
