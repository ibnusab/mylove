import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ParticleCanvas } from './components/ParticleCanvas';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GlobalMusicPlayer } from './components/GlobalMusicPlayer';

import { Home } from './pages/Home';
import { Story } from './pages/Story';
import { Gallery } from './pages/Gallery';
import { MusicPage } from './pages/Music';
import { Notes } from './pages/Notes';
import { Anniversary } from './pages/Anniversary';
import { MemoryCalendar } from './pages/Calendar';
import { LoveLetterPage } from './pages/Letter';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="relative min-h-screen bg-[#FFF0F6] text-[#5C3A4D] font-sans antialiased selection:bg-[#F8BBD0] selection:text-[#5C3A4D] flex flex-col justify-between overflow-x-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#FFE4EC] rounded-full blur-3xl opacity-70 pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#F8BBD0] rounded-full blur-[90px] opacity-50 pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-[#FF69B4] rounded-full opacity-30 pointer-events-none" />

          {/* Background Floating Particle System */}
          <ParticleCanvas />

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Content View */}
          <main className="relative z-10 flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story" element={<Story />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/anniversary" element={<Anniversary />} />
              <Route path="/calendar" element={<MemoryCalendar />} />
              <Route path="/letter" element={<LoveLetterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>

          {/* Floating Music Player Widget */}
          <GlobalMusicPlayer />

          {/* Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
