// The canonical dataset for the experience.
//
// A "stop" is a single entry on the timeline. Most stops are places I *lived*,
// but the model also supports places merely *visited* so the collection can grow
// later without reworking the data shape. Coordinates are decimal lat/lng.
//
// `endYear: null` means "to the present day".

export type StopKind = 'lived' | 'visited';

export interface Stop {
  /** Stable id — used for selection, persistence keys and React keys. */
  id: string;
  city: string;
  country: string;
  /** Decimal degrees, north-positive. */
  lat: number;
  /** Decimal degrees, east-positive. */
  lng: number;
  startYear: number;
  /** `null` => present. */
  endYear: number | null;
  kind: StopKind;
  /**
   * Authored description. This is the *default* copy shipped with the app.
   * Edit-mode changes are stored separately (see useStore) so the original
   * is never lost and edits survive code updates.
   */
  description?: string;
}

// Ordered chronologically. Note Georgetown appears twice — two distinct
// chapters of life that happen to share a location. They are separate stops
// (separate timeline bands) but the globe de-duplicates the physical marker.
export const STOPS: Stop[] = [
  {
    id: 'georgetown-1973',
    city: 'Georgetown',
    country: 'Guyana',
    lat: 6.8013,
    lng: -58.1551,
    startYear: 1973,
    endYear: 1974,
    kind: 'lived',
    description: 'Where it began — born on the Atlantic coast of South America.',
  },
  {
    id: 'ottawa-1974',
    city: 'Ottawa',
    country: 'Canada',
    lat: 45.4215,
    lng: -75.6972,
    startYear: 1974,
    endYear: 1975,
    kind: 'lived',
    description: 'A first northern winter in the Canadian capital.',
  },
  {
    id: 'waterloo-1975',
    city: 'Waterloo',
    country: 'Belgium',
    lat: 50.6815,
    lng: 4.3995,
    startYear: 1975,
    endYear: 1981,
    kind: 'lived',
    description: 'Childhood years just south of Brussels.',
  },
  {
    id: 'baghdad-1981',
    city: 'Baghdad',
    country: 'Iraq',
    lat: 33.3152,
    lng: 44.3661,
    startYear: 1981,
    endYear: 1983,
    kind: 'lived',
    description: 'On the banks of the Tigris.',
  },
  {
    id: 'georgetown-1983',
    city: 'Georgetown',
    country: 'Guyana',
    lat: 6.8013,
    lng: -58.1551,
    startYear: 1983,
    endYear: 1987,
    kind: 'lived',
    description: 'A return to Guyana — this time old enough to remember it.',
  },
  {
    id: 'paramaribo-1987',
    city: 'Paramaribo',
    country: 'Suriname',
    lat: 5.852,
    lng: -55.2038,
    startYear: 1987,
    endYear: 1990,
    kind: 'lived',
    description: 'Next door in Suriname, the smallest country in South America.',
  },
  {
    id: 'great-barrington-1990',
    city: 'Great Barrington',
    country: 'USA',
    lat: 42.1959,
    lng: -73.3621,
    startYear: 1990,
    endYear: 1992,
    kind: 'lived',
    description: 'The Berkshires of western Massachusetts.',
  },
  {
    id: 'savannah-1992',
    city: 'Savannah',
    country: 'USA',
    lat: 32.0809,
    lng: -81.0912,
    startYear: 1992,
    endYear: 1996,
    kind: 'lived',
    description: 'Spanish moss and the Georgia coast.',
  },
  {
    id: 'brooklyn-1996',
    city: 'Brooklyn',
    country: 'USA',
    lat: 40.6501,
    lng: -73.9496,
    startYear: 1996,
    endYear: null,
    kind: 'lived',
    description: 'Home, for the long haul.',
  },
];

/** The full span the timeline needs to render, padded a little for breathing room. */
export const TIMELINE_START = 1973;
export const TIMELINE_END = new Date().getFullYear();

export function formatRange(stop: Stop): string {
  const end = stop.endYear === null ? 'Present' : String(stop.endYear);
  // Single-year stops read better collapsed (e.g. "1973" not "1973–1974").
  if (stop.endYear !== null && stop.endYear - stop.startYear <= 1) {
    return String(stop.startYear);
  }
  return `${stop.startYear} – ${end}`;
}
