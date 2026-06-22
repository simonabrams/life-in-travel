import { useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EarthTextures } from '../../hooks/useEarthTextures';
import { GLOBE_RADIUS, sunInViewSpace } from './constants';

interface EarthProps {
  textures: EarthTextures;
}

/**
 * The planet surface.
 *
 * Built on MeshStandardMaterial so colour-management and tone-mapping work
 * correctly in both the bloom (post-processing) and plain render paths. The
 * day/night terminator is driven physically by the scene's sun light; we inject
 * a small shader patch so the night-lights emissive map only shows on the dark
 * side. When textures are unavailable it degrades to a plainly shaded sphere.
 */
export function Earth({ textures }: EarthProps) {
  // View-space sun direction, shared into the injected shader each frame.
  const sunUniform = useRef<{ value: THREE.Vector3 }>({
    value: new THREE.Vector3(1, 0, 0),
  });

  const onBeforeCompile = useCallback((shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uSunViewDir = sunUniform.current;
    shader.fragmentShader = `uniform vec3 uSunViewDir;\n${shader.fragmentShader}`.replace(
      '#include <emissivemap_fragment>',
      /* glsl */ `
        #include <emissivemap_fragment>
        // City lights fade in only on the night side of the terminator.
        float nightMix = smoothstep(0.18, -0.18, dot(normalize(vNormal), normalize(uSunViewDir)));
        totalEmissiveRadiance *= nightMix * 1.6;
      `,
    );
  }, []);

  useFrame(({ camera }) => {
    sunUniform.current.value.copy(sunInViewSpace(camera));
  });

  const material = useMemo(() => {
    if (!textures.ok) return null;
    const mat = new THREE.MeshStandardMaterial({
      map: textures.day,
      // Greyscale elevation gives subtle relief on the day side.
      bumpMap: textures.topology ?? undefined,
      bumpScale: 0.4,
      metalness: 0,
      roughness: 0.85,
      // City lights at night.
      emissive: new THREE.Color(0xffffff),
      emissiveMap: textures.night ?? undefined,
      emissiveIntensity: 1,
    });
    mat.onBeforeCompile = onBeforeCompile;
    return mat;
  }, [textures, onBeforeCompile]);

  if (!material) {
    // Graceful fallback: a shaded ocean-blue sphere.
    return (
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#16314f" roughness={0.85} metalness={0.1} />
      </mesh>
    );
  }

  return (
    <mesh material={material}>
      <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
    </mesh>
  );
}
