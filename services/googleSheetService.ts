import Papa from 'papaparse';
import { WorkItem, Category, WorkType, SkillItem } from '../types';
import { getYouTubeId, getYouTubeThumbnail } from '../utils/youtube';

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

// Tools 데이터가 있는 시트의 GID
const TOOLS_GID = '2121398315';
const GOOGLE_SHEET_TOOLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${TOOLS_GID}&output=csv`;

// Equipment 데이터가 있는 시트의 GID
const EQUIPMENT_GID = '1277913603';
const GOOGLE_SHEET_EQUIPMENT_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${EQUIPMENT_GID}&output=csv`;

// ----------------------------------------------------------------------
// 2. 데이터 인터페이스 (구글 시트 헤더와 1:1 매핑)
// ----------------------------------------------------------------------

// 프로젝트 시트의 행 데이터 타입 (Raw Data)
interface SheetRow {
    id: string;
    date: string;
    hidden: string;
    participation_level: string;
    project_type: string;
    client: string;
    artist: string;
    running_time: string;
    title: string;
    contribution_rate: string;
    my_role: string;
    use_tools: string;
    set_up: string;
    video_url: string;
    description: string;
}

// 스킬(Capabilities) 시트의 행 데이터 타입 (Raw Data)
// 실제 시트 컬럼: id, hidden, source_table, group, skill_name, level, remark
interface SkillSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    skill_name: string;
    level: string;
    remark?: string;
}

// Tools 시트의 행 데이터 타입 (Raw Data)
interface ToolSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    vendor: string;
    tool_name: string;
    level: string;
    remark: string;
}

// Equipment 시트의 행 데이터 타입 (Raw Data)
interface EquipmentSheetRow {
    id: string;
    hidden: string;
    source_table: string;
    group: string;
    brand: string;
    name: string;
    level: string;
    remark: string;
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
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
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
                            // 썸네일 컬럼 삭제됨 -> 유튜브 썸네일 항상 자동 생성
                            thumbnail: getYouTubeThumbnail(row.video_url),
                            videoUrl: row.video_url,
                            category: mapCategory(row.project_type),
                            type: mapWorkType(row.participation_level),
                            runningTime: row.running_time,
                            releaseDate: row.date,
                            role: row.my_role, // role -> my_role
                            setup: row.set_up, // setup -> set_up
                            description: row.description,
                            contributionRate: row.contribution_rate // 추가됨
                        }));

                    resolve(workItems);
                } catch (err) {
                    console.error('Error parsing work items:', err);
                    resolve([]);
                }
            },
            error: (err) => {
                console.error('Fetch error (work items):', err);
                resolve([]);
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
    return new Promise((resolve) => {
        Papa.parse(GOOGLE_SHEET_SKILLS_URL, {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as SkillSheetRow[];
                    const skills: SkillItem[] = rows
                        // 1. 필수값 체크: skill_name 존재 + hidden이 아닌 것
                        .filter(row => row.skill_name && row.skill_name.trim() && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        // 2. 데이터 매핑: 시트 컬럼 → 앱 내부 SkillItem 구조
                        .map(row => ({
                            category: 'Capabilities',      // source_table 대신 고정값 사용
                            filter: row.group,              // group → filter
                            name: row.skill_name,           // skill_name → name
                            level: parseInt(row.level, 10) || 0,
                            hidden: false                   // 이미 필터링 완료
                        }));

                    resolve(skills);
                } catch (err) {
                    console.error('Error parsing skills:', err);
                    resolve([]); // 에러 발생 시 빈 배열 반환하여 앱 충돌 방지
                }
            },
            error: (err) => {
                console.error('Fetch error (skills):', err);
                resolve([]); // reject 대신 resolve([])로 변경 — 다른 fetch 실패 방지
            }
        });
    });
};

/**
 * Tools 목록 가져오기
 * - group -> filter, tool_name -> name 매핑
 * - category: 'Tools'
 */
export const fetchToolsData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_TOOLS_URL, {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as ToolSheetRow[];
                    const tools: SkillItem[] = rows
                        .filter(row => row.tool_name && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE'))
                        .map(row => ({
                            category: 'Tools',
                            filter: row.group,
                            name: row.tool_name,
                            level: parseInt(row.level, 10) || 0,
                            hidden: false
                        }));
                    resolve(tools);
                } catch (err) {
                    console.error('Error parsing tools:', err);
                    resolve([]);
                }
            },
            error: (err) => {
                console.error('Fetch error (tools):', err);
                resolve([]);
            }
        });
    });
};

/**
 * Equipment 목록 가져오기
 * - group -> filter 매핑
 * - category: 'Equipment'
 * - level > 0 필터링 (핵심 비즈니스 로직)
 */
export const fetchEquipmentData = async (): Promise<SkillItem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_EQUIPMENT_URL, {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
            complete: (results) => {
                try {
                    const rows = results.data as EquipmentSheetRow[];
                    const equipment: SkillItem[] = rows
                        .filter(row => {
                            // hidden 처리된 항목만 제외 (level 필터 제거 — 시트에서 hidden으로 관리)
                            return row.name && (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE');
                        })
                        .map(row => ({
                            category: 'Equipment',
                            filter: row.group,
                            name: row.name,
                            level: parseInt(row.level, 10) || 0,
                            hidden: false
                        }));
                    resolve(equipment);
                } catch (err) {
                    console.error('Error parsing equipment:', err);
                    resolve([]);
                }
            },
            error: (err) => {
                console.error('Fetch error (equipment):', err);
                resolve([]);
            }
        });
    });
};