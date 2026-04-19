import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OpenSrtFile from './pages/OpenSrtFile';
import SrtToVtt from './pages/SrtToVtt';
import SrtToAss from './pages/SrtToAss';
import SrtToTxt from './pages/SrtToTxt';
import LrcToSrt from './pages/LrcToSrt';
import VideoSplitter from './pages/VideoSplitter';
import ImageToWebp from './pages/ImageToWebp';
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
          <Route path="/image-to-webp" element={<ImageToWebp />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
