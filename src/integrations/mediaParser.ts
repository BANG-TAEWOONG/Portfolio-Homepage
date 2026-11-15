import { CreditItem } from '../data/types';
import { CURATED_PROJECT_STILLS } from '../data/curatedStills';
import { getYouTubeId } from './youtubeParser';

const EMPTY_SENTINEL_REGEX = /^(해당\s*없음|없음|n\/a|na|none|null|-|—)$/i;

/**
 * 값이 실질적으로 의미 있는 텍스트인지 판별 ("해당없음", "-", 빈 문자열 등 제외)
 */
export const isMeaningfulValue = (value?: string | null): boolean => {
    if (!value) return false;
    const cleaned = value.replace(/"/g, '').trim();
    if (!cleaned) return false;
    return !EMPTY_SENTINEL_REGEX.test(cleaned);
};

/**
 * 시트 내 역할/크레딧 오타 정규화
 * - "Colorlist" -> "Colorist"
 * - "Graffer" -> "Gaffer"
 */
export const normalizeRoleTypos = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/colorlist/gi, 'Colorist')
        .replace(/graffer/gi, 'Gaffer');
};

/**
 * 단일 텍스트 필드 정제 ("해당없음" 필터링 및 따옴표 제거)
 */
export const cleanFieldValue = (raw?: string | null, normalizeRoles = false): string => {
    if (!isMeaningfulValue(raw)) return '';
    const cleaned = (raw || '').replace(/"/g, '').trim();
    return normalizeRoles ? normalizeRoleTypos(cleaned) : cleaned;
};

/**
 * 줄바꿈, 세미콜론, 콤마로 구분된 리스트를 깔끔한 배열로 분리 및 중복 제거
 */
export const splitCleanList = (raw?: string | null, normalizeRoles = true): string[] => {
    if (!isMeaningfulValue(raw)) return [];
    const tokens = (raw || '')
        .replace(/"/g, '')
        .split(/[\r\n;,]+/)
        .map((item) => {
            const trimmed = item.trim();
            return normalizeRoles ? normalizeRoleTypos(trimmed) : trimmed;
        })
        .filter((item) => isMeaningfulValue(item));

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const token of tokens) {
        const key = token.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(token);
        }
    }
    return unique;
};

/**
 * 날짜 문자열(예: "2026. 11. 5")에서 4자리 연도("2026") 추출
 */
export const extractYear = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const match = dateStr.match(/((?:19|20)\d{2})/);
    return match ? match[1] : '';
};

/**
 * Google Drive 공유 링크에서 파일 ID 추출
 * 지원 포맷:
 * - https://drive.google.com/file/d/<ID>/view?usp=sharing
 * - https://drive.google.com/open?id=<ID>
 * - https://drive.google.com/uc?id=<ID>&export=view
 * - https://drive.google.com/thumbnail?id=<ID>&sz=w2000
 * - https://lh3.googleusercontent.com/d/<ID>=w2000
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();

    if (!/drive\.google\.com|googleusercontent\.com/i.test(trimmed)) {
        return null;
    }

    const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    if (filePathMatch) return filePathMatch[1];

    const googleUserContentMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/);
    if (googleUserContentMatch) return googleUserContentMatch[1];

    const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (queryIdMatch) return queryIdMatch[1];

    return null;
};

/**
 * 단일 스틸 이미지 URL 변환기 (Google Drive 공유 링크 -> 고해상도 썸네일 엔드포인트 자동 변환)
 */
export const normalizeStillUrl = (rawUrl: string, videoUrl?: string): string | null => {
    if (!isMeaningfulValue(rawUrl)) return null;
    const trimmed = rawUrl.replace(/"/g, '').trim();

    // yt:1, yt:2, yt:3 단축 문법 지원
    const ytShortMatch = trimmed.match(/^yt:([123])$/i);
    if (ytShortMatch && videoUrl) {
        const ytId = getYouTubeId(videoUrl);
        if (ytId) {
            return `https://i.ytimg.com/vi/${ytId}/maxres${ytShortMatch[1]}.jpg`;
        }
        return null;
    }

    // Google Drive 링크 변환
    const driveId = extractGoogleDriveFileId(trimmed);
    if (driveId) {
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;
    }

    return trimmed;
};

/**
 * 스틸 이미지 로드 실패(onError) 또는 YouTube 120x90 플레이스홀더 감지 시 사용할 폴백 URL 반환
 * - 로컬 `/stills/<id>_<slot>.jpg` -> `/public/stills/<id>_<slot>.jpg` -> YouTube `maxres<slot>.jpg`
 * - Google Drive thumbnail -> lh3.googleusercontent.com/d/<ID>=w2000
 * - YouTube maxres1~3.jpg -> hq1~3.jpg
 * - 더 이상 대체할 URL이 없으면 null 반환 (프레임 숨김 처리)
 */
export const getStillFallbackUrl = (url: string, videoUrl?: string): string | null => {
    if (!url) return null;

    // 0. 로컬 추출 스틸 폴백 (`/stills/...` <-> `/public/stills/...` -> YouTube maxres1~3)
    const localMatch = url.match(/^\/(public\/)?stills\/(.+)_([123])\.jpg$/i);
    if (localMatch) {
        if (!localMatch[1]) {
            return `/public/stills/${localMatch[2]}_${localMatch[3]}.jpg`;
        }
        const ytId = getYouTubeId(videoUrl || '');
        if (ytId) {
            return `https://i.ytimg.com/vi/${ytId}/maxres${localMatch[3]}.jpg`;
        }
        return null;
    }

    // 1. Google Drive thumbnail -> lh3 CDN 폴백
    if (/drive\.google\.com\/thumbnail/i.test(url)) {
        const driveId = extractGoogleDriveFileId(url);
        if (driveId) {
            return `https://lh3.googleusercontent.com/d/${driveId}=w2000`;
        }
    }

    // 2. YouTube maxres1~3.jpg -> hq1~3.jpg 폴백
    const ytSceneMatch = url.match(/https?:\/\/(?:i\.ytimg|img\.youtube)\.com\/vi\/([^/]+)\/maxres([123])\.jpg/i);
    if (ytSceneMatch) {
        return `https://i.ytimg.com/vi/${ytSceneMatch[1]}/hq${ytSceneMatch[2]}.jpg`;
    }

    // 3. YouTube maxresdefault.jpg -> hqdefault.jpg 폴백
    const ytDefaultMatch = url.match(/https?:\/\/(?:i\.ytimg|img\.youtube)\.com\/vi\/([^/]+)\/maxresdefault\.jpg/i);
    if (ytDefaultMatch) {
        return `https://i.ytimg.com/vi/${ytDefaultMatch[1]}/hqdefault.jpg`;
    }

    return null;
};

/**
 * 프로젝트 스틸컷 URL 리스트 생성
 * - 시트에 스틸 컬럼이 채워져 있으면 파싱 및 Google Drive 변환 수행 (최우선)
 * - 비어 있으면 모션블러 없이 추출·검수된 로컬 스틸컷(`CURATED_PROJECT_STILLS`) 우선 사용
 * - 해당 ID가 없고 YouTube 영상인 경우 maxres1.jpg, maxres2.jpg, maxres3.jpg 자동 생성
 * - 비어 있고 Instagram 등 외부 플랫폼인 경우 빈 배열 반환 (섹션 자동 숨김)
 */
export const parseProjectStills = (
    rawStills?: string | null,
    videoUrl?: string,
    projectId?: string
): string[] => {
    if (isMeaningfulValue(rawStills)) {
        const rawTokens = (rawStills || '')
            .replace(/"/g, '')
            .split(/[\r\n;,]+/)
            .map((t) => t.trim())
            .filter(Boolean);

        const resolved = rawTokens
            .map((token) => normalizeStillUrl(token, videoUrl))
            .filter((u): u is string => Boolean(u));

        if (resolved.length > 0) {
            return Array.from(new Set(resolved));
        }
    }

    if (projectId && CURATED_PROJECT_STILLS[projectId]?.length) {
        const isFilePreview =
            typeof window !== 'undefined' &&
            window.location.pathname.endsWith('local_preview.html');
        return CURATED_PROJECT_STILLS[projectId].map((u) =>
            isFilePreview && u.startsWith('/stills/') ? `/public${u}` : u
        );
    }

    const ytId = getYouTubeId(videoUrl || '');
    if (ytId) {
        return [
            `https://i.ytimg.com/vi/${ytId}/maxres1.jpg`,
            `https://i.ytimg.com/vi/${ytId}/maxres2.jpg`,
            `https://i.ytimg.com/vi/${ytId}/maxres3.jpg`,
        ];
    }

    return [];
};

/**
 * 단일 역할 문자열을 Pre / Production / Post 단계로 자동 분류
 */
const classifySingleRole = (roleItem: string): 'pre' | 'prod' | 'post' => {
    const r = roleItem.trim();

    // 0. 현장 크루/동시녹음 팀은 Sound Design보다 먼저 Production으로 분류
    if (/(?:\bsound\s*team\b|\bboom\b|동시녹음)/i.test(r)) {
        return 'prod';
    }

    // 1. Post-Production 키워드 검사
    if (
        /(?:\beditor\b|\bediting\b|\bcolorist\b|\bcolor\s*grading\b|\bvfx\b|\b2d\b|\b3d\b|\bcgi\b|sound\s*design|\bmixing\b|\bdi\b|\bcompositing\b|\bmotion\b|편집|색보정|합성|믹싱|모션|보정)/i.test(
            r
        )
    ) {
        return 'post';
    }

    // 2. Pre-Production 키워드 검사
    if (
        /(?:executive\s*producer|\bproducer\b|assistant\s*producer|\bep\b|\bpd\b|\bap\b|\(ep\)|\(pd\)|\(ap\)|assistant\s*pd|production\s*management|art\s*director|art\s*assistant|location|scheduling|call\s*sheet|performance\s*director|\bconcept\b|treatment|storyboard|pre-?viz|\bscript\b|\bplanning\b|기획|구성|섭외|로케이션|스토리보드|각본)/i.test(
            r
        )
    ) {
        return 'pre';
    }

    // 3. Production 키워드 검사 (Director, Assistant Director, DOP, Camera Team, Lighting Team, Art Team 등)
    if (
        /(?:^director$|^co-director$|director\s*of\s*photography|\bdop\b|\bdp\b|assistant\s*director|\bcamera\b|\bb-?\s*cam\b|\ba\s*cam\b|1st\s*ac|2nd\s*ac|focus\s*puller|\bgaffer\b|lighting\s*team|art\s*team|\bdancer\b|\bshooting\b|\blighting\b|\bgrip\b|연출|감독|촬영|조명|조연출|댄서)/i.test(
            r
        )
    ) {
        return 'prod';
    }

    // 기본값: 현장 프로덕션 크루 역할로 배치
    return 'prod';
};

export interface ScopeResolutionInput {
    explicitPre?: string | null;
    explicitProd?: string | null;
    explicitPost?: string | null;
    myRole?: string | null;
    setUp?: string | null;
    useTools?: string | null;
}

export interface ProjectScopes {
    scopePre: string[];
    scopeProd: string[];
    scopePost: string[];
}

const pushUnique = (target: string[], items: string[]) => {
    const existing = new Set(target.map((t) => t.toLowerCase()));
    for (const item of items) {
        const key = item.toLowerCase();
        if (!existing.has(key)) {
            existing.add(key);
            target.push(item);
        }
    }
};

/**
 * 하이브리드 Pre / Production / Post 분류 엔진 (순수 역할 및 명시적 단계 컬럼 전용)
 * - 시트에 명시적 scope_pre / scope_prod / scope_post 중 하나라도 입력되어 있으면 해당 값 우선 사용
 * - 모두 비어 있는 경우 `my_role`만 Pre / Production / Post로 자동 분류 (장비나 소프트웨어는 절대 포함하지 않음)
 */
export const resolveProjectScopes = ({
    explicitPre,
    explicitProd,
    explicitPost,
    myRole,
}: ScopeResolutionInput): ProjectScopes => {
    const preExplicitList = splitCleanList(explicitPre, true);
    const prodExplicitList = splitCleanList(explicitProd, true);
    const postExplicitList = splitCleanList(explicitPost, true);

    if (preExplicitList.length > 0 || prodExplicitList.length > 0 || postExplicitList.length > 0) {
        return {
            scopePre: preExplicitList,
            scopeProd: prodExplicitList,
            scopePost: postExplicitList,
        };
    }

    const scopePre: string[] = [];
    const scopeProd: string[] = [];
    const scopePost: string[] = [];

    const roleItems = splitCleanList(myRole, true);
    for (const item of roleItems) {
        if (/1st\s*assistant\s*director|\b1st\s*ad\b/i.test(item)) {
            pushUnique(scopePre, ['Scheduling & Call Sheet']);
            pushUnique(scopeProd, ['On-Set AD']);
            continue;
        }
        const bucket = classifySingleRole(item);
        if (bucket === 'pre') pushUnique(scopePre, [item]);
        else if (bucket === 'prod') pushUnique(scopeProd, [item]);
        else pushUnique(scopePost, [item]);
    }

    return { scopePre, scopeProd, scopePost };
};

export interface CreditsResolutionInput {
    explicitCredits?: string | null;
    client?: string | null;
    artist?: string | null;
    myRole?: string | null;
    contributionRate?: string | null;
    setUp?: string | null;
    useTools?: string | null;
    runningTime?: string | null;
    releaseDate?: string | null;
    participationType?: 'Created' | 'Participated';
    studioLabel?: string;
}

const NON_FILM_TOOL_REGEX = /^(excel|power\s*point|microsoft\s*(excel|powerpoint|word)|word|autocad|envato\s*ai)$/i;

/**
 * `use_tools` 문자열에서 비영상 오피스 툴을 제외하고 DaVinci Resolve 모듈을 압축 표기
 */
export const formatToolsPipeline = (rawTools?: string | null): string[] => {
    const tokens = splitCleanList(rawTools, false).filter((t) => !NON_FILM_TOOL_REGEX.test(t.trim()));
    if (tokens.length === 0) return [];

    let hasResolveBase = false;
    let hasFusion = false;
    let hasFairlight = false;
    const extras: string[] = [];

    for (const token of tokens) {
        const lower = token.trim().toLowerCase();
        if (lower === 'davinci resolve' || lower === 'davinci resolve studio') {
            hasResolveBase = true;
        } else if (lower === 'davinci resolve - fusion' || lower === 'davinci fusion' || lower === 'fusion') {
            hasFusion = true;
        } else if (lower === 'davinci resolve - fairlight' || lower === 'davinci fairlight' || lower === 'fairlight') {
            hasFairlight = true;
        } else if (lower === 'klingai' || lower === 'kling ai') {
            pushUnique(extras, ['Kling AI']);
        } else if (lower === 'runway gen-2' || lower === 'runway') {
            pushUnique(extras, ['Runway']);
        } else {
            pushUnique(extras, [token.trim()]);
        }
    }

    const formatted: string[] = [];
    if (hasResolveBase) {
        if (hasFusion || hasFairlight) {
            const modules = ['Edit', 'Color'];
            if (hasFusion) modules.push('Fusion');
            if (hasFairlight) modules.push('Fairlight');
            formatted.push(`DaVinci Resolve Studio (${modules.join(' · ')})`);
        } else {
            formatted.push('DaVinci Resolve Studio');
        }
    } else {
        if (hasFusion) formatted.push('DaVinci Fusion');
        if (hasFairlight) formatted.push('DaVinci Fairlight');
    }

    pushUnique(formatted, extras);
    return formatted;
};

const normalizeGearToken = (raw: string): string => {
    const t = raw.trim();
    const lower = t.toLowerCase();
    if (lower === 'fx3' || lower === 'sony ilme-fx3') return 'Sony FX3';
    if (lower === 'a7s3' || lower === 'a7s iii' || lower === 'sony a7s iii') return 'Sony A7S III';
    if (lower === 'a7c2' || lower === 'a7c ii' || lower === 'sony a7c ii') return 'Sony A7C II';
    if (lower === 'mobile' || lower === 'mobile cinema rig') return 'Mobile Cinema Rig';
    if (lower === 'rs 4' || lower === 'rs4' || lower === 'dji rs 4') return 'DJI RS 4';
    if (lower === 'fe 16-35mm f/2.8 gm ii' || lower === 'sony fe 16-35mm gm ii') return 'Sony FE 16-35mm GM II';
    if (lower === 'fe 24-70mm f/2.8 gm ii' || lower === 'sony fe 24-70mm gm ii') return 'Sony FE 24-70mm GM II';
    if (lower === 'fe 70-200mm f/2.8 gm ii' || lower === 'sony fe 70-200mm gm ii') return 'Sony FE 70-200mm GM II';
    return t;
};

/**
 * `set_up` 장비 문자열을 시네마 엔드크레딧 섹션(`Camera`, `Optics`, `Movement & Support`, `Lighting`)으로 분리·압축
 */
export const groupEquipmentCredits = (rawSetup?: string | null): CreditItem[] => {
    const tokens = splitCleanList(rawSetup, false).map(normalizeGearToken);
    if (tokens.length === 0) return [];

    const cameras: string[] = [];
    const optics: string[] = [];
    const movement: string[] = [];
    const lighting: string[] = [];

    for (const item of tokens) {
        if (/sony\s*(fx|a7|a1|venice|burano)|mobile\s*cinema\s*rig|\bcamera\b|alexa|red\s|komodo|blackmagic\s*(pyxis|pocket|ursa)|lumix|eos\s*[rc]/i.test(item)) {
            pushUnique(cameras, [item]);
        } else if (/aputure|nanlite|arri\s*skypanel|orbiter|godox|astera|quasar|light\s*storm|forza|pavo|lighting/i.test(item)) {
            pushUnique(lighting, [item]);
        } else if (/rs\s*4|\bgimbal\b|mavic|inspire|drone|sachtler|manfrotto|tripod|crane|float/i.test(item)) {
            pushUnique(movement, [item]);
        } else if (/\bgm\b|\bg\s*master\b|\bmm\b|\blens\b|\bprime\b|\bzoom\b|samyang|sigma|zeiss|dzofilm|laowa|sirui|\bfe\s+\d/i.test(item)) {
            pushUnique(optics, [item]);
        } else {
            pushUnique(movement, [item]);
        }
    }

    // Sony FE GM II 줌 렌즈군 2종 이상 사용 시 한 줄 압축 표기
    const gmZoomRanges: string[] = [];
    const otherOptics: string[] = [];
    for (const lens of optics) {
        const gmMatch = lens.match(/^Sony\s+FE\s+(16-35|24-70|70-200)mm.*GM\s*II$/i);
        if (gmMatch) {
            gmZoomRanges.push(gmMatch[1].replace('-', '–'));
        } else {
            otherOptics.push(lens);
        }
    }

    const formattedOptics: string[] = [];
    if (gmZoomRanges.length >= 2) {
        const orderMap: Record<string, number> = { '16–35': 1, '24–70': 2, '70–200': 3 };
        gmZoomRanges.sort((a, b) => (orderMap[a] || 99) - (orderMap[b] || 99));
        formattedOptics.push(`Sony FE ${gmZoomRanges.join(' · ')}mm GM II`);
        pushUnique(formattedOptics, otherOptics);
    } else {
        pushUnique(formattedOptics, optics);
    }

    const result: CreditItem[] = [];
    if (cameras.length > 0) result.push({ role: 'Camera', name: cameras.join(', ') });
    if (formattedOptics.length > 0) result.push({ role: 'Optics', name: formattedOptics.join(', ') });
    if (movement.length > 0) result.push({ role: 'Movement & Support', name: movement.join(', ') });
    if (lighting.length > 0) result.push({ role: 'Lighting', name: lighting.join(', ') });
    return result;
};

/**
 * 작품 소개 본문 자동 합성용 간결한 카메라/패키지 요약 문자열 생성
 */
export const summarizeSetupForProse = (rawSetup?: string | null): string => {
    const grouped = groupEquipmentCredits(rawSetup);
    if (grouped.length === 0) return '';
    const cameraEntry = grouped.find((g) => g.role === 'Camera');
    if (cameraEntry) {
        const primaryCam = cameraEntry.name.split(',')[0].trim();
        const hasPackage = grouped.some((g) => g.role === 'Optics' || g.role === 'Movement & Support' || g.role === 'Lighting');
        if (/mobile\s*cinema\s*rig/i.test(primaryCam) && !hasPackage) {
            return '모바일 시네마 리그';
        }
        return hasPackage ? `${primaryCam} 시네마 패키지` : primaryCam;
    }
    return grouped[0].name;
};

const mapRoleToFilmCreditTitle = (roleItem: string): string | null => {
    const r = roleItem.trim();
    if (!r) return null;
    if (/director\s*of\s*photography|\bdop\b|\bdp\b|촬영감독/i.test(r)) return 'Director of Photography';
    if (/1st\s*assistant\s*director|\b1st\s*ad\b|조연출/i.test(r)) return '1st Assistant Director';
    if (/assistant\s*director\s*team|assistant\s*director|연출팀/i.test(r)) return 'Assistant Director';
    if (/performance\s*director/i.test(r)) return 'Performance Director';
    if (/\bart\s*team\b|art\s*assistant/i.test(r)) return 'Art Team';
    if (/art\s*director|미술감독/i.test(r)) return 'Art Director';
    if (/^director$|^co-director$|^연출$|^감독$/i.test(r)) return 'Directed by';
    if (/executive\s*producer|\bep\b|\(ep\)/i.test(r)) return 'Executive Producer';
    if (/assistant\s*pd|assistant\s*producer|producer\s*assistant|\bap\b|\(ap\)/i.test(r)) return 'Assistant Producer';
    if (/\bproducer\b|\bpd\b|\(pd\)/i.test(r)) return 'Producer';
    if (/\bb-?\s*cam\b/i.test(r)) return 'B-Cam Operator';
    if (/\bcamera\s*team\b/i.test(r)) return 'Camera Team';
    if (/camera\s*operator|\ba\s*cam\b|1st\s*ac|2nd\s*ac|camera\s*assistant|촬영/i.test(r)) {
        return r;
    }
    if (/gaffer\s*assistant|lighting\s*team|조명팀/i.test(r)) return 'Lighting Team';
    if (/\bgaffer\b|조명감독|조명/i.test(r)) return 'Gaffer';
    if (/\beditor\b|\bediting\b|편집/i.test(r)) return 'Edited by';
    if (/\bcolorist\b|color\s*grading|색보정/i.test(r)) return 'Colorist';
    if (/\bvfx\b|\bcgi\b|\b2d\b|\b3d\b|compositing|합성/i.test(r)) return 'VFX & Compositing';
    if (/\bsound\s*team\b/i.test(r)) return 'Sound Team';
    if (/\bsound\b|붐|동시녹음|믹싱/i.test(r)) return 'Sound';
    return r;
};

/**
 * 하이브리드 진짜 영화/영상 엔드 크레딧(CREDITS) 파서 및 자동 생성기
 * - 상단 메타데이터(Release Date, Running Time, Format)와 중복되는 항목은 배제!
 * - `credits` 컬럼이 채워져 있으면 `Directed by: 홍길동` / `DOP - 김철수` 라인을 그대로 파싱
 * - 비어 있으면 Production House, Artist, Client, 담당 파트 크레딧 및 분리된 Camera/Optics/Movement/Post Suite 구성
 */
export const resolveProjectCredits = ({
    explicitCredits,
    client,
    artist,
    myRole,
    contributionRate,
    participationType = 'Created',
    studioLabel = 'TWOONG STUDIO',
}: CreditsResolutionInput): CreditItem[] => {
    if (isMeaningfulValue(explicitCredits)) {
        const lines = (explicitCredits || '')
            .replace(/"/g, '')
            .split(/[\r\n;]+/)
            .map((l) => l.trim())
            .filter((l) => isMeaningfulValue(l));

        const parsed: CreditItem[] = [];
        for (const line of lines) {
            const sepMatch = line.match(/^([^:—\-]+?)\s*(?::|—|\s-\s)\s*(.+)$/);
            if (sepMatch) {
                const role = sepMatch[1].trim();
                const name = normalizeRoleTypos(sepMatch[2].trim());
                if (role && isMeaningfulValue(name)) {
                    parsed.push({ role, name });
                }
            } else {
                parsed.push({ role: 'Credit', name: normalizeRoleTypos(line) });
            }
        }
        if (parsed.length > 0) return parsed;
    }

    const credits: CreditItem[] = [];

    if (participationType === 'Created') {
        credits.push({ role: 'Production', name: studioLabel });
    }

    const cleanArtist = cleanFieldValue(artist);
    const cleanClient = cleanFieldValue(client);

    if (cleanArtist) {
        credits.push({ role: 'Artist / Talent', name: cleanArtist });
    }
    if (cleanClient && cleanClient.toLowerCase() !== cleanArtist.toLowerCase()) {
        credits.push({ role: 'Client / Label', name: cleanClient });
    }

    const roleItems = splitCleanList(myRole, true);
    const cleanContribution = cleanFieldValue(contributionRate);
    const creditEntity = cleanContribution && cleanContribution !== '100%'
        ? `${studioLabel} (${cleanContribution})`
        : studioLabel;

    const usedTitles = new Set<string>();
    for (const rawRole of roleItems) {
        const creditTitle = mapRoleToFilmCreditTitle(rawRole);
        if (!creditTitle) continue;
        const key = creditTitle.toLowerCase();
        if (!usedTitles.has(key)) {
            usedTitles.add(key);
            credits.push({ role: creditTitle, name: creditEntity });
        }
    }

    if (roleItems.length === 0 && participationType === 'Participated') {
        credits.push({ role: 'Crew Participation', name: creditEntity });
    }

    return credits;
};

/**
 * Formats a running time string using prime/double-prime notation (`M' SS"`).
 * Converts e.g. `9:13` -> `9' 13"`, `0:33` -> `0' 33"`, `1:05:20` -> `65' 20"`.
 */
export const formatRunningTimePrime = (raw?: string | null): string => {
    const clean = cleanFieldValue(raw);
    if (!clean) return '';

    if (/['′″"]/.test(clean)) {
        return clean
            .replace(/′/g, "'")
            .replace(/″/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const hmsMatch = clean.match(/^(\d{1,2})\s*:\s*(\d{1,2})\s*:\s*(\d{1,2})$/);
    if (hmsMatch) {
        const hours = Number(hmsMatch[1]);
        const mins = Number(hmsMatch[2]);
        const secs = hmsMatch[3].padStart(2, '0');
        return `${hours * 60 + mins}' ${secs}"`;
    }

    const msMatch = clean.match(/^(\d{1,3})\s*:\s*(\d{1,2})$/);
    if (msMatch) {
        const mins = Number(msMatch[1]);
        const secs = msMatch[2].padStart(2, '0');
        return `${mins}' ${secs}"`;
    }

    return clean;
};
