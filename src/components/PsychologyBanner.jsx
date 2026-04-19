import { t, formatTime, useLang } from '../i18n';

export default function PsychologyBanner({ duration, onPurchase }) {
  useLang();
  const minutes = Math.ceil(duration / 60);
  const timeLostMin = minutes * 30;
  const timeStr = formatTime(timeLostMin);

  return (
    <div className="psychology-banner">
      <div className="banner-content">
        <span className="banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        <div className="banner-text">
          <p className="banner-main" dangerouslySetInnerHTML={{
            __html: t('bannerMain', { time: timeStr })
          }} />
          <p className="banner-sub">{t('bannerSub')}</p>
        </div>
        <button className="banner-cta" onClick={onPurchase}>
          {t('bannerCta')}
        </button>
      </div>
    </div>
  );
}
