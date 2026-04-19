import { t, formatTime, useLang } from '../i18n';

export default function PricingModal({ duration, onPurchase, onClose }) {
  useLang();
  const minutes = Math.ceil(duration / 60);
  const totalTimeLostMin = minutes * 30 + 180;
  const totalHours = Math.floor(totalTimeLostMin / 60);

  let priceCents = 500;
  if (minutes > 20) {
    priceCents += Math.ceil((minutes - 20) / 5) * 300;
  }
  const priceUSD = priceCents / 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-compact" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="pricing-display">
          <div className="price-crossed">
            <span className="crossed-amount">${Math.round((totalTimeLostMin / 60) * 15)}</span>
            <span className="crossed-label">{t('crossedLabel')}</span>
          </div>
          <div className="price-tag">
            <span className="price-amount">${priceUSD}</span>
          </div>
        </div>

        <div className="anchor-comparison" dangerouslySetInnerHTML={{
          __html: t('anchorComparison', { hours: totalHours })
        }} />

        <button className="purchase-btn" onClick={onPurchase}>
          {t('purchaseBtn', { price: priceUSD })}
        </button>

        <p className="guarantee">{t('guarantee')}</p>
      </div>
    </div>
  );
}
