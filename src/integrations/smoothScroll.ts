/**
 * Luxury Inertial Smooth Scroll & Programmatic Section Glide (`wowtapes.com` feel)
 * - `initSmoothWheelScroll`: Silky desktop wheel inertia (`lerp = 0.088`) with automatic bypass
 *   for touch devices, reduced-motion, open modals/drawers, nested scroll containers, and intro lock.
 * - Tracks `document.documentElement.dataset.scrollDir` (`'down' | 'up'`) and
 *   `document.documentElement.dataset.hasScrolled` (`'true'`) so bidirectional scroll choreography
 *   and below-the-fold scroll gating stay 100% synchronized.
 */

let targetScrollY = 0;
let currentScrollY = 0;
let wheelRafId: number | null = null;
let programmaticRafId: number | null = null;
let lastObservedY = 0;

const syncFromWindowScroll = () => {
  if (typeof window === 'undefined') return;
  const y =
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;
  currentScrollY = y;
  targetScrollY = y;
};

const updateScrollMetadata = () => {
  if (typeof window === 'undefined') return;
  const y =
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;
  const delta = y - lastObservedY;

  if (delta > 0.5) {
    document.documentElement.dataset.scrollDir = 'down';
  } else if (delta < -0.5) {
    document.documentElement.dataset.scrollDir = 'up';
  }

  if (y > 10) {
    document.documentElement.dataset.hasScrolled = 'true';
  }

  lastObservedY = y;
};

const hasScrollableAncestor = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;

  while (el && el !== document.body && el !== document.documentElement) {
    if (
      el.tagName === 'SELECT' ||
      el.tagName === 'TEXTAREA' ||
      el.getAttribute('role') === 'dialog'
    ) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight + 2
      ) {
        return true;
      }
      if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        return true;
      }
    }

    const style = window.getComputedStyle(el);
    const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
    if (isScrollable && el.scrollHeight > el.clientHeight + 2) {
      return true;
    }
    el = el.parentElement;
  }

  return false;
};

export const smoothScrollTo = (
  targetId: string,
  offset: number = 48,
  duration: number = 1650
) => {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(targetId);
  if (!element) return;

  if (wheelRafId !== null) {
    window.cancelAnimationFrame(wheelRafId);
    wheelRafId = null;
  }
  if (programmaticRafId !== null) {
    window.cancelAnimationFrame(programmaticRafId);
    programmaticRafId = null;
  }

  const startPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
  const targetPosition = Math.max(0, element.getBoundingClientRect().top + startPosition - offset);
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  document.documentElement.dataset.hasScrolled = 'true';
  document.documentElement.dataset.scrollDir = distance >= 0 ? 'down' : 'up';

  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

  const step = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const nextY = startPosition + distance * eased;

    window.scrollTo(0, nextY);
    syncFromWindowScroll();
    updateScrollMetadata();
    window.dispatchEvent(new CustomEvent('tw:programmatic-scroll'));

    if (progress < 1) {
      programmaticRafId = window.requestAnimationFrame(step);
    } else {
      programmaticRafId = null;
    }
  };

  programmaticRafId = window.requestAnimationFrame(step);
};

export const initSmoothWheelScroll = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  syncFromWindowScroll();
  lastObservedY = window.pageYOffset || document.documentElement.scrollTop || 0;
  if (!document.documentElement.dataset.scrollDir) {
    document.documentElement.dataset.scrollDir = 'down';
  }
  updateScrollMetadata();

  const stepInertia = () => {
    const diff = targetScrollY - currentScrollY;
    if (Math.abs(diff) < 0.35) {
      currentScrollY = targetScrollY;
      window.scrollTo(0, Math.round(currentScrollY));
      updateScrollMetadata();
      wheelRafId = null;
      return;
    }

    // Silky `wowtapes.com`-calibrated exponential decay (`lerp = 0.074`)
    currentScrollY += diff * 0.074;
    window.scrollTo(0, currentScrollY);
    updateScrollMetadata();
    wheelRafId = window.requestAnimationFrame(stepInertia);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    if (!window.matchMedia?.('(pointer: fine)').matches) return;
    if (document.body.style.overflow === 'hidden') return;

    // While the opening TWOONG STUDIO portal is active, prevent accidental wheel jumps away from (0, 0)
    if (document.documentElement.dataset.introLocked === 'true') {
      e.preventDefault();
      return;
    }

    if (hasScrollableAncestor(e.target)) return;

    // Normalize wheel delta across mouse ticks & high-res trackpads
    let deltaY = e.deltaY;
    if (e.deltaMode === 1) deltaY *= 32;
    else if (e.deltaMode === 2) deltaY *= (window.innerHeight || 900) * 0.85;
    deltaY = Math.max(-220, Math.min(220, deltaY));

    if (Math.abs(deltaY) < 0.01) return;

    // Cancel any active programmatic glide cleanly if the user takes over with the wheel
    if (programmaticRafId !== null) {
      window.cancelAnimationFrame(programmaticRafId);
      programmaticRafId = null;
    }

    if (wheelRafId === null) {
      syncFromWindowScroll();
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetScrollY = Math.max(0, Math.min(maxScroll, targetScrollY + deltaY * 0.92));

    document.documentElement.dataset.scrollDir = deltaY >= 0 ? 'down' : 'up';
    if (targetScrollY > 10) {
      document.documentElement.dataset.hasScrolled = 'true';
    }

    e.preventDefault();

    if (wheelRafId === null) {
      wheelRafId = window.requestAnimationFrame(stepInertia);
    }
  };

  const handleNativeScroll = () => {
    updateScrollMetadata();
    if (wheelRafId === null && programmaticRafId === null) {
      syncFromWindowScroll();
    }
  };

  const handleProgrammaticSync = () => {
    syncFromWindowScroll();
    updateScrollMetadata();
  };

  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('scroll', handleNativeScroll, { passive: true });
  window.addEventListener('tw:programmatic-scroll', handleProgrammaticSync);

  return () => {
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('scroll', handleNativeScroll);
    window.removeEventListener('tw:programmatic-scroll', handleProgrammaticSync);
    if (wheelRafId !== null) window.cancelAnimationFrame(wheelRafId);
    if (programmaticRafId !== null) window.cancelAnimationFrame(programmaticRafId);
    wheelRafId = null;
    programmaticRafId = null;
  };
};
