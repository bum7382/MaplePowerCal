// frontend/src/pages/IntroPage.jsx
// 처음 화면
import React, { useState, useEffect } from "react";
import SearchModal from "../components/SearchModal";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { getCachedCharacter, setCachedCharacter } from "../utils/charCache";
import { fetchCharacterByName } from "../utils/fetchCharacterByName.js";
import { useToast } from "../utils/toastContext";
import NoticeModal from "../components/NoticeModal.jsx";

export default function IntroPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // 공지 상태
  const [notices, setNotices] = useState([]);
  const [notice, setNotice] = useState(false);

  // 공지 가지고 오기
  useEffect(() => {
    fetch("/data/notices.json")
      .then(res => res.json())
      .then(data => setNotices(data.reverse()));
  }, []);

  // 첫 화면에서 즐겨찾기 불러오기
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

  // 검색 시 캐릭터 검색 모달 닫고 로딩
  const handleSearchStart = () => {
    setShowSearch(false);
    setLoading(true);
  };

  // API 완료 시 데이터 저장하고 메인 페이지 이동
  const handleSearchSuccess = (character) => {
    localStorage.setItem("selectedCharacter", JSON.stringify(character));
    setLoading(false);
    navigate("/main");
  };

  // 즐겨찾기 캐릭터 닉네임 클릭 시 바로 검색
  const handleFavoriteClick = async (name) => {
    handleSearchStart(); // 로딩 시작
    // API 호출
    try {
      // 1. 캐시 체크(30분) - 최초 검색 후 30분 이내 검색이면 재검색 X
      const cached = getCachedCharacter(name);
      if (cached) {
        handleSearchSuccess(cached);
        return;
      }
      // 2. 캐시에 없으면 api 호출
      const result = await fetchCharacterByName(name);
      // 실패: 응답 받지 못하면 에러
      if (!result) {
        setLoading(false);
        showToast("캐릭터 정보를 불러오지 못했습니다.", "error");
        return;
      }
      // 성공: 캐시 저장 후 메인 페이지로 이동
      setCachedCharacter(name, result);
      handleSearchSuccess(result);
    } catch (e) {
      setLoading(false);
      showToast("캐릭터 정보를 불러오지 못했습니다.", "error");
    }
  };


  return (
    <div
      className="select-none drag-none relative w-screen h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat "
      style={{ backgroundImage: 'url(/images/background.png)' }}>
      {/* 공지사항 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-50">
        <div className="
          bg-[#1F2735] bg-opacity-60 font-galmuri text-white rounded-[10px] flex flex-row items-center px-4 py-2 shadow-md
          max-w-[90vw] w-fit min-w-[200px]"
          onClick={() => {
            setNotice(true);
          }}>
          <img src="/images/icons/확성기.png"
            className="w-5 h-5 sm:w-7 sm:h-7 mr-2"
            alt="공지"
            draggable={false}
          />
          {/* 미리보기 문장 */}
          <span className="text-xs sm:text-base whitespace-pre-line">
            {notices.length > 0 ? notices[0].title : "공지사항입니다."}
          </span>
        </div>
      </div>

      {/* 로고 */}
      <div className="flex flex-col items-center mb-2 sm:mb-10">
        <img
          src="/images/logo.png"
          alt="메이플 스펙업 효율 계산기"
          draggable="false"
          className="w-70 h-auto mb-4 drop-shadow-xl"
        />
      </div>
      
      {/* 캐릭터 검색 모달 창 */}
      <div className="flex gap-[100px]">
        <button
          onClick={() => setShowSearch(true)}
          className="w-[140px] h-[40px] sm:w-[160px] sm:h-[50px] font-galmuri text-white text-[13px] sm:text-[16px] rounded-full 
                     bg-[#44B7CF] hover:bg-[#369EBC] border-2 border-white shadow-md mb-4
                     ">
          캐릭터 검색하기
        </button>
      </div>
      
      {/* 즐겨찾기 캐릭터 리스트 블러 박스 */}
      <div className="
        w-[90vw] max-w-[650px] min-h-[60px] mt-5 mx-auto rounded-[20px]
        bg-white/60 backdrop-blur-md flex flex-wrap justify-center items-center
        px-4 sm:px-6 py-4 gap-2 shadow-lg">
        {/* 즐겨찾기 타이틀 */}
        <span
          className="
            absolute left-[15px] sm:left-[21px] -top-[25px] sm:-top-[30px] text-white text-[12px] sm:text-[15px] font-galmuri tracking-widest select-none
            bg-[#44B7CF]/80 px-4 py-1 shadow rounded-[10px] backdrop-blur-md z-0
            "
          style={{ pointerEvents: "none" }}>
          ⭐즐겨찾기
        </span>
        {/* 즐겨찾기 한 닉네임 리스트 */}
        <div className="flex flex-wrap justify-center items-center gap-2 max-h-[120px] overflow-y-auto w-full
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#44B7CF]/80">
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
                    text-gray-800 text-[13px] sm:text-[15px] shadow font-galmuri mr-2 mb-2
                    ">
                  <span className="mr-2">{char}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 전파 방지
                      handleRemove(char);
                    }}
                    className="text-red-400 ml-1 hover:text-red-700 text-[15px] font-bold mb-[4px]">
                    ✕
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>


      {/* 캐릭터 검색 모달 */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSearchStart={handleSearchStart}
          onSearchSuccess={handleSearchSuccess}
          setLoading={setLoading}
        />
      )}

      {/* 로딩화면 */}
      {loading && <Loading visible={true} />}
      
      {/* 공지화면 */}
      {notice && notices.length > 0 && (
        <NoticeModal onClose={() => setNotice(false)} notices={notices} />
      )}
    </div>
  );
}
