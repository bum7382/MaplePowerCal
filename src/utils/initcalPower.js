import jobStat from "../data/jobStat.json";
import potentialOptions from "../data/potentialOptions.json";
import setEffect from "../data/setEffect.json";
import soulOptions from "../data/soulOptions.json";

const baseStat = {
    STR: 4,
    DEX: 4,
    INT: 4,
    LUK: 4,
    atk: 0,
    magic: 0,
    damage: 0,
    boss_damage: 0,
    crit_damage: 0,
};

const noPerStat = {
    STR: 0,
    DEX: 0,
    INT: 0,
    LUK: 0
}
// 0. 기본 스탯
function basicPower(character_level, character_class){
  // 직업별 주력 스탯 찾기
  const jobInfo = jobStat.find(j => j.class === character_class);
  const mainStat = jobInfo?.main_stat ?? null;
  baseStat[mainStat] = 18 + 5 * character_level;
}

// 1. 칭호
function titlePower(title) {
  if (!title || !title.title_description) return;

  // 효과 줄 단위로 파싱
  const effects = title.title_description.split('\n');
  effects.forEach(effect => {
    let m;
    // 올스탯 +N
    m = effect.match(/^올스탯\s*\+?(\d+)/);
    if (m) {
      const n = Number(m[1]);
      baseStat.STR += n;
      baseStat.DEX += n;
      baseStat.INT += n;
      baseStat.LUK += n;
      return;
    }

    // 공격력/마력+N
    m = effect.match(/^공격력\/마력\+?(\d+)/);
    if (m) {
      baseStat.atk += Number(m[1]);
      baseStat.magic += Number(m[1]);
      return;
    }

    // 보스 몬스터 데미지+N%
    m = effect.match(/^보스 몬스터 데미지\+?([\d.]+)%/);
    if (m) {
      baseStat.boss_damage += Number(m[1]);
      return;
    }
  });
}

// 2. 어빌리티
function abilityPower(character_level, ability) {
  ability.forEach(({ ability_value }) => {
    // 한 줄에 여러 효과가 콤마로 있을 수 있음
    const effects = ability_value.split(",").map(e => e.trim());
    effects.forEach(effect => {
      let m;
      // STR/DEX/INT/LUK N 증가
      m = effect.match(/^(STR|DEX|INT|LUK)\s*(\d+)\s*증가/);
      if (m) {
        noPerStat[m[1]] += Number(m[2]);
        return;
      }

      // 모든 능력치 N 증가
      m = effect.match(/^모든 능력치\s*(\d+)\s*증가/);
      if (m) {
        const n = Number(m[1]);
        noPerStat.STR += n;
        noPerStat.DEX += n;
        noPerStat.INT += n;
        noPerStat.LUK += n;
        return;
      }

      // 공격력 N 증가
      m = effect.match(/^공격력\s*(\d+)\s*증가/);
      if (m) {
        baseStat.atk += Number(m[1]);
        return;
      }

      // 마력 N 증가
      m = effect.match(/^마력\s*(\d+)\s*증가/);
      if (m) {
        baseStat.magic += Number(m[1]);
        return;
      }

      // 보스 몬스터 공격 시 데미지 N% 증가
      m = effect.match(/^보스 몬스터 공격 시 데미지\s*(\d+)% 증가/);
      if (m) {
        baseStat.boss_damage += Number(m[1]);
        return;
      }

      // 크리티컬 데미지 N% 증가
      m = effect.match(/^크리티컬 데미지\s*(\d+)% 증가/);
      if (m) {
        baseStat.crit_damage += Number(m[1]);
        return;
      }

      // N레벨마다 공격력 1 증가
      m = effect.match(/^(\d+)레벨마다 공격력 1 증가/);
      if (m && character_level) {
        baseStat.atk += Math.floor(character_level / Number(m[1]));
        return;
      }

      // N레벨마다 마력 1 증가
      m = effect.match(/^(\d+)레벨마다 마력 1 증가/);
      if (m && character_level) {
        baseStat.magic += Math.floor(character_level / Number(m[1]));
        return;
      }
    });
  });
}

// 3. 유니온 아티팩트
function artifactPower(artifact) {
  artifact.forEach(({ name }) => {
    let m;
    // 올스탯 N 증가
    m = name.match(/^올스탯\s*(\d+)\s*증가/);
    if (m) {
      const n = Number(m[1]);
      baseStat.STR += n;
      baseStat.DEX += n;
      baseStat.INT += n;
      baseStat.LUK += n;
      return;
    }

    // 공격력 N, 마력 N 증가
    m = name.match(/^공격력\s*(\d+),\s*마력\s*(\d+)\s*증가/);
    if (m) {
      baseStat.atk += Number(m[1]);
      baseStat.magic += Number(m[2]);
      return;
    }

    // 데미지 증가
    m = name.match(/^데미지\s*([\d.]+)% 증가/);
    if (m) {
      baseStat.damage += Number(m[1]);
      return;
    }

    // 보스 몬스터 공격 시 데미지 N% 증가
    m = name.match(/^보스 몬스터 공격 시 데미지\s*([\d.]+)% 증가/);
    if (m) {
      baseStat.boss_damage += Number(m[1]);
      return;
    }

    // 크리티컬 데미지 N% 증가
    m = name.match(/^크리티컬 데미지\s*([\d.]+)% 증가/);
    if (m) {
      baseStat.crit_damage += Number(m[1]);
      return;
    }
  });
}

// 4. 유니온 챔피언
function championPower(champion) {
  champion.forEach(({ stat }) => {
    let m;
    // 올스탯 N 증가
    m = stat.match(/^올스탯\s*(\d+)/);
    if (m) {
      const n = Number(m[1]);
      baseStat.STR += n;
      baseStat.DEX += n;
      baseStat.INT += n;
      baseStat.LUK += n;
    }

    // 공격력/마력 N 증가
    m = stat.match(/^공격력\/마력\s*(\d+)\s*증가/);
    if (m) {
      baseStat.atk += Number(m[1]);
      baseStat.magic += Number(m[1]);
    }

    // 보스 몬스터 공격 시 데미지 N% 증가
    m = stat.match(/^보스 몬스터 공격 시 데미지\s*([\d.]+)% 증가/);
    if (m) {
      baseStat.boss_damage += Number(m[1]);
    }

    // 크리티컬 데미지 N% 증가
    m = stat.match(/^크리티컬 데미지\s*([\d.]+)% 증가/);
    if (m) {
      baseStat.crit_damage += Number(m[1]);
    }
  });
}

// 5. 헥사 스탯
function hexaStatPower(hexa_stat, character_class){
  const hexaCoreValue = {
    "공격력 증가": { main: [0, 5, 10, 15, 20, 30, 40, 50, 65, 80, 100], 
				     sub: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] },
    "데미지 증가": { main: [0, 0.75, 1.5, 2.25, 3, 4.5, 6, 7.5, 9.75, 12, 15], 
				          sub: [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6, 6.75, 7.5] },
    "보스 데미지 증가": { main: [0, 1, 2, 3, 4, 6, 8, 10, 13, 16, 20], 
				          sub: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    "크리티컬 데미지 증가": { main: [0.35, 0.7, 1.05, 1.4, 2.10, 2.8, 3.5, 4.55, 5.6, 7], 
				              sub: [0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45, 2.8, 3.15, 3.5] },
    "주력 스탯 증가": { main: [0, 100, 200, 300, 400, 600, 800, 1000, 1300, 1600, 2000], 
			            sub: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] }
  };
    // 직업별 주력스탯 찾기
  const jobInfo = jobStat.find(j => j.class === character_class);
  const mainStat = jobInfo?.main_stat ?? null;

  // 세 코어 모두 합산
  const allCores = [
    ...(hexa_stat.character_hexa_stat_core || []),
    ...(hexa_stat.character_hexa_stat_core_2 || []),
    ...(hexa_stat.character_hexa_stat_core_3 || [])
  ];

  allCores.forEach(core => {
    // main 옵션
    const { main_stat_name, main_stat_level, sub_stat_name_1, sub_stat_level_1, sub_stat_name_2, sub_stat_level_2 } = core;
    if (hexaCoreValue[main_stat_name] && main_stat_level != null) {
      const value = hexaCoreValue[main_stat_name].main[main_stat_level] ?? 0;
      if (main_stat_name === "공격력 증가") baseStat.atk += value;
      else if (main_stat_name === "데미지 증가") baseStat.damage += value;
      else if (main_stat_name === "보스 데미지 증가") baseStat.boss_damage += value;
      else if (main_stat_name === "크리티컬 데미지 증가") baseStat.crit_damage += value;
      else if (main_stat_name === "주력 스탯 증가" && mainStat) noPerStat[mainStat] += value;
    }
    // sub1 옵션
    if (hexaCoreValue[sub_stat_name_1] && sub_stat_level_1 != null) {
      const value = hexaCoreValue[sub_stat_name_1].sub[sub_stat_level_1] ?? 0;
      if (sub_stat_name_1 === "공격력 증가") baseStat.atk += value;
      else if (sub_stat_name_1 === "데미지 증가") baseStat.damage += value;
      else if (sub_stat_name_1 === "보스 데미지 증가") baseStat.boss_damage += value;
      else if (sub_stat_name_1 === "크리티컬 데미지 증가") baseStat.crit_damage += value;
      else if (sub_stat_name_1 === "주력 스탯 증가" && mainStat) noPerStat[mainStat] += value;
    }
    // sub2 옵션
    if (hexaCoreValue[sub_stat_name_2] && sub_stat_level_2 != null) {
      const value = hexaCoreValue[sub_stat_name_2].sub[sub_stat_level_2] ?? 0;
      if (sub_stat_name_2 === "공격력 증가") baseStat.atk += value;
      else if (sub_stat_name_2 === "데미지 증가") baseStat.damage += value;
      else if (sub_stat_name_2 === "보스 데미지 증가") baseStat.boss_damage += value;
      else if (sub_stat_name_2 === "크리티컬 데미지 증가") baseStat.crit_damage += value;
      else if (sub_stat_name_2 === "주력 스탯 증가" && mainStat) noPerStat[mainStat] += value;
    }
  });
}

// 6. 하이퍼 스탯
function hyperStatPower(hyperStat) {
  hyperStat.forEach(({ stat_increase }) => {
    if (!stat_increase) return;
    let m;
    // 힘/민첩성/지력/운 N 증가
    m = stat_increase.match(/^힘\s*(\d+)\s*증가/);
    if (m) { noPerStat.STR += Number(m[1]); return; }
    m = stat_increase.match(/^민첩성\s*(\d+)\s*증가/);
    if (m) { noPerStat.DEX += Number(m[1]); return; }
    m = stat_increase.match(/^지력\s*(\d+)\s*증가/);
    if (m) { noPerStat.INT += Number(m[1]); return; }
    m = stat_increase.match(/^운\s*(\d+)\s*증가/);
    if (m) { noPerStat.LUK += Number(m[1]); return; }

    // 크리티컬 데미지 N% 증가
    m = stat_increase.match(/^크리티컬 데미지\s*([\d.]+)% 증가/);
    if (m) { baseStat.crit_damage += Number(m[1]); return; }

    // 보스 몬스터 공격 시 데미지 N% 증가
    m = stat_increase.match(/^보스 몬스터 공격 시 데미지\s*([\d.]+)% 증가/);
    if (m) { baseStat.boss_damage += Number(m[1]); return; }

    // 데미지 N% 증가
    m = stat_increase.match(/^데미지\s*([\d.]+)% 증가/);
    if (m) { baseStat.damage += Number(m[1]); return; }

    // 공격력과 마력 N 증가
    m = stat_increase.match(/^공격력과 마력\s*(\d+)\s*증가/);
    if (m) {
      baseStat.atk += Number(m[1]);
      baseStat.magic += Number(m[1]);
      return;
    }
  });
}

// 7. 스킬
function skillPower(skill) {
  skill.forEach(({ skill_effect }) => {
    if (!skill_effect) return;

    // 모든 숫자 추출 (공격력, 마력 순서)
    // 1. "공격력 N" 추출
    const atkMatch = skill_effect.match(/공격력\s*(\d+)/);
    if (atkMatch) baseStat.atk += Number(atkMatch[1]);

    // 2. "마력 N" 추출
    const magicMatch = skill_effect.match(/마력\s*(\d+)/);
    if (magicMatch) baseStat.magic += Number(magicMatch[1]);
  });
}

// 8. 심볼
function symbolPower(symbol, character_class) {

  // 직업별 주력 스탯 찾기
  const jobInfo = jobStat.find(j => j.class === character_class);
  const mainStat = jobInfo?.main_stat ?? null;

  const statKeyMap = {
    STR: "symbol_str",
    DEX: "symbol_dex",
    INT: "symbol_int",
    LUK: "symbol_luk",
  };
  const statKey = statKeyMap[mainStat];

  // 모든 심볼 누적
  symbol.forEach(symbol => {
    if (statKey && symbol[statKey]) {
      noPerStat[mainStat] += Number(symbol[statKey]);
    }
  });
}

// 9. 유니온
function unionPower(union) {
  if (union.union_occupied) {
    union.union_occupied.forEach(effect => {
      let m;
      m = effect.match(/STR\s*([\d.]+)\s*증가/);
      if (m) baseStat.STR += Number(m[1]);
      m = effect.match(/DEX\s*([\d.]+)\s*증가/);
      if (m) baseStat.DEX += Number(m[1]);
      m = effect.match(/INT\s*([\d.]+)\s*증가/);
      if (m) baseStat.INT += Number(m[1]);
      m = effect.match(/LUK\s*([\d.]+)\s*증가/);
      if (m) baseStat.LUK += Number(m[1]);
      m = effect.match(/STR,\s*DEX,\s*LUK\s*([\d.]+)\s*증가/);
      if (m) {
        const n = Number(m[1]);
        baseStat.STR += n; baseStat.DEX += n; baseStat.LUK += n;
      }
      m = effect.match(/공격력\s*([\d.]+)\s*증가/);
      if (m) baseStat.atk += Number(m[1]);
      m = effect.match(/마력\s*([\d.]+)\s*증가/);
      if (m) baseStat.magic += Number(m[1]);
      m = effect.match(/공격력\/마력\s*([\d.]+)\s*증가/);
      if (m) {
        const n = Number(m[1]);
        baseStat.atk += n; baseStat.magic += n;
      }
      m = effect.match(/^데미지\s*([\d.]+)% 증가/);
      if (m) baseStat.damage += Number(m[1]);
      m = effect.match(/^보스 몬스터 공격 시 데미지\s*([\d.]+)% 증가/);
      if (m) baseStat.boss_damage += Number(m[1]);
      m = effect.match(/^크리티컬 데미지\s*([\d.]+)% 증가/);
      if (m) baseStat.crit_damage += Number(m[1]);
    });
  }

  if (union.union_raider) {
    union.union_raider.forEach(effect => {
      let m;
      m = effect.match(/STR\s*([\d.]+)\s*증가/);
      if (m) noPerStat.STR += Number(m[1]);
      m = effect.match(/DEX\s*([\d.]+)\s*증가/);
      if (m) noPerStat.DEX += Number(m[1]);
      m = effect.match(/INT\s*([\d.]+)\s*증가/);
      if (m) noPerStat.INT += Number(m[1]);
      m = effect.match(/LUK\s*([\d.]+)\s*증가/);
      if (m) noPerStat.LUK += Number(m[1]);
      m = effect.match(/STR,\s*DEX,\s*LUK\s*([\d.]+)\s*증가/);
      if (m) {
        const n = Number(m[1]);
        noPerStat.STR += n; noPerStat.DEX += n; noPerStat.LUK += n;
      }
      m = effect.match(/공격력\s*([\d.]+)\s*증가/);
      if (m) baseStat.atk += Number(m[1]);
      m = effect.match(/마력\s*([\d.]+)\s*증가/);
      if (m) baseStat.magic += Number(m[1]);
      m = effect.match(/공격력\/마력\s*([\d.]+)\s*증가/);
      if (m) {
        const n = Number(m[1]);
        baseStat.atk += n; baseStat.magic += n;
      }
      m = effect.match(/^보스 몬스터 공격 시 데미지\s*([\d.]+)% 증가/);
      if (m) baseStat.boss_damage += Number(m[1]);
      m = effect.match(/^크리티컬 데미지\s*([\d.]+)% 증가/);
      if (m) baseStat.crit_damage += Number(m[1]);
    });
  }
}



export function initcalPower(character){
    basicPower(character.level, character.class);
    titlePower(character.title);
    abilityPower(character.level, character.ability);
    artifactPower(character.artifact);
    championPower(character.champion);
    hexaStatPower(character.hexa_stat, character.class);
    hyperStatPower(character.hyperStat);
    skillPower(character.skill);
    symbolPower(character.symbol, character.class);
    unionPower(character.union)
    return {baseStat, noPerStat};
}