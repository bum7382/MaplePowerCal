// 캐시 만료 시간 (30분)
const CACHE_EXPIRE_MS = 1000 * 60 * 30;

// 캐릭터별로 저장하는 구조: { [characterName]: { data, timestamp } }
const STORAGE_KEY = "characterCache";

// 캐시 가져오기 (만료 확인)
export function getCachedCharacter(name) {
  const cacheStr = localStorage.getItem(STORAGE_KEY);
  if (!cacheStr) return null;
  try {
    const cache = JSON.parse(cacheStr);
    const entry = cache[name];
    if (!entry) return null;
    // 만료 체크
    if (Date.now() - entry.timestamp > CACHE_EXPIRE_MS) {
      // 만료된 캐시는 삭제해줌
      delete cache[name];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

// 캐시 저장
export function setCachedCharacter(name, data) {
  let cache = {};
  const cacheStr = localStorage.getItem(STORAGE_KEY);
  if (cacheStr) {
    try { cache = JSON.parse(cacheStr); } catch {}
  }
  cache[name] = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

