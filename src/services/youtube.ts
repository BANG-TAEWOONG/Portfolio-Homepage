/**
 * YouTube URL 파싱 유틸리티
 * - 다양한 YouTube URL 형식에서 Video ID를 추출
 * - 임베드 URL 변환
 * - 썸네일 URL 생성
 */

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

export const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(YOUTUBE_REGEX);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('embed/')) return url;

    const videoId = getYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

export const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeId(url);
    return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop';
};
