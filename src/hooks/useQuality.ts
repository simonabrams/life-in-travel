import { useMemo } from 'react';
import { useStore } from '../state/useStore';

export interface QualitySettings {
  tier: 'high' | 'low';
  /** Device-pixel-ratio cap for the canvas. */
  dpr: [number, number];
  /** Whether the post-processing bloom pass runs. */
  bloom: boolean;
  /** Whether the translucent cloud shell renders. */
  clouds: boolean;
  /** Whether the starfield renders. */
  stars: boolean;
  /** Anisotropic filtering level for earth textures. */
  anisotropy: number;
}

/**
 * One-time probe of the device. We deliberately keep this cheap and synchronous:
 * it reads coarse signals (memory, cores, touch, a throwaway WebGL context) that
 * are good enough to pick a starting tier. The user can always override via the
 * settings menu, and <PerformanceMonitor> further adapts DPR at runtime.
 */
function probeIsLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Respect explicit data-saver / reduced-motion intent.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection?.saveData;
  if (saveData) return true;

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof deviceMemory === 'number' && deviceMemory <= 4) return true;

  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) {
    // Low core count *and* a touch device is a strong "mobile" signal.
    const touch = typeof window !== 'undefined' && 'ontouchstart' in window;
    if (touch) return true;
  }

  // No/old WebGL → definitely low.
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
  } catch {
    return true;
  }

  return false;
}

const LOW_END = typeof window !== 'undefined' ? probeIsLowEnd() : false;

export function useQuality(): QualitySettings {
  const preference = useStore((s) => s.quality);

  return useMemo(() => {
    const tier: 'high' | 'low' =
      preference === 'high' ? 'high' : preference === 'low' ? 'low' : LOW_END ? 'low' : 'high';

    if (tier === 'low') {
      return {
        tier,
        dpr: [1, 1.25],
        bloom: false,
        clouds: false,
        stars: false,
        anisotropy: 1,
      };
    }

    return {
      tier,
      dpr: [1, 2],
      bloom: true,
      clouds: true,
      stars: true,
      anisotropy: 8,
    };
  }, [preference]);
}

/** Honour the OS "reduce motion" setting for ambient animation. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
