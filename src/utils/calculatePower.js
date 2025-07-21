// frontnend/src/utils/calculatePower.js
// 전투력 계산 유틸리티
import jobStat from "../data/jobStat.json";
import potentialOptions from "../data/potentialOptions.json";
import setEffect from "../data/setEffect.json";
import soulOptions from "../data/soulOptions.json";

function buildTemplateRegex(template) {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace("\\{value\\}", "(\\d+)");
  return new RegExp(`^${pattern}$`);
}


export function calculatePower(equipments, character_class, initialStat, noPerStat, character_level = 0) {
  const jobInfo = jobStat.find(j => j.class === character_class);
  if (!jobInfo) return 0;
  const baseStat = { ...initialStat };
  const perStat = {
    STR: 0,
    DEX: 0,
    INT: 0,
    LUK: 0,
    atk: 0,
    magic: 0
  };
  // 주스탯이 INT일 경우 공격력이 아닌 마력 사용
  const isMagicClass = jobInfo.main_stat === "INT";
  const statKeys = ["STR", "DEX", "INT", "LUK"];

  // 세트 효과
  const setCountMap = {};

  // 제네시스 무기일 경우 최종 데미지 1.1배, 아닐 경우 1배
  const weapon = equipments.find(eq => eq.item_equipment_slot === "무기");
  const currentIsGenesis = weapon?.item_name?.includes("제네시스");
  let finalDamage = currentIsGenesis ? 1.1 : 1.0;

  // 현재 장착 중인 장비의 전체 옵션 계산
  for (const eq of equipments) {
    const base = eq.item_base_option || {}; // 기본값
    const add = eq.item_add_option || {}; // 추가 옵션
    const etc = eq.item_etc_option || {}; // 주문서작
    const star = eq.item_starforce_option || {};  // 스타포스작

    // 추옵 계산
    // 기본 스탯 값 계산
    for (let stat of ["str", "dex", "int", "luk"]) {
      const key = stat.toUpperCase();
      baseStat[key] +=
        +(base[stat] || 0) + +(add[stat] || 0) + +(etc[stat] || 0) + +(star[stat] || 0);
    }
    // 올스탯 %
    const allPercent = +(base.all_stat || 0) + +(add.all_stat || 0) + +(etc.all_stat || 0) + +(star.all_stat || 0);
    if (allPercent > 0) {
      for (let key of ["STR", "DEX", "INT", "LUK"]) {
        perStat[key] += allPercent;
      }
    }

    // 공격력 계산
    baseStat.atk += +(base.attack_power || 0) + +(add.attack_power || 0) + +(etc.attack_power || 0) + +(star.attack_power || 0);
    
    // 마력 계산  
    baseStat.magic += +(base.magic_power || 0) + +(add.magic_power || 0) + +(etc.magic_power || 0) + +(star.magic_power || 0);

    // 보스 데미지 계산
    baseStat.boss_damage += +(base.boss_damage || 0) + +(add.boss_damage || 0);

    // 데미지 계산
    baseStat.damage += +(base.damage || 0) + +(add.damage || 0)

    // 소울 옵션이 있을 경우 계산
    if (eq.soul_option) {
      const match = soulOptions.find(opt => eq.soul_option?.startsWith(opt.label));
      if (match) {
        const valMatch = eq.soul_option.match(/([0-9]+)/);
        const val = valMatch ? +valMatch[1] : 0;
        const id = match.id;

        if (match.type === "percent") {
          if (id == 4) baseStat.boss_damage += val;
          else if (id == 2) perStat.atk += val;
          else if (id == 3) perStat.magic += val;
          else if (id == 13) statKeys.forEach(k => perStat[k] += val);
        } else if (match.type === "flat") {
          if (id == 8) baseStat.STR += val;
          else if (id == 9) baseStat.LUK += val;
          else if (id == 10) baseStat.DEX += val;
          else if (id == 11) baseStat.INT += val;
          else if (id == 6) baseStat.atk += val;
          else if (id == 7) baseStat.magic += val;
        }
      }
    }

    // 잠재 능력 계산
    const allPotentials = [
      eq.potential_option_1, eq.potential_option_2, eq.potential_option_3,
      eq.additional_potential_option_1, eq.additional_potential_option_2, eq.additional_potential_option_3
    ].filter(Boolean);
    
    // 잠재옵션 계산
    for (const pot of allPotentials) {
      let match = null;
      const p = potentialOptions.find(option => {
        const regex = buildTemplateRegex(option.template);
        const m = pot?.match(regex);
        if (m) {
          match = m;
          return true;
        }
        return false;
      });
      if (!p || !match) continue;
      const val = match ? +match[1] : 0;
      const id = p.id;

      if (p.template.includes("캐릭터 기준")) {
        const levelMatch = pot?.match(/기준 (\d+)레벨 당 ([A-Z]+) \+(\d+)/);
        if (levelMatch) {
          const interval = +levelMatch[1]; // 예: 9
          const statKey = levelMatch[2].toUpperCase(); // STR, DEX 등
          const perInterval = +levelMatch[3]; // 예: 1
          const bonus = Math.floor(character_level / interval) * perInterval;
          if (statKeys.includes(statKey)) {
            baseStat[statKey] += bonus;
          }
          continue;
        }
      }
      if (p.type === "percent") {
        if (id == 4) baseStat.boss_damage += val; // 보공
        else if(id == 5) baseStat.damage += val;  // 데미지
        else if (id == 52) baseStat.crit_damage += val;  // 크뎀

        else if (id == 28) statKeys.forEach(k => perStat[k] += val); // 올스탯 %
        else if (id == 23) perStat.STR += val; // STR %
        else if (id == 24) perStat.LUK += val; // LUK %
        else if (id == 25) perStat.DEX += val; // DEX %
        else if (id == 26) perStat.INT += val; // INT %
 
        else if (id == 2) perStat.atk += val; // 공격력 %
        else if (id == 3) perStat.magic += val;  // 마력 %
      } else if (p.type === "flat") {
        if (id == 27) statKeys.forEach(k => baseStat[k] += val); // 올스탯
        else if (id == 19) baseStat.STR += val;  // STR
        else if (id == 20) baseStat.LUK += val;  // LUK
        else if (id == 21) baseStat.DEX += val;  // DEX
        else if (id == 22) baseStat.INT += val;  // INT

        else if (id == 17) baseStat.atk += val; // 공격력
        else if (id == 18) baseStat.magic += val;  // 마력
        
      }
    }

    Object.entries(setEffect).forEach(([setName, data]) => {
      const items = data.setItems || [];
      const matchList = data.match || [];
      if (items.includes(eq.item_name) || matchList.some(keyword => eq.item_name?.includes(keyword))) {
        setCountMap[setName] = (setCountMap[setName] || 0) + 1;
      }
    });
  }

  for (const [setName, count] of Object.entries(setCountMap)) {
    const bonus = setEffect[setName].bonuses;
    for (let i = 1; i <= count; i++) {
      const entry = bonus?.[String(i)];
      if (!entry) continue;
      for (const [k, v] of Object.entries(entry)) {
        const key = k.replace(/ /g, "");
        if (key === "공격력") baseStat.atk += v;
        else if (key === "마력") baseStat.magic += v;
        else if (key === "보스몬스터데미지") baseStat.boss_damage += v;
        else if (key === "올스탯") {
          for (let s of ["STR", "DEX", "INT", "LUK"]) baseStat[s] += v;
        }
        else if(key === "주스탯") baseStat[jobInfo.main_stat] += v;
        else if(key === "부스탯") baseStat[jobInfo.sub_stat] += v;
        else if (key === "크리티컬데미지") baseStat.crit_damage += v;
      }
    }
  }

  // 주스탯, 부스탯
  const main = jobInfo.main_stat;
  const sub = jobInfo.sub_stat;

  const mainStat = baseStat[main] * ((100 + perStat[main]) / 100) + noPerStat[main];
  const subStat = baseStat[sub] * ((100 + perStat[sub]) / 100) + noPerStat[sub]
  const finalStat = Math.floor((mainStat * 4 + subStat) / 100);

  const finalAtk = Math.floor((baseStat[isMagicClass ? "magic" : "atk"]) * ((100 + perStat[isMagicClass ? "magic" : "atk"]) / 100));
  
  const finalDmg = (100 + baseStat.boss_damage + baseStat.damage) / 100;
  const finalCrit = (135 + baseStat.crit_damage) / 100;
  const power = Math.floor(finalStat * finalAtk * finalDmg * finalCrit * finalDamage);
  
  
  console.log("전투력 계산:", {
    baseStat,
    noPerStat,
    perStat,
    mainStat,
    subStat, 
    finalStat,
    finalAtk,
    finalDmg,
    finalCrit,
    power
  });
  return isNaN(power) ? 0 : power;
}
