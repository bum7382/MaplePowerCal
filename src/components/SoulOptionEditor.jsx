// src/components/SoulOptionEditor.jsx
// 소울 옵션 편집기 컴포넌트
import React from "react";
import useSoulOptions from "@/utils/useSoulOptions";

export default function SoulOptionEditor({ value, onChange }) {
  const options = useSoulOptions();
  const { template, value: statValue } = value || {};

  return (
    <div className="mt-3 border-t border-gray-600 pt-2">
      <p className="text-white mb-1">소울 옵션</p>
      <div className="flex items-center gap-2">
        <select
          className="bg-[#1F2735] text-white text-sm rounded px-2 py-1 border border-gray-500"
          value={template?.label || ""}
          onChange={(e) => {
            const selected = options.find(opt => opt.label === e.target.value);
            if (selected) onChange({ template: selected, value: "" });
          }}
        >
          <option value="">선택 안함</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.label}>{opt.label}</option>
          ))}
        </select>

        {template && (
          <input
            type="text"
            value={statValue}
            onChange={(e) => {
              const raw = e.target.value.replace(/^0+(?!$)/, ""); // 앞자리 0 제거
              const digits = raw.replace(/[^\d]/g, "").slice(0, 4); // 숫자만, 최대 4자리
              onChange({ template, value: digits });
            }}
            className="w-[60px] text-sm text-right bg-transparent border-b border-white text-white px-1"
            placeholder="수치"
          />
        )}

        {template?.template?.includes("%") && <span className="text-white">%</span>}
      </div>
    </div>
  );
}
