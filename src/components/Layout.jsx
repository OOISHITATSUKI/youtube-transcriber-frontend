import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';

export default function Layout({ children }) {
  useLang();

  return (
    <div className="app">
      <div className="top-bar">
        <Link to="/" className="top-bar-logo">
          YT Transcriber <span className="beta-badge">BETA</span>
        </Link>
        <LanguageSwitcher onLangChange={() => {}} />
      </div>
      {children}
      <Footer />
    </div>
  );
}
