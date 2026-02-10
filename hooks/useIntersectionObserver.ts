import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 요소가 화면에 나타나는지 감지하는 커스텀 훅
 * - 한 번 화면에 나타나면 계속 visible 상태를 유지 (once 동작)
 * - 애니메이션 트리거 용도로 최적화
 * @param options IntersectionObserver 옵션 (threshold, root, rootMargin)
 * @returns [ref, isVisible] - 타겟 요소에 연결할 ref, 가시성 상태
 */
export const useIntersectionObserver = (options: IntersectionObserverInit = { threshold: 0.1 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const hasBeenVisible = useRef(false);

    // threshold 값을 안정화 (매 렌더마다 새 객체 생성 방지)
    const threshold = typeof options.threshold === 'number' ? options.threshold : 0.1;

    useEffect(() => {
        // 이미 한 번 보인 적 있으면 observer 연결할 필요 없음
        if (hasBeenVisible.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasBeenVisible.current) {
                hasBeenVisible.current = true;
                setIsVisible(true);
                // 한 번 감지되면 observer 해제 (성능 최적화)
                observer.disconnect();
            }
        }, { threshold });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [threshold]);

    return [ref, isVisible] as const;
};
