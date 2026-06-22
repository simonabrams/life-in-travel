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
 * The quaternion to apply to the globe group so that the given lat/lng faces the
 * camera (world +Z). Used to "front" a location during a focus transition.
 */
export function quaternionFacingCamera(lat: number, lng: number): THREE.Quaternion {
  const local = latLngToVector3(lat, lng, 1).normalize();
  const forward = new THREE.Vector3(0, 0, 1);
  return new THREE.Quaternion().setFromUnitVectors(local, forward);
}
