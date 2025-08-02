import { useEffect, useState } from "react";
import slotMap from "../data/itemTypeToSlot.json";
import statMap from "../data/statMap.json";
import { useToast } from "../utils/toastContext";
import jobKind from "../data/jobKind.json";

// 직업에 해당하는 장비만 보임
function canSeeItem(item, currentJobClass) {
  // 직업 제한 없을 때
  if (!item.requiredJobs || item.requiredJobs.length === 0) return true;

  // 직업 제한 존재 시
  for (const jobGroup of item.requiredJobs) {
    // 전직 완료 직업인지 확인 (전사, 궁수 등)
    if (jobKind[jobGroup]) {
      // 특정 직업 제한인지 확인
      if (jobKind[jobGroup].includes(currentJobClass)) return true;
    } else {
      return true;
    }
  }
  // 위 조건에 안 걸리면 보이지 않게
  return false;
}

export default function EquipmentSearch({ slot, onSelectItem, character_class }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // 검색 단어 존재 시
      if (query.length > 0) {
        // 기존 문자열 검색
        fetch(`https://maplestory.io/api/KMS/389/item/?searchFor=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then((data) => {
            setResults(data);
          })
          .catch((err) => {
            showToast("검색에 실패하였습니다.", "error");
            setResults([]);
          });
      }
      // 검색 단어 X 시 해당 부위 장비 전체 리스트 보여줌 
      else {
        // 전체 장비 가져와서 subCategory 기준 필터
        fetch("https://maplestory.io/api/KMS/389/item/category/equip")
          .then(res => res.json())
          .then((data) => {
            setResults(data);
          })
          .catch((err) => {
            showToast("장비 목록을 불러오는 데에 실패했습니다.", "error");
            setResults([]);
          });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, slot]);


  // 이름 정규화
  function getBaseSlotName(slotName) {
    // "반지1" → "반지", "펜던트2" → "펜던트"
    return slotName.replace(/[0-9]/g, "");
  }

  // 검색한 장비 -> Nexon Open API 형식으로 변환
  function convertToNexonFormat(apiData) {
    const nexonBaseOption = {}

    // 기본값 0으로 채우기
    Object.values(statMap).forEach(nexonKey => {
      nexonBaseOption[nexonKey] = "0";
    });

    // 받아온 값으로 교체
    Object.entries(statMap).forEach(([myKey, nexonKey]) => {
      if (apiData.metaInfo && apiData.metaInfo[myKey] !== undefined) {
        nexonBaseOption[nexonKey] = String(apiData.metaInfo[myKey]);
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
        all_stat: "0",
        max_hp_rate: "0",
        max_mp_rate: "0"
      },
      item_description: apiData.description.description,
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
      item_icon: `https://maplestory.io/api/KMS/389/item/${apiData.description.id}/icon`,
      item_name: apiData.description.name,
      item_shape_icon: `https://maplestory.io/api/KMS/389/item/${apiData.description.id}/icon`,
      item_shape_name: apiData.description.name,
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
      scroll_upgrade: (Number(apiData.metaInfo?.tuc || 0) + 1).toString(),
      scroll_upgradeable_count: "0",
      soul_name: null,
      soul_option: null,
      special_ring_level: 0,
      starforce: "0",
      starforce_scroll_flag: "미사용"
    };
    return finalOption;
  }

  // 이름 정규화
  function getSlotFromItem(item) {
    const cat = item.typeInfo?.category;
    const sub = item.typeInfo?.subCategory;

    if (cat === "One-Handed Weapon" || cat === "Two-Handed Weapon") return "무기";
    if (cat === "Secondary Weapon") return "보조무기";
    return slotMap[sub] || null;
  }

  const baseSlot = getBaseSlotName(slot);

  // 결과 정규화: 캐시템이거나 장비가 아닐 경우 보이지 않게 함
  const filteredResults = results.filter((item) => {
    const itemSlot = getSlotFromItem(item); // "반지", "펜던트", ...
    return item.typeInfo?.overallCategory === "Equip" && item.isCash !== true && itemSlot === baseSlot && canSeeItem(item, character_class);
  });

  function handleItemSelect(itemId) {
    fetch(`https://maplestory.io/api/KMS/389/item/${itemId}`)
      .then(res => res.json())
      .then((ioData) => {
        const finalItem = convertToNexonFormat(ioData);
        if (typeof onSelectItem === "function") {
          onSelectItem(finalItem);
        }
      })
      .catch((err) => {
        showToast("사이트에서 기본 정보를 제공하지 않아 장착 불가합니다.", "error");
      });
  }


  return (
    <div className="w-[320px] bg-[#1F2735] text-white rounded shadow-lg p-4 font-galmuri">
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
      
      {/* 장비 리스트 */}
      <div className="h-[300px] overflow-y-auto mt-2 space-y-2 scrollbar-thin scrollbar-thumb-[#44B7CF] scrollbar-track-transparent">
        {filteredResults.length > 0 ? (
          filteredResults.map((item) => (
            <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm hover:bg-gray-700 cursor-pointer"
                onClick={() => handleItemSelect(item.id)} // 선택 시 처리
            >
                <img
                src={`https://maplestory.io/api/KMS/389/item/${item.id}/icon`}
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
