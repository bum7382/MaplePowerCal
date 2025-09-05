import jobStat from "../data/jobStat.json";

const hexaCoreValue = {
	"공격력 증가": { main: [0, 5, 10, 15, 20, 30, 40, 50, 65, 80, 100], 
											sub: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] },
	"데미지 증가": { main: [0, 0.75, 1.5, 2.25, 3, 4.5, 6, 7.5, 9.75, 12, 15], 
													sub: [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6, 6.75, 7.5] },
	"보스 데미지 증가": { main: [0, 1, 2, 3, 4, 6, 8, 10, 13, 16, 20], 
													sub: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
	"크리티컬 데미지 증가": { main: [0, 0.35, 0.7, 1.05, 1.4, 2.10, 2.8, 3.5, 4.55, 5.6, 7], 
															sub: [0, 0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45, 2.8, 3.15, 3.5] },
	"주력 스탯 증가": { main: [0, 100, 200, 300, 400, 600, 800, 1000, 1300, 1600, 2000], 
											sub: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] },
	"올스탯 증가": { main: [0, 48, 96, 144, 192, 288, 384, 480, 624, 768, 960], 
											sub: [0, 48, 96, 144, 192, 240, 288, 336, 384, 432, 480] },
	"최대 HP 증가": { main: [0, 2100, 4200, 6300, 8400, 12600, 16800, 21000, 27300, 33600, 42000], 
											sub: [0, 2100, 4200, 6300, 8400, 10500, 12600, 14700, 16800, 18900, 21000] }
};

export default function hexaStatPower(hexa_stat, character_class){
  // 반환 버킷(기여치만 담음)
  const baseStat  = { STR: 0, DEX: 0, INT: 0, LUK: 0, pure_HP: 9, HP: 0, atk: 0, magic: 0, damage: 0, boss_damage: 0, crit_damage: 0 };
  const noPerStat = { STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0 };

  if (!hexa_stat) return { baseStat, noPerStat };

  const jobInfo  = jobStat.find(j => j.class === character_class);
  const mainStat = jobInfo?.main_stat ?? null;

  // “주력 스탯 증가”를 직업별로 어떤 테이블로 볼지 결정
  //  - 제논:  "올스탯 증가" 테이블
  //  - 데몬어벤져: "최대 HP 증가" 테이블
  //  - 그 외: "주력 스탯 증가" 테이블
  const mapStatTableName = (origName) => {
    if (origName !== "주력 스탯 증가") return origName;
    if (character_class === "제논") return "올스탯 증가";
    if (character_class === "데몬어벤져") return "최대 HP 증가";
    return "주력 스탯 증가";
  };

  // 테이블에서 값 꺼내오기
  const getValue = (name, level, lane) => {
    const tableName = mapStatTableName(name);
    const table = hexaCoreValue[tableName];
    if (!table || level == null) return 0;
    return table[lane]?.[level] ?? 0;
  };

  // “주력/올스탯/HP 증가” 적용 방식
  const applyStatIncrease = (origName, level, lane) => {
    if (origName !== "주력 스탯 증가") return false; // 이 함수는 “주력 스탯 증가” 원요청만 처리
    const tableName = mapStatTableName(origName);
    const v = getValue(origName, level, lane);

    if (character_class === "제논") {
      // 제논: “올스탯 증가” 값을 noPer에 STR/DEX/LUK에 각각 가산
      noPerStat.STR += v;
      noPerStat.DEX += v;
      noPerStat.LUK += v;
    } else if (character_class === "데몬어벤져") {
      // 데몬어벤져: “최대 HP 증가” 값을 noPer.HP에 가산
      noPerStat.HP += v;
    } else {
      // 일반 직업: 주스탯에 noPer 가산 (배열 케이스 거의 없음이지만 방어적으로 처리)
      if (Array.isArray(mainStat)) {
        mainStat.forEach(k => { if (k && noPerStat[k] != null) noPerStat[k] += v; });
      } else if (mainStat && noPerStat[mainStat] != null) {
        noPerStat[mainStat] += v;
      }
    }
    return true;
  };

  // 세 코어 모두 합산
  const allCores = [
    ...(hexa_stat.character_hexa_stat_core   || []),
    ...(hexa_stat.character_hexa_stat_core_2 || []),
    ...(hexa_stat.character_hexa_stat_core_3 || [])
  ];

  allCores.forEach(core => {
    const { main_stat_name, main_stat_level, sub_stat_name_1, sub_stat_level_1, sub_stat_name_2, sub_stat_level_2 } = core;

    // main
    if (!applyStatIncrease(main_stat_name, main_stat_level, "main")) {
      // 일반 옵션 처리
      const v = getValue(main_stat_name, main_stat_level, "main");
      if (main_stat_name === "공격력 증가") baseStat.atk += v;
      else if (main_stat_name === "데미지 증가") baseStat.damage += v;
      else if (main_stat_name === "보스 데미지 증가") baseStat.boss_damage += v;
      else if (main_stat_name === "크리티컬 데미지 증가") baseStat.crit_damage += v;
    }

    // sub1
    if (!applyStatIncrease(sub_stat_name_1, sub_stat_level_1, "sub")) {
      const v1 = getValue(sub_stat_name_1, sub_stat_level_1, "sub");
      if (sub_stat_name_1 === "공격력 증가") baseStat.atk += v1;
      else if (sub_stat_name_1 === "데미지 증가") baseStat.damage += v1;
      else if (sub_stat_name_1 === "보스 데미지 증가") baseStat.boss_damage += v1;
      else if (sub_stat_name_1 === "크리티컬 데미지 증가") baseStat.crit_damage += v1;
    }

    // sub2
    if (!applyStatIncrease(sub_stat_name_2, sub_stat_level_2, "sub")) {
      const v2 = getValue(sub_stat_name_2, sub_stat_level_2, "sub");
      if (sub_stat_name_2 === "공격력 증가") baseStat.atk += v2;
      else if (sub_stat_name_2 === "데미지 증가") baseStat.damage += v2;
      else if (sub_stat_name_2 === "보스 데미지 증가") baseStat.boss_damage += v2;
      else if (sub_stat_name_2 === "크리티컬 데미지 증가") baseStat.crit_damage += v2;
    }
  });

  return { baseStat, noPerStat };
}