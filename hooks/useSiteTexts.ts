import { useState, useEffect } from 'react';
import { DEFAULT_SITE_TEXTS, SiteTexts } from '../constants/siteTexts';
import { fetchSiteTexts } from '../services/googleSheetService';

// 모듈 레벨 캐시 (useWorkItems.ts 패턴 동일)
let cachedTexts: SiteTexts | null = null;

export const useSiteTexts = () => {
    const [texts, setTexts] = useState<SiteTexts>(cachedTexts || DEFAULT_SITE_TEXTS);
    const [loading, setLoading] = useState<boolean>(!cachedTexts);

    useEffect(() => {
        if (cachedTexts) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const sheetTexts = await fetchSiteTexts();
                const merged = { ...DEFAULT_SITE_TEXTS, ...sheetTexts };
                cachedTexts = merged;
                setTexts(merged);
            } catch (err) {
                console.error('Failed to load site texts:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { texts, loading };
};
