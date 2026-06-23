/**
 * A tiny imperative bridge so UI controls rendered *outside* the R3F Canvas
 * (the zoom buttons) can drive the camera that lives *inside* it. The Globe
 * registers real implementations on mount; before that the methods are no-ops.
 *
 * A module singleton is appropriate here because there is exactly one globe.
 */
export const globeControls: {
  /** Multiply the current camera distance (e.g. 0.85 = zoom in, 1.18 = out). */
  zoomBy: (factor: number) => void;
} = {
  zoomBy: () => {},
};
