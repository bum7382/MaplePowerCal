// frontend/src/utils/fetchCharacterByName.js
// 캐릭터 이름으로 넥슨 API에서 캐릭터 정보를 조회하는 함수
export async function fetchCharacterByName(name) {
  try {
    const res = await fetch(`/api/characterSearch?name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("서버 오류");
    return await res.json(); // 넥슨 API 결과
  } catch (err) {
    console.error("❌ 넥슨 캐릭터 조회 실패:", err);
    return null;
  }
}
