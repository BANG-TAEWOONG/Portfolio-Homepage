import { useEffect } from 'react';

interface MotionPhysicsOptions {
  disabled?: boolean;
}

/**
 * Lightweight, zero-dependency single-RAF scroll velocity physics hook.
 * Updates `--tw-scroll-skew` (`clamp(-1.8deg, smoothVel * -0.04, 1.8deg)`)
 * on `document.documentElement.style` for a subtle weighted editorial feel.
 *
 * Automatically bypassed on:
 * - `prefers-reduced-motion: reduce`
 * - coarse touch pointers (`pointer: coarse`)
 * - `disabled === true` (e.g. CMS inline `isEditMode` or modal open)
 */
export function useMotionPhysics(options: MotionPhysicsOptions = {}): void {
  const { disabled = false } = options;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const rootStyle = document.documentElement.style;
    const resetSkew = () => {
      rootStyle.setProperty('--tw-scroll-skew', '0deg');
    };

    if (disabled) {
      resetSkew();
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

    if (reducedMotionQuery.matches || coarsePointerQuery.matches) {
      resetSkew();
      return;
    }

    let rafId = 0;
    let lastScrollY = window.scrollY;
    let smoothVel = 0;
    let lastAppliedSkew = 0;
    let active = true;

    const tick = () => {
      if (!active) return;

      const currentY = window.scrollY;
      const rawDelta = currentY - lastScrollY;
      lastScrollY = currentY;

      // Damped low-pass filter for weighted analog inertia
      smoothVel += (rawDelta - smoothVel) * 0.14;

      if (Math.abs(smoothVel) < 0.05) {
        smoothVel = 0;
      }

      const targetSkew = Math.max(-1.8, Math.min(1.8, smoothVel * -0.04));

      if (Math.abs(targetSkew - lastAppliedSkew) > 0.004) {
        lastAppliedSkew = targetSkew;
        const formatted = Math.abs(targetSkew) < 0.01 ? '0deg' : `${targetSkew.toFixed(3)}deg`;
        rootStyle.setProperty('--tw-scroll-skew', formatted);
      } else if (targetSkew === 0 && lastAppliedSkew !== 0) {
        lastAppliedSkew = 0;
        resetSkew();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const handleMediaChange = () => {
      if (reducedMotionQuery.matches || coarsePointerQuery.matches) {
        active = false;
        window.cancelAnimationFrame(rafId);
        resetSkew();
      }
    };

    reducedMotionQuery.addEventListener('change', handleMediaChange);
    coarsePointerQuery.addEventListener('change', handleMediaChange);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      reducedMotionQuery.removeEventListener('change', handleMediaChange);
      coarsePointerQuery.removeEventListener('change', handleMediaChange);
      resetSkew();
    };
  }, [disabled]);
}
