import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { Earth } from './Earth';
import { Atmosphere } from './Atmosphere';
import { Clouds } from './Clouds';
import { Markers } from './Markers';
import { EarthTextures } from '../../hooks/useEarthTextures';
import { QualitySettings, prefersReducedMotion } from '../../hooks/useQuality';
import { useStore } from '../../state/useStore';
import { STOPS } from '../../data/locations';
import { orientationFacingCamera } from '../../utils/geo';
import {
  CAMERA_FOCUS_Z,
  CAMERA_REST_Z,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_ZOOM,
} from './constants';
import { globeControls } from './globeControls';

interface GlobeProps {
  textures: EarthTextures;
  quality: QualitySettings;
}

const IDLE_SPEED = 0.05; // radians / second
const DRAG_SENSITIVITY = 0.005;
const WHEEL_SENSITIVITY = 0.0014;
const TWO_PI = Math.PI * 2;
const FOCUS_DURATION = 1.6;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Smallest signed delta to rotate `from` onto `to` (handles wrap-around). */
function shortestAngle(from: number, to: number): number {
  let d = (to - from) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

export function Globe({ textures, quality }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  // Orientation is held as two scalars (never a free quaternion) so the globe
  // can yaw and pitch but never *roll* — the continents stay upright.
  const yaw = useRef(0);
  const pitch = useRef(0);
  const zoom = useRef(CAMERA_REST_Z);

  const interacting = useRef(false);
  const focusing = useRef(false);
  const reduced = useRef(prefersReducedMotion());

  const selectedId = useStore((s) => s.selectedId);

  // Reusable math objects (avoid per-frame allocation).
  const qYaw = useRef(new THREE.Quaternion());
  const qPitch = useRef(new THREE.Quaternion());
  const axisY = useRef(new THREE.Vector3(0, 1, 0));
  const axisX = useRef(new THREE.Vector3(1, 0, 0));

  const killFocusTweens = () => {
    gsap.killTweensOf(yaw);
    gsap.killTweensOf(pitch);
    gsap.killTweensOf(zoom);
    focusing.current = false;
  };

  // --- Focus / deselect transitions ------------------------------------
  useEffect(() => {
    killFocusTweens();

    if (!selectedId) {
      // Ease back out; leave orientation where it is and let idle resume.
      gsap.to(zoom, { current: CAMERA_REST_Z, duration: 1.1, ease: 'power2.inOut' });
      return;
    }

    const stop = STOPS.find((s) => s.id === selectedId);
    if (!stop) return;

    const target = orientationFacingCamera(stop.lat, stop.lng);
    // Take the shortest rotational path from the current (unbounded) yaw.
    const targetYaw = yaw.current + shortestAngle(yaw.current, target.yaw);
    const targetPitch = clamp(target.pitch, -MAX_PITCH, MAX_PITCH);

    focusing.current = true;
    gsap.to(yaw, { current: targetYaw, duration: FOCUS_DURATION, ease: 'power3.inOut' });
    gsap.to(pitch, { current: targetPitch, duration: FOCUS_DURATION, ease: 'power3.inOut' });
    gsap.to(zoom, {
      current: CAMERA_FOCUS_Z,
      duration: FOCUS_DURATION,
      ease: 'power3.inOut',
      onComplete: () => {
        focusing.current = false;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // --- Pointer / wheel interaction -------------------------------------
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;
    let pinchZoom = 0;

    const onDown = (e: PointerEvent) => {
      killFocusTweens();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      interacting.current = true;
      document.body.classList.add('grabbing');
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZoom = zoom.current;
      }
    };

    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        // Pinch to zoom.
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0 && dist > 0) {
          zoom.current = clamp((pinchZoom * pinchDist) / dist, MIN_ZOOM, MAX_ZOOM);
        }
        return;
      }

      // Single-pointer drag to spin.
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      yaw.current += dx * DRAG_SENSITIVITY;
      pitch.current = clamp(pitch.current + dy * DRAG_SENSITIVITY, -MAX_PITCH, MAX_PITCH);
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) {
        interacting.current = false;
        document.body.classList.remove('grabbing');
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      killFocusTweens();
      // Proportional step feels natural across the whole zoom range.
      zoom.current = clamp(
        zoom.current + e.deltaY * WHEEL_SENSITIVITY * zoom.current,
        MIN_ZOOM,
        MAX_ZOOM,
      );
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // Expose zoom to the out-of-canvas UI buttons.
    globeControls.zoomBy = (factor: number) => {
      killFocusTweens();
      zoom.current = clamp(zoom.current * factor, MIN_ZOOM, MAX_ZOOM);
    };

    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      globeControls.zoomBy = () => {};
      document.body.classList.remove('grabbing');
    };
  }, [gl]);

  // Cursor affordance.
  useEffect(() => {
    gl.domElement.style.cursor = 'grab';
    return () => {
      gl.domElement.style.cursor = '';
    };
  }, [gl]);

  // --- Per-frame apply (single source of truth) ------------------------
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Idle ambient spin only when at rest.
    if (!focusing.current && !interacting.current && !selectedId && !reduced.current) {
      yaw.current += IDLE_SPEED * Math.min(delta, 0.05);
    }

    pitch.current = clamp(pitch.current, -MAX_PITCH, MAX_PITCH);
    qYaw.current.setFromAxisAngle(axisY.current, yaw.current);
    qPitch.current.setFromAxisAngle(axisX.current, pitch.current);
    group.quaternion.copy(qYaw.current).multiply(qPitch.current);

    // Camera stays on the +Z axis and only dollies — no roll, no orbit.
    camera.position.set(0, 0, zoom.current);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <Earth textures={textures} />
      <Atmosphere />
      {quality.clouds && <Clouds />}
      <Markers />
    </group>
  );
}
