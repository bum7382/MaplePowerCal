// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 페이지 라우트
import IntroPage from "./pages/IntroPage";
import CharacterPage from "./pages/CharacterPage";
import MainPage from "./pages/MainPage";


import { ToastProvider } from "./utils/toastContext.jsx";  // 전역 토스트 컨텍스트
import Loading from "./components/Loading";  // 로딩 컴포넌트

function App() {
  const selectedChar = localStorage.getItem("selectedCharacter");

  return (
    
      <ToastProvider>
        <Router>
          <div className="flex flex-col">
            <Routes>
              <Route path="/" element={<IntroPage/>} />
              <Route path="/character" element={<CharacterPage />} />
              <Route path="/main" element={<MainPage />} />
              <Route
                path="/start"
                element={selectedChar ? <Navigate to="/main" replace /> : <Navigate to="/character" replace />}
                />
            </Routes>
            {/* 기타 컴포넌트들 */}
      
            <footer className="w-full py-4 text-center text-sm text-white font-dotum bg-[#96BA44]">
              Data Based on NEXON OPEN API <br />
              This site is not an official site of NEXON and does not provide any warranty.<br />
              ⓒ 2025 스카니아@IBUCHUI. All Rights Reserved.<br />
              contact: maplepowercal@gmail.com
            </footer>
          </div>
        </Router>
      </ToastProvider>
    
  );
}

export default App;
