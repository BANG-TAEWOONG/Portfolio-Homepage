import { useState, useEffect } from 'react';
import { WorkItem } from '../types';
import { fetchWorkItems } from '../services/googleSheetService';

export const useWorkItems = () => {
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchWorkItems();
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
