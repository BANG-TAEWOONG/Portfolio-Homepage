import { WorkItem } from '../data/types';
import { CURATED_PROJECT_STILLS } from '../data/curatedStills';
import {
  LOCAL_FULL_VIDEO_WORK_IDS,
  LOCAL_PREVIEW_WORK_IDS,
} from '../data/localMediaManifest';
import {
  cleanFieldValue,
  extractYear,
  formatToolsPipeline,
  getStillFallbackUrl,
  normalizeRoleTypos,
  resolveProjectScopes,
  splitCleanList,
  summarizeSetupForProse,
} from '../integrations/mediaParser';
import {
  getInstagramId,
  getVideoPlatform,
  getYouTubeId,
  isVerticalVideoUrl,
} from '../integrations/youtubeParser';

/**
 * Legacy Unsplash concert-crowd stock URL returned by youtubeParser fallback.
 * Explicitly blocked so missing/external thumbnails always render the monochrome studio slate.
 */
const LEGACY_UNSPLASH_CONCERT_FRAGMENT = '1492684223066-81342ee5ff30';

/**
 * Resolves whether a WorkItem is vertical (9:16 Reels / Shorts) or horizontal (16:9).
 * Priority:
 * 1. Explicit in-page UI override (`workOrientationOverrides`)
 * 2. Explicit Google Sheet `vertical` / `orientation` column (`explicitVertical`)
 * 3. Runtime loaded thumbnail aspect measurement (`naturalWidth` vs `naturalHeight`)
 * 4. URL/heuristic fallback (`item.vertical` / `isVerticalVideoUrl`)
 */
export const isWorkItemVertical = (
  item: WorkItem,
  override?: 'horizontal' | 'vertical',
  detectedAspect?: 'horizontal' | 'vertical'
): boolean => {
  if (override === 'horizontal') return false;
  if (override === 'vertical') return true;
  if (typeof item.explicitVertical === 'boolean') return item.explicitVertical;
  const isYtShort = /youtube\.com\/shorts\/|\/shorts\//i.test(item.videoUrl || '');
  if (isYtShort) return true;
  if (detectedAspect === 'horizontal') return false;
  if (detectedAspect === 'vertical') return true;
  return Boolean(item.vertical ?? isVerticalVideoUrl(item.videoUrl));
};

/**
 * Detects empty URLs or generic stock placeholder URLs that should never be displayed.
 */
export const isPlaceholderStockThumbnail = (url?: string | null): boolean => {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  return trimmed.includes(LEGACY_UNSPLASH_CONCERT_FRAGMENT);
};

/**
 * Detects YouTube's 120x90 gray missing-thumbnail placeholder image.
 */
export const isYouTubePlaceholderDimension = (
  naturalWidth: number,
  naturalHeight: number
): boolean => {
  return naturalWidth > 0 && naturalWidth <= 120 && naturalHeight <= 90;
};

/**
 * Builds an ordered, deduplicated list of real thumbnail URLs to try before
 * falling back to the monochrome typographic studio slate:
 * 1. Local verified Instagram thumbnail cache (`/thumbnails/ig_<id>.jpg`) ahead of external `instagram.com/.../media`
 *    (which Instagram serves with `Cross-Origin-Resource-Policy: same-origin` blocking `<img>`)
 * 2. Explicit/primary non-Instagram thumbnail (unless stock placeholder)
 * 3. YouTube `maxresdefault.jpg` -> `hqdefault.jpg` -> `mqdefault.jpg` fallback chain
 * 4. Google Drive `lh3.googleusercontent.com` CDN mirror fallback
 */
export const buildThumbnailCandidates = (
  item: Pick<WorkItem, 'thumbnail' | 'videoUrl'> & { id?: string }
): string[] => {
  const candidates: string[] = [];
  const pushCandidate = (url?: string | null) => {
    if (!url || isPlaceholderStockThumbnail(url)) return;
    const trimmed = url.trim();
    if (trimmed && !candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  const rawThumb = (item.thumbnail || '').trim();
  const isInstagramRedirectThumb = /https?:\/\/(?:www\.)?instagram\.com\/p\/[^/]+\/media/i.test(rawThumb);
  const instaId =
    getInstagramId(item.videoUrl || '') || getInstagramId(rawThumb);
  const isFilePreview =
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('local_preview.html');

  // If explicit thumbnail is NOT Instagram's blocked `/media` endpoint, try it first
  if (!isInstagramRedirectThumb) {
    pushCandidate(rawThumb);
  }

  // Prefer local static thumbnail caches before external Instagram redirect URL
  if (instaId) {
    if (isFilePreview) {
      pushCandidate(`/public/thumbnails/ig_${instaId}.jpg`);
      pushCandidate(`/thumbnails/ig_${instaId}.jpg`);
    } else {
      pushCandidate(`/thumbnails/ig_${instaId}.jpg`);
      pushCandidate(`/public/thumbnails/ig_${instaId}.jpg`);
    }
  }

  // Fallback to curated sharp still frame when thumbnail cache isn't built yet
  const curatedFirstStill = item.id ? CURATED_PROJECT_STILLS[item.id]?.[0] : undefined;
  if (curatedFirstStill) {
    if (isFilePreview && curatedFirstStill.startsWith('/stills/')) {
      pushCandidate(`/public${curatedFirstStill}`);
      pushCandidate(curatedFirstStill);
    } else {
      pushCandidate(curatedFirstStill);
      if (curatedFirstStill.startsWith('/stills/')) {
        pushCandidate(`/public${curatedFirstStill}`);
      }
    }
  }

  if (isInstagramRedirectThumb) {
    pushCandidate(rawThumb);
  }

  // Google Drive secondary CDN fallback if thumbnail is a Drive link
  if (rawThumb && !isPlaceholderStockThumbnail(rawThumb)) {
    const driveFallback = getStillFallbackUrl(rawThumb);
    pushCandidate(driveFallback);
  }

  // Extract YouTube ID from videoUrl or thumbnail URL
  const ytIdFromVideo = getYouTubeId(item.videoUrl || '');
  const ytMatchFromThumb = rawThumb.match(
    /https?:\/\/(?:i\.ytimg|img\.youtube)\.com\/vi\/([A-Za-z0-9_-]{11})\//i
  );
  const ytId = ytIdFromVideo || (ytMatchFromThumb ? ytMatchFromThumb[1] : null);

  if (ytId) {
    // Ensure maxresdefault -> hqdefault -> mqdefault fallback order
    if (candidates.length === 0) {
      pushCandidate(`https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`);
    }
    pushCandidate(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`);
    pushCandidate(`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`);
  }

  return candidates;
};

/**
 * Extracts a clean 4-digit release year from `item.year` or `item.releaseDate`.
 */
export const getWorkYear = (item: WorkItem): string => {
  const explicit = cleanFieldValue(item.year);
  if (explicit) {
    const match = explicit.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : explicit;
  }
  const fromDate = extractYear(cleanFieldValue(item.releaseDate));
  return fromDate || cleanFieldValue(item.releaseDate);
};

/**
 * Formats the exact release date (e.g. `2026. 11. 05`) for the top Metadata bar's `Release Date` column.
 */
export const getWorkReleaseDate = (item: WorkItem): string => {
  const rawDate = cleanFieldValue(item.releaseDate);
  if (rawDate) {
    const parts = rawDate.match(/^((?:19|20)\d{2})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?/);
    if (parts) {
      const y = parts[1];
      const m = parts[2].padStart(2, '0');
      const d = parts[3] ? parts[3].padStart(2, '0') : '';
      return d ? `${y}. ${m}. ${d}` : `${y}. ${m}`;
    }
    return rawDate;
  }
  return getWorkYear(item) || '—';
};

/**
 * Builds a silent muted loop preview source.
 * Priority:
 * 1. Explicit `previewUrl` or direct `.mp4` `videoUrl`
 * 2. Verified extracted local highlight MP4 (`/previews/<id>.mp4`)
 * 3. Clean YouTube fallback teaser (for newly-added future rows)
 */
export const getMutedPreviewEmbedUrl = (
  item: Pick<WorkItem, 'videoUrl' | 'previewUrl'> & { id?: string }
): {
  kind: 'mp4' | 'youtube' | 'vimeo' | 'none';
  src: string;
} => {
  const directCandidate = cleanFieldValue(item.previewUrl) || cleanFieldValue(item.videoUrl);
  if (directCandidate && /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(directCandidate)) {
    return { kind: 'mp4', src: directCandidate };
  }

  if (item.id && LOCAL_PREVIEW_WORK_IDS.has(item.id)) {
    const isFilePreview =
      typeof window !== 'undefined' &&
      window.location.pathname.endsWith('local_preview.html');
    return {
      kind: 'mp4',
      src: isFilePreview ? `/public/previews/${item.id}.mp4` : `/previews/${item.id}.mp4`,
    };
  }

  const ytId = getYouTubeId(item.videoUrl || '');
  if (ytId) {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      disablekb: '1',
      start: '6',
    });
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/embed/${ytId}?${params.toString()}`,
    };
  }

  return { kind: 'none', src: '' };
};

/**
 * Resolves the clean playable full video URL for the modal `WATCH` stage.
 * Uses local same-origin `.mp4` (`/videos/<id>.mp4`) for Instagram works so `MinimalScrubPlayer`
 * plays pure cinema footage without Instagram web chrome, while keeping `item.videoUrl` untouched
 * for external `"Watch on Instagram ↗"` links.
 */
export const getModalPlayableVideoUrl = (
  item: Pick<WorkItem, 'id' | 'videoUrl'>
): string => {
  const rawUrl = cleanFieldValue(item.videoUrl);
  if (rawUrl && /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(rawUrl)) {
    return rawUrl;
  }
  if (item.id && LOCAL_FULL_VIDEO_WORK_IDS.has(item.id)) {
    const isFilePreview =
      typeof window !== 'undefined' &&
      window.location.pathname.endsWith('local_preview.html');
    return isFilePreview ? `/public/videos/${item.id}.mp4` : `/videos/${item.id}.mp4`;
  }
  return item.videoUrl;
};

/**
 * Returns the single primary artist or client name for compact inside-card badges.
 */
export const getPrimaryEntityLabel = (item: WorkItem): string => {
  const artist = cleanFieldValue(item.artist);
  const client = cleanFieldValue(item.client);
  return artist || client;
};

/**
 * Returns full Client / Artist display string for Case Study metadata and Archive List rows.
 */
export const getClientArtistDisplay = (item: WorkItem): string => {
  const client = cleanFieldValue(item.client);
  const artist = cleanFieldValue(item.artist);
  if (client && artist && client.toLowerCase() !== artist.toLowerCase()) {
    return `${client} · ${artist}`;
  }
  return artist || client;
};

/**
 * Builds the inside-card bottom-right monospace metadata label matching `wowtapes.com`:
 * - Horizontal (`16:9`): `Client · Artist • Category` (or `Category • Year` when no artist/client)
 * - Vertical (`9:16`): `Instagram • Reel` / `YouTube • Short` / `Category • 9:16`
 */
export const getInsideCardMeta = (item: WorkItem, isVertical: boolean): string => {
  if (isVertical) {
    const platform = getVideoPlatform(item.videoUrl);
    if (platform === 'instagram') return 'Instagram • Reel';
    if (platform === 'youtube') return 'YouTube • Short';
    return `${cleanFieldValue(item.category) || 'Vertical'} • 9:16`;
  }

  const entity = getClientArtistDisplay(item);
  const category = cleanFieldValue(item.category) || 'Film';
  const year = getWorkYear(item);

  if (entity) {
    return `${entity} • ${category}`;
  }
  if (year) {
    return `${category} • ${year}`;
  }
  return category;
};

/**
 * Builds the `Role & Category` column text for Full Archive `LIST` view (e.g. `Director • Official MV`).
 */
export const getListRoleAndCategory = (item: WorkItem): string => {
  const roles = splitCleanList(item.role, true);
  const primaryRole =
    roles[0] || (item.type === 'Created' ? 'Director' : 'Crew');
  const category = cleanFieldValue(item.category) || 'Film';
  return `${primaryRole} • ${category}`;
};

/**
 * Returns custom Google Sheet `description` if entered; otherwise synthesizes a strictly factual,
 * understated Korean studio archive note from the project's real Google Sheet columns.
 */
export const resolveEditorialDescription = (item: WorkItem): string => {
  const explicit = cleanFieldValue(item.description);
  if (explicit) return explicit;

  const year = getWorkYear(item);
  const entity = getClientArtistDisplay(item);
  const category = cleanFieldValue(item.category) || '영상';
  const roles = splitCleanList(item.role, true);
  const roleText = roles.join(', ');
  const setup = summarizeSetupForProse(item.setup);
  const tools = formatToolsPipeline(item.tools).join(', ');

  const yearPrefix = year ? `${year}년 공개된 ` : '';
  const entityPrefix = entity ? `${entity}의 ` : '';

  if (item.type === 'Created') {
    let scopePhrase = '';
    if (setup && tools) {
      scopePhrase = `${setup} 기반의 프로덕션과 ${tools} 후반 작업까지 `;
    } else if (setup) {
      scopePhrase = `${setup} 기반의 프로덕션 등 `;
    } else if (tools) {
      scopePhrase = `${tools} 후반 작업을 포함해 `;
    }

    if (roleText) {
      return `${yearPrefix}${entityPrefix}${category} 프로젝트 「${item.title}」. ${roleText} 파트를 전담하여 ${scopePhrase}전 과정을 디렉팅했습니다.`;
    }
    return `${yearPrefix}${entityPrefix}${category} 프로젝트 「${item.title}」. ${scopePhrase}프로덕션 전 과정을 디렉팅했습니다.`;
  }

  // Participated (Crew Participation)
  const baseSentence = roleText
    ? `${yearPrefix}${entityPrefix}${category} 프로젝트 「${item.title}」에 ${normalizeRoleTypos(roleText)} 파트로 참여했습니다.`
    : `${yearPrefix}${entityPrefix}${category} 프로젝트 「${item.title}」 프로덕션에 참여했습니다.`;

  if (setup && tools) {
    return `${baseSentence} ${setup} 운용 및 ${tools} 후반 공정을 함께 수행했습니다.`;
  }
  if (setup) {
    return `${baseSentence} 현장에서 ${setup} 운용을 담당했습니다.`;
  }
  if (tools) {
    return `${baseSentence} 후반 공정에서 ${tools} 작업을 담당했습니다.`;
  }
  return baseSentence;
};

export interface CaseStudyStageColumn {
  label: 'Pre' | 'Production' | 'Post';
  items: string[];
}

/**
 * Resolves the 3-column `HOW I WORKED` (`Pre | Production | Post`) stages.
 * Never collapses below 3 columns:
 * - For 100% Personal (`Created`) works where `Pre` was left implicit, includes `Concept & Planning` / `Direction`.
 * - Empty crew stages remain `items: []` so the UI renders a muted `—` under that column's hairline.
 */
export const resolveCaseStudyStages = (item: WorkItem): CaseStudyStageColumn[] => {
  let pre = item.scopePre ? [...item.scopePre] : [];
  let prod = item.scopeProd ? [...item.scopeProd] : [];
  let post = item.scopePost ? [...item.scopePost] : [];

  if (pre.length === 0 && prod.length === 0 && post.length === 0) {
    const resolved = resolveProjectScopes({
      myRole: item.role,
    });
    pre = [...resolved.scopePre];
    prod = [...resolved.scopeProd];
    post = [...resolved.scopePost];
  }

  const cleanContribution = cleanFieldValue(item.contributionRate);
  if (
    !item.hasExplicitScopes &&
    item.type === 'Created' &&
    cleanContribution === '100%' &&
    pre.length === 0
  ) {
    pre = ['Concept & Treatment', 'Script & Storyboard'];
  }

  return [
    { label: 'Pre', items: pre },
    { label: 'Production', items: prod },
    { label: 'Post', items: post },
  ];
};
