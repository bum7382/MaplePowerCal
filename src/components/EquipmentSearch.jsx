import { useEffect, useState } from "react";
import { useToast } from "../utils/toastContext";
import jobKind from "../data/jobKind.json";
import classWeapon from "../data/classWeapon.json";

// 직업군 → req_job 비트
const JOB_BIT = {
  Warrior: 1,
  Magician: 2,
  Bowman: 4,
  Thief: 8,
  Pirate: 16,
};

// 캐릭터 직업 → 비트마스크 (제논처럼 여러 직업군에 속할 경우 OR)
function getReqJobBitmask(characterClass) {
  let mask = 0;
  for (const [group, classes] of Object.entries(jobKind)) {
    if (classes.includes(characterClass)) {
      mask |= JOB_BIT[group] || 0;
    }
  }
  return mask;
}

// 빈 옵션 객체 (모든 키 "0")
const emptyStatOption = () => ({
  str: "0",
  dex: "0",
  int: "0",
  luk: "0",
  max_hp: "0",
  max_mp: "0",
  attack_power: "0",
  magic_power: "0",
  armor: "0",
  speed: "0",
  jump: "0",
  boss_damage: "0",
  damage: "0",
  all_stat: "0",
});

// MongoDB에서 받은 아이템 → 넥슨 API 포맷으로 보강
// MongoDB 데이터는 이미 대부분 넥슨 포맷이지만, 장착 시 필요한 빈 옵션 객체들이 누락되어 있어서 채워줌
function normalizeItem(item, slot) {
  return {
    ...item,
    item_equipment_slot: slot, // 슬롯명 정규화 (반지1/2/3/4, 펜던트2)
    item_equipment_part: item.item_equipment_part || slot.replace(/[0-9]/g, ""),
    item_add_option: item.item_add_option || {
      ...emptyStatOption(),
      equipment_level_decrease: 0,
    },
    item_etc_option: item.item_etc_option || emptyStatOption(),
    item_starforce_option: item.item_starforce_option || emptyStatOption(),
    item_exceptional_option: item.item_exceptional_option || {
      attack_power: "0",
      dex: "0",
      exceptional_upgrade: "0",
      int: "0",
      luk: "0",
      magic_power: "0",
      max_hp: "0",
      max_mp: "0",
      str: "0",
    },
    item_total_option: item.item_total_option || {
      ...item.item_base_option,
      damage: 0,
      equipment_level_decrease: 0,
    },
    additional_potential_option_1: item.additional_potential_option_1 ?? null,
    additional_potential_option_2: item.additional_potential_option_2 ?? null,
    additional_potential_option_3: item.additional_potential_option_3 ?? null,
    additional_potential_option_flag: item.additional_potential_option_flag ?? "false",
    additional_potential_option_grade: item.additional_potential_option_grade ?? null,
    potential_option_1: item.potential_option_1 ?? null,
    potential_option_2: item.potential_option_2 ?? null,
    potential_option_3: item.potential_option_3 ?? null,
    potential_option_flag: item.potential_option_flag ?? "false",
    potential_option_grade: item.potential_option_grade ?? null,
    // 새로 장착하는 장비는 작이 한 번도 안 된 상태 → 남은 작 가능 횟수 = 총 작 가능 횟수
    scroll_upgrade: item.scroll_upgrade ?? item.scroll_upgradeable_count ?? "0",
    scroll_upgradeable_count: item.scroll_upgradeable_count ?? "0",
    scroll_resilience_count: item.scroll_resilience_count ?? "0",
    starforce: item.starforce ?? "0",
    starforce_scroll_flag: item.starforce_scroll_flag ?? "미사용",
    soul_name: item.soul_name ?? null,
    soul_option: item.soul_option ?? null,
    special_ring_level: item.special_ring_level ?? 0,
    cuttable_count: item.cuttable_count ?? "10",
    growth_exp: item.growth_exp ?? 0,
    growth_level: item.growth_level ?? 0,
  };
}

export default function EquipmentSearch({ slot, onSelectItem, character_class }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ slot });
      if (query.trim().length > 0) params.set("query", query.trim());
      const jobBit = getReqJobBitmask(character_class);
      if (jobBit > 0) params.set("jobBit", String(jobBit));

      // 무기/보조무기는 직업별 사용 가능한 종류로 제한
      const baseSlot = slot.replace(/[0-9]/g, "");
      if (baseSlot === "무기" || baseSlot === "보조무기") {
        const key = baseSlot === "무기" ? "weapon" : "subweapon";
        const types = classWeapon[key]?.[character_class];
        if (Array.isArray(types) && types.length > 0) {
          params.set("types", types.join(","));
        }
      }

      fetch(`/api/searchItem?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("검색 실패");
          return res.json();
        })
        .then((data) => {
          if (!Array.isArray(data)) {
            setResults([]);
            return;
          }
          // item_name 기준 중복 제거 (같은 이름은 처음 항목만 유지)
          const seen = new Set();
          const deduped = data.filter((item) => {
            const key = item.item_name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setResults(deduped);
        })
        .catch(() => {
          showToast("장비 검색에 실패했습니다.", "error");
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, slot, character_class]);

  function handleItemSelect(item) {
    const finalItem = normalizeItem(item, slot);
    if (typeof onSelectItem === "function") {
      onSelectItem(finalItem);
    }
  }

  return (
    <div className="w-[90vw] max-w-[320px] bg-[#1F2735] text-white rounded shadow-lg p-4 font-galmuri">
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
        {loading ? (
          <div className="text-sm text-gray-400 text-center">검색 중...</div>
        ) : results.length > 0 ? (
          results.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm hover:bg-gray-700 cursor-custom"
              onClick={() => handleItemSelect(item)}
            >
              <img
                src={item.item_icon}
                alt={item.item_name}
                className="w-8 h-8 cursor-custom"
              />
              <span>{item.item_name || "이름 없음"}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400 text-center">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );
}
