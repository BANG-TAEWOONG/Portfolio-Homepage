import { useState, useRef, useCallback, useEffect } from 'react';

export interface ScrollRevealOptions {
  /** Minimum fraction in viewport to count as visible (default: 0.04) */
  threshold?: number;
  /** Lock visible permanently after first reveal? Default: false for bidirectional scroll-down & scroll-up! */
  once?: boolean;
  /** Keep below-the-fold sections un-triggered while sitting at Showreel top (scrollY <= 10). Default: true */
  requireScroll?: boolean;
}

export type EnterDirection = 'bottom' | 'top';

// Shared module-level ResizeObserver so card hydration, aspect reflow, or mobile viewport
// resizing immediately re-evaluates mounted reveal nodes even without a scroll event.
const resizeListeners = new Set<() => void>();
let sharedResizeObserver: ResizeObserver | null = null;
let resizeRafId = 0;

function subscribeBodyResize(cb: () => void): () => void {
  resizeListeners.add(cb);

  if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined' && !sharedResizeObserver) {
    sharedResizeObserver = new ResizeObserver(() => {
      if (resizeRafId) return;
      resizeRafId = window.requestAnimationFrame(() => {
        resizeRafId = 0;
        resizeListeners.forEach((listener) => listener());
      });
    });
    if (document.documentElement) sharedResizeObserver.observe(document.documentElement);
    if (document.body) sharedResizeObserver.observe(document.body);
  }

  return () => {
    resizeListeners.delete(cb);
    if (resizeListeners.size === 0 && sharedResizeObserver) {
      sharedResizeObserver.disconnect();
      sharedResizeObserver = null;
      if (resizeRafId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(resizeRafId);
        resizeRafId = 0;
      }
    }
  };
}

/**
 * Bidirectional Scroll Reveal Observer (Zero Premature Force-Reveal & Zero White Blank Gaps)
 * - Supports BOTH scroll-down entry (`data-enter-from="bottom"`) AND scroll-up re-entry (`data-enter-from="top"`)
 *   using buffered hysteresis (`85px` outside viewport before resetting) so scrolled-in sections always
 *   begin gliding into place at the edge rather than appearing invisible mid-screen.
 * - While `requireScroll` is true and the visitor has not scrolled past `10px` (or clicked a nav route),
 *   below-the-fold sections remain poised in their initial state until actual scrolling starts.
 */
export const useIntersectionObserver = (options?: ScrollRevealOptions) => {
  const [isVisible, setIsVisible] = useState(false);
  const [enterFrom, setEnterFrom] = useState<EnterDirection>('bottom');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);
  const hasTriggeredRef = useRef(false);
  const navJumpedRef = useRef(false);

  const once = options?.once ?? false;
  const requireScroll = options?.requireScroll ?? true;

  const evaluateNode = useCallback(
    (node: HTMLElement) => {
      const vh = window.innerHeight || 900;
      const rect = node.getBoundingClientRect();
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      if (scrollY > 10 && document.documentElement.dataset.hasScrolled !== 'true') {
        document.documentElement.dataset.hasScrolled = 'true';
      }
      const hasScrolled =
        scrollY > 10 ||
        document.documentElement.dataset.hasScrolled === 'true' ||
        navJumpedRef.current;

      const margin = 85;
      const isNearOrInsideViewport = rect.bottom > -margin && rect.top < vh + margin;

      if (isNearOrInsideViewport) {
        // Strict Showreel top gate: keep everything below the fold hidden while at `(0, 0)`
        if (requireScroll && !hasScrolled && rect.top >= vh * 0.85) {
          return;
        }

        const withinEnterBand = rect.top < vh + 48 && rect.bottom > -48;
        if (!withinEnterBand) return;

        const dir: EnterDirection =
          rect.top < vh * 0.35 && document.documentElement.dataset.scrollDir === 'up'
            ? 'top'
            : node.dataset.enterFrom === 'top' && rect.top < vh * 0.45
              ? 'top'
              : 'bottom';

        node.dataset.enterFrom = dir;
        setEnterFrom(dir);
        setIsVisible(true);

        if (once) {
          hasTriggeredRef.current = true;
          observerRef.current?.disconnect();
        }
        return;
      }

      // Reset ONLY after leaving the buffered viewport completely (`±85px`) so visible items never go blank!
      if (!once) {
        if (rect.bottom <= -margin) {
          node.dataset.enterFrom = 'top';
          setEnterFrom('top');
          setIsVisible(false);
        } else if (rect.top >= vh + margin) {
          node.dataset.enterFrom = 'bottom';
          setEnterFrom('bottom');
          setIsVisible(false);
        }
      }
    },
    [once, requireScroll]
  );

  // Re-evaluate as soon as user scrolls, resizes viewport, triggers layout reflow, or clicks MENU nav
  useEffect(() => {
    const handleUnlockOrScroll = () => {
      const node = nodeRef.current;
      if (!node) return;
      if (once && hasTriggeredRef.current) return;
      evaluateNode(node);
    };

    const handleNavTransition = () => {
      navJumpedRef.current = true;
      window.setTimeout(handleUnlockOrScroll, 760);
    };

    const unsubscribeResize = subscribeBodyResize(handleUnlockOrScroll);
    document.addEventListener('scroll', handleUnlockOrScroll, { passive: true, capture: true });
    window.addEventListener('scroll', handleUnlockOrScroll, { passive: true });
    window.addEventListener('resize', handleUnlockOrScroll, { passive: true });
    window.addEventListener('tw:programmatic-scroll', handleUnlockOrScroll);
    window.addEventListener('tw:nav-transition', handleNavTransition);
    return () => {
      unsubscribeResize();
      document.removeEventListener('scroll', handleUnlockOrScroll, { capture: true });
      window.removeEventListener('scroll', handleUnlockOrScroll);
      window.removeEventListener('resize', handleUnlockOrScroll);
      window.removeEventListener('tw:programmatic-scroll', handleUnlockOrScroll);
      window.removeEventListener('tw:nav-transition', handleNavTransition);
    };
  }, [evaluateNode, once]);

  const callbackRef = useCallback(
    (node: HTMLElement | null) => {
      if (once && hasTriggeredRef.current) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = node;
      if (!node) return;

      if (!node.dataset.enterFrom) {
        node.dataset.enterFrom = 'bottom';
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          evaluateNode(node);
        },
        {
          threshold: [0, 0.01, 0.04, 0.1, 0.25, 0.5],
          rootMargin: '85px 0px 85px 0px',
        }
      );

      observerRef.current.observe(node);
      evaluateNode(node);
    },
    [evaluateNode, once]
  );

  return [callbackRef, isVisible, enterFrom] as const;
};
