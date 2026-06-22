import { useRef, useState } from 'react';
import { useStore, useStopEdit } from '../../state/useStore';
import { fileToScaledDataUrl, randomId } from '../../utils/image';

interface EditPanelProps {
  stopId: string;
  fallbackDescription: string;
}

export function EditPanel({ stopId, fallbackDescription }: EditPanelProps) {
  const edit = useStopEdit(stopId);
  const setDescription = useStore((s) => s.setDescription);
  const addPhoto = useStore((s) => s.addPhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const setPhotoCaption = useStore((s) => s.setPhotoCaption);
  const resetEdit = useStore((s) => s.resetEdit);
  const exportEdits = useStore((s) => s.exportEdits);
  const importEdits = useStore((s) => s.importEdits);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = edit.description ?? fallbackDescription;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await fileToScaledDataUrl(file);
        addPhoto(stopId, { id: randomId(), dataUrl });
      }
    } catch {
      setError('Could not add one or more images. They may be too large.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onExport() {
    const blob = new Blob([exportEdits()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'life-in-travel-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importEdits(String(reader.result));
      setError(ok ? null : 'That file could not be imported.');
    };
    reader.readAsText(file);
  }

  return (
    <div className="edit">
      <label className="edit__label" htmlFor={`desc-${stopId}`}>
        Description
      </label>
      <textarea
        id={`desc-${stopId}`}
        className="edit__textarea"
        value={value}
        placeholder="Write about this place…"
        onChange={(e) => setDescription(stopId, e.target.value)}
        rows={5}
      />

      <div className="edit__photos">
        <div className="edit__photos-head">
          <span className="edit__label">Photos</span>
          <button className="btn btn--small" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Adding…' : '+ Add photos'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {edit.photos.length > 0 && (
          <div className="edit__grid">
            {edit.photos.map((p) => (
              <div key={p.id} className="edit__thumb">
                <img src={p.dataUrl} alt={p.caption ?? 'photo'} />
                <input
                  className="edit__caption"
                  value={p.caption ?? ''}
                  placeholder="Caption"
                  onChange={(e) => setPhotoCaption(stopId, p.id, e.target.value)}
                />
                <button
                  className="edit__remove"
                  onClick={() => removePhoto(stopId, p.id)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="edit__error">{error}</p>}

      <div className="edit__footer">
        <button className="btn btn--small btn--ghost" onClick={() => resetEdit(stopId)}>
          Reset this place
        </button>
        <div className="edit__data">
          <button className="btn btn--small btn--ghost" onClick={onExport}>
            Export
          </button>
          <label className="btn btn--small btn--ghost">
            Import
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <p className="edit__hint">
        Edits are saved in this browser. Use Export to back them up or move them to another device.
      </p>
    </div>
  );
}
