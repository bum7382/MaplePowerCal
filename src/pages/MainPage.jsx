// src/pages/MainPage.jsx
import React, { useEffect, useState, useRef } from "react";
import EquipmentInfo from "../components/EquipmentInfo.jsx";
import { calculatePower } from "../utils/calculatePower";
import { hexaStatPower } from "../utils/initcalPower";
import InventoryPanel from "../components/InventoryPanel.jsx";
import EquipmentSearch from "../components/EquipmentSearch.jsx";
import { useNavigate } from "react-router-dom";
import { isItemChanged } from "../utils/equipmentUtils";
import { useToast } from "../utils/toastContext";
import Tutorial from "../components/Tutorial.jsx";
import { fetchCharacterByName } from "../utils/fetchCharacterByName.js";
import Loading from "../components/Loading";
import { v4 as uuidv4 } from 'uuid';
import { getCachedCharacter, setCachedCharacter, removeCachedCharacter } from "../utils/charCache";
import TutorialMobile from "../components/TutorialMobile.jsx";
import { AnimatePresence, motion } from "framer-motion";
import HexaStat from "../components/HexaStat.jsx";
import useIsMobile from "../utils/useIsMobile.js";


export default function MainPage() {
  // 캐릭터 정보
  const [character, setCharacter] = useState(null);

  // 슬롯
  const [hoveredSlot, setHoveredSlot] = useState(null); // 슬롯 호버 상태
  const [isInfoLocked, setInfoLocked] = useState(false);  // 슬롯 클릭 상태
  const [savedSlots, setSavedSlots] = useState({}); // 슬롯 저장 상태
  const [slotColors, setSlotColors] = useState({}); // 슬롯 색상 상태
  const [selectedSlot, setSelectedSlot] = useState(null); // 선택한 슬롯

  // 장비
  const [equipment, setEquipment] = useState({}); // 장비 정보
  const [originalEquipment, setOriginalEquipment] = useState({}); // 원본 장비 정보
  const [showInfo, setShowInfo] = useState(false);  // 장비 정보 표시 여부
  const [showSearch, setShowSearch] = useState(false);  // 장비 찾기 모달 여부

  // 전투력
  const [powerDiff, setPowerDiff] = useState(0);  // 전투력
  const [originalPower, setOriginalPower] = useState(0);  // 원본 전투력
  const [initDone, setInitDone] = useState(false);
  const [showCalPower, setShowCalPower] = useState(false);
  
  // 인벤토리
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem("inventory");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("인벤토리 파싱 실패:", e);
        return [];
      }
    }
    return [];
  });
  const [showInventory, setShowInventory] = useState(false);  // 인벤토리 표시 여부
  const [hoveredInventoryItem, setHoveredInventoryItem] = useState(null); // 인벤토리 아이템 호버 상태

  // 프리셋
  const [preset, setPreset] = useState(1);

  // 헥사스탯
  const [showHexaStat, setShowHexaStat] = useState(false);
  const [hexaStat, setHexaStat] = useState(null); // 현재 헥사 (편집 가능, 초기값은 character에서 로드)
  // 모달 닫혀도 유지되는 헥사 슬롯 상태 (코어별)
  const [hexaSavedStats, setHexaSavedStats] = useState({ core: null, core_2: null, core_3: null });
  const [hexaActiveSlots, setHexaActiveSlots] = useState({ core: "current", core_2: "current", core_3: "current" });

  // 기타 상태
  const navigate = useNavigate(); // 내비게이터
  const { showToast } = useToast(); // 토스트
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [showTutorial, setShowTutorial] = useState(false);  // 튜토리얼 확인 여부
  const [isFavorite, setIsFavorite] = useState(false);  // 즐겨찾기 여부
  const isMobile = useIsMobile(1024);  // 1024px 이하는 모바일 레이아웃

  // PC 전용 1920x1080 디자인 → 가로 기준 scale (1024px 이하는 모바일 레이아웃)
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth <= 1024) {
        setScale(1);
        return;
      }
      // 가로 기준만 사용: 1920+ 에서는 항상 1:1, 그 미만에서만 비율 축소
      setScale(Math.min(1, window.innerWidth / 1920));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);


  const lastTouch = useRef(0);  // 마지막 터치 시간
  

  /* ===== 튜토리얼 ===== */
  // 튜토리얼 기록 확인
  useEffect(() => {
    // localStorage에 튜토리얼 본 기록이 없으면 튜토리얼 띄움
    const hasSeen = localStorage.getItem("tutorialSeen");
    if (!hasSeen) setShowTutorial(true);
  }, []);

  // 튜토리얼 닫기 핸들러
  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem("tutorialSeen", "true");
  };

  /* ===== 캐릭터 정보 ===== */
  // 로컬 스토리지에서 캐릭터 정보 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("selectedCharacter");
    if (saved) {
      try {
        setCharacter(JSON.parse(saved));
      } catch (e) {
        showToast("캐릭터를 받아오는데에 실패했습니다.", "error");
        setCharacter(null);
      }
    } else {
      setCharacter(null);
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (!loading && !character) {
      navigate("/");
    }
  }, [character, loading, navigate]);

  // 캐릭터 로드 시 hexaStat 초기화 (편집 가능한 작업 사본)
  useEffect(() => {
    if (character?.hexa_stat) {
      setHexaStat(character.hexa_stat);
    }
  }, [character?.name]);

  // 헥사 기여분을 적용한 작업용 baseStat/noPerStat 반환
  const getStatsWithHexa = () => {
    if (!character) return null;
    const baseStat = { ...character.baseStat };
    const noPerStat = { ...character.noPerStat };
    if (hexaStat) {
      hexaStatPower(hexaStat, character.class, baseStat, noPerStat);
    }
    return { baseStat, noPerStat, perStat: character.perStat };
  };

  // 장비 배열을 받아 현재 헥사 기준의 전투력 계산
  const computePower = (equipments) => {
    if (!character) return 0;
    const stats = getStatsWithHexa();
    return calculatePower(
      equipments,
      character.class,
      stats.baseStat,
      stats.noPerStat,
      stats.perStat,
      character.level
    );
  };

  // EquipmentInfo에 넘길 character (헥사 적용된 baseStat 포함)
  const characterWithHexa = (() => {
    if (!character) return null;
    const stats = getStatsWithHexa();
    if (!stats) return character;
    return {
      ...character,
      baseStat: stats.baseStat,
      noPerStat: stats.noPerStat,
      perStat: stats.perStat,
    };
  })();

  // 장비 로드
  useEffect(() => {
    // 받은 값 없으면 에러
    if (!character?.equipment) return;

    const equipmentMap = {};
    const countMap = {};

    // 펜던트, 반지 정규화
    for (const item of character.equipment) {
      let raw = item.item_equipment_slot || item.item_equipment_part;
      if (!raw) continue;
      if (raw === "펜던트") {
        countMap["펜던트"] = (countMap["펜던트"] || 0) + 1;
        raw = countMap["펜던트"] === 1 ? "펜던트" : "펜던트2";
      } else if (raw === "반지") {
        countMap["반지"] = countMap["반지"] || 1;
        raw = `반지${countMap["반지"]}`;
        countMap["반지"] += 1;
      }
      equipmentMap[raw] = item;
    }

    setOriginalEquipment(equipmentMap);
    setEquipment(equipmentMap);
  }, [character]);

  // 기초 전투력 계산 활성화
  useEffect(() => {
    setInitDone(false);
  }, [character?.name]);

  // 기초 전투력 계산 - 최초 한 번 계산
  useEffect(() => {
    if (initDone) return;
    if (!character || Object.keys(equipment).length === 0) return;
    if (character.hexa_stat && !hexaStat) return; // hexaStat 초기화 대기
    const basePower = computePower(Object.values(equipment));
    setOriginalPower(basePower);
    setInitDone(true);
  }, [character, equipment, initDone, hexaStat]);
    
  // 전체 장비 초기화 
  const handleResetAllEquipment = () => {
    setEquipment(originalEquipment);
    setSavedSlots({});
    setSlotColors({});

    const newPower = computePower(Object.values(originalEquipment));
    setPowerDiff(newPower - originalPower);

    setShowInfo(false);
    setInfoLocked(false);
  };

  /* ===== 프리셋 ===== */
  useEffect(() => {
    if (!character) return;
    if (character.preset_no !== undefined) {
      setPreset(character.preset_no);
    }
  }, [character]);

  // 프리셋으로 장비 변경
  function mapPresetEquipmentToSlot(presetEquipment) {
    // presetEquipment: 배열
    const equipmentMap = {};
    const countMap = {};
    for (const item of presetEquipment) {
      let raw = item.item_equipment_slot || item.item_equipment_part;
      if (!raw) continue;
      if (raw === "펜던트") {
        countMap["펜던트"] = (countMap["펜던트"] || 0) + 1;
        raw = countMap["펜던트"] === 1 ? "펜던트" : "펜던트2";
      } else if (raw === "반지") {
        countMap["반지"] = countMap["반지"] || 1;
        raw = `반지${countMap["반지"]}`;
        countMap["반지"] += 1;
      }
      equipmentMap[raw] = item;
    }
    return equipmentMap;
  }

  // 프리셋 버튼 핸들러
  function handlePresetSelect(n) {
    setPreset(n); // 버튼 스타일, UI
    let presetEquipment;
    if (n === 1) presetEquipment = character.equipment_preset_1;
    if (n === 2) presetEquipment = character.equipment_preset_2;
    if (n === 3) presetEquipment = character.equipment_preset_3;

    if (!presetEquipment) return;

    const equipmentMap = mapPresetEquipmentToSlot(presetEquipment);
    setEquipment(equipmentMap); // 슬롯에 즉시 반영
  }

  // 프리셋 적용 핸들러
  function handleApplyPreset() {
    // 기준 장비 업데이트
    setOriginalEquipment(equipment);
    
    // 바뀐 장비 프리셋으로 전투력 재계산
    const newPower = computePower(Object.values(equipment));
    setOriginalPower(newPower);
    setPowerDiff(0); // 적용 시 전투력 변화량 0으로
    setSlotColors({});
    setSelectedSlot(null);

    showToast("장비 프리셋이 변경되었습니다.", "success")
  }

  /* ===== 인벤토리 ===== */
  // 인벤토리 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  /* ===== 즐겨찾기 ===== */
  // 즐겨찾기 여부
  useEffect(() => {
    if (!character) return;
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favs.includes(character.name));
  }, [character]);

  // 즐겨찾기 클릭 핸들러
  const handleFavoriteClick = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    let newFavorites;
    if (favorites.includes(character?.name)) {
      // 삭제
      newFavorites = favorites.filter((item) => item !== character?.name);
      setIsFavorite(false);
      showToast("즐겨찾기에서 삭제되었습니다.", "error");
    } else {
      // 추가
      newFavorites = [...favorites, character?.name];
      setIsFavorite(true);
      showToast("즐겨찾기에 추가되었습니다.", "success");
    }
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };
  
  // 정보 갱신 핸들러
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await fetchCharacterByName(character.name);
      if (!result) {
        // 실패 시 처리
        setLoading(false);
        showToast("정보 갱신에 실패했습니다.", "error");
        return;
      }
      removeCachedCharacter(character.name);  // 캐시 삭제
      setCachedCharacter(character.name, result); // 캐시 새로 저장
      setCharacter(result);
      // hexaStat·originalPower는 character 변경 useEffect들이 자동 재계산

      setLoading(false);
      showToast("정보가 갱신되었습니다.", "success")
    } catch (e) {
      setLoading(false);
      showToast("정보 갱신에 실패했습니다.", "error");
    }
  };

  // 전투력 표시 포맷: ??억 ??만
  function formatKoreanNumber(num) {
    const abs = Math.abs(num);
    const eok = Math.floor(abs / 100000000);
    const man = Math.floor((abs % 100000000) / 10000);
    const rest = abs % 10000;

    const parts = [];
    if (eok > 0) parts.push(`${eok}억`);
    if (man > 0) parts.push(`${man}만`);
    if (rest > 0 || parts.length === 0) parts.push(`${rest}`);

    return parts.join(" ");
  }

  // 장비 수정 핸들러
  const handleEditClick = () => {
    setInfoLocked(true);   // 수정모드로 진입
    setShowInfo(true);     // 정보창 다시 표시
  };

  // 각 장비 슬롯 위치
  const slotStyle = "absolute w-full h-full bg-black bg-opacity-0 rounded active:bg-opacity-20 hover:bg-opacity-10";
  const slots = [
    ...["반지1", "반지2", "반지3", "반지4", "벨트", "포켓 아이템"].map((name, i) => ({ name, top: 23.05 + i * 10, left: 7.9 })),
    ...["얼굴장식", "눈장식", "귀고리", "펜던트", "펜던트2"].map((name, i) => ({ name, top: 23.05 + i * 10, left: 20.1 })),
    ...["모자", "상의", "하의", "어깨장식"].map((name, i) => ({ name, top: 23.05 + i * 10, left: 69 })),
    ...["망토", "장갑", "신발", "훈장", "기계 심장", "뱃지"].map((name, i) => ({ name, top: 23.05 + i * 10, left: 81.2 })),
    { name: "무기", top: 63.2, left: 32.3 },
    { name: "보조무기", top: 63.2, left: 44.5},
    { name: "엠블렘", top: 63.2, left: 56.8 },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cover bg-center bg-no-repeat select-none"
         style={{ backgroundImage: "url(/images/background_blur.png)" }}>
      <div
        className={isMobile ? "w-full h-full flex items-center justify-center" : "absolute left-1/2 top-1/2 flex items-center justify-center"}
        style={isMobile ? {} : {
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
      {/* 장비창 */}
      <div className="relative w-[90%] sm:w-[420px] aspect-[420/509]">
        {/* 장비창 배경 */}
        <img src="/images/inventory/equipment_bg.png" draggable="false" className="absolute inset-0 w-full h-full" />
        {/* 장비창 설명 */}
        <img src="/images/inventory/equipmentUI.png" draggable="false" className="absolute top-[14%] left-[3.6%] w-[92.8%]" />

        {/* 튜토리얼 버튼 */}
        <button onClick={() => setShowTutorial(true)}>
            <img
              src="/images/tutorial/정보창.png"
              draggable="false"
              title="튜토리얼"
              className="absolute top-[5%] right-[2%] w-[7%] active:brightness-75 hover:brightness-125 transition"
            />
        </button>
        {/* 정보 갱신 버튼 */}
        <button
          onClick = {handleRefresh}
          className="absolute top-[5%] right-[10%] bg-[#1F2735] bg-opacity-60 w-[70px] h-[25px] sm:w-[85px] sm:h-[30px] rounded text-[10px] sm:text-[13px]
          font-galmuri text-white active:brightness-75 hover:brightness-125 transition text-center
          " 
          >
          정보 갱신
        </button>
        
        {/* 전투력 증가량 */}
        <div className="absolute -translate-y-[100px] left-1/2 -translate-x-1/2 z-20">
          <div className="w-[90vw] max-w-[600px] h-[50px] flex items-center justify-center text-center text-white bg-[#1F2735] bg-opacity-50 px-4 py-1 rounded
                          max-sm:w-[90vw]">
            <span className="font-galmuri absolute left-4 text-[14px] text-[#E0E8F2]
                            sm:left-4 max-sm:-top-[23px] max-sm:left-[35%] max-sm:text-center max-sm:text-black">
              전투력 증가량:
            </span>
           <span
            className={
              "font-kohi text-[23px] " +
              (isMobile
                ? (powerDiff < 0 ? "text-[#FF006E]" : "text-white")
                : (powerDiff < 0
                    ? "bg-gradient-to-b from-[#BE0058] to-[#FF006E] bg-clip-text text-transparent"
                    : "bg-gradient-to-b from-[#ffffff] to-[#D5E1EA] bg-clip-text text-transparent"
                  )
              )
            }
          >
              {powerDiff === 0
                ? "0"
                : `${powerDiff > 0 ? "+" : "-"}${formatKoreanNumber(powerDiff)}`}
            </span>
          </div>
        </div>
        
        {/* 장비창 인벤토리 창 */}
        <img src="/images/inventory/equipment_info.png" draggable="false" className="absolute bottom-[88%] left-[4%] w-[40%]" />
        <div draggable="false" className="absolute top-[2%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          {/* 캐릭터 이미지 */}
          <img src={character?.image || "/images/default_character.png"} 
               draggable="false" 
               className="w-[180%] object-contain object-top [clip-path:inset(30%_30%_25%_30%)] max-w-none" 
               onMouseEnter={() => setShowCalPower(true)}
               onMouseLeave={() => setShowCalPower(false)}
          />

          {/* 전투력 표시 툴팁 */}
          {showCalPower && (
            <div className="absolute bottom-[73%] left-1/2 -translate-x-1/2 ml-2 px-3 py-1 bg-[#1F2735] bg-opacity-60 text-white 
            text-xs rounded shadow-lg whitespace-nowrap z-20 font-galmuri text-center">
              계산된 기본 전투력: {formatKoreanNumber(originalPower) || "0"} <br />
              원본 전투력: {formatKoreanNumber(character.power) || "0"}
            </div>
          )}

          {/* 캐릭터 이름 & 즐겨찾기 */}
          <div className="absolute flex flex-row items-center space-x-1 top-[72%]">
            {/* 캐릭터 이름 */}
            <span className="mt-1 px-3 py-0.5 rounded-full bg-[#44B7CF] text-white text-sm font-galmuri relative -top-[5px]
                            max-sm:text-[9px] max-sm:py-[0.01px]">
              {character?.name || "이름없음"}
            </span>
            {/* 즐겨찾기 */}
            <button 
              onClick = {handleFavoriteClick}
              className="active:brightness-75 hover:brightness-110 transition">
              <img
                src={isFavorite ? "/images/icons/즐겨찾기on.png" : "/images/icons/즐겨찾기off.png"}
                className="mb-[5px]"
                alt="즐겨찾기"
                draggable={false}
              />
            </button>
          </div>
        </div>
         
        {/* 프리셋 버튼 */}
        <div className="flex gap-2 absolute left-[52.5%] top-[85%] max-sm:top-[80%] z-50 max-sm:top-[85%] max-sm:left-[45%]">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className="items-center focus:outline-none"
              onClick={() => handlePresetSelect(n)}
              style={
                preset === n
                  ? { border: '2px solid #fff', borderRadius: '5px', boxShadow: '0 0 3px 1px #44B7CF40, 0 0 18px 6px #44B7CF40' }
                  : { border: '2px solid transparent', borderRadius: '5px' }
              }
            >
              <img
                src={`/images/inventory/preset${n}${preset === n ? '_pressed' : ''}.png`}
                alt={`preset${n}`}
                className="w-[100%] transition hover:brightness-110 active:brightness-90"
              />
            </button>
          ))}
        </div>

        {/* 프리셋 적용 버튼 */}
        <button
          onClick={handleApplyPreset}
          className="absolute top-[84.7%] left-[77%] items-center rounded z-50 hover:brightness-110 active:brightness-90">
          <img
            src="/images/inventory/적용.png" alt="프리셋 적용" className=""
          />
        </button>
        

        {/* 처음으로 버튼 */}
        <button
          className="absolute top-[75%] left-[40%] px-3 py-1 sm:px-4 sm:py-[7px] bg-[#44B7CF] text-white items-center text-[10px] sm:text-[80%] font-galmuri rounded-[5px] hover:bg-[#60DCF6] active:bg-[#2b7f94] z-50"
          onClick={() => navigate("/")}
        >
          처음으로
        </button>


        {/* 장비 슬롯 */}
        {slots.map(({ name, top, left }) => (
          <div
            key={name}
            style={{ top: `${top}%`, left: `${left}%` }}
            className={`absolute aspect-square w-[11%] flex items-center justify-center transition-all duration-150
              ${selectedSlot === name ? "ring-2 ring-[#44B7CF] ring-offset-2 shadow-md rounded" : ""}`}
            onMouseEnter={() => {
              if (!isInfoLocked && equipment[name]) {
                setHoveredSlot(name);
                setShowInfo(true);
              }
            }}
            onMouseLeave={() => {
              if (!isInfoLocked && !isMobile) {
                setShowInfo(false);
                setHoveredSlot(null);
              }
            }}
          >
            {/* 슬롯 배경 색 - 장비 변경 시 색 바뀜 */}
            <div
              className="absolute inset-0 rounded"
              style={{ backgroundColor: slotColors[name] || "transparent", zIndex: 5 }}
            />

            {/* 아이템 아이콘 */}
            {equipment[name]?.item_icon && (
              <img
                src={equipment[name].item_icon}
                alt={equipment[name].item_name}
                draggable="false"
                className="w-[80%] object-contain p-1 z-10 pointer-events-none"
              />
            )}

            {/* 장비 장착 해제 버튼 */}
            {selectedSlot === name && equipment[name] && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEquipment((prev) => {
                    const updated = { ...prev };
                    delete updated[name];
                    return updated;
                  });
                  setSlotColors((prev) => ({
                    ...prev,
                    [name]: "transparent"
                  }));
                  setPowerDiff(computePower(
                    Object.values({ ...equipment, [name]: undefined }).filter(Boolean)
                  ) - originalPower);
                  setShowInfo(false);
                  setInfoLocked(false);
                }}
                className="absolute top-0 right-0 bg-red-500 text-center text-white w-[16px] h-[16px] text-[10px] leading-[16px] rounded-full z-30 hover:bg-red-600"
                title="장착 해제"
              >
                ✕
              </button>
            )}


            {/* 슬롯 */}
            <button
              className={`${slotStyle} z-20`}
              style={{ backgroundColor: "transparent" }}
              // 단일 클릭: 슬롯만 선택
              onClick={() => {
                setSelectedSlot(name);
                setHoveredSlot(name);
                setInfoLocked(false);
              }}
              // 더블 클릭: 수정창 열기
              onDoubleClick={() => {
                setSelectedSlot(name);
                setHoveredSlot(name);
                const hasItem = !!equipment[name];
                setInfoLocked(true);
                setShowInfo(hasItem);
                setShowSearch(!hasItem);
              }}
              // 모바일 - 더블 터치 시 더블 클릭과 동일하게 작동
              onTouchStart={() => {
                const now = Date.now();
                if (now - lastTouch.current < 300) {
                  setSelectedSlot(name);
                  setHoveredSlot(name);
                  const hasItem = !!equipment[name];
                  setInfoLocked(true);
                  setShowInfo(hasItem);
                  setShowSearch(!hasItem);
                  lastTouch.current = 0;
                } else {
                  setSelectedSlot(name);
                  setHoveredSlot(name);
                  setInfoLocked(false);
                  lastTouch.current = now;
                }
              }}              
            />
          </div>
        ))}
        {selectedSlot && (
          <div className="absolute bottom-[1.2%] right-2 flex gap-2 max-sm:bottom-[2%]">
            {/* 전체 초기화 버튼 */}
            <button
              onClick={handleResetAllEquipment}
              className="bg-red-600 w-[55px] h-[20px] sm:w-[90px] sm:h-[30px] rounded text-[9px] sm:text-[13px] font-galmuri text-white active:brightness-75 hover:brightness-110 transition text-center
                         "
            >
              전체 초기화
            </button>

            {/* 초기화 버튼 */}
            <button
              onClick={() => {
                if (!originalEquipment[selectedSlot]) return;
                setEquipment((prev) => ({
                  ...prev,
                  [selectedSlot]: originalEquipment[selectedSlot]
                }));
                setSavedSlots((prev) => ({
                  ...prev,
                  [selectedSlot]: false
                }));
                setSlotColors((prev) => ({
                  ...prev,
                  [selectedSlot]: "transparent"
                }));
                
                // 전투력 재계산
                const newPower = computePower(
                  Object.values({ ...equipment, [selectedSlot]: originalEquipment[selectedSlot] })
                );
                setPowerDiff(newPower - originalPower);

                setShowInfo(false);
                setInfoLocked(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-galmuri px-2 py-1 sm:px-4 rounded text-[9px] sm:text-[13px]
                         "
            >
              초기화
            </button>

            {/* 인벤토리 저장 버튼 */}
            {equipment[selectedSlot] && (<button
              onClick={async () => {
                const item = equipment[selectedSlot];
                const isDuplicate = inventory.some((inv) =>
                 // JSON.stringify({ ...inv, price: undefined, uuid: undefined }) ===
                 // JSON.stringify({ ...item, price: undefined, uuid: undefined })
                 JSON.stringify({ ...inv, uuid: undefined }) ===
                 JSON.stringify({ ...item, uuid: undefined })
                );
                // 중복 저장 불가
                if (!isDuplicate) {
                  const newItem = { ...item, uuid: uuidv4() };
                  setInventory((prev) => [...prev, newItem]);
                }
                else showToast("이미 인벤토리에 추가된 아이템입니다!", "error")
              }}
              className="bg-[#44B7CF] hover:bg-[#60DCF6] active:bg-[#2b7f94] font-galmuri text-white px-2 py-1 sm:px-4 rounded text-[9px] sm:text-[13px]
                         "
            >
              인벤토리에 저장
            </button>
            )}
          </div>
        )}

        
        {/* 인벤토리 아이콘 */}
        <button className="absolute bottom-[1.2%] left-[3%] w-[10%] transition max-sm:w-[7%]"
          onClick={() => setShowInventory((prev) => !prev)}>
          <img src="/images/icons/bag_normal.png" draggable="false"
            className="custom-cursor hover:content-[url('/images/icons/bag_hover.png')] active:content-[url('/images/icons/bag_pressed.png')]"/>
        </button>

        {/* 헥사스탯 아이콘 - To-Do*/}
        {/*
        <button className="absolute bottom-[1.2%] left-[12%] w-[10%] transition max-sm:w-[7%]"
          onClick={() => {
            if (isMobile) {
              showToast("해당 기능은 PC에서만 가능합니다.", "error");
              return;
            }
            setShowHexaStat((prev) => !prev);
          }}>
          <img 
            src="/images/hexa/헥사메뉴.normal.png" draggable="false"
            className="custom-cursor hover:content-[url('/images/hexa/헥사메뉴.hover.png')] active:content-[url('/images/hexa/헥사메뉴.pressed.png')]"/>
        </button>
        */}

        {/* 인벤토리 창 */}
        <AnimatePresence>
          {showInventory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute -bottom-[43%] left-1/2 -translate-x-1/2"
            >
            <div className="absolute -bottom-[43%] left-1/2 -translate-x-1/2">
              <InventoryPanel
                items={inventory}
                // 장비 클릭 시
                onSlotClick={(item) => {
                  if (!selectedSlot) return;
                    const slotBaseName = selectedSlot.replace(/[0-9]/g, "");
                    const itemSlotBaseName = item.item_equipment_slot.replace(/[0-9]/g, "");
                    if (slotBaseName !== itemSlotBaseName) {
                      showToast("선택한 슬롯에 장착할 수 없는 아이템입니다.", "error");
                      return;
                    }

                  // 장비 장착
                  setEquipment((prev) => ({
                    ...prev,
                    [selectedSlot]: item
                  }));
                  // 전투력 계산
                  const newPower = computePower(
                    Object.values({ ...equipment, [selectedSlot]: item })
                  );
                  setPowerDiff(newPower - originalPower);
                  // slotColors 갱신
                  const original = originalEquipment[selectedSlot];
                  const isChanged = isItemChanged(item, original);
                  setSlotColors((prev) => ({
                    ...prev,
                    [selectedSlot]: isChanged ? '#44B7CF' : 'transparent'
                  }));
                  // 착용 후 info창 닫기
                  setShowInfo(false);
                  setInfoLocked(false);
                }}
                onDeleteClick={async (itemToDelete) => {
                  // 로컬 인벤토리에서 제거
                  setInventory((prev) => prev.filter(i => i.uuid !== itemToDelete.uuid));
                }}
                onHoverItem={(item) => setHoveredInventoryItem(item)}
                onHoverOut={() => setHoveredInventoryItem(null)}
              />
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        
      {/* hover 시 장비 정보 보임 */}
      {showInfo && hoveredSlot && equipment[hoveredSlot] && (
        <EquipmentInfo
          item={equipment[hoveredSlot]}
          editable={isInfoLocked}
          onEdit={handleEditClick}

          slot={hoveredSlot}
          onClose={() => {
            setShowInfo(false);
            setInfoLocked(false);
          }}
          onSave={(newItem, diff) => {
            const updated = { ...equipment, [hoveredSlot]: newItem };
            setPowerDiff(diff);
            setEquipment(updated);
            setSavedSlots((prev) => ({ ...prev, [hoveredSlot]: true }));
            setInfoLocked(false);
          }}
          originalEquipment={originalEquipment}
          currentEquipment={equipment}
          character={characterWithHexa}
          originalPower={originalPower}
          setSlotColors={setSlotColors}
          setPowerDiff={setPowerDiff}
          setEquipment={setEquipment}
          equipment={equipment}
          showInventory={showInventory}
        />
      )}
      
      {/* 인벤토리에 있는 장비 hover 시 정보 보임 */}
      {hoveredInventoryItem && !isInfoLocked && (() => {
        // hover된 아이템의 종류(반지, 무기 등)
        const hoverSlotType = hoveredInventoryItem.item_equipment_slot.replace(/[0-9]/g, "");
        // 선택된 슬롯의 종류
        const selectedSlotType = selectedSlot?.replace(/[0-9]/g, "");
        // 실제 비교할 슬롯 결정
        const compareSlot =
          selectedSlot && hoverSlotType === selectedSlotType
            ? selectedSlot
            : hoveredInventoryItem.item_equipment_slot;

        return (
          <EquipmentInfo
            item={hoveredInventoryItem}
            editable={false}
            slot={compareSlot}
            onClose={() => setHoveredInventoryItem(null)}
            originalEquipment={originalEquipment}
            currentEquipment={{
              ...equipment,
              [compareSlot]: hoveredInventoryItem
            }}
            character={characterWithHexa}
            originalPower={originalPower}
            setSlotColors={() => {}}
            setPowerDiff={setPowerDiff}
            setEquipment={setEquipment}
            equipment={equipment}
          />
        );
      })()}

    {/* 장비 검색 모달 */}
    {showSearch && selectedSlot && !equipment[selectedSlot] && (
      <div className="absolute top-[23%] right-[16%] z-30 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto max-sm:top-[75%]">
        {/* 모달 닫기 X 버튼 */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
          onClick={() => setShowSearch(false)}
        >
          ✕
        </button>

        {/* 장비 검색 컴포넌트 */}
        <EquipmentSearch
          slot={selectedSlot}
          onSelectItem={(item) => {
            setEquipment((prev) => ({
              ...prev,
              [selectedSlot]: {
                ...item,
                item_equipment_slot: selectedSlot,
              },
            }));
            setSlotColors((prev) => ({
              ...prev,
              [selectedSlot]: "#44B7CF",
            }));
            setShowSearch(false);
            setShowInfo(false);
            setInfoLocked(false);

            // 전투력 갱신
            const newPower = computePower(
              Object.values({ ...equipment, [selectedSlot]: { ...item, item_equipment_slot: selectedSlot } })
            );
            setPowerDiff(newPower - originalPower);
          }}
          character_class = {character.class}
        />
      </div>
    )}

    </div>

    {/* 풀스크린 모달들은 scale 래퍼 밖에 위치 (transform 영향 안 받게) */}
    {/* 튜토리얼 */}
    {showTutorial && !isMobile && <Tutorial onClose={handleTutorialClose} />}
    {showTutorial && isMobile && <TutorialMobile onClose={handleTutorialClose} />}

    {/* 로딩 모달 */}
    {loading && <Loading visible={true} />}

    {/* 헥사 스탯 */}
    <AnimatePresence>
      {showHexaStat &&
        <HexaStat
          hexaStat = {hexaStat || character.hexa_stat}
          originalHexaStat = {character.hexa_stat}
          savedHexaStats = {hexaSavedStats}
          setSavedHexaStats = {setHexaSavedStats}
          activeSlots = {hexaActiveSlots}
          setActiveSlots = {setHexaActiveSlots}
          onClose={() => setShowHexaStat(false)}
          onApply={(newHexaStat) => {
            setHexaStat(newHexaStat);
            // 새 헥사 기준으로 현재 장비 전투력 재계산 → powerDiff 갱신
            const baseStat = { ...character.baseStat };
            const noPerStat = { ...character.noPerStat };
            hexaStatPower(newHexaStat, character.class, baseStat, noPerStat);
            const newPower = calculatePower(
              Object.values(equipment),
              character.class,
              baseStat, noPerStat, character.perStat,
              character.level
            );
            setPowerDiff(newPower - originalPower);
          }}
          character_class = {character.class}
        />}
    </AnimatePresence>
    </div>
  );
}