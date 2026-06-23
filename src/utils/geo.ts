import * as THREE from 'three';

/**
 * Convert geographic coordinates to a point on a sphere of the given radius.
 *
 * The mapping is chosen to line up with the equirectangular earth textures used
 * by the globe (three-globe's blue-marble set): the texture's horizontal centre
 * (longitude 0) sits on the +Z/-Z meridian after the texture's default wrap, so
 * we offset longitude by -90° to put (lat 0, lng 0) at world +X facing forward.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y
  const theta = (lng + 180) * (Math.PI / 180); // azimuth

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * The yaw (about world Y) and pitch (about world X) that bring the given
 * lat/lng to face the camera (world +Z) while keeping the continents upright.
 *
 * The globe's orientation is always composed as `Ry(yaw) * Rx(pitch)` with no
 * roll, so north stays up. Solving `Ry(yaw)·Rx(pitch)·p = +Z` for the unit
 * surface point `p` yields the closed form below.
 */
export function orientationFacingCamera(
  lat: number,
  lng: number,
): { yaw: number; pitch: number } {
  const p = latLngToVector3(lat, lng, 1).normalize();
  const h = Math.sqrt(p.y * p.y + p.z * p.z);
  const pitch = Math.atan2(p.y, p.z);
  const yaw = Math.atan2(-p.x, h);
  return { yaw, pitch };
}
