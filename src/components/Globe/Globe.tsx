import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { Earth } from './Earth';
import { Atmosphere } from './Atmosphere';
import { Clouds } from './Clouds';
import { Markers } from './Markers';
import { EarthTextures } from '../../hooks/useEarthTextures';
import { QualitySettings } from '../../hooks/useQuality';
import { prefersReducedMotion } from '../../hooks/useQuality';
import { useStore } from '../../state/useStore';
import { STOPS } from '../../data/locations';
import { quaternionFacingCamera } from '../../utils/geo';
import { CAMERA_FOCUS_Z, CAMERA_REST_Z } from './constants';

interface GlobeProps {
  textures: EarthTextures;
  quality: QualitySettings;
}

const IDLE_SPEED = 0.035; // radians / second
const DRAG_SENSITIVITY = 0.005;

export function Globe({ textures, quality }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const draggingRef = useRef(false);
  const focusingRef = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const reducedMotion = useRef(prefersReducedMotion());

  const selectedId = useStore((s) => s.selectedId);

  // --- Focus transitions ------------------------------------------------
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Kill any in-flight tweens so rapid clicks don't fight each other.
    gsap.killTweensOf(camera.position);

    if (!selectedId) {
      // Deselect → ease the camera back out, resume ambient spin.
      gsap.to(camera.position, {
        z: CAMERA_REST_Z,
        duration: 1.1,
        ease: 'power2.inOut',
      });
      return;
    }

    const stop = STOPS.find((s) => s.id === selectedId);
    if (!stop) return;

    const startQuat = group.quaternion.clone();
    const targetQuat = quaternionFacingCamera(stop.lat, stop.lng);
    const proxy = { t: 0 };

    focusingRef.current = true;
    gsap.killTweensOf(proxy);
    gsap.to(proxy, {
      t: 1,
      duration: 1.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        group.quaternion.slerpQuaternions(startQuat, targetQuat, proxy.t);
      },
      onComplete: () => {
        focusingRef.current = false;
      },
    });

    gsap.to(camera.position, {
      z: CAMERA_FOCUS_Z,
      duration: 1.6,
      ease: 'power3.inOut',
    });
  }, [selectedId, camera]);

  // --- Drag to spin -----------------------------------------------------
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !groupRef.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    const group = groupRef.current;
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      dx * DRAG_SENSITIVITY,
    );
    const pitch = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      dy * DRAG_SENSITIVITY,
    );
    // World-axis rotation: pre-multiply so it feels like grabbing the surface.
    group.quaternion.premultiply(yaw).premultiply(pitch);
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = false;
    document.body.classList.remove('grabbing');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [onPointerMove]);

  const startDrag = useCallback(
    (e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
      // Any in-flight focus tween yields to direct manipulation.
      focusingRef.current = false;
      draggingRef.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      document.body.classList.add('grabbing');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
    },
    [onPointerMove, endDrag],
  );

  useEffect(() => () => endDrag(), [endDrag]);

  // --- Idle ambient rotation -------------------------------------------
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (draggingRef.current || focusingRef.current) return;
    if (reducedMotion.current) return;
    // Only idle-spin freely when nothing is focused; once a location is
    // selected we hold it steady for reading.
    if (selectedId) return;

    const clamped = Math.min(delta, 0.05);
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      IDLE_SPEED * clamped,
    );
    groupRef.current.quaternion.premultiply(yaw);
  });

  // Cursor affordance.
  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = 'grab';
    return () => {
      el.style.cursor = '';
    };
  }, [gl]);

  return (
    <group ref={groupRef}>
      <Earth textures={textures} />
      <Atmosphere />
      {quality.clouds && <Clouds />}
      <Markers />

      {/* Invisible, slightly oversized grab sphere so empty space near the
          globe still initiates a drag. Markers sit above it and stop
          propagation, so they stay clickable. */}
      <mesh onPointerDown={(e) => startDrag(e)} scale={1.12}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
