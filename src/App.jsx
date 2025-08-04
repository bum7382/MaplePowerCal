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
              {/* 아이콘 버튼 영역 */}
              <div className="flex justify-center gap-4 mb-3">
                {/* 지메일 */}
                <a href="mailto:maplepowercal@gmail.com" target="_blank" rel="noopener noreferrer" title="이메일">
                  <img src="/images/icons/지메일.png" alt="지메일" className="select-none w-10 h-10 inline-block hover:brightness-110 active:brightness-90" />
                </a>
                {/* 카카오톡 */}
                <a href="https://open.kakao.com/o/sBmiSGKh" target="_blank" rel="noopener noreferrer" title="카카오톡 오픈채팅">
                  <img src="/images/icons/카카오톡.png" alt="카카오톡" className="select-none w-10 h-10 inline-block hover:brightness-110 active:brightness-90" />
                </a>
                {/* 유튜브 */}
                {/*<a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" title="유튜브">
                  <img src="/images/icons/유튜브.png" alt="유튜브" className="select-none w-10 h-10 inline-block hover:brightness-110 active:brightness-90" />
                </a>*/}
              </div>

              {/* 글씨 영역 */}
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
