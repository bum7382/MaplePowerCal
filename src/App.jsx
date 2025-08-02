// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 페이지 라우트
import IntroPage from "./pages/IntroPage";
import MainPage from "./pages/MainPage";


import { ToastProvider } from "./utils/toastContext.jsx";  // 전역 토스트 컨텍스트

function App() {
  return (
      <ToastProvider>
        <Router>
          <div className="flex flex-col">
            <Routes>
              <Route path="/" element={<IntroPage/>} />
              <Route path="/main" element={<MainPage />} />
              {/* 지정되지 않은 엔드포인트로 이동 시 처음 화면으로 돌아감 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* 저작권 표시 */}
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
