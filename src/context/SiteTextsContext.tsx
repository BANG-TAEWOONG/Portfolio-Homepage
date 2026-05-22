import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_SITE_TEXTS, SiteTexts } from '../siteTexts';
import { fetchSiteTexts } from '../services/googleSheetService';

export interface SiteTextsContextType {
    texts: SiteTexts;
    loading: boolean;
    isEditMode: boolean;
    setIsEditMode: (mode: boolean) => void;
    pendingChanges: Partial<Record<keyof SiteTexts, string>>;
    updateText: (key: keyof SiteTexts, value: string) => void;
    saveChanges: () => Promise<boolean>;
    discardChanges: () => void;
    hasChanges: boolean;
    isSaving: boolean;
    scriptUrl: string;
    setScriptUrl: (url: string) => void;
}

export const SiteTextsContext = createContext<SiteTextsContextType>({
    texts: DEFAULT_SITE_TEXTS,
    loading: true,
    isEditMode: false,
    setIsEditMode: () => {},
    pendingChanges: {},
    updateText: () => {},
    saveChanges: async () => false,
    discardChanges: () => {},
    hasChanges: false,
    isSaving: false,
    scriptUrl: '',
    setScriptUrl: () => {},
});

export const SiteTextsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [originalTexts, setOriginalTexts] = useState<SiteTexts>(DEFAULT_SITE_TEXTS);
    const [texts, setTexts] = useState<SiteTexts>(DEFAULT_SITE_TEXTS);
    const [loading, setLoading] = useState<boolean>(true);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [pendingChanges, setPendingChanges] = useState<Partial<Record<keyof SiteTexts, string>>>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Google Apps Script URL (우선 localStorage, 없으면 env)
    const [scriptUrl, setScriptUrlState] = useState<string>(() => {
        return localStorage.getItem('vite_google_script_url') || import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
    });

    const setScriptUrl = useCallback((url: string) => {
        setScriptUrlState(url);
        if (url) {
            localStorage.setItem('vite_google_script_url', url);
        } else {
            localStorage.removeItem('vite_google_script_url');
        }
    }, []);

    // 초기 데이터 로딩
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const sheetTexts = await fetchSiteTexts();
                const merged = { ...DEFAULT_SITE_TEXTS, ...sheetTexts };
                setOriginalTexts(merged);
                setTexts(merged);
            } catch (err) {
                console.error('Failed to load site texts inside Context:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 텍스트 임시 수정
    const updateText = useCallback((key: keyof SiteTexts, value: string) => {
        setTexts((prev) => ({
            ...prev,
            [key]: value,
        }));
        setPendingChanges((prev) => {
            const updated = { ...prev, [key]: value };
            // 만약 원본 값과 같아지면 대기 중인 변경 목록에서 제거
            if (originalTexts[key] === value) {
                delete updated[key];
            }
            return updated;
        });
    }, [originalTexts]);

    // 임시 변경 사항 취소
    const discardChanges = useCallback(() => {
        setTexts(originalTexts);
        setPendingChanges({});
    }, [originalTexts]);

    // 구글 시트에 변경사항 저장 (Apps Script POST API)
    const saveChanges = useCallback(async (): Promise<boolean> => {
        const changedKeys = Object.keys(pendingChanges) as (keyof SiteTexts)[];
        if (changedKeys.length === 0) return true;

        if (!scriptUrl) {
            alert('구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다.\n우측 상단 관리자 아이콘을 눌러 URL을 먼저 등록해주세요.');
            return false;
        }

        setIsSaving(true);
        try {
            // 변경 데이터 포맷 구성 (Google Sheet 갱신용 API 호출 규격)
            const payload = changedKeys.map((key) => ({
                key: key,
                value: pendingChanges[key],
            }));

            // Google Apps Script Web App은 CORS 제한 우회를 위해 Content-Type: text/plain을 사용하는 것이 유리함
            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // no-cors 모드는 응답을 직접 읽지 못하지만 요청은 전송됨 (Apps Script의 특수성 고려)
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(payload),
            });

            // mode: 'no-cors' 상태이므로 response.ok나 status를 읽을 수 없음 (항상 0 또는 opaque)
            // 따라서 예외가 발생하지 않으면 성공한 것으로 간주하고 처리함.
            // (구글 스프레드시트가 실제 갱신되는 데 시간이 소요될 수 있으므로 화면 데이터를 최신 원본으로 승격)
            
            // 약간의 딜레이를 주어 실제 전송 완료된 느낌 구현
            await new Promise((r) => setTimeout(r, 1000));

            const updatedTexts = { ...texts };
            setOriginalTexts(updatedTexts);
            setPendingChanges({});
            setIsSaving(false);
            return true;
        } catch (err) {
            console.error('Failed to save site texts:', err);
            alert('구글 시트 저장 중 오류가 발생했습니다. Apps Script URL 및 권한을 확인해주세요.');
            setIsSaving(false);
            return false;
        }
    }, [pendingChanges, scriptUrl, texts]);

    const hasChanges = useMemo(() => Object.keys(pendingChanges).length > 0, [pendingChanges]);

    const value = useMemo(() => ({
        texts,
        loading,
        isEditMode,
        setIsEditMode,
        pendingChanges,
        updateText,
        saveChanges,
        discardChanges,
        hasChanges,
        isSaving,
        scriptUrl,
        setScriptUrl,
    }), [texts, loading, isEditMode, pendingChanges, updateText, saveChanges, discardChanges, hasChanges, isSaving, scriptUrl, setScriptUrl]);

    return (
        <SiteTextsContext.Provider value={value}>
            {children}
        </SiteTextsContext.Provider>
    );
};
