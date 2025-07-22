import { useEffect, useState } from "react";
import slotMap from "../data/itemTypeToSlot.json";
import statMap from "../data/statMap.json";

export default function EquipmentSearch({ slot, onSelectItem }) {
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

  function getBaseSlotName(slotName) {
    // "반지1" → "반지", "펜던트2" → "펜던트"
    return slotName.replace(/[0-9]/g, "");
  }

  // 2. 변환 함수
  function convertToNexonFormat(apiData) {
    const nexonBaseOption = {}

    // 기본값 0으로 채우기
    Object.values(statMap).forEach(nexonKey => {
      nexonBaseOption[nexonKey] = "0";
    });

    // 받아온 값으로 교체
    Object.entries(statMap).forEach(([myKey, nexonKey]) => {
      if (apiData.stats && apiData.stats[myKey] !== undefined) {
        nexonBaseOption[nexonKey] = String(apiData.stats[myKey]);
      }
    });

    const finalOption = {
      additional_potential_option_1: null,
      additional_potential_option_2: null,
      additional_potential_option_3: null,
      additional_potential_option_flag: "false",
      additional_potential_option_grade: null,
      cuttable_count: "10",
      date_expire: null,
      equipment_level_increase: 0,
      freestyle_flag: "0",
      golden_hammer_flag: "미적용",
      growth_exp: 0,
      growth_level: 0,
      item_add_option: {
        all_stat: "0",
        armor: "0",
        attack_power: "0",
        boss_damage: "0",
        damage: "0",
        dex: "0",
        equipment_level_decrease: 0,
        int: "0",
        jump: "0",
        luk: "0",
        magic_power: "0",
        max_hp: "0",
        max_mp: "0",
        speed: "0",
        str: "0"
      },
      item_base_option: {
        ...nexonBaseOption,
        base_equipment_level: apiData.requiredStats.level,
        max_hp_rate: "0",
        max_mp_rate: "0"
      },
      item_description: apiData.io_desc,
      item_equipment_part: getBaseSlotName(slot),
      item_equipment_slot: slot,
      item_etc_option: {
        armor: "0",
        attack_power: "0",
        dex: "0",
        int: "0",
        jump: "0",
        luk: "0",
        magic_power: "0",
        max_hp: "0",
        max_mp: "0",
        speed: "0",
        str: "0"
      },
      item_exceptional_option: {
        attack_power: "0",
        dex: "0",
        exceptional_upgrade: "0",
        int: "0",
        luk: "0",
        magic_power: "0",
        max_hp: "0",
        max_mp: "0",
        str: "0" 
      },
      item_gender: null,
      item_icon: `https://api.maplestory.net/item/${apiData.itemId}/icon`,
      item_name: apiData.io_name,
      item_shape_icon: `https://api.maplestory.net/item/${apiData.itemId}/icon`,
      item_shape_name: apiData.io_name,
      item_starforce_option: {
        armor: "0",
        attack_power: "0",
        dex: "0",
        int: "0",
        jump: "0",
        luk: "0",
        magic_power: "0",
        max_hp: "0",
        max_mp: "0",
        speed: "0",
        str: "0"
      },
      item_total_option: {
        ...nexonBaseOption,
        damage: 0,
        equipment_level_decrease: 0,
        max_hp_rate: "0",
        max_mp_rate: "0"
      },
      potential_option_1: null,
      potential_option_2: null,
      potential_option_3: null,
      potential_option_flag: "false",
      potential_option_grade: null,
      scroll_resilience_count: "0",
      scroll_upgrade: "0",
      scroll_upgradeable_count: "0",
      soul_name: null,
      soul_option: null,
      special_ring_level: 0,
      starforce: "0",
      starforce_scroll_flag: "미사용"
    };
    
    return finalOption;
  }

  function getSlotFromItem(item) {
    const cat = item.typeInfo?.category;
    const sub = item.typeInfo?.subCategory;

    if (cat === "One-Handed Weapon" || cat === "Two-Handed Weapon") return "무기";
    if (cat === "Secondary Weapon") return "보조무기";
    return slotMap[sub] || null;
  }

  const baseSlot = getBaseSlotName(slot);

  const filteredResults = results.filter((item) => {
    const itemSlot = getSlotFromItem(item); // "반지", "펜던트", ...
    return itemSlot === baseSlot;
  });

  function handleItemSelect(itemId) {
    Promise.all([
      fetch(`https://maplestory.io/api/KMS/389/item/${itemId}`).then(res => res.json()),
      fetch(`https://api.maplestory.net/item/${itemId}`).then(res => res.json())
    ])
      .then(([ioData, netData]) => {
        const mergedData = {
          ...netData,
          io_desc: ioData.description?.description || "",
          io_name: ioData.description?.name || "",
        };
        const finalItem = convertToNexonFormat(mergedData);
        console.log(finalItem);
        if (typeof onSelectItem === "function") {
          onSelectItem(finalItem);
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
