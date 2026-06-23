import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { Header } from './components/UI/Header';
import { Timeline } from './components/UI/Timeline';
import { LocationPanel } from './components/UI/LocationPanel';
import { ZoomControls } from './components/UI/ZoomControls';
import { Intro } from './components/UI/Intro';
import { useQuality } from './hooks/useQuality';
import { useStore } from './state/useStore';
import { STOPS } from './data/locations';

export default function App() {
  const quality = useQuality();

  // Keyboard: Esc clears selection; ←/→ steps chronologically once a place is
  // selected (read the latest state lazily so the handler need not re-bind).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { selectedId, select } = useStore.getState();
      if (e.key === 'Escape') {
        select(null);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!selectedId) return;
        const i = STOPS.findIndex((s) => s.id === selectedId);
        if (i === -1) return;
        const j = e.key === 'ArrowLeft' ? i - 1 : i + 1;
        if (j >= 0 && j < STOPS.length) select(STOPS[j].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <div className="scene-layer">
        <Scene quality={quality} />
      </div>

      <div className="ui-layer">
        <Header tier={quality.tier} />
        <Intro />
        <ZoomControls />
        <LocationPanel />
        <Timeline />
      </div>
    </div>
  );
}
