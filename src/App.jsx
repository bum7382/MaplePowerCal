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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (/iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent)) {
      setIsMobile(true);
    }
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white text-[1rem] font-galmuri">
        <img src="/images/황당.png" className="w-[30%]"></img>
        ⚠️ 이 사이트는 PC 환경에 최적화되어 있습니다.<br/>
        <span className="mt-2 text-base text-neutral-400">
          원활한 사용을 위해 PC로 접속해주세요.
        </span>
      </div>
    );
  }

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
                {/* 지정되지 않은 모든 경로는 '/'로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
