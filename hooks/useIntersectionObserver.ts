import { useState, useEffect, useRef } from 'react';

/**
 * 요소가 화면에 나타나는지 감지하는 커스텀 훅
 * @param options IntersectionObserver 옵션 (threshold, root, rootMargin)
 * @returns [ref, isIntersecting] - 타겟 요소에 연결할 ref, 가시성 상태
 */
export const useIntersectionObserver = (options: IntersectionObserverInit = { threshold: 0.1 }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [options.threshold, options.root, options.rootMargin]);

    return [ref, isIntersecting] as const;
};
