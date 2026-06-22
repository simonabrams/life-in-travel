import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
} from './shaders';
import { ATMO_COLOR, GLOBE_RADIUS, sunInViewSpace } from './constants';

/**
 * The glowing shell of air. It's a slightly larger sphere drawn from the inside
 * (BackSide) with additive blending, so it reads as light scattering at the limb
 * — and it's exactly the bright, soft edge the bloom pass latches onto.
 */
export function Atmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: ATMO_COLOR },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uIntensity: { value: 1.15 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    if (materialRef.current) {
      uniforms.uSunDirection.value.copy(sunInViewSpace(camera));
    }
  });

  return (
    <mesh scale={1.16}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
