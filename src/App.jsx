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
    <>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<IntroPage/>} />
            <Route path="/character" element={<CharacterPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route
              path="/start"
              element={selectedChar ? <Navigate to="/main" replace /> : <Navigate to="/character" replace />}
              />
          </Routes>
        </Router>
      </ToastProvider>
    </>
  );
}

export default App;
