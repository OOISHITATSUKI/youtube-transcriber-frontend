import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OpenSrtFile from './pages/OpenSrtFile';
import SrtToVtt from './pages/SrtToVtt';
import SrtToAss from './pages/SrtToAss';
import SrtToTxt from './pages/SrtToTxt';
import LrcToSrt from './pages/LrcToSrt';
import VideoSplitter from './pages/VideoSplitter';
import ImageConverter from './pages/ImageConverter';
import AudioPage from './pages/AudioPage';
import AudioConverter from './pages/AudioConverter';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CommercePage from './pages/CommercePage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
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
          <Route path="/audio" element={<AudioPage />} />
          <Route path="/wav-to-mp3" element={<AudioConverter mode="wav-to-mp3" />} />
          <Route path="/mp3-to-wav" element={<AudioConverter mode="mp3-to-wav" />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/commerce" element={<CommercePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
