import { useEffect, useRef } from 'react';
import { STOPS, formatRange } from '../../data/locations';
import { useStore, useStopEdit } from '../../state/useStore';
import { EditPanel } from './EditPanel';

export function LocationPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const editMode = useStore((s) => s.editMode);
  const edit = useStopEdit(selectedId ?? '');

  const panelRef = useRef<HTMLDivElement>(null);

  const stop = STOPS.find((s) => s.id === selectedId) ?? null;
  const open = !!stop;

  // Move keyboard focus into the panel when it opens (accessibility).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, selectedId]);

  if (!stop) return null;

  const description = edit.description ?? stop.description ?? '';

  return (
    <aside
      ref={panelRef}
      className={`panel ${open ? 'is-open' : ''}`}
      tabIndex={-1}
      aria-label={`${stop.city}, ${stop.country}`}
    >
      <div className="panel__head">
        <div>
          <p className="panel__kicker" data-kind={stop.kind}>
            {stop.kind === 'lived' ? 'Lived' : 'Visited'}
          </p>
          <h2 className="panel__title">{stop.city}</h2>
          <p className="panel__sub">
            {stop.country} · <span className="panel__years">{formatRange(stop)}</span>
          </p>
        </div>
        <button className="panel__close" onClick={() => select(null)} aria-label="Close">
          ×
        </button>
      </div>

      {!editMode && (
        <>
          {description ? (
            <p className="panel__body">{description}</p>
          ) : (
            <p className="panel__body panel__body--muted">
              No description yet. Turn on Edit to add one.
            </p>
          )}

          {edit.photos.length > 0 && (
            <div className="gallery">
              {edit.photos.map((p) => (
                <figure key={p.id} className="gallery__item">
                  <img src={p.dataUrl} alt={p.caption ?? `${stop.city} photo`} loading="lazy" />
                  {p.caption && <figcaption>{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      {editMode && <EditPanel stopId={stop.id} fallbackDescription={stop.description ?? ''} />}
    </aside>
  );
}
