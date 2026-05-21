import { useState, useRef, useCallback } from 'react';

/**
 * 요소가 화면에 나타나는지 감지하는 커스텀 훅
 * - callback ref 패턴: DOM 요소가 연결되는 즉시 observer 시작
 * - 한 번 보이면 계속 visible 유지 (once 동작)
 * - 안전장치: 3초 후에도 감지 안 되면 강제로 visible 처리
 * @param options IntersectionObserver 옵션
 * @returns [callbackRef, isVisible]
 */
export const useIntersectionObserver = (options?: { threshold?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const hasTriggered = useRef(false);
    const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const threshold = options?.threshold ?? 0.1;

    // callback ref: DOM 요소가 마운트/언마운트될 때 자동 호출
    const callbackRef = useCallback((node: HTMLElement | null) => {
        // 이미 트리거됨 → 아무것도 안 함
        if (hasTriggered.current) return;

        // 기존 observer 정리
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        // 기존 fallback 타이머 정리
        if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current);
            fallbackTimer.current = null;
        }

        // 노드가 없으면(언마운트) 여기서 끝
        if (!node) return;

        // 안전장치: 3초 후에도 observer가 감지 못하면 강제 visible
        fallbackTimer.current = setTimeout(() => {
            if (!hasTriggered.current) {
                hasTriggered.current = true;
                setIsVisible(true);
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            }
        }, 3000);

        // IntersectionObserver 생성 및 감시 시작
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggered.current) {
                    hasTriggered.current = true;
                    setIsVisible(true);
                    observerRef.current?.disconnect();
                    // fallback 타이머도 정리
                    if (fallbackTimer.current) {
                        clearTimeout(fallbackTimer.current);
                    }
                }
            },
            { threshold }
        );

        observerRef.current.observe(node);
    }, [threshold]);

    return [callbackRef, isVisible] as const;
};
