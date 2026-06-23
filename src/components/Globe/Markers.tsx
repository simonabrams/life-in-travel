import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STOPS, Stop, StopKind } from '../../data/locations';
import { useStore } from '../../state/useStore';
import { latLngToVector3 } from '../../utils/geo';
import { MARKER_RADIUS } from './constants';

interface LocationGroup {
  key: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  kind: StopKind;
  stops: Stop[];
  position: THREE.Vector3;
}

const KIND_COLOR: Record<StopKind, string> = {
  lived: '#5ad8ff',
  visited: '#ffb347',
};

// De-duplicate physical locations (Georgetown is two chapters, one dot).
function useLocationGroups(): LocationGroup[] {
  return useMemo(() => {
    const map = new Map<string, LocationGroup>();
    for (const stop of STOPS) {
      const key = `${stop.lat.toFixed(3)},${stop.lng.toFixed(3)}`;
      const existing = map.get(key);
      if (existing) {
        existing.stops.push(stop);
        if (stop.kind === 'lived') existing.kind = 'lived';
      } else {
        map.set(key, {
          key,
          lat: stop.lat,
          lng: stop.lng,
          city: stop.city,
          country: stop.country,
          kind: stop.kind,
          stops: [stop],
          position: latLngToVector3(stop.lat, stop.lng, MARKER_RADIUS),
        });
      }
    }
    return [...map.values()];
  }, []);
}

export function Markers() {
  const groups = useLocationGroups();
  return (
    <group>
      {groups.map((g) => (
        <Marker key={g.key} group={g} />
      ))}
    </group>
  );
}

function Marker({ group }: { group: LocationGroup }) {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const [hovered, setHovered] = useState(false);

  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const color = KIND_COLOR[group.kind];
  const isSelected = group.stops.some((s) => s.id === selectedId);
  const active = isSelected || hovered;

  // Gentle pulse; stronger when active.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2.5) * (active ? 0.22 : 0.1);
    if (ringRef.current) {
      ringRef.current.scale.setScalar(pulse * (active ? 1.5 : 1));
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.85 : 0.4 + Math.sin(t * 2.5) * 0.1;
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(active ? 1.6 : 1);
    }
  });

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    // For a shared location, default to the earliest chapter; the timeline is
    // the precise way to pick a specific era.
    const earliest = group.stops.reduce((a, b) => (a.startYear <= b.startYear ? a : b));
    select(earliest.id);
  };

  return (
    <group position={group.position}>
      <Billboard>
        {/* Outer pulsing ring */}
        <mesh ref={ringRef} onClick={onClick}>
          <ringGeometry args={[0.018, 0.026, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Solid core dot — the click target */}
        <mesh
          ref={coreRef}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = '';
          }}
        >
          <circleGeometry args={[0.014, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </Billboard>

      {active && (
        // No `distanceFactor`: the label renders at a constant screen size so
        // it stays crisp at any zoom (distanceFactor scales the DOM in 3D,
        // which rasterises then upscales → the pixelation we want to avoid).
        <Html
          center
          position={[0, 0.045, 0]}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[20, 0]}
        >
          <div className="marker-label" data-kind={group.kind}>
            <span className="marker-label__city">{group.city}</span>
            <span className="marker-label__country">{group.country}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
