import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OpenSrtFile from './pages/OpenSrtFile';
import SrtToVtt from './pages/SrtToVtt';
import SrtToAss from './pages/SrtToAss';
import SrtToTxt from './pages/SrtToTxt';
import LrcToSrt from './pages/LrcToSrt';
import VideoSplitter from './pages/VideoSplitter';
import ImageConverter from './pages/ImageConverter';
import PdfConverter from './pages/PdfConverter';
import AudioPage from './pages/AudioPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CommercePage from './pages/CommercePage';
import VseoPage from './pages/VseoPage';
import AccountPage from './pages/AccountPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import ThumbnailPage from './pages/ThumbnailPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/open-srt" element={<OpenSrtFile />} />
          <Route path="/srt-to-vtt" element={<SrtToVtt />} />
          <Route path="/srt-to-ass" element={<SrtToAss />} />
          <Route path="/srt-to-txt" element={<SrtToTxt />} />
          <Route path="/lrc-to-srt" element={<LrcToSrt />} />
          <Route path="/video-splitter" element={<VideoSplitter />} />
          <Route path="/image-to-webp" element={<ImageConverter />} />
          <Route path="/pdf-converter" element={<PdfConverter />} />
          <Route path="/vseo" element={<VseoPage />} />
          <Route path="/audio" element={<AudioPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/commerce" element={<CommercePage />} />
          <Route path="/thumbnail" element={<ThumbnailPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
