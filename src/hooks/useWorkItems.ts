import { useState, useEffect } from 'react';
import { WorkItem } from '../types';
import { fetchWorkItems } from '../services/googleSheetService';

// 모듈 레벨 캐시: 동일 세션 내 중복 API 호출 방지
let cachedItems: WorkItem[] | null = null;

/**
 * 프로젝트(Work Items) 데이터를 비동기로 가져오고 상태를 관리하는 커스텀 훅
 * 캐시가 있으면 즉시 반환하여 불필요한 네트워크 요청을 방지합니다.
 * @returns { items, loading, error } - 데이터 배열, 로딩 상태, 에러 객체
 */
export const useWorkItems = () => {
    const [items, setItems] = useState<WorkItem[]>(cachedItems || []);
    const [loading, setLoading] = useState<boolean>(!cachedItems);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // 캐시가 이미 있으면 추가 페칭 불필요
        if (cachedItems) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchWorkItems();
                cachedItems = data;
                setItems(data);
                setError(null);
            } catch (err) {
                console.error('Failed to load work items:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { items, loading, error };
};