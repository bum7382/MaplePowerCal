// src/components/SearchModal.jsx
// 캐릭터 검색 모달 컴포넌트
import React, { useState, useEffect } from "react";
import { fetchCharacterByName } from "../utils/fetchCharacterByName.js";
import { useToast } from "../utils/toastContext.jsx";
import { getCachedCharacter, setCachedCharacter } from "../utils/charCache.js";

export default function SearchModal({ onClose, onSearchStart, onSearchSuccess, setLoading }) {
  const [inputValue, setInputValue] = useState("");
  const [recent, setRecent] = useState([]);
  const { showToast } = useToast();

  // 최근 검색 기록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    setRecent(saved ? JSON.parse(saved) : []);
  }, []);

  // 최근 검색 기록에 닉네임 추가 (중복X, 5개)
  const addRecent = (name) => {
    if (!name) return;
    let next = [name, ...recent.filter((v) => v !== name)];
    if (next.length > 5) next = next.slice(0, 5);
    setRecent(next);
    localStorage.setItem("recentSearches", JSON.stringify(next));
  };
  
  // 캐릭터 검색 처리
  const handleSearch = async () => {
    const name = inputValue.trim();
    if (!name) {
      showToast("❌ 캐릭터 이름을 입력하세요.", "error");
      return;
    }
    if (onSearchStart) onSearchStart(); // 로딩화면

    // 캐시 체크 - 30분 이내 재검색 시 api 호출 X
    const cached = getCachedCharacter(name);
    if (cached) {
      addRecent(name);
      if (onSearchSuccess) onSearchSuccess(cached);
      return;
    }

    // 캐시 존재 X 시 api 호출
    const result = await fetchCharacterByName(inputValue.trim());
    if (!result || result?.error) {
      showToast("캐릭터를 찾을 수 없습니다.", "error");
      if (setLoading) setLoading(false);
      return;
    }

    // 캐시에 저장
    setCachedCharacter(name, result);
    addRecent(result.name);
    if (onSearchSuccess) onSearchSuccess(result);
  };

  // 최근 검색 닉네임 클릭 시 input에 넣고 바로 검색할 수도 있음
  const handleRecentClick = (name) => {
    setInputValue(name);
  };

  return (
    <div className="select-none fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-[20px] w-[90vw] max-w-[600px] p-6 sm:p-10 relative shadow-lg">
        <div className="absolute -top-[36px] left-[25px] bg-[#44B7CF] font-galmuri text-white px-6 py-2 rounded-t-lg text-sm shadow-md z-20">
          캐릭터 검색
        </div>

        <div className="flex flex-col items-center mb-10">
          <img
            src="/images/logo.png"
            alt="메이플 스펙업 효율 계산기"
            className="w-[200px] sm:w-70 h-auto mb-0 sm:mb-4 drop-shadow-xl"
          />
        </div>

        <div className="flex rounded-full bg-gray-100 overflow-hidden font-galmuri shadow-inner">
          <input
            type="text"
            placeholder="캐릭터 이름을 입력하세요."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="flex-1 px-4 py-2 outline-none bg-gray-100 text-sm"
          />
          <button
            type="button"
            onClick={() => handleSearch()}
            className="bg-[#44B7CF] text-white px-4 sm:px-6 text-sm font-galmuri hover:bg-[#369EBC]"
          >
            검색
          </button>
        </div>

        {/* 최근 검색 기록 */}
        <div className="mt-5">
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-gray-500 font-galmuri text-sm mr-1">최근 검색 :</span>
              {recent.slice(0, 5).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="bg-white border border-[#44B7CF] text-[#44B7CF] font-galmuri rounded-full px-3 py-1 text-sm shadow hover:bg-[#44B7CF] hover:text-white transition"
                  onClick={() => handleRecentClick(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
