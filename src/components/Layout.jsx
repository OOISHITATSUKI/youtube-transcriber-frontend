import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t, useLang } from '../i18n';
import { useAuth } from '../AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';

export default function Layout({ children }) {
  useLang();
  const { user, isLoggedIn, loading, logout, handleGoogleResponse } = useAuth();
  const googleBtnRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Render / cleanup Google Sign-In button
  useEffect(() => {
    // While loading from localStorage, do nothing (don't render GSI button prematurely)
    if (loading) return;

    if (isLoggedIn) {
      const cleanup = () => {
        try { window.google?.accounts?.id?.cancel(); } catch {}
        document.querySelectorAll(
          '[id^="credential_picker"], [id^="g_id_"], iframe[src*="accounts.google.com"], .g_id_signin, div[style*="accounts.google.com"]'
        ).forEach(el => el.remove());
        if (googleBtnRef.current) googleBtnRef.current.innerHTML = '';
      };
      // Run immediately + after delay to catch async GSI injections
      cleanup();
      const t1 = setTimeout(cleanup, 300);
      const t2 = setTimeout(cleanup, 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    // Not logged in: render Google Sign-In button
    if (!googleBtnRef.current) return;
    googleBtnRef.current.innerHTML = '';

    const tryRender = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        size: 'medium',
        text: 'signin',
        locale: 'ja',
      });
      return true;
    };

    if (!tryRender()) {
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loading, handleGoogleResponse]);

  // Toggle body class for CSS-level GSI hiding
  useEffect(() => {
    if (isLoggedIn) {
      document.body.classList.add('logged-in');
    } else {
      document.body.classList.remove('logged-in');
    }
  }, [isLoggedIn]);

  // Close dropdown on outside click or ESC
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleShowPricing = () => {
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('openPricing'));
  };

  return (
    <div className="app">
      <div className="top-bar">
        <Link to="/" className="top-bar-logo">
          YT Transcriber <span className="beta-badge">BETA</span>
        </Link>
        <div className="top-bar-right">
          {loading ? null : isLoggedIn ? (
            <div className="user-menu" ref={menuRef}>
              <button className="user-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="credits-badge">{user.credits ?? 0} credits</span>
                <div className="user-avatar-small">
                  {user.picture ? (
                    <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{(user.name || user.email || '?')[0]}</span>
                  )}
                </div>
              </button>

              {menuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user.picture ? (
                        <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{(user.name || user.email || '?')[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="dropdown-name">{user.name || user.email?.split('@')[0]}</div>
                      <div className="dropdown-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-credits">
                    <span className="dropdown-credits-label">クレジット残高</span>
                    <span className="dropdown-credits-value">{user.credits ?? 0}</span>
                  </div>
                  <Link to="/pricing" className="dropdown-buy-btn" onClick={() => setMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                    {t('buy_credits')}
                  </Link>

                  <div className="dropdown-divider" />

                  <Link to="/account" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    アカウント設定
                  </Link>
                  <Link to="/account" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    利用履歴
                  </Link>

                  <div className="dropdown-divider" />

                  <button className="dropdown-logout" onClick={() => { setMenuOpen(false); logout(); }}>
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div ref={googleBtnRef} className="google-btn-container" />
          )}
          <LanguageSwitcher onLangChange={() => {}} />
        </div>
      </div>
      {children}
      <Footer />
    </div>
  );
}
