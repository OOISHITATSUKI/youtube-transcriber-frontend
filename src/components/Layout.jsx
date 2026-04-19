import { useLang } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';

export default function Layout({ children }) {
  useLang();

  return (
    <div className="app">
      <div className="top-bar">
        <LanguageSwitcher onLangChange={() => {}} />
      </div>
      {children}
      <Footer />
    </div>
  );
}
