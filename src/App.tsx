import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { Header } from './components/UI/Header';
import { Timeline } from './components/UI/Timeline';
import { LocationPanel } from './components/UI/LocationPanel';
import { Intro } from './components/UI/Intro';
import { useQuality } from './hooks/useQuality';
import { useStore } from './state/useStore';

export default function App() {
  const quality = useQuality();
  const select = useStore((s) => s.select);

  // Esc clears the current selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  return (
    <div className="app">
      <div className="scene-layer">
        <Scene quality={quality} />
      </div>

      <div className="ui-layer">
        <Header tier={quality.tier} />
        <Intro />
        <LocationPanel />
        <Timeline />
      </div>
    </div>
  );
}
