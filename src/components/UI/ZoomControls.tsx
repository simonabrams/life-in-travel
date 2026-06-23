import { globeControls } from '../Globe/globeControls';

/**
 * Zoom in/out buttons. They drive the same clamped camera distance as the
 * mouse wheel and pinch gesture, via the globeControls bridge.
 */
export function ZoomControls() {
  return (
    <div className="zoom" aria-label="Zoom controls">
      <button
        className="zoom__btn"
        onClick={() => globeControls.zoomBy(0.82)}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        className="zoom__btn"
        onClick={() => globeControls.zoomBy(1.22)}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
}
