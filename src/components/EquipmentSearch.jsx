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

// sessionStorage 캐시 헬퍼 (raw API 응답을 저장, 후처리는 매번 다시 적용)
const CACHE_PREFIX = "equipSearch:";

function buildCacheKey(baseSlot, query, jobBit, typeList) {
  const sortedTypes = [...typeList].sort().join(",");
  return `${CACHE_PREFIX}${baseSlot}|q=${query.trim()}|j=${jobBit}|t=${sortedTypes}`;
}

function getCachedRaw(key) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function setCachedRaw(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // QuotaExceeded 등은 조용히 무시
  }
}

export default function EquipmentSearch({ slot, onSelectItem, character_class }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const baseSlot = slot.replace(/[0-9]/g, "");
    const jobBit = getReqJobBitmask(character_class);

    // 무기/보조무기 종류 결정
    const typeList = (() => {
      if (baseSlot !== "무기" && baseSlot !== "보조무기") return [];
      const key = baseSlot === "무기" ? "weapon" : "subweapon";
      const types = classWeapon[key]?.[character_class];
      const arr = Array.isArray(types) ? [...types] : [];
      // 방패는 보조무기 검색 시 항상 포함 (req_job으로 자동 필터링)
      if (baseSlot === "보조무기" && !arr.includes("방패")) arr.push("방패");
      return arr;
    })();

    // 받은 raw 데이터에 후처리 적용 (포스실드 필터 + 중복 제거)
    const applyPostFilters = (rawData) => {
      let filtered = rawData;
      if (baseSlot === "보조무기") {
        const isDemon = character_class === "데몬슬레이어" || character_class === "데몬어벤져";
        filtered = filtered.filter((item) => {
          if (item.item_equipment_slot !== "방패") return true;
          const isForceShield = item.item_name?.includes("포스실드");
          return isDemon ? isForceShield : !isForceShield;
        });
      }
      const seen = new Set();
      return filtered.filter((item) => {
        const k = item.item_name;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    const cacheKey = buildCacheKey(baseSlot, query, jobBit, typeList);

    // 캐시 히트: 즉시 결과 표시 (debounce 생략)
    const cached = getCachedRaw(cacheKey);
    if (cached) {
      setResults(applyPostFilters(cached));
      setLoading(false);
      return;
    }

    // 캐시 미스: 디바운스 후 fetch
    const delayDebounce = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ slot });
      if (query.trim().length > 0) params.set("query", query.trim());
      if (jobBit > 0) params.set("jobBit", String(jobBit));
      if (typeList.length > 0) params.set("types", typeList.join(","));

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
          setCachedRaw(cacheKey, data);
          setResults(applyPostFilters(data));
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
