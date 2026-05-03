import { useState, useEffect, useRef } from 'react';
import { t, useLang } from '../i18n';
import { useAuth } from '../AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function PricingPage() {
  useLang();
  const { user, isLoggedIn, handleGoogleResponse } = useAuth();
  const [purchasing, setPurchasing] = useState(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn || !googleBtnRef.current) return;
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
        size: 'large',
        text: 'signin',
        locale: 'ja',
        width: 280,
      });
      return true;
    };

    if (!tryRender()) {
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, handleGoogleResponse]);

  const handlePurchase = async (planId) => {
    if (!isLoggedIn) return;
    setPurchasing(planId);
    try {
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, userToken: user.userToken }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="tool-page">
      <div className="pricing-page-header">
        <h1>{t('pricing_page_title')}</h1>
        <p>{t('pricing_page_desc')}</p>
        {isLoggedIn && (
          <div className="pricing-current-credits">
            {user.email} — {t('pricing_page_current')}: <strong>{user?.credits ?? 0} credits</strong>
          </div>
        )}
      </div>

      {!isLoggedIn && (
        <div className="pricing-login-required">
          <div className="pricing-login-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3>{t('pricing_page_login_required')}</h3>
          <p>{t('pricing_page_login_desc')}</p>
          <div ref={googleBtnRef} className="pricing-google-btn"></div>
        </div>
      )}

      {/* Section: Credit Packs */}
      <h3 className="pricing-section-title">{t('pricing_section_credits')}</h3>
      <div className={`pricing-cards ${!isLoggedIn ? 'disabled' : ''}`}>
        {/* Pack 5 */}
        <div className="pricing-card">
          <h2>5 {t('pricing_credits')}</h2>
          <div className="pricing-price">$1.00</div>
          <div className="pricing-per">$0.20 {t('pricing_page_per')}</div>
          <ul className="pricing-features">
            <li>{t('pricing_page_feature1', { credits: 5 })}</li>
            <li>{t('pricing_page_feature2')}</li>
            <li>{t('pricing_page_feature3')}</li>
          </ul>
          <button
            className="pricing-buy-btn"
            onClick={() => handlePurchase('pack5')}
            disabled={!isLoggedIn || purchasing === 'pack5'}
          >
            {!isLoggedIn ? t('pricing_page_login_first') : purchasing === 'pack5' ? t('pricing_page_processing') : t('pricing_page_buy', { price: '1.00' })}
          </button>
        </div>

        {/* Pack 10 */}
        <div className="pricing-card">
          <span className="pricing-badge">25% OFF</span>
          <h2>10 {t('pricing_credits')}</h2>
          <div className="pricing-price">$1.50</div>
          <div className="pricing-per">$0.15 {t('pricing_page_per')}</div>
          <ul className="pricing-features">
            <li>{t('pricing_page_feature1', { credits: 10 })}</li>
            <li>{t('pricing_page_feature2')}</li>
            <li>{t('pricing_page_feature3')}</li>
          </ul>
          <button
            className="pricing-buy-btn"
            onClick={() => handlePurchase('pack10')}
            disabled={!isLoggedIn || purchasing === 'pack10'}
          >
            {!isLoggedIn ? t('pricing_page_login_first') : purchasing === 'pack10' ? t('pricing_page_processing') : t('pricing_page_buy', { price: '1.50' })}
          </button>
        </div>
      </div>

      {/* Section: Subscription */}
      <h3 className="pricing-section-title">{t('pricing_section_subscription')}</h3>
      <div className={`pricing-cards ${!isLoggedIn ? 'disabled' : ''}`}>
        <div className="pricing-card popular subscription-card">
          <span className="pricing-popular">{t('pricing_page_popular')}</span>
          <span className="pricing-badge">{t('pricing_best_value')}</span>
          <h2>{t('pricing_unlimited')}</h2>
          <div className="pricing-price">$4.99<span className="pricing-price-period"> / {t('pricing_month')}</span></div>
          <div className="pricing-per">{t('pricing_unlimited_desc')}</div>
          <ul className="pricing-features">
            <li>{t('pricing_sub_feature1')}</li>
            <li>{t('pricing_sub_feature2')}</li>
            <li>{t('pricing_sub_feature3')}</li>
            <li>{t('pricing_sub_feature4')}</li>
            <li>{t('pricing_sub_feature5')}</li>
          </ul>
          <button
            className="pricing-buy-btn subscription-btn"
            onClick={() => handlePurchase('monthly_unlimited')}
            disabled={!isLoggedIn || purchasing === 'monthly_unlimited'}
          >
            {!isLoggedIn ? t('pricing_page_login_first') : purchasing === 'monthly_unlimited' ? t('pricing_page_processing') : t('pricing_subscribe_btn')}
          </button>
        </div>
      </div>

      <div className="pricing-note">
        <p>{t('pricing_page_note')}</p>
        <p style={{ marginTop: 4 }}>{t('pricing_sub_cancel_note')}</p>
      </div>
    </div>
  );
}
