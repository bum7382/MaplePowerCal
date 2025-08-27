// frontend/src/utils/fetchCharacterByName.js
// 캐릭터 이름으로 넥슨 API에서 캐릭터 정보를 조회하는 함수
import { initcalPower } from "../utils/initcalPower.js";

export async function fetchCharacterByName(name) {
  try {
    const res = await fetch(`/api/characterSearch?name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("서버 오류");
    const result = await res.json(); // 넥슨 API 결과

    if (!result || result?.error) return null;

    // 데이터 전처리
    const basicPowerChar = {
      class: result.character_class,  // 캐릭터 직업
      level: result.character_level,  // 캐릭터 레벨
      title: result.title,            // 칭호
      hyperStat: result.hyperStat,    // 하이퍼 스탯
      ability: result.ability,        // 어빌리티
      symbol: result.symbol,          // 심볼 정보
      skill: result.skill,            // 0차 스킬
      hexa_stat: result.hexa_stat,    // 헥사 스탯
      union: result.union,            // 유니온
      artifact: result.artifact,      // 아티팩트
      champion: result.champion,      // 유니온 챔피언
      pet: result.pet,                 // 펫 장비
      willingness_level: result.willingness_level   // 성향 의지 레벨
    }

    const { baseStat, noPerStat, perStat } = initcalPower(basicPowerChar);

    const mappedChar = {
      name: result.character_name,    // 캐릭터 이름
      class: result.character_class,  // 캐릭터 직업
      level: result.character_level,  // 캐릭터 레벨
      image: result.character_image,  // 캐릭터 이미지 URL
      power: result.combat_power,      // 전투력
      equipment: result.item,         // 장비
      baseStat: baseStat,             // 기본 스탯
      noPerStat: noPerStat,           // % 미적용 스탯
      perStat: perStat,               // % 스탯
      preset_no: result.item_preset,  // 장비 프리셋 번호
      equipment_preset_1: result.item_preset1,  // 1번 프리셋 장비
      equipment_preset_2: result.item_preset2,  // 2번 프리셋 장비
      equipment_preset_3: result.item_preset3,  // 3번 프리셋 장비
      hexa_stat: result.hexa_stat,  // 헥사 스탯
    };
    console.log(mappedChar)
    return mappedChar;
  } catch (err) {
    console.log(err)
    return null;
  }
}
