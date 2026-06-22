// Earth texture maps. These default to the well-known "blue marble" set hosted
// on unpkg (shipped with the `three-globe` package, permissively usable). They
// are loaded at runtime by the browser — swap these constants for files in
// /public if you'd rather self-host (recommended for production).
//
// If any of these fail to load, the globe degrades gracefully to a solid,
// shaded sphere (see useEarthTextures).

const CDN = 'https://unpkg.com/three-globe@2.31.0/example/img';

export const TEXTURES = {
  day: `${CDN}/earth-blue-marble.jpg`,
  night: `${CDN}/earth-night.jpg`,
  /** Greyscale elevation — used here as a specular/relief mask. */
  topology: `${CDN}/earth-topology.png`,
  /** Greyscale water mask — white where there's ocean. */
  water: `${CDN}/earth-water.png`,
} as const;

/**
 * Optional cloud layer. three-globe doesn't ship clouds, so this is left blank
 * by default and the cloud shell is skipped. Drop a 2k/4k transparent cloud PNG
 * into /public and set this to e.g. '/clouds.png' to enable it.
 */
export const CLOUDS_TEXTURE = '';
