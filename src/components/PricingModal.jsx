import { useState } from 'react';
import { t, useLang } from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || '';

const PLANS = [
  { id: 'pack5', credits: 5, price: 2.50, perCredit: 0.50, popular: false },
  { id: 'pack10', credits: 10, price: 4.00, perCredit: 0.40, popular: true, discount: '20% OFF' },
];

export default function PricingModal({ duration, onClose, userToken }) {
  useLang();
  const [selectedPlan, setSelectedPlan] = useState('pack10');
  const [purchasing, setPurchasing] = useState(false);

  const selected = PLANS.find(p => p.id === selectedPlan);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, userToken }),
      });
      const data = await res.json();
      if (data.url) {
        if (data.userToken) localStorage.setItem('yt_user_token', data.userToken);
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-header">
          <h2>{t('pricing_title')}</h2>
          <p className="subtitle">{t('pricing_subtitle')}</p>
        </div>

        <div className="plan-cards">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.discount && <span className="plan-badge">{plan.discount}</span>}
              {plan.popular && <span className="plan-popular-badge">{t('pricing_popular')}</span>}
              <h3 className="plan-name">{plan.credits} {t('pricing_credits')}</h3>
              <div className="plan-price">${plan.price.toFixed(2)}</div>
              <div className="plan-per-credit">${plan.perCredit.toFixed(2)} / {t('pricing_each')}</div>
            </div>
          ))}
        </div>

        <div className="pricing-features">
          <p>{t('pricing_feature1')}</p>
          <p>{t('pricing_feature2')}</p>
          <p>{t('pricing_feature3')}</p>
        </div>

        <button className="purchase-btn" onClick={handlePurchase} disabled={purchasing}>
          {purchasing ? t('pricing_processing') : t('pricing_buyBtn', { price: selected.price.toFixed(2), credits: selected.credits })}
        </button>

        <p className="guarantee">{t('guarantee')}</p>
      </div>
    </div>
  );
}
