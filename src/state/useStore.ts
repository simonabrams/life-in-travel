import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STOPS } from '../data/locations';

/**
 * localStorage that fails soft. Photos are stored inline as base64, so a heavy
 * gallery can blow past the ~5MB quota; rather than letting the write throw and
 * tear down the store, we swallow the error and warn. (Export still works as a
 * durable backup.)
 */
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      console.warn(
        '[life-in-travel] Could not save to localStorage (quota?). ' +
          'Use Export to back up your content.',
      );
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* no-op */
    }
  },
}));

export interface Photo {
  id: string;
  /** Base64 data URL. Kept inline so photos persist without a backend. */
  dataUrl: string;
  caption?: string;
}

export interface StopEdit {
  description?: string;
  photos: Photo[];
}

/** User-facing quality preference. `auto` lets the runtime probe decide. */
export type QualityPreference = 'auto' | 'high' | 'low';

interface AppState {
  // --- selection / navigation ---
  selectedId: string | null;
  select: (id: string | null) => void;

  // --- edit mode ---
  editMode: boolean;
  toggleEditMode: () => void;

  // --- per-stop author edits (persisted) ---
  edits: Record<string, StopEdit>;
  setDescription: (stopId: string, description: string) => void;
  addPhoto: (stopId: string, photo: Photo) => void;
  removePhoto: (stopId: string, photoId: string) => void;
  setPhotoCaption: (stopId: string, photoId: string, caption: string) => void;
  resetEdit: (stopId: string) => void;

  // --- data portability ---
  exportEdits: () => string;
  importEdits: (json: string) => boolean;

  // --- rendering quality (persisted preference) ---
  quality: QualityPreference;
  setQuality: (q: QualityPreference) => void;
}

function emptyEdit(): StopEdit {
  return { photos: [] };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedId: null,
      select: (id) => set({ selectedId: id }),

      editMode: false,
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

      edits: {},
      setDescription: (stopId, description) =>
        set((s) => ({
          edits: {
            ...s.edits,
            [stopId]: { ...(s.edits[stopId] ?? emptyEdit()), description },
          },
        })),
      addPhoto: (stopId, photo) =>
        set((s) => {
          const current = s.edits[stopId] ?? emptyEdit();
          return {
            edits: {
              ...s.edits,
              [stopId]: { ...current, photos: [...current.photos, photo] },
            },
          };
        }),
      removePhoto: (stopId, photoId) =>
        set((s) => {
          const current = s.edits[stopId] ?? emptyEdit();
          return {
            edits: {
              ...s.edits,
              [stopId]: {
                ...current,
                photos: current.photos.filter((p) => p.id !== photoId),
              },
            },
          };
        }),
      setPhotoCaption: (stopId, photoId, caption) =>
        set((s) => {
          const current = s.edits[stopId] ?? emptyEdit();
          return {
            edits: {
              ...s.edits,
              [stopId]: {
                ...current,
                photos: current.photos.map((p) =>
                  p.id === photoId ? { ...p, caption } : p,
                ),
              },
            },
          };
        }),
      resetEdit: (stopId) =>
        set((s) => {
          const next = { ...s.edits };
          delete next[stopId];
          return { edits: next };
        }),

      exportEdits: () => JSON.stringify(get().edits, null, 2),
      importEdits: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (typeof parsed !== 'object' || parsed === null) return false;
          // Only keep entries that map to known stops, and normalise shape.
          const known = new Set(STOPS.map((s) => s.id));
          const cleaned: Record<string, StopEdit> = {};
          for (const [id, value] of Object.entries(parsed)) {
            if (!known.has(id) || typeof value !== 'object' || value === null) continue;
            const v = value as Partial<StopEdit>;
            cleaned[id] = {
              description: typeof v.description === 'string' ? v.description : undefined,
              photos: Array.isArray(v.photos) ? v.photos.filter(isPhoto) : [],
            };
          }
          set({ edits: cleaned });
          return true;
        } catch {
          return false;
        }
      },

      quality: 'auto',
      setQuality: (quality) => set({ quality }),
    }),
    {
      name: 'life-in-travel:v1',
      storage: safeStorage,
      // Persist only the things worth keeping; selection/editMode are ephemeral.
      partialize: (s) => ({ edits: s.edits, quality: s.quality }),
    },
  ),
);

function isPhoto(p: unknown): p is Photo {
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof (p as Photo).id === 'string' &&
    typeof (p as Photo).dataUrl === 'string'
  );
}

/** Convenience selector: resolved edit (always defined) for a stop. */
export function useStopEdit(stopId: string): StopEdit {
  return useStore((s) => s.edits[stopId]) ?? emptyEdit();
}
