import * as THREE from 'three';

export const GLOBE_RADIUS = 1;
export const MARKER_RADIUS = GLOBE_RADIUS * 1.005;

/** Fixed world-space sun direction. The globe spins under it for day/night. */
export const WORLD_SUN = new THREE.Vector3(1, 0.35, 0.9).normalize();

export const ATMO_COLOR = new THREE.Color('#3aa0ff');

/** Camera distances for the resting and focused (zoomed-in) states. */
export const CAMERA_REST_Z = 3.2;
export const CAMERA_FOCUS_Z = 2.35;

/** Compute the sun direction in view space for the current camera. */
const _sun = new THREE.Vector3();
export function sunInViewSpace(camera: THREE.Camera): THREE.Vector3 {
  return _sun.copy(WORLD_SUN).transformDirection(camera.matrixWorldInverse);
}
