import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CLOUDS_TEXTURE } from '../../data/assets';
import { GLOBE_RADIUS } from './constants';

/**
 * A thin translucent shell of clouds that drifts a touch faster than the
 * surface. Renders nothing unless a cloud texture has been configured
 * (see data/assets.ts) — three-globe's default set doesn't include one.
 */
export function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!CLOUDS_TEXTURE) return;
    let cancelled = false;
    new THREE.TextureLoader().load(
      CLOUDS_TEXTURE,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (!cancelled) setTexture(tex);
      },
      undefined,
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.01;
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} scale={1.012}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        alphaMap={texture}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}
