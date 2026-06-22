# A Life in Travel

An interactive, photoreal 3D globe that tells the story of the places I've lived
— and, eventually, the places I've only visited. Built with React, React Three
Fiber, custom GLSL shaders, and GSAP.

![A Life in Travel](public/globe.svg)

## What it does

- **Photoreal globe** with a day/night terminator, city lights, oceanic
  specular glint, a vertex-shader **atmosphere** shell, and a subtle **bloom**.
- **Idle ambient spin**, **click-and-drag** to rotate freely, and smooth
  **fly-to** transitions that spin + zoom a location to centre.
- A proportional **timeline** of every chapter, 1973 → present. Click a band or
  a marker to travel there.
- **Lived vs. visited** are first-class categories (different colours), so the
  collection can grow beyond places I've lived.
- **Edit mode**: add a description and upload photos for any place. Everything
  is saved in the browser and can be exported / imported as JSON.
- **Performance-aware**: probes the device, adapts resolution to framerate, and
  degrades gracefully (drops bloom, clouds, stars, and DPR on weaker hardware).
  Honours `prefers-reduced-motion`.
- **Responsive** — the side panel becomes a bottom sheet on phones.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Adding or editing places

All locations live in [`src/data/locations.ts`](src/data/locations.ts). Each
`Stop` has coordinates, a year range, a `kind` (`'lived'` | `'visited'`), and an
optional default description:

```ts
{
  id: 'lisbon-2010',
  city: 'Lisbon',
  country: 'Portugal',
  lat: 38.7223,
  lng: -9.1393,
  startYear: 2010,
  endYear: 2010,
  kind: 'visited',          // shows up amber instead of cyan
  description: 'A long weekend of pastéis de nata.',
}
```

Descriptions and photos added through **Edit mode** are stored separately in
`localStorage` (so code updates never clobber your content) and can be moved
between devices via **Export / Import**.

## Assets

The earth maps load at runtime from a CDN (see
[`src/data/assets.ts`](src/data/assets.ts)). For production you'll likely want
to self-host them: drop the images in `/public` and point the constants at the
local paths. The same file is where you enable an optional **cloud layer** by
supplying a transparent cloud texture.

## How the globe works

- `src/components/Globe/` — the planet (`Earth`), `Atmosphere`, `Clouds`,
  `Markers`, and `Globe` (which owns rotation/drag/fly-to).
- `src/components/Globe/shaders.ts` — the day/night earth shader and the
  fresnel atmosphere shader.
- `src/components/Scene.tsx` — canvas, lighting, starfield, bloom, and the
  runtime DPR governor.
- `src/hooks/useQuality.ts` — device probe + quality tiers.

Rotation is applied to the globe *group's* quaternion: idle adds a small yaw per
frame, dragging maps pointer deltas to world-axis rotations, and a focus
transition slerps the quaternion so a chosen lat/lng faces the camera while the
camera dollies in.
