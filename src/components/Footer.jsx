import { Link } from 'react-router-dom';
import { t, useLang } from '../i18n';

export default function Footer() {
  useLang();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h4>{t('footerSubtitlingTools')}</h4>
          <ul>
            <li><Link to="/open-srt">{t('footerOpenSrt')}</Link></li>
            <li><Link to="/srt-to-vtt">{t('footerSrtToVtt')}</Link></li>
            <li><Link to="/srt-to-ass">{t('footerSrtToAss')}</Link></li>
            <li><Link to="/srt-to-txt">{t('footerSrtToTxt')}</Link></li>
            <li><Link to="/lrc-to-srt">{t('footerLrcToSrt')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('footerVideoEditing')}</h4>
          <ul>
            <li><Link to="/">{t('footerTranscriber')}</Link></li>
            <li><Link to="/audio">{t('footerAudioTranscriber')}</Link></li>
            <li><Link to="/video-splitter">{t('footerVideoSplitter')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('footerAudioTools')}</h4>
          <ul>
            <li><Link to="/wav-to-mp3">{t('footerWavToMp3')}</Link></li>
            <li><Link to="/mp3-to-wav">{t('footerMp3ToWav')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('footerImageTools')}</h4>
          <ul>
            <li><Link to="/image-to-webp">{t('footerImageToWebp')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('footerLegal')}</h4>
          <ul>
            <li><Link to="/terms">{t('footerTerms')}</Link></li>
            <li><Link to="/privacy">{t('footerPrivacy')}</Link></li>
            <li><Link to="/commerce">{t('footerCommerce')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-beta">{t('beta_notice')}</p>
        <p>{t('footerMain')}</p>
      </div>
    </footer>
  );
}
