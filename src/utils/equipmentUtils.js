// frontnend/src/utils/equipmentUtils.js
// 장비 편집 후 변경 사항 비교 유틸리티 함수
export const isOptionEqual = (a = {}, b = {}) => {
  // a, b의 모든 키를 합쳐서 Set 생성
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    // undefined/null → 빈 문자열로 통일 후 문자열 비교
    const va = (a[key] ?? "").toString();
    const vb = (b[key] ?? "").toString();
    if (va !== vb) return false;  // 하나라도 다르면 false
    }
    return true;  // 모든 값이 같으면 true
};

// 실제 아이템 변경 여부 비교 함수
export const isItemChanged = (originalItem, currentItem) => {
  if (!originalItem || !currentItem) return false;

  const fieldsToCompare = [
    "item_add_option",
    "item_etc_option",
    "item_starforce_option",
  ];

  for (const field of fieldsToCompare) {
    if (!isOptionEqual(originalItem[field], currentItem[field])) {
      return true;
    }
  }

  const forceStringCompare = (key) => {
    const o = (originalItem[key] ?? "").toString();
    const c = (currentItem[key] ?? "").toString();
    return o !== c;
  };

  const simpleKeys = [
    "starforce",
    "potential_option_grade",
    "additional_potential_option_grade",
    "potential_option_1",
    "potential_option_2",
    "potential_option_3",
    "additional_potential_option_1",
    "additional_potential_option_2",
    "additional_potential_option_3",
    "soul_option"
  ];

  for (const key of simpleKeys) {
    if (forceStringCompare(key)) return true;
  }

  return false;
};
