import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { TEXTURES } from '../data/assets';

export interface EarthTextures {
  day: THREE.Texture | null;
  night: THREE.Texture | null;
  topology: THREE.Texture | null;
  water: THREE.Texture | null;
  /** True once the load attempt has settled (success or failure). */
  ready: boolean;
  /** True if at least the day map loaded — drives full vs. fallback material. */
  ok: boolean;
}

/**
 * Loads the earth maps manually (rather than drei's `useTexture`) so a failed
 * request degrades gracefully instead of throwing into a Suspense boundary.
 */
export function useEarthTextures(anisotropy: number): EarthTextures {
  const [state, setState] = useState<EarthTextures>({
    day: null,
    night: null,
    topology: null,
    water: null,
    ready: false,
    ok: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const load = (url: string) =>
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = anisotropy;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            resolve(tex);
          },
          undefined,
          () => resolve(null),
        );
      });

    Promise.all([
      load(TEXTURES.day),
      load(TEXTURES.night),
      load(TEXTURES.topology),
      load(TEXTURES.water),
    ]).then(([day, night, topology, water]) => {
      if (cancelled) return;
      // Data maps shouldn't be treated as colour.
      if (topology) topology.colorSpace = THREE.NoColorSpace;
      if (water) water.colorSpace = THREE.NoColorSpace;
      setState({ day, night, topology, water, ready: true, ok: !!day });
    });

    return () => {
      cancelled = true;
    };
  }, [anisotropy]);

  return state;
}
