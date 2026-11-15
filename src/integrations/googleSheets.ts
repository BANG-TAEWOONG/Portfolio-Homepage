import Papa from 'papaparse';
import { WorkItem, Category, WorkType, SkillItem, CreditItem } from '../data/types';
import { getYouTubeThumbnail, isVerticalVideoUrl } from './youtubeParser';
import {
    cleanFieldValue,
    extractYear,
    normalizeStillUrl,
    parseProjectStills,
    resolveProjectCredits,
    resolveProjectScopes,
    splitCleanList,
} from './mediaParser';
import { SiteTexts, DEFAULT_SITE_TEXTS } from '../data/siteTexts';

// ----------------------------------------------------------------------
// 1. 구글 시트 설정 및 상수 정의
// ----------------------------------------------------------------------

// 메인 포트폴리오 스프레드시트 (`work`) ID 및 실시간 내보내기 URL
const WORK_SPREADSHEET_ID = '1ui6NN8gESJu5LC5EFGaXXMShPBkgd7_vf30lvLFgAQo';

// '웹에 게시'된 구글 스프레드시트의 CSV 출력 URL (CDN 캐시용 백업)
const GOOGLE_SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub';

// 메인 프로젝트 데이터 (`01_Project`) 실시간 CSV 내보내기 URL + pub 백업 URL
const WORK_PROJECT_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=0`;
const GOOGLE_SHEET_CSV_URL = `${GOOGLE_SHEET_BASE_URL}?output=csv`;

// 스킬/역량 데이터 (`02_Capabilities`) 실시간 내보내기 URL + pub 백업
const SKILL_DB_GID = '865936350';
const WORK_SKILLS_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=${SKILL_DB_GID}`;
const GOOGLE_SHEET_SKILLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${SKILL_DB_GID}&output=csv`;

// Tools 데이터 (`03_Tools`) 실시간 내보내기 URL + pub 백업
const TOOLS_GID = '2121398315';
const WORK_TOOLS_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=${TOOLS_GID}`;
const GOOGLE_SHEET_TOOLS_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${TOOLS_GID}&output=csv`;

// Equipment 데이터 (`04_Equipment`) 실시간 내보내기 URL + pub 백업
const EQUIPMENT_GID = '1277913603';
const WORK_EQUIPMENT_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=${EQUIPMENT_GID}`;
const GOOGLE_SHEET_OLD_EQUIPMENT_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${EQUIPMENT_GID}&output=csv`;

// 사이트 텍스트 시트 GID 및 URL (`work` 시트의 실시간 내보내기 API)
const SITE_TEXTS_GID = '877199329';
const SITE_TEXTS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=${SITE_TEXTS_GID}`;
const SITE_TEXTS_PUB_FALLBACK_URL = `${GOOGLE_SHEET_BASE_URL}?gid=${SITE_TEXTS_GID}&output=csv`;

// 엔드 크레딧 전용 시트 (`05_Credits`) GID 및 URL
const CREDITS_GID = '1077885986';
const GOOGLE_SHEET_CREDITS_URL = `https://docs.google.com/spreadsheets/d/${WORK_SPREADSHEET_ID}/export?format=csv&gid=${CREDITS_GID}`;

// ----------------------------------------------------------------------
// 2. 데이터 인터페이스 (구글 시트 헤더와 1:1 매핑 + 선택적 확장 컬럼 지원)
// ----------------------------------------------------------------------

// 프로젝트 시트의 행 데이터 타입 (Raw Data — 기존 15개 컬럼 + 선택적 확장 컬럼)
type RawSheetRow = Record<string, string | undefined>;

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

// ----------------------------------------------------------------------
// 3. 헬퍼 함수 (데이터 변환 및 유틸리티)
// ----------------------------------------------------------------------

/**
 * 대소문자 및 공백/하이픈 차이를 무시하고 유연한 헤더 별칭(Alias)에서 값을 읽음
 */
const normalizeHeaderKey = (key: string): string =>
    key.trim().toLowerCase().replace(/[\s-]+/g, '_');

const buildNormalizedRow = (row: RawSheetRow): Record<string, string> => {
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'string') {
            normalized[normalizeHeaderKey(k)] = v;
        }
    }
    return normalized;
};

const pickCol = (normRow: Record<string, string>, aliases: string[]): string => {
    for (const alias of aliases) {
        const val = normRow[normalizeHeaderKey(alias)];
        if (val !== undefined && val.trim() !== '') {
            return val.trim();
        }
    }
    return '';
};

/**
 * 시트의 'project_type' 문자열을 앱 내부 'Category' 타입으로 변환 (시트의 카테고리명 원본 유지)
 */
function mapCategory(type: string): Category {
    if (!type) return 'Other';
    return type.trim();
}

/**
 * 시트의 'participation_level' 문자열을 'WorkType'으로 변환
 * (예: Personal -> Created / 그 외 -> Participated)
 */
const mapWorkType = (level: string): WorkType => {
    if (level && level.includes('Personal')) return 'Created';
    return 'Participated';
};

/**
 * vertical / orientation / aspect_ratio 컬럼 값 우선 파싱 (명시되지 않은 경우 undefined 반환)
 */
const parseExplicitVerticalFlag = (rawValue: string): boolean | undefined => {
    const trimmed = rawValue.trim();
    if (!trimmed) return undefined;
    const upper = trimmed.toUpperCase();

    if (
        upper === 'TRUE' ||
        upper === 'YES' ||
        upper === '1' ||
        upper === 'VERTICAL' ||
        upper === 'PORTRAIT' ||
        upper.includes('9:16') ||
        trimmed.includes('세로')
    ) {
        return true;
    }

    if (
        upper === 'FALSE' ||
        upper === 'NO' ||
        upper === '0' ||
        upper === 'HORIZONTAL' ||
        upper === 'LANDSCAPE' ||
        upper.includes('16:9') ||
        upper.includes('4:3') ||
        upper.includes('2.35:1') ||
        trimmed.includes('가로')
    ) {
        return false;
    }

    return undefined;
};

/**
 * explicit vertical 값이 있으면 우선 적용하고, 비어 있으면 video_url 기반 휴리스틱으로 초기 판단
 */
const resolveVerticalFlag = (verticalRaw: string, videoUrl: string): boolean => {
    const explicit = parseExplicitVerticalFlag(verticalRaw);
    if (explicit !== undefined) return explicit;
    return isVerticalVideoUrl(videoUrl);
};

const addCacheBuster = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
};

const INLINE_CREDIT_COLUMNS: { role: string; aliases: string[] }[] = [
    { role: 'Directed by', aliases: ['credit_director', 'credit_directed_by'] },
    { role: 'Executive Producer', aliases: ['credit_ep', 'credit_executive_producer'] },
    { role: 'Producer', aliases: ['credit_pd', 'credit_producer'] },
    { role: 'Assistant Director', aliases: ['credit_ad', 'credit_assistant_director'] },
    { role: 'Director of Photography', aliases: ['credit_dop', 'credit_dp'] },
    { role: 'Camera Team', aliases: ['credit_cam', 'credit_camera'] },
    { role: 'Gaffer', aliases: ['credit_gaffer', 'credit_lighting'] },
    { role: 'Art Direction', aliases: ['credit_art', 'credit_art_director'] },
    { role: 'Edited by', aliases: ['credit_edit', 'credit_editor'] },
    { role: 'Colorist', aliases: ['credit_color', 'credit_colorist'] },
    { role: 'VFX & Compositing', aliases: ['credit_vfx'] },
    { role: 'Sound', aliases: ['credit_sound'] },
];

/**
 * `05_Credits` 전용 시트에서 프로젝트 ID별 실명 크레딧 목록 로드
 */
const fetchCreditsSheetMap = (): Promise<Record<string, CreditItem[]>> => {
    return new Promise((resolve) => {
        Papa.parse(addCacheBuster(GOOGLE_SHEET_CREDITS_URL), {
            download: true,
            header: true,
            transformHeader: (h: string) => h.trim(),
            complete: (results) => {
                try {
                    const rows = results.data as RawSheetRow[];
                    const map: Record<string, CreditItem[]> = {};
                    for (const raw of rows) {
                        const row = buildNormalizedRow(raw);
                        const hidden = pickCol(row, ['hidden']).toUpperCase() === 'TRUE';
                        if (hidden) continue;
                        const pid = pickCol(row, ['project_id', 'id', 'work_id']);
                        const role = cleanFieldValue(pickCol(row, ['role', 'credit_role']));
                        const name = cleanFieldValue(pickCol(row, ['name', 'credit_name', 'person', 'staff']), true);
                        if (!pid || !role || !name) continue;
                        if (!map[pid]) map[pid] = [];
                        map[pid].push({ role, name });
                    }
                    resolve(map);
                } catch {
                    resolve({});
                }
            },
            error: () => {
                resolve({});
            },
        });
    });
};

// ----------------------------------------------------------------------
// 4. 데이터 페칭 함수 (외부로 export)
// ----------------------------------------------------------------------

/**
 * 프로젝트 목록(Work Items) 가져오기
 * - 기존 15개 구글 시트 컬럼 100% 호환 유지
 * - `05_Credits` 시트 및 선택적 신규 케이스 스터디 컬럼 하이브리드 파싱 지원
 */
export const fetchWorkItems = async (): Promise<WorkItem[]> => {
    const creditsSheetMap = await fetchCreditsSheetMap();

    const parseWorkCsvFromUrl = (url: string): Promise<WorkItem[] | null> =>
        new Promise((resolve) => {
            Papa.parse(addCacheBuster(url), {
                download: true, // URL에서 직접 다운로드
                header: true,   // 첫 번째 줄을 키(Key)로 사용
                transformHeader: (h: string) => h.trim(), // CSV 헤더 공백 제거
                complete: (results) => {
                    try {
                        const rawRows = results.data as RawSheetRow[];

                        const parsedItems: WorkItem[] = rawRows
                            .map((raw) => buildNormalizedRow(raw))
                            // 1. 유효성 검사: ID와 제목이 있고, 숨김 처리되지 않은 항목만 필터링
                            .filter((row) => {
                                const id = pickCol(row, ['id']);
                                const title = pickCol(row, ['title']);
                                const hidden = pickCol(row, ['hidden']);
                                return Boolean(id && title && hidden.toUpperCase() !== 'TRUE');
                            })
                            // 2. 데이터 매핑: Raw 데이터를 앱에서 사용하는 WorkItem 구조로 변환
                            .map((row) => {
                                const id = pickCol(row, ['id']);
                                const title = pickCol(row, ['title']);
                                const date = pickCol(row, ['date', 'release_date']);
                                const participationLevel = pickCol(row, ['participation_level']);
                                const projectType = pickCol(row, ['project_type', 'category']);
                                const rawClient = pickCol(row, ['client']);
                                const rawArtist = pickCol(row, ['artist']);
                                const runningTime = cleanFieldValue(pickCol(row, ['running_time', 'duration']));
                                const contributionRate = cleanFieldValue(pickCol(row, ['contribution_rate']));
                                const rawMyRole = pickCol(row, ['my_role', 'role']);
                                const rawUseTools = pickCol(row, ['use_tools', 'tools']);
                                const rawSetUp = pickCol(row, ['set_up', 'setup', 'equipment']);
                                const videoUrl = pickCol(row, ['video_url']);
                                const rawDescription = pickCol(row, ['description', 'overview', 'story']);

                                // 선택적 확장 컬럼 (유연한 별칭 대소문자 무관 매칭)
                                const rawPinned = pickCol(row, ['pinned', 'is_pinned', 'featured', 'pin']).toUpperCase();
                                const pinned = rawPinned === 'TRUE' || rawPinned === 'YES' || rawPinned === '1';
                                const rawVertical = pickCol(row, ['vertical', 'is_vertical', 'orientation', 'aspect_ratio', 'aspect']);
                                const explicitVertical = parseExplicitVerticalFlag(rawVertical);
                                const rawIndustry = cleanFieldValue(pickCol(row, ['industry']));
                                const rawMedium = cleanFieldValue(pickCol(row, ['medium']));
                                const explicitPre = pickCol(row, ['role_pre', 'pre', 'scope_pre', 'pre_production']);
                                const explicitProd = pickCol(row, ['role_prod', 'production', 'scope_prod', 'prod']);
                                const explicitPost = pickCol(row, ['role_post', 'post', 'scope_post', 'post_production']);
                                const rawStills = pickCol(row, ['stills', 'still_urls', 'images', 'scene_stills']);
                                const rawCredits = pickCol(row, ['credits', 'credit']);
                                const rawThumbnail = pickCol(row, ['thumbnail', 'thumbnail_url', 'poster']);
                                const rawPreviewUrl = pickCol(row, ['preview_url', 'preview_video', 'teaser_url', 'loop_url']);
                                const rawFocalPoint = cleanFieldValue(pickCol(row, ['crop_position', 'focal_point', 'object_position', 'focus']));

                                const workType = mapWorkType(participationLevel);
                                const cleanedRoleList = splitCleanList(rawMyRole, true);
                                const cleanedSetupList = splitCleanList(rawSetUp, false);
                                const cleanedToolsList = splitCleanList(rawUseTools, false);

                                const { scopePre, scopeProd, scopePost } = resolveProjectScopes({
                                    explicitPre,
                                    explicitProd,
                                    explicitPost,
                                    myRole: rawMyRole,
                                });
                                const hasExplicitScopes = Boolean(
                                    explicitPre.trim() || explicitProd.trim() || explicitPost.trim()
                                );

                                const stills = parseProjectStills(rawStills, videoUrl, id);

                                // 인라인 structured `credit_*` 컬럼 확인
                                const inlineStructuredCredits: CreditItem[] = [];
                                for (const colDef of INLINE_CREDIT_COLUMNS) {
                                    const val = cleanFieldValue(pickCol(row, colDef.aliases), true);
                                    if (val) {
                                        inlineStructuredCredits.push({ role: colDef.role, name: val });
                                    }
                                }

                                const sheetTabCredits = creditsSheetMap[id] || [];
                                let credits: CreditItem[];
                                if (sheetTabCredits.length > 0) {
                                    credits = [...sheetTabCredits];
                                } else if (inlineStructuredCredits.length > 0 && !rawCredits) {
                                    credits = [...inlineStructuredCredits];
                                } else if (cleanFieldValue(rawCredits, true)) {
                                    credits = resolveProjectCredits({
                                        explicitCredits: rawCredits,
                                        client: rawClient,
                                        artist: rawArtist,
                                        myRole: rawMyRole,
                                        contributionRate,
                                        runningTime,
                                        releaseDate: date,
                                        participationType: workType,
                                    });
                                } else {
                                    credits = [];
                                }

                                const explicitYear = cleanFieldValue(pickCol(row, ['year']));
                                const year = explicitYear || extractYear(date);
                                const resolvedThumbnail =
                                    normalizeStillUrl(rawThumbnail, videoUrl) ||
                                    getYouTubeThumbnail(videoUrl);

                                return {
                                    id,
                                    title,
                                    thumbnail: resolvedThumbnail,
                                    videoUrl,
                                    previewUrl: cleanFieldValue(rawPreviewUrl) || undefined,
                                    category: mapCategory(projectType),
                                    type: workType,
                                    runningTime,
                                    releaseDate: date,
                                    role: cleanedRoleList.join(', '),
                                    setup: cleanedSetupList.join(', '),
                                    description: cleanFieldValue(rawDescription),
                                    contributionRate: contributionRate || undefined,
                                    pinned: pinned || undefined,
                                    vertical: resolveVerticalFlag(rawVertical, videoUrl),
                                    explicitVertical,
                                    client: cleanFieldValue(rawClient) || undefined,
                                    artist: cleanFieldValue(rawArtist) || undefined,
                                    industry: rawIndustry || undefined,
                                    medium: rawMedium || undefined,
                                    year: year || undefined,
                                    tools: cleanedToolsList.join(', ') || undefined,
                                    focalPoint: rawFocalPoint || undefined,
                                    scopePre,
                                    scopeProd,
                                    scopePost,
                                    hasExplicitScopes,
                                    stills,
                                    credits,
                                };
                            });

                        // 대표작(`pinned = TRUE`) 상단 우선 배치 (기존 시트 행 순서 유지)
                        const sorted = [
                            ...parsedItems.filter((item) => item.pinned),
                            ...parsedItems.filter((item) => !item.pinned),
                        ];
                        resolve(sorted);
                    } catch (err) {
                        console.error('Error parsing work items:', err);
                        resolve(null);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (work items):', err);
                    resolve(null);
                }
            });
        });

    const primary = await parseWorkCsvFromUrl(WORK_PROJECT_EXPORT_URL);
    if (primary && primary.length > 0) return primary;

    const fallback = await parseWorkCsvFromUrl(GOOGLE_SHEET_CSV_URL);
    return fallback || [];
};

/**
 * 스킬/역량 목록(Skill Items) 가져오기 (`02_Capabilities`)
 * - level > 0 && hidden !== TRUE 항목만 로드 (실시간 export 우선 -> pub 백업)
 */
export const fetchSkillsData = async (): Promise<SkillItem[]> => {
    const parseSkillsFromUrl = (url: string): Promise<SkillItem[] | null> =>
        new Promise((resolve) => {
            Papa.parse(addCacheBuster(url), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as SkillSheetRow[];
                        const skills: SkillItem[] = rows
                            .filter((row) => {
                                const lvl = parseInt(row.level, 10) || 0;
                                return Boolean(
                                    row.skill_name &&
                                    row.skill_name.trim() &&
                                    (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE') &&
                                    lvl > 0
                                );
                            })
                            .map((row) => ({
                                category: 'Capabilities',
                                filter: row.group,
                                name: row.skill_name,
                                level: parseInt(row.level, 10) || 0,
                                hidden: false,
                            }));
                        resolve(skills);
                    } catch (err) {
                        console.error('Error parsing skills:', err);
                        resolve(null);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (skills):', err);
                    resolve(null);
                },
            });
        });

    const primary = await parseSkillsFromUrl(WORK_SKILLS_EXPORT_URL);
    if (primary && primary.length > 0) return primary;

    const fallback = await parseSkillsFromUrl(GOOGLE_SHEET_SKILLS_URL);
    return fallback || [];
};

/**
 * Tools 목록 가져오기 (`03_Tools`)
 * - level > 0 && hidden !== TRUE 항목만 로드 (실시간 export 우선 -> pub 백업)
 */
export const fetchToolsData = async (): Promise<SkillItem[]> => {
    const parseToolsFromUrl = (url: string): Promise<SkillItem[] | null> =>
        new Promise((resolve) => {
            Papa.parse(addCacheBuster(url), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as ToolSheetRow[];
                        const tools: SkillItem[] = rows
                            .filter((row) => {
                                const lvl = parseInt(row.level, 10) || 0;
                                return Boolean(
                                    row.tool_name &&
                                    row.tool_name.trim() &&
                                    (!row.hidden || row.hidden.trim().toUpperCase() !== 'TRUE') &&
                                    lvl > 0
                                );
                            })
                            .map((row) => ({
                                category: 'Tools',
                                filter: row.group,
                                name: row.tool_name,
                                level: parseInt(row.level, 10) || 0,
                                hidden: false,
                            }));
                        resolve(tools);
                    } catch (err) {
                        console.error('Error parsing tools:', err);
                        resolve(null);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (tools):', err);
                    resolve(null);
                },
            });
        });

    const primary = await parseToolsFromUrl(WORK_TOOLS_EXPORT_URL);
    if (primary && primary.length > 0) return primary;

    const fallback = await parseToolsFromUrl(GOOGLE_SHEET_TOOLS_URL);
    return fallback || [];
};

/**
 * Equipment 목록 가져오기 (`04_Equipment` 단일 마스터 소스)
 * - 주력 대표 제품군(`level > 0`)만 표시 (실시간 export 우선 -> pub 백업)
 */
export const fetchEquipmentData = async (): Promise<SkillItem[]> => {
    const parseEquipmentFromUrl = (url: string): Promise<SkillItem[] | null> =>
        new Promise((resolve) => {
            Papa.parse(addCacheBuster(url), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as any[];
                        const items: SkillItem[] = rows
                            .filter((row) => {
                                const name = row.name || '';
                                const hidden = row.hidden?.trim().toUpperCase() === 'TRUE';
                                const lvl = parseInt(row.level, 10) || 0;
                                return Boolean(name && !hidden && lvl > 0);
                            })
                            .map((row) => {
                                const brand = row.brand?.trim() || '';
                                const model = row.name?.trim() || '';
                                const displayName =
                                    !brand ||
                                    model.startsWith(brand) ||
                                    model === 'Mobile Cinema Rig'
                                        ? model
                                        : `${brand} ${model}`;

                                const grp = row.group?.trim() || '';
                                let filter = 'Accessories';
                                if (grp === 'Camera' || grp === 'Lens' || grp === 'Drone') {
                                    filter = 'Camera';
                                } else if (grp === 'Lighting') {
                                    filter = 'Lighting';
                                } else if (grp === 'Gimbal' || grp === 'Tripod' || grp === 'Movement') {
                                    filter = 'Stabilizer & Rigs';
                                }

                                const lvl = parseInt(row.level, 10) || 0;
                                const remark = row.remark?.trim() || '';

                                return {
                                    category: 'Equipment',
                                    filter,
                                    name: displayName.trim(),
                                    level: lvl,
                                    hidden: false,
                                    brand,
                                    model,
                                    description: remark,
                                    keyComponents: '',
                                    quantity: 1,
                                    condition: '',
                                    remark,
                                    owned: remark.includes('보유') || lvl >= 5,
                                };
                            });
                        resolve(items);
                    } catch (err) {
                        console.error('Error parsing equipment data:', err);
                        resolve(null);
                    }
                },
                error: (err) => {
                    console.error('Fetch error (equipment data):', err);
                    resolve(null);
                },
            });
        });

    const primary = await parseEquipmentFromUrl(WORK_EQUIPMENT_EXPORT_URL);
    if (primary && primary.length > 0) return primary;

    const fallback = await parseEquipmentFromUrl(GOOGLE_SHEET_OLD_EQUIPMENT_URL);
    return fallback || [];
};


// ----------------------------------------------------------------------
// 사이트 텍스트 시트 행 타입 (key | value)
// ----------------------------------------------------------------------
interface SiteTextRow {
    key: string;
    value: string;
}

/**
 * 사이트 텍스트 가져오기 (Google Sheets CMS)
 * - key/value 2열 구조의 CSV를 SiteTexts 객체로 변환
 * - \n 문자열을 실제 줄바꿈으로 치환
 */
export const fetchSiteTexts = async (): Promise<Partial<SiteTexts>> => {
    const parseSiteTextsFromUrl = (url: string): Promise<Partial<SiteTexts> | null> =>
        new Promise((resolve) => {
            Papa.parse(addCacheBuster(url), {
                download: true,
                header: true,
                transformHeader: (h: string) => h.trim(),
                complete: (results) => {
                    try {
                        const rows = results.data as SiteTextRow[];
                        const validKeys = Object.keys(DEFAULT_SITE_TEXTS);
                        const texts: Partial<SiteTexts> = {};

                        for (const row of rows) {
                            const key = row.key?.trim();
                            if (key && validKeys.includes(key) && row.value != null) {
                                (texts as Record<string, string>)[key] = row.value.replace(/\\n/g, '\n');
                            }
                        }

                        resolve(texts);
                    } catch {
                        resolve(null);
                    }
                },
                error: () => {
                    resolve(null);
                },
            });
        });

    const primary = await parseSiteTextsFromUrl(SITE_TEXTS_SHEET_URL);
    if (primary) return primary;

    const fallback = await parseSiteTextsFromUrl(SITE_TEXTS_PUB_FALLBACK_URL);
    return fallback || {};
};
