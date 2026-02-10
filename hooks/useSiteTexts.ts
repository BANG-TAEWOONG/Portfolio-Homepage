import { useState, useEffect } from 'react';
import { DEFAULT_SITE_TEXTS, SiteTexts } from '../constants/siteTexts';

const STORAGE_KEY = 'portfolio_site_texts';

export const useSiteTexts = () => {
    const [texts, setTexts] = useState<SiteTexts>(DEFAULT_SITE_TEXTS);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setTexts({ ...DEFAULT_SITE_TEXTS, ...JSON.parse(saved) });
            } catch (e) {
                console.error('Failed to parse site texts', e);
            }
        }
    }, []);

    // Save function
    const saveTexts = (newTexts: SiteTexts) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTexts));
        setTexts(newTexts);
        // Trigger custom event for cross-component updates if needed, 
        // or just rely on mount for other components (simplest for now).
        // For real-time updates across the app without reload, context is better, 
        // but for this simple admin requirement, this hook usage in Admin is enough.
        // However, other components need to listen to changes or fetch on mount.
        // If Admin changes it, other components won't know until reload if they only read on mount.
        // Let's add a simple window event dispatch to notify others.
        window.dispatchEvent(new Event('site-texts-updated'));
    };

    // Listen for updates from other instances of the hook (e.g. Admin saves, Contact updates)
    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setTexts({ ...DEFAULT_SITE_TEXTS, ...JSON.parse(saved) });
            }
        };

        window.addEventListener('site-texts-updated', handleUpdate);
        return () => window.removeEventListener('site-texts-updated', handleUpdate);
    }, []);

    return { texts, saveTexts };
};
