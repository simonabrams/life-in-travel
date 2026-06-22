import { useMemo } from 'react';
import {
  STOPS,
  TIMELINE_END,
  TIMELINE_START,
  formatRange,
} from '../../data/locations';
import { useStore } from '../../state/useStore';

const SPAN = TIMELINE_END - TIMELINE_START;

function pct(year: number): number {
  return ((year - TIMELINE_START) / SPAN) * 100;
}

export function Timeline() {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  const decadeTicks = useMemo(() => {
    const ticks: number[] = [];
    const first = Math.ceil(TIMELINE_START / 10) * 10;
    for (let y = first; y <= TIMELINE_END; y += 10) ticks.push(y);
    return ticks;
  }, []);

  return (
    <section className="timeline" aria-label="Timeline of places lived">
      <div className="timeline__scroll">
        <div className="timeline__track">
          {/* Decade gridlines */}
          {decadeTicks.map((y) => (
            <div key={y} className="timeline__tick" style={{ left: `${pct(y)}%` }}>
              <span className="timeline__tick-label">{y}</span>
            </div>
          ))}

          {/* Stop bands */}
          {STOPS.map((stop, i) => {
            const left = pct(stop.startYear);
            const end = stop.endYear ?? TIMELINE_END;
            const width = Math.max(pct(end) - left, 1.5);
            const selected = stop.id === selectedId;
            return (
              <button
                key={stop.id}
                className={`timeline__band ${selected ? 'is-selected' : ''}`}
                data-kind={stop.kind}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  // Alternate vertical lanes so adjacent labels don't collide.
                  top: `${(i % 2) * 1.9 + 0.4}rem`,
                }}
                onClick={() => select(selected ? null : stop.id)}
                title={`${stop.city}, ${stop.country} · ${formatRange(stop)}`}
              >
                <span className="timeline__band-city">{stop.city}</span>
                <span className="timeline__band-range">{formatRange(stop)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
