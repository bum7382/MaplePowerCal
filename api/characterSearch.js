// /api/characterSearch.js
// 요청 딜레이 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// fetch 요청 1개: 429면 최대 n회까지 재시도, 나머진 에러 throw
async function fetchWithRetry(url, headers, retry = 2, delayMs = 1500) {
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url, { headers });
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      throw new Error(`응답을 JSON으로 변환 실패: ${url} status:${res.status}`);
    }
    if (res.status === 429) {
      if (i === retry) throw new Error(`429 오류: ${url} (최대 재시도 초과)`);
      await delay(delayMs); // 쿨타임 대기 후 재시도
      continue;
    }
    if (!res.ok || body.error) {
      throw new Error(`API 실패: ${url} status:${res.status} body:${JSON.stringify(body)}`);
    }
    return body;
  }
}

// fetch 여러 개를 n개씩 나눠서 순차적으로 호출하는 함수
async function fetchWithLimit(requests, limit, delayMs) {
  const results = [];
  for (let i = 0; i < requests.length; i += limit) {
    const batch = requests.slice(i, i + limit).map(fn => fn());
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    if (i + limit < requests.length) {
      await delay(delayMs);
    }
  }
  return results;
}

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

    const headers = { "x-nxopen-api-key": API_KEY };

    // ocid로 각종 정보 병렬 요청 → fetch 함수로 배열화 (429도 자동 재시도)
    const fetchFns = [
      // 2. 캐릭터 기본 정보
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/basic?ocid=${ocid}`, headers),
      // 3. 스탯 정보
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/stat?ocid=${ocid}`, headers),
      // 4. 장비 정보
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/item-equipment?ocid=${ocid}`, headers),
      // 5. 하이퍼 스탯
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/hyper-stat?ocid=${ocid}`, headers),
      // 6. 어빌리티
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/ability?ocid=${ocid}`, headers),
      // 7. 심볼
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, headers),
      // 8. 0차 스킬
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/skill?ocid=${ocid}&character_skill_grade=0`, headers),
      // 9. 헥사 스텟
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/hexamatrix-stat?ocid=${ocid}`, headers),
      // 10. 유니온 공격대
      () => fetchWithRetry(`${API_URL}/maplestory/v1/user/union-raider?ocid=${ocid}`, headers),
      // 11. 유니온 아티팩트
      () => fetchWithRetry(`${API_URL}/maplestory/v1/user/union-artifact?ocid=${ocid}`, headers),
      // 12. 유니온 챔피언
      () => fetchWithRetry(`${API_URL}/maplestory/v1/user/union-champion?ocid=${ocid}`, headers),
      // 13. 펫
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/pet-equipment?ocid=${ocid}`, headers),
      // 14. 성향
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/propensity?ocid=${ocid}`, headers),
      // 15. 기타 능력치 영향 요소
      () => fetchWithRetry(`${API_URL}/maplestory/v1/character/other-stat?ocid=${ocid}`, headers),
    ];

    // 5개씩 1.2초 대기하며 순차 실행 (limit, delayMs 값은 상황에 따라 조정 가능)
    const [
      infoBody,   // 2. 캐릭터 기본 정보
      stat,       // 3. 스탯 정보
      item,       // 4. 장비 정보
      hyperStat,  // 5. 하이퍼 스탯
      ability,    // 6. 어빌리티
      symbol,     // 7. 심볼 정보
      skill,      // 8. 0차 스킬
      hexaStat,   // 9. 헥사 스텟
      union,      // 10. 유니온 공격대
      artifact,   // 11. 유니온 아티팩트
      champion,   // 12. 유니온 챔피언
      pet,        // 13. 펫
      propensity,  // 14. 성향
      otherStat   // 15. 기타 능력치 영향 요소
    ] = await fetchWithLimit(fetchFns, 5, 1200);
    // 결과 파싱 (원본과 동일)
    const combatPowerObj = stat.final_stat ? stat.final_stat.find(s => s.stat_name === "전투력") : null;
    const combatPower = combatPowerObj ? combatPowerObj.stat_value : null;

    // 하이퍼 스탯 프리셋 1만 추출
    const presetNo = hyperStat.use_preset_no || "1";
    const presetKey = `hyper_stat_preset_${presetNo}`;
    const preset = hyperStat[presetKey] || [];

    // 기타 능력치 중 '의문의 결계'의 stat_info만 추출
    const barrierStat = otherStat.other_stat?.find(
      s => s.other_stat_type === "[챌린저스] 의문의 결계"
    )?.stat_info || [];

    // 필요한 데이터만 합쳐서 반환
    res.status(200).json({
      character_name: infoBody.character_name,    // 캐릭터 이름
      character_class: infoBody.character_class,  // 캐릭터 직업
      character_level: infoBody.character_level,  // 캐릭터 레벨
      character_image: infoBody.character_image,  // 캐릭터 이미지 URL
      combat_power: combatPower,                  // 전투력
      item_preset:  item.preset_no,               // 적용하고 있는 장비 프리셋 번호
      item: item.item_equipment,                  // 장비
      item_preset1: item.item_equipment_preset_1, // 장비 프리셋1
      item_preset2: item.item_equipment_preset_2, // 장비 프리셋2
      item_preset3: item.item_equipment_preset_3, // 장비 프리셋3
      title: item.title,                          // 칭호
      hyperStat: preset,                          // 하이퍼 스탯
      ability: ability.ability_info,              // 어빌리티
      symbol: symbol.symbol,                      // 심볼 정보
      skill: skill.character_skill,               // 0차 스킬
      hexa_stat: hexaStat,                        // 헥사 스텟
      union: {                                    // 유니온
        union_raider: union.union_raider_stat,
        union_occupied: union.union_occupied_stat
      },
      artifact: artifact.union_artifact_effect,   // 아티팩트
      champion: champion.champion_badge_total_info, // 유니온 챔피언
      pet:{                                       // 펫
        pet_1_equipment: pet.pet_1_equipment,
        pet_2_equipment: pet.pet_2_equipment,
        pet_3_equipment: pet.pet_3_equipment
      },
      willingness_level: propensity.willingness_level,
      other_stat: barrierStat,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
