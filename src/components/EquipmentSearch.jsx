import { useEffect, useState } from "react";
import slotMap from "../data/itemTypeToSlot.json";
import statMap from "../data/statMap.json";

export default function EquipmentSearch({ slot, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 0) {
        fetch(`https://maplestory.io/api/KMS/389/item/?searchFor=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((data) => {
            setResults(data);
          })
          .catch((err) => {
            console.error("검색 실패:", err);
            setResults([]);
          });
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // 2. 변환 함수
  function convertToNexonFormat(apiData) {
    const nexonBaseOption = {};
    // statMap: { 우리Key: 넥슨APIKey }
    Object.entries(statMap).forEach(([myKey, nexonKey]) => {
        if (apiData.stats && apiData.stats[myKey] !== undefined) {
        nexonBaseOption[nexonKey] = String(apiData.stats[myKey]);
        }
    });
    return {
        ...apiData,
        item_base_option: nexonBaseOption, // 넥슨 형식으로 추가
    };
  }

  function getSlotFromItem(item) {
    const cat = item.typeInfo?.category;
    const sub = item.typeInfo?.subCategory;

    if (cat === "One-Handed Weapon" || cat === "Two-Handed Weapon") return "무기";
    if (cat === "Secondary Weapon") return "보조무기";
    return slotMap[sub] || null;
  }

  const filteredResults = results.filter((item) => {
    const itemSlot = getSlotFromItem(item);
    return itemSlot === slot;
  });

  function handleItemSelect(itemId) {
    fetch(`https://api.maplestory.net/item/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
      // 외부 API 구조 → 넥슨 구조로 변환
      const nexonData = convertToNexonFormat(data);
      // 여기서 onSelectItem(nexonData) 호출 (props에서 받아야 함!)
      if (typeof onSelectItem === "function") {
        onSelectItem(nexonData);
      }
    })
    .catch((err) => {
      console.error("아이템 상세 조회 실패:", err);
    });
  }


  return (
    <div className="w-[320px] bg-[#1F2735] text-white rounded shadow-lg p-4 font-morris">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg">{slot} 장비 검색</h2>
        <button onClick={onClose} className="text-gray-300 hover:text-white text-xl">×</button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="아이템 이름 입력..."
        className="w-full px-2 py-1 text-black rounded"
      />

      <div className="h-[300px] overflow-y-auto mt-2 space-y-2 scrollbar-thin scrollbar-thumb-[#44B7CF] scrollbar-track-transparent">
        {filteredResults.length > 0 ? (
          filteredResults.map((item) => (
            <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm hover:bg-gray-700 cursor-pointer"
                onClick={() => handleItemSelect(item.id)} // 선택 시 처리
            >
                <img
                src={`https://api.maplestory.net/item/${item.id}/icon`}
                alt={item.name}
                className="w-8 h-8"
                />
                <span>{item.name || "이름 없음"}</span>
            </div>
            ))
        ) : (
            <div className="text-sm text-gray-400 text-center">검색 결과가 없습니다</div>
        )}
        </div>
    </div>
  );
}
