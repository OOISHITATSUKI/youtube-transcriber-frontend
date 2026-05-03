import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t, useLang, setLang, getLang } from '../i18n';
import { useAuth } from '../AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
];

export default function AccountPage() {
  useLang();
  const { user, isLoggedIn, logout, refreshCredits } = useAuth();
  const [currentLang, setCurrentLang] = useState(getLang());
  const [usage, setUsage] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      refreshCredits();
      fetchUsage();
    }
  }, []);

  const fetchUsage = async () => {
    if (!user?.userToken) return;
    setUsageLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/usage?token=${user.userToken}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage || []);
      }
    } catch {}
    setUsageLoading(false);
  };

  const handleLangChange = (code) => {
    setLang(code);
    setCurrentLang(code);
  };

  if (!isLoggedIn) {
    return (
      <div className="tool-page">
        <div className="account-not-logged-in">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2>ログインが必要です</h2>
          <p>アカウント設定を表示するにはGoogleアカウントでログインしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>アカウント設定</h1>
      </div>

      {/* Profile Section */}
      <section className="account-section">
        <h2 className="account-section-title">プロフィール</h2>
        <div className="account-profile-card">
          <div className="account-avatar">
            {user.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{(user.name || user.email || '?')[0]}</span>
            )}
          </div>
          <div className="account-profile-info">
            <div className="account-profile-name">{user.name || user.email?.split('@')[0]}</div>
            <div className="account-profile-email">{user.email}</div>
          </div>
        </div>
      </section>

      {/* Credits Section */}
      <section className="account-section">
        <h2 className="account-section-title">クレジット</h2>
        <div className="account-credits-card">
          <div className="account-credits-main">
            <span className="account-credits-number">{user.credits ?? 0}</span>
            <span className="account-credits-unit">credits</span>
          </div>
          <p className="account-credits-desc">
            1クレジット = 動画1本の全文文字起こし（20分まで）
          </p>
          <button
            className="convert-btn"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => window.dispatchEvent(new CustomEvent('openPricing'))}
          >
            クレジットを購入
          </button>
        </div>
      </section>

      {/* Language Section */}
      <section className="account-section">
        <h2 className="account-section-title">言語設定</h2>
        <div className="account-lang-grid">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`account-lang-btn ${currentLang === lang.code ? 'active' : ''}`}
              onClick={() => handleLangChange(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Usage History Section */}
      <section className="account-section">
        <h2 className="account-section-title">利用履歴（直近7日間）</h2>
        {usageLoading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>読み込み中...</p>
        ) : usage.length > 0 ? (
          <div className="account-usage-list">
            {usage.map((item, i) => (
              <div key={i} className="account-usage-item">
                <span className="account-usage-title">
                  {item.file_name || item.video_url || item.usage_type || '文字起こし'}
                </span>
                <span className="account-usage-date">
                  {new Date(item.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="account-usage-credits">-{item.credits_used}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="account-usage-empty">
            まだ利用履歴はありません
            <p style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ※ 利用履歴はクレジット購入後の文字起こしから記録されます
            </p>
          </div>
        )}
      </section>

      {/* Legal Section */}
      <section className="account-section">
        <h2 className="account-section-title">法的情報</h2>
        <div className="account-legal-links">
          <Link to="/terms" className="account-legal-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            利用規約
          </Link>
          <Link to="/privacy" className="account-legal-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            プライバシーポリシー
          </Link>
          <Link to="/commerce" className="account-legal-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            特定商取引法に基づく表記
          </Link>
        </div>
      </section>

      {/* Logout */}
      <section className="account-section">
        <button className="account-logout-btn" onClick={logout}>
          ログアウト
        </button>
      </section>
    </div>
  );
}
