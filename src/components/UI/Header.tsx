import { useState } from 'react';
import { useStore } from '../../state/useStore';
import { QualityPreference } from '../../state/useStore';

interface HeaderProps {
  tier: 'high' | 'low';
}

export function Header({ tier }: HeaderProps) {
  const editMode = useStore((s) => s.editMode);
  const toggleEditMode = useStore((s) => s.toggleEditMode);
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__mark" aria-hidden />
        <div className="header__titles">
          <h1 className="header__title">A Life in Travel</h1>
          <p className="header__subtitle">Nine places, five decades, one globe</p>
        </div>
      </div>

      <div className="header__actions">
        <button
          className={`btn ${editMode ? 'btn--active' : ''}`}
          onClick={toggleEditMode}
          aria-pressed={editMode}
        >
          {editMode ? 'Done editing' : 'Edit'}
        </button>

        <div className="menu">
          <button
            className="btn btn--ghost"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Display
          </button>
          {menuOpen && (
            <div className="menu__panel" role="menu">
              <p className="menu__label">Graphics quality</p>
              {(['auto', 'high', 'low'] as QualityPreference[]).map((q) => (
                <button
                  key={q}
                  role="menuitemradio"
                  aria-checked={quality === q}
                  className={`menu__item ${quality === q ? 'menu__item--active' : ''}`}
                  onClick={() => {
                    setQuality(q);
                    setMenuOpen(false);
                  }}
                >
                  {q === 'auto' ? `Auto (now: ${tier})` : q[0].toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
