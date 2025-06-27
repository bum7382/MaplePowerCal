// frontend/src/pages/IntroPage.jsx
// 처음 화면
import React, { useState, useEffect } from "react";
import SearchModal from "../components/SearchModal";
import { useNavigate } from "react-router-dom";

export default function IntroPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  // 마운트 시 localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    setFavorites(saved ? JSON.parse(saved) : []);
  }, []);

  // 즐겨찾기에서 캐릭터 삭제
  const handleRemove = (name) => {
    const filtered = favorites.filter((char) => char.name !== name);
    setFavorites(filtered);
    localStorage.setItem("favorites", JSON.stringify(filtered));
  };

  // 캐릭터 검색 성공 시(검색 성공 후 바로 MainPage로 이동)
  const handleSearch = (character) => {
    // 캐릭터 정보 localStorage에 저장
    localStorage.setItem("selectedCharacter", JSON.stringify(character));
    setShowSearch(false);
    // MainPage로 이동
    navigate("/main");
  };

  return (
    <div
      className="select-none drag-none relative w-screen h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/background.png)' }}
    >
      <div className="flex flex-col items-center mb-10">
        <img
          src="/images/logo.png"
          alt="메이플 스펙업 효율 계산기"
          draggable="false"
          className="w-70 h-auto mb-4 drop-shadow-xl"
        />
      </div>

      <div className="flex gap-[100px]">
        <button
          onClick={() => setShowSearch(true)}
          className="w-[160px] h-[50px] font-morris text-white text-[18px] rounded-full 
                     bg-[#44B7CF] hover:bg-[#369EBC] border-2 border-white shadow-md mb-4"
        >
          캐릭터 검색하기
        </button>
      </div>
      
      {/* 즐겨찾기 캐릭터 리스트 블러 박스 */}
      <div className="
        w-[650px] min-h-[60px] mt-5 mx-auto rounded-[20px]
        bg-white/60 backdrop-blur-md flex flex-wrap justify-center items-center 
        px-6 py-4 gap-2 shadow-lg
      ">
        {/* (즐겨찾기) 타이틀 */}
        <span
          className="
            absolute
            left-[21px] 
            -top-[30px]
            text-white text-[15px] font-morris tracking-widest select-none
            bg-[#44B7CF]/80 px-4 py-1 shadow rounded-[10px] backdrop-blur-md
            z-0
          "
          style={{ pointerEvents: "none" }}
        >
          ⭐즐겨찾기
        </span>
        {/* 닉네임 pill 리스트 */}
        <div className="flex flex-wrap justify-center items-center gap-2 max-h-[120px] overflow-y-auto w-full
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#44B7CF]/80
        ">
          {favorites.length === 0 ? (
            <span className="text-gray-400 text-base font-morris">
              즐겨찾기 캐릭터가 없습니다
            </span>
          ) : (
            favorites.map((char) => (
              <span
                key={char.name}
                className="
                  flex items-center bg-white/80 rounded-full px-4 py-1 
                  text-gray-800 text-[15px] shadow font-morris
                  mr-2 mb-2
                "
              >
                <span className="mr-2">{char.name}</span>
                <button
                  onClick={() => handleRemove(char.name)}
                  className="text-red-400 ml-1 hover:text-red-700 text-lg font-bold"
                  style={{ lineHeight: 1 }}
                >
                  X
                </button>
              </span>
            ))
          )}
        </div>
      </div>


      {/* SearchModal 모달 렌더링 */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSearch={handleSearch}
        />
      )}
    </div>
  );
}
