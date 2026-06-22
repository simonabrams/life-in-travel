import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useStore } from '../../state/useStore';

/**
 * A first-run hint that fades away once the user engages (selects a place) or
 * after a short delay. Purely decorative — safe to ignore on reduced-motion.
 */
export function Intro() {
  const selectedId = useStore((s) => s.selectedId);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 1.2, delay: 0.4, ease: 'power2.out' },
    );
    const timer = window.setTimeout(() => setDismissed(true), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedId) setDismissed(true);
  }, [selectedId]);

  useEffect(() => {
    if (dismissed && ref.current) {
      gsap.to(ref.current, { autoAlpha: 0, y: -8, duration: 0.6, ease: 'power2.in' });
    }
  }, [dismissed]);

  return (
    <div ref={ref} className="intro" aria-hidden={dismissed}>
      <p className="intro__line">Drag to spin the globe</p>
      <p className="intro__line intro__line--dim">
        Tap a marker or a band on the timeline to travel there
      </p>
    </div>
  );
}
