import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, getLang, setLang } from '../i18n';

export default function LanguageSwitcher({ onLangChange }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getLang());
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (code) => {
    setLang(code);
    setCurrent(code);
    setOpen(false);
    onLangChange?.(code);
  };

  const currentLang = LANGUAGES.find(l => l.code === current);

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <span className="lang-flag">{currentLang?.flag}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${lang.code === current ? 'active' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-option-flag">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
