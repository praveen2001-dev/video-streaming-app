import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { VideoPlayer } from './pages/VideoPlayer';
import { AdminUpload } from './pages/AdminUpload';
import { AdminManage } from './pages/AdminManage';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<VideoPlayer />} />
          <Route path="/upload" element={<AdminUpload />} />
          <Route path="/manage" element={<AdminManage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
