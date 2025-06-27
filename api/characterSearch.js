// api/characterSearch.js
export default async function handler(req, res) {
  const { name } = req.query;

  const API_URL = process.env.NEXON_OPEN_API_URL;
  const API_KEY = process.env.NEXON_OPEN_API;

  try {
    // 1. 닉네임으로 ocid 조회
    const idRes = await fetch(`${API_URL}/maplestory/v1/id?character_name=${encodeURIComponent(name)}`, {
      headers: { "x-nxopen-api-key": API_KEY },
    });
    const idResBody = await idRes.json();
    if (!idRes.ok || idResBody.error || !idResBody.ocid) {
      throw new Error(`ID 조회 실패: ${JSON.stringify(idResBody)}`);
    }
    const ocid = idResBody.ocid;

    // ocid로 각종 정보 병렬 요청
    const [
      infoRes,     // 2. 캐릭터 기본 정보
      statRes,     // 3. 스탯 정보
      itemRes,     // 4. 장비 정보
      hyperRes,    // 5. 하이퍼 스탯
      abilityRes,  // 6. 어빌리티
      symbolRes,   // 7. 심볼
      skillRes,    // 8. 0차 스킬
      hexaRes,     // 9. 헥사 스텟
      unionRes,    // 10. 유니온 공격대
      artifactRes, // 11. 유니온 아티팩트
      championRes  // 12. 유니온 챔피언
    ] = await Promise.all([
      fetch(`${API_URL}/maplestory/v1/character/basic?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/stat?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/item-equipment?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/hyper-stat?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/ability?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/skill?ocid=${ocid}&character_skill_grade=0`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/hexamatrix-stat?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/union-raider?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/union-artifact?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      }),
      fetch(`${API_URL}/maplestory/v1/character/union-champion?ocid=${ocid}`, {
        headers: { "x-nxopen-api-key": API_KEY },
      })
    ]);

    // 결과 파싱
    const [
      infoBody,
      stat,
      item,
      hyperStat,
      ability,
      symbol,
      skill,
      hexaStat,
      union,
      artifact,
      champion
    ] = await Promise.all([
      infoRes.json(),
      statRes.json(),
      itemRes.json(),
      hyperRes.json(),
      abilityRes.json(),
      symbolRes.json(),
      skillRes.json(),
      hexaRes.json(),
      unionRes.json(),
      artifactRes.json(),
      championRes.json()
    ]);

    // ★ 필요한 데이터만 합쳐서 반환
    res.status(200).json({
      ...infoBody,
      ...stat,
      ...item,
      hyperStat,
      ability,
      symbol,
      skill,
      hexaStat,
      union,
      artifact,
      champion
    });

  } catch (err) {
    console.error("❌ API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}