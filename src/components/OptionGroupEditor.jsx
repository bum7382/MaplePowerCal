// frontend/src/components/OptionGroupEditor.jsx
// 잠재옵션 또는 에디셔널 잠재옵션을 드롭다운 + 수치 입력 형식으로 설정하는 컴포넌트
import React, { useEffect, useState, useMemo } from "react";
import usePotentialOptions from "@/utils/usePotentialOptions";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseOptionString(optionStr, allOptions) {
  if (!optionStr || typeof optionStr !== "string") return null;

  for (const opt of allOptions) {
    // 1. escape 템플릿
    let escaped = escapeRegex(opt.template);

    // 2. 변수 자리에 캡처 그룹 삽입 (음수 포함)
    escaped = escaped
      .replace("\\{percent\\}", "(-?\\d+)")
      .replace("\\{level\\}", "(-?\\d+)")
      .replace("\\{value\\}", "(-?\\d+)");

    const regex = new RegExp("^" + escaped + "$");
    const match = optionStr.trim().match(regex);

    if (match) {
      const values = {};
      let i = 1;
      if (opt.template.includes("{percent}")) values.percent = Number(match[i++]);
      if (opt.template.includes("{level}")) values.level = Number(match[i++]);
      if (opt.template.includes("{value}")) values.value = Number(match[i++]);
      return { template: opt, values };
    }
  }
  return null;
}

const gradeColor = {
  레전드리: "text-[#CCFF00]",
  유니크: "text-[#FFCC00]",
  에픽: "text-[#B473F5]",
  레어: "text-[#66FFFF]",
  없음: "text-[#B7BFC5]",
};

export default function OptionGroupEditor({ item, type, onChange }) {
  // 잠재가 불가능한 부위인지 여부 체크
  const noPotentialSlots = ["뱃지", "훈장", "포켓 아이템"];
  const isSeedRing = item.special_ring_level && item.special_ring_level !== 0;
  const cannotHavePotential =
    noPotentialSlots.includes(item.item_equipment_slot) || isSeedRing;

  const options = usePotentialOptions();  // 전체 옵션 템플릿 불러오기
  const [grade, setGrade] = useState(item[type === "잠재" ? "potential_option_grade" : "additional_potential_option_grade"] || "없음");
  const [parsedOptions, setParsedOptions] = useState([
    { template: null, values: {} },
    { template: null, values: {} },
    { template: null, values: {} },
  ]);
  const [initialized, setInitialized] = useState(false);

  const optionKeys =
    type === "잠재"
      ? ["potential_option_1", "potential_option_2", "potential_option_3"]
      : ["additional_potential_option_1", "additional_potential_option_2", "additional_potential_option_3"];

  // 초기값 설정: item과 options가 준비되면 기존 옵션을 parsed로 파싱
  useEffect(() => {
    if (!item || options.length === 0 || initialized) return;
  

    const newParsed = optionKeys.map((key) => {
      const raw = item[key];
      if (!raw || typeof raw !== "string") return { template: null, values: {} };
      const parsed = parseOptionString(raw, options);
      return parsed || { template: null, values: {} };
    });

    setParsedOptions(newParsed);
    setInitialized(true);
  }, [item, options, initialized]);

  // grade 또는 options가 바뀔 때 onChange 콜백 호출
  useEffect(() => {
    onChange && onChange({ grade, options: parsedOptions });
  }, [grade, parsedOptions]);

  // 드롭다운에 보여줄 옵션 필터링 (등급/부위/잠재/에디셔널 조건에 따라)
  const filteredOptions = useMemo(() => {
    const base = options.filter(
      (opt) =>
        opt.grades.includes(grade) &&
        opt.applicableTo.includes(type) &&
        opt.slots.includes(item.item_equipment_slot)
    );
    // 현재 선택된 값 중 필터에서 누락된 옵션은 유지되도록 강제로 포함
    const selected = parsedOptions
      .map((opt) => opt.template)
      .filter((t) => t && !base.find((b) => b.id === t.id));

    return [...base, ...selected];
  }, [options, grade, type, item.item_equipment_slot, parsedOptions]);
  // 입력값 정리 함수 (숫자만 허용, 앞자리 0 제거, 2자리 제한)
  const sanitizeInput = (value) =>
    value.replace(/[^\d]/g, "").replace(/^0+(?!$)/, "").slice(0, 2);

  if (cannotHavePotential) {
    return (
      <div className="text-sm text-gray-400">
        이 부위에는 잠재능력이 존재하지 않습니다.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${type === "에디셔널" ? "mt-4" : ""} ${type === "잠재" ? "mt-2" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <label className={`text-sm ${gradeColor[grade]}`}>
          {type === "잠재" ? "잠재옵션" : "에디셔널 잠재옵션"}
        </label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="bg-[#1F2735] text-white text-sm rounded px-2 py-1 border border-gray-500"
        >
          {["레전드리", "유니크", "에픽", "레어", "없음"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {parsedOptions.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="flex flex-col">
            <select
              value={opt.template?.id?.toString() || ""}
              onChange={(e) => {
                const selected = options.find((o) => o.id === Number(e.target.value));
                const updated = [...parsedOptions];
                updated[idx] = {
                  template: selected,
                  values: {},
                };
                setParsedOptions(updated);
              }}
              className="bg-[#1F2735] text-white text-sm rounded px-2 py-1 border border-gray-500 w-60"
            >
              <option value="">-- 옵션 선택 --</option>
              {filteredOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1">
            {opt.template?.template.includes("{value}") && (
              <div className="flex items-center">
                <span className="text-white">
                  {opt.template.template.includes("-{value}") ? "-" : "+"}
                </span>
                <input
                  type="text"
                  value={opt.values.value ?? ""}
                  placeholder="value"
                  onChange={(e) => {
                    const updated = [...parsedOptions];
                    updated[idx].values.value = Number(sanitizeInput(e.target.value));
                    setParsedOptions(updated);
                  }}
                  className="ml-1 w-[50px] px-2 py-1 text-sm border border-gray-500 rounded bg-[#161C26] text-white text-right"
                />
                {opt.template.template.includes("{value}%") && (
                  <span className="text-white ml-1">%</span>
                )}
              </div>
            )}
            {opt.template?.template.includes("{percent}") && (
              <div className="flex items-center">
                <span className="text-white">+</span>
                <input
                  type="text"
                  value={opt.values.percent ?? ""}
                  placeholder="percent"
                  onChange={(e) => {
                    const updated = [...parsedOptions];
                    updated[idx].values.percent = Number(sanitizeInput(e.target.value));
                    setParsedOptions(updated);
                  }}
                  className="ml-1 w-[65px] px-2 py-1 text-sm border border-gray-500 rounded bg-[#161C26] text-white text-right"
                />
                <span className="text-white ml-1">%</span>
              </div>
            )}
            {opt.template?.template.includes("{level}") && (
              <div className="flex items-center">
                <span className="text-white">+</span>
                <input
                  type="text"
                  value={opt.values.level ?? ""}
                  placeholder="level"
                  onChange={(e) => {
                    const updated = [...parsedOptions];
                    updated[idx].values.level = Number(sanitizeInput(e.target.value));
                    setParsedOptions(updated);
                  }}
                  className="w-14 px-2 py-1 text-sm border border-gray-500 rounded bg-white text-white text-right"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
