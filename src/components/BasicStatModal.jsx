// frontend/src/componets/BasicStatModal.jsx
// 기본 능력치를 입력받는 모달 컴포넌트
import React, { useState, useEffect } from "react";

export default function BasicStatModal({ jobClass, mainStat, subStat, isMagicClass, onSave, onClose }) {
  const [values, setValues] = useState({}); // 모든 입력 값 저장
  const [hoveringExample, setHoveringExample] = useState(false);  // 예시 이미지 hover 상태

  // 최초 로딩 시 로컬 스토리지에서 값 불러오기
  useEffect(() => {
    if (Object.keys(values).length > 0) return; // 이미 값이 있다면 초기화하지 않음
    const savedMap = JSON.parse(localStorage.getItem("baseStatMap") || "{}");
    const stored = savedMap[jobClass] || {};  // 해당 직업의 기존 값


    const initial = {
        [mainStat]: stored[mainStat] || "",
        [`${mainStat}Percent`]: stored[`${mainStat}Percent`] || "",
        [`${mainStat}Fixed`]: stored[`${mainStat}Fixed`] || "",
        [subStat]: stored[subStat] || "",
        [`${subStat}Percent`]: stored[`${subStat}Percent`] || "",
        [`${subStat}Fixed`]: stored[`${subStat}Fixed`] || "",
        [isMagicClass ? "magic" : "attack"]: stored[isMagicClass ? "magic" : "attack"] || "",
        [`${isMagicClass ? "magic" : "attack"}Percent`]: stored[`${isMagicClass ? "magic" : "attack"}Percent`] || "",
        bossDamage: stored.bossDamage || "",
        critDamage: stored.critDamage || ""
    };
    setValues(initial);
  }, [mainStat, subStat, isMagicClass]);

  // 숫자 외 입력 방지 및 앞자리 0 제거
  const handleChange = (key, val) => {
    const onlyDigits = val.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
    setValues(prev => ({ ...prev, [key]: onlyDigits }));
  };


  const renderLabeledRow = (label, children) => (
    <div className="flex items-center justify-between gap-2">
      <label className="text-sm text-gray-700 w-[140px]">{label}</label>
      <div className="flex gap-1 w-full">{children}</div>
    </div>
  );

  // 저장 버튼
  const handleSave = () => {
    // 로컬 스토리지에 저장
    const savedMap = JSON.parse(localStorage.getItem("baseStatMap") || "{}");
    const parsedValues = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, Number(v) || 0]) // 숫자로 변환
    );
    savedMap[jobClass] = parsedValues;  // 해당 직업의 값만 저장
    localStorage.setItem("baseStatMap", JSON.stringify(savedMap));
    onSave(parsedValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center font-morris z-[999]">
      <div className="bg-white p-4 rounded shadow w-[600px] space-y-3 relative">
        <div
          onMouseEnter={() => setHoveringExample(true)}
          onMouseLeave={() => setHoveringExample(false)}
          className="absolute top-2 right-3 text-sm underline text-[#44B7CF] cursor-help"
        >
          예시 보기
        </div>

        {hoveringExample && (
          <div className="absolute -top-[200px] left-[590px] p-2 rounded z-30">
            <img src="/images/baseStatExample.png" alt="예시" className="max-w-[700px]" />
          </div>
        )}

        <h2 className="text-lg">{jobClass} 기본 능력치 입력</h2>
        <h3 className="text-sm">아무런 효과가 없는 상태에서 측정 후 장비 능력치를 제외해주세요. 숫자만 입력해주세요.</h3>

        {[mainStat, subStat].map(stat => renderLabeledRow(
          `${stat.toUpperCase()}`,
          <>
            <input
              type="text"
              placeholder="기본 수치"
              inputMode="numeric"
              value={values[stat] || ""}
              onChange={e => handleChange(stat, e.target.value)}
              className="border px-2 py-1 rounded w-1/3"
            />
            <input
              type="text"
              placeholder="% 수치"
              inputMode="numeric"
              value={values[`${stat}Percent`] || ""}
              onChange={e => handleChange(`${stat}Percent`, e.target.value)}
              className="border px-2 py-1 rounded w-1/3"
            />
            <input
              type="text"
              placeholder="% 미적용 수치"
              inputMode="numeric"
              value={values[`${stat}Fixed`] || ""}
              onChange={e => handleChange(`${stat}Fixed`, e.target.value)}
              className="border px-2 py-1 rounded w-1/3"
            />
          </>
        ))}

        {renderLabeledRow(isMagicClass ? "마력" : "공격력",
          <>
            <input
              type="text"
              placeholder="기본 수치"
              inputMode="numeric"
              value={values[isMagicClass ? "magic" : "attack"] || ""}
              onChange={e => handleChange(isMagicClass ? "magic" : "attack", e.target.value)}
              className="border px-2 py-1 rounded w-1/2"
            />
            <input
              type="text"
              placeholder="% 수치"
              inputMode="numeric"
              value={values[isMagicClass ? "magicPercent" : "attackPercent"] || ""}
              onChange={e => handleChange(isMagicClass ? "magicPercent" : "attackPercent", e.target.value)}
              className="border px-2 py-1 rounded w-1/2"
            />
          </>
        )}
        {renderLabeledRow("보스 데미지",
          <input
            type="text"
            placeholder="적용 중인 수치"
            inputMode="numeric"
            value={values.bossDamage || ""}
            onChange={e => handleChange("bossDamage", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        )}

        {renderLabeledRow("크리티컬 데미지",
          <input
            type="text"
            placeholder="적용 중인 수치"
            inputMode="numeric"
            value={values.critDamage || ""}
            onChange={e => handleChange("critDamage", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        )}
        <div className="flex justify-end items-center gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">취소</button>
          <button
            onClick={handleSave}
            className="bg-[#44B7CF] text-white px-4 py-1 rounded"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}