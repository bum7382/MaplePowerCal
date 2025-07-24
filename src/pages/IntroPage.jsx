// frontend/src/pages/IntroPage.jsx
// 처음 화면
import React, { useState, useEffect } from "react";
import SearchModal from "../components/SearchModal";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { getCachedCharacter, setCachedCharacter } from "../utils/charCache";
import { fetchCharacterByName } from "../utils/fetchCharacterByName.js";
import { useToast } from "../utils/toastContext";

export default function IntroPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 마운트 시 localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    setFavorites(saved ? JSON.parse(saved) : []);
  }, []);

  // 즐겨찾기에서 캐릭터 삭제
  const handleRemove = (name) => {
    const filtered = favorites.filter(char => char !== name);
    setFavorites(filtered);
    localStorage.setItem("favorites", JSON.stringify(filtered));
  };

  // 검색 시작 시 모달 닫고 로딩
  const handleSearchStart = () => {
    setShowSearch(false);
    setLoading(true);
  };

  // API 완료 시 데이터 저장하고 페이지 이동
  const handleSearchSuccess = (character) => {
    localStorage.setItem("selectedCharacter", JSON.stringify(character));
    setLoading(false);
    navigate("/main");
  };

  // 즐겨찾기 캐릭터 닉네임 클릭 시 바로 검색
  const handleFavoriteClick = async (name) => {
    handleSearchStart(); // 로딩 시작
    // 실제 캐릭터 검색 API 호출 (함수는 프로젝트 구조에 맞게)
    try {
      // 1. 캐시 체크 (30분 이내면 캐시)
      const cached = getCachedCharacter(name);
      if (cached) {
        handleSearchSuccess(cached);
        return;
      }
      // 2. 캐시에 없으면 api 호출
      const result = await fetchCharacterByName(name);
      if (!result) {
        setLoading(false);
        showToast("캐릭터 정보를 불러오지 못했습니다.", "error");
        return;
      }
      setCachedCharacter(name, result);
      handleSearchSuccess(result);
    } catch (e) {
      setLoading(false);
      showToast("캐릭터 정보를 불러오지 못했습니다.", "error");
    }
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
          className="w-[160px] h-[50px] font-galmuri text-white text-[16px] rounded-full 
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
            text-white text-[15px] font-galmuri tracking-widest select-none
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
            <span className="text-gray-400 text-base font-galmuri">
              즐겨찾기 캐릭터가 없습니다
            </span>
          ) : (
            favorites.map((char) => (
              <div
                key={char}
                className="active:brightness-75 hover:brightness-125 transition"
                onClick={() => handleFavoriteClick(char)}>
                <span
                  
                  className="
                    flex items-center bg-white/80 rounded-full px-4 py-1 
                    text-gray-800 text-[15px] shadow font-galmuri
                    mr-2 mb-2"
                >
                  <span className="mr-2">{char}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 전파 방지
                      handleRemove(char);
                    }}
                    className="text-red-400 ml-1 hover:text-red-700 text-[15px] font-bold mb-[4px]"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>


      {/* SearchModal 모달 렌더링 */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSearchStart={handleSearchStart}
          onSearchSuccess={handleSearchSuccess}
        />
      )}

      {loading && <Loading visible={true} />}
    </div>
  );
}
