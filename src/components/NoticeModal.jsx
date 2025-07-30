import React, { useState } from "react";

export default function NoticeModal({ onClose, notices }) {
  const [selectedIdx, setSelectedIdx] = useState(null);


  // 리스트 화면
  if (selectedIdx === null) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
        <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-lg max-h-[90vh] font-galmuri p-6">
          <button
            className="absolute top-[0.5px] right-2 text-[15px] text-gray-500 hover:text-black font-bold"
            onClick={onClose}>
							✕
					</button>
          <h2 className="absolute -top-[36px] left-[25px] bg-[#44B7CF] font-galmuri text-white px-6 py-2 rounded-t-lg text-sm shadow-md z-20">공지사항</h2>
          <ul className="divide-y divide-gray-200 rounded-lg shadow bg-white/60 backdrop-blur p-2 max-h-[60vh] overflow-y-auto">
            {notices.length === 0 ? (
              <li className="text-center text-gray-400 py-12">등록된 공지사항이 없습니다</li>
            ) : (
              notices.map((notice, idx) => (
                <li
                  key={idx}
                  className="py-4 px-4 cursor-pointer hover:bg-[#f0faff] transition"
                  onClick={() => setSelectedIdx(idx)}
                >
                  <span className="font-bold text-[#44B7CF] mr-2">[Notice]</span>
                  <span className="font-medium">{notice.title}</span>
                  <span className="float-right text-xs text-gray-400">{notice.date}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  }

  // 상세 화면
  const notice = notices[selectedIdx];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-lg max-h-[90vh] font-galmuri p-6">
        <button
          className="absolute top-3 right-4 text-xl text-gray-500 hover:text-black font-bold"
          onClick={onClose}
        >✕</button>
        <button
          className="absolute top-3 left-4 text-xl text-gray-500 hover:text-black font-bold"
          onClick={() => setSelectedIdx(null)}
        >←</button>
        <h2 className="text-[20px] font-bold font-dotum mb-[-1px] text-[#44B7CF] mt-5">{notice.title}</h2>
        <div className="text-xs text-gray-400 mb-4">{notice.date}</div>
        <div className="whitespace-pre-line text-gray-900 text-base leading-relaxed max-h-[45vh] overflow-y-auto mb-6">
          {notice.text}
        </div>
        <button
          className="block mx-auto px-6 py-2 bg-gray-400 text-white rounded-lg shadow hover:bg-gray-600 font-dotum"
          onClick={onClose}
        >닫기</button>
      </div>
    </div>
  );
}
