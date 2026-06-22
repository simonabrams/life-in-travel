import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Globe } from './Globe/Globe';
import { useEarthTextures } from '../hooks/useEarthTextures';
import { QualitySettings } from '../hooks/useQuality';
import { CAMERA_REST_Z, WORLD_SUN } from './Globe/constants';

interface SceneProps {
  quality: QualitySettings;
}

export function Scene({ quality }: SceneProps) {
  return (
    <Canvas
      dpr={quality.dpr}
      gl={{
        antialias: quality.tier === 'high',
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, 0, CAMERA_REST_Z], fov: 35, near: 0.1, far: 100 }}
    >
      <SceneContents quality={quality} />
    </Canvas>
  );
}

function SceneContents({ quality }: SceneProps) {
  const textures = useEarthTextures(quality.anisotropy);
  const setDpr = useThree((s) => s.setDpr);

  const [minDpr, maxDpr] = quality.dpr;

  return (
    <>
      {/* Sun key light aligned with the shader's sun direction. */}
      <directionalLight position={WORLD_SUN.clone().multiplyScalar(5).toArray()} intensity={1.4} />
      <ambientLight intensity={0.08} />

      {quality.stars && (
        <Stars radius={80} depth={40} count={3500} factor={3} saturation={0} fade speed={0.4} />
      )}

      <Suspense fallback={null}>
        <Globe textures={textures} quality={quality} />
      </Suspense>

      {quality.bloom && (
        <EffectComposer multisampling={quality.tier === 'high' ? 4 : 0}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.85}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      )}

      {/* Adapt resolution to sustained framerate: map the monitor's 0..1
          performance factor onto our allowed DPR range. */}
      <PerformanceMonitor
        onChange={({ factor }) => setDpr(minDpr + factor * (maxDpr - minDpr))}
      />
    </>
  );
}
