// frontend/src/components/CharacterSelect.jsx
// 캐릭터 선택 컴포넌트
import React, { useState } from "react";
import SearchModal from "./SearchModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../utils/toastContext.jsx";
import { fetchCharacterByName } from "../utils/fetchCharacterByName";

export default function CharacterSelect({ characters, setCharacters, userId, user}) {
  const MAX_SLOTS = 12; // 최대 슬롯 수
  const [selectedIndex, setSelectedIndex] = useState(null); // 선택된 캐릭터 인덱스
  const [showModal, setShowModal] = useState(false);  // 검색 모달 표시 여부
  const navigate = useNavigate();
  const { showToast } = useToast();
  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  // 캐릭터 슬롯 클릭 시 처리
  const handleSlotClick = (index) => {
    const char = characters[index];
    if (char) {
      setSelectedIndex(index);  // 캐릭터 선택
    } else if (index === characters.length) {
      setShowModal(true); // 빈 칸 클릭 시 검색 모달 열기
    }
  };

  // 캐릭터 선택 후 결정 버튼 클릭
  const handleConfirm = async () => {
    const char = characters[selectedIndex];
    const result = await fetchCharacterByName(char.name); // 캐릭터 정보 가져오기

    // 선택된 캐릭터 정보 저장
    const selectedCharacter = {
      name: result.character_name,
      level: result.character_level,
      image: result.character_image,
      character_id: result.character_id,
      class: result.character_class,  // 직업
      weapon_is_genesis: false, // 제네시스 무기인지 -> 기본값 false
      power: result.final_stat?.find(stat => stat.stat_name === "전투력")?.stat_value || "0",
    };

    // 로컬 스토리지에 선택된 캐릭터 정보 저장
    localStorage.setItem("selectedCharacter", JSON.stringify(selectedCharacter));
    navigate("/main");  // 메인 페이지로 이동
  };

  // 새로운 캐릭터 추가 처리
  const handleAddCharacter = async (newChar) => {
    if (characters.some((char) => char.name === newChar.name)) {
      showToast("❌ 이미 추가된 캐릭터입니다.", "error");
      return false;
    }
    const data = {
      name: newChar.name,
      level: newChar.level,
      image: newChar.image,
    };


    // 서버에 POST 요청하여 캐릭터 저장
    axios
      .post(`${API_BASE}/api/character`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        if (res.status !== 201 || res.data?.message === "이미 존재하는 캐릭터입니다.") {
          showToast("❌ 이미 존재하는 캐릭터입니다.", "error");
          return false;
        }

        setCharacters([...characters, res.data]);
        setShowModal(false);
      })
      .catch((err) => {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message || "";
        const msg = serverMessage || err.message || "서버 오류";

        if (status === 409 || serverMessage.includes("이미 존재")) {
          showToast("❌ 이미 존재하는 캐릭터입니다.", "error");
        } else {
          showToast("❌ 캐릭터 추가 실패\n" + msg, "error");
        }

        return false;
      });
  };

  // 캐릭터 삭제 처리
  const handleRemoveCharacter = async (indexToRemove) => {
    const target = characters[indexToRemove];
    if (!target || !target._id) {
      console.warn("삭제할 캐릭터 정보 없음:", target);
      return;
    }

    const confirmDelete = window.confirm(`'${target.name}' 캐릭터를 삭제할까요?`);
    if (!confirmDelete) return;

    const token = await user.getIdToken();

    axios
      .delete(`${API_BASE}/api/character/${target._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setCharacters((prev) => {
          const updated = prev.filter((_, idx) => idx !== indexToRemove);
          return updated;
        });

        if (selectedIndex === indexToRemove) {
          setSelectedIndex(null);
        } else if (selectedIndex > indexToRemove) {
          setSelectedIndex((prev) => prev - 1);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "서버 오류";
        showToast("❌ 캐릭터 삭제 실패\n" + msg, "error");
        return false;
      });
  };


  return (
    <div
      className="relative w-[934px] h-[553px]"
      style={{
        backgroundImage: 'url("/images/select_character.png")',
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 캐릭터 슬롯 12개 (6x2 그리드) */}
      <div className="absolute top-12 left-6 grid grid-cols-6 grid-rows-2 gap-4 z-10">
        {Array.from({ length: MAX_SLOTS }).map((_, index) => {
          const char = characters[index];
          const isSelected = index === selectedIndex;
          const isAddSlot = !char && index === characters.length;

          const col = index % 6;
          const row = Math.floor(index / 6);
          const left = 9 + col * 146;
          const top = 5 + row * 207;

          return (
            <div
              key={index}
              className={`absolute w-[135px] h-[198px] border-2 rounded-md flex flex-col items-center justify-center cursor-pointer
              ${isSelected ? "border-blue-400" : "border-transparent"}
              hover:border-blue-300 bg-black bg-opacity-30 group z-10`}
              onClick={() => handleSlotClick(index)}
              style={{ top: `${top}px`, left: `${left}px` }}
            >
              {/* 캐릭터 칸 (삭제 버튼 포함) */}
              {char ? (
                <>
                  <button
                    type="button"
                    className="absolute top-2 right-2 z-20 w-5 h-5 group-hover:opacity-100 opacity-0 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCharacter(index);
                    }}
                  >
                    <img
                      src="/images/icons/delete_icon.png"
                      alt="삭제"
                      className="w-full h-full active:brightness-90 hover:brightness-110"
                    />
                  </button>

                  <img src={char.image} alt="char" className="w-[110px] rounded scale-x-[-1]" />
                  <p className="text-[#F6D5AF] text-s font-galmuri ">Lv. {char.level}</p>
                  <p className="text-white text-[18px] font-galmuri">{char.name}</p>
                </>
              ) : isAddSlot ? (
                <span className="text-white text-4xl font-maple">+</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* 결정 버튼 */}
      <div className="absolute bottom-7 right-[415px]">
        <button
          className={`px-10 py-2 rounded-[20px] text-white text-l font-galmuri transition 
            ${selectedIndex != null ? "bg-[#44B7CF] hover:bg-[#369EBC]" : "bg-gray-500 cursor-not-allowed"}`}
          disabled={selectedIndex == null}
          onClick={handleConfirm}
        >
          결정
        </button>
      </div>

      {/* 검색 모달 */}
      {showModal && (
        <SearchModal
          onClose={() => setShowModal(false)}
          onSearch={handleAddCharacter}
          userId={userId}
        />
      )}
    </div>
  );
}
