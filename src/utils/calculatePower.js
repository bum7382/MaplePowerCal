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


export function calculatePower(equipments, jobClass, originalIsGenesis = null, baseStatsInput = null, characterLevel = 0) {
  const jobInfo = jobStat.find(j => j.class === jobClass);
  if (!jobInfo) return 0;

  // 주스탯이 INT일 경우 공격력이 아닌 마력 사용
  const isMagicClass = jobInfo.main_stat === "INT";

  const statKeys = ["STR", "DEX", "INT", "LUK", "HP"];
  // flat 값
  const baseStats = Object.fromEntries(statKeys.map(k => [k, 0]));
  // percent 값
  const percentStats = Object.fromEntries(statKeys.map(k => [k, 0]));

  // 공격력/마력
  let attack = 0, attackPercent = 0;
  let magic = 0, magicPercent = 0;

  // 보스 데미지, 최종 데미지, 크리티컬 데미지
  let bossDmg = baseStatsInput?.bossDamage ?? 0;
  let critDmg = 135 + (baseStatsInput?.critDamage ?? 0);
  
  // 세트 효과
  const setCountMap = {};

  // 제네시스 무기인지 확인 -> 제네시스 무기일 경우 최종 데미지 1.1배, 아닐 경우 1배
  // 기존에 제네시스 무기 -> 일반 무기로 변환 시 0.9배 되어야 함.
  const weapon = equipments.find(eq => eq.item_equipment_slot === "무기");
  const currentIsGenesis = weapon?.item_name?.includes("제네시스");
  let finalDamage = currentIsGenesis ? 1.1 : 1.0;

  // 현재 장착 중인 장비의 전체 옵션 계산
  for (const eq of equipments) {
    const base = eq.item_base_option || {}; // 전체
    const add = eq.item_add_option || {}; // 추가 옵션
    const etc = eq.item_etc_option || {}; // 주문서작
    const star = eq.item_starforce_option || {};  // 스타포스작

    // 스탯 값 계산
    for (let stat of ["str", "dex", "int", "luk", "hp"]) {
      const key = stat.toUpperCase();
      const baseKey = stat === "hp" ? "max_hp" : stat;
      baseStats[key] +=
        +(base[baseKey] || 0) + +(add[baseKey] || 0) + +(etc[baseKey] || 0) + +(star[baseKey] || 0);
    }
    // 올스탯 %
    const allPercent = +(base.all_stat || 0) + +(add.all_stat || 0) + +(etc.all_stat || 0) + +(star.all_stat || 0);
    if (allPercent > 0) {
      for (let key of ["STR", "DEX", "INT", "LUK"]) {
        percentStats[key] += allPercent;
      }
    }

    // 공격력 계산
    attack += +(base.attack_power || 0) + +(add.attack_power || 0) + +(etc.attack_power || 0) + +(star.attack_power || 0);
    
    // 마력 계산  
    magic += +(base.magic_power || 0) + +(add.magic_power || 0) + +(etc.magic_power || 0) + +(star.magic_power || 0);

    // 보스 공격력 계산
    bossDmg += +(base.boss_damage || 0) + +(add.boss_damage || 0);

    // 소울 옵션이 있을 경우 계산
    if (eq.soul_option) {
      const match = soulOptions.find(opt => eq.soul_option?.startsWith(opt.label));
      if (match) {
        const valMatch = eq.soul_option.match(/([0-9]+)/);
        const val = valMatch ? +valMatch[1] : 0;
        const id = match.id;

        if (match.type === "percent") {
          if (id == 4) bossDmg += val;
          else if (id == 2) attackPercent += val;
          else if (id == 3) magicPercent += val;
          else if (id == 13) statKeys.forEach(k => percentStats[k] += val);
        } else if (match.type === "flat") {
          if (id == 8) baseStats.STR += val;
          else if (id == 9) baseStats.LUK += val;
          else if (id == 10) baseStats.DEX += val;
          else if (id == 11) baseStats.INT += val;
          else if (id == 14) baseStats.HP += val;
          else if (id == 6) attack += val;
          else if (id == 7) magic += val;
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
          const bonus = Math.floor(characterLevel / interval) * perInterval;
          if (statKeys.includes(statKey)) {
            baseStats[statKey] += bonus;
          }
          continue;
        }
      }
      if (p.type === "percent") {
        if (id == 4) bossDmg += val; // 보공
        else if (id == 52) critDmg += val;  // 크뎀

        else if (id == 28) statKeys.forEach(k => percentStats[k] += val); // 올스탯 %
        else if (id == 23) percentStats.STR += val; // STR %
        else if (id == 24) percentStats.LUK += val; // LUK %
        else if (id == 25) percentStats.DEX += val; // DEX %
        else if (id == 26) percentStats.INT += val; // INT %
        else if (id == 30) percentStats.HP += val;  // HP %
 
        else if (id == 2) attackPercent += val; // 공격력 %
        else if (id == 3) magicPercent += val;  // 마력 %
      } else if (p.type === "flat") {
        if (id == 27) statKeys.forEach(k => baseStats[k] += val); // 올스탯
        else if (id == 19) baseStats.STR += val;  // STR
        else if (id == 20) baseStats.LUK += val;  // LUK
        else if (id == 21) baseStats.DEX += val;  // DEX
        else if (id == 22) baseStats.INT += val;  // INT
        else if (id == 29) baseStats.HP += val; // HP

        else if (id == 17) attack += val; // 공격력
        else if (id == 18) magic += val;  // 마력
        
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
        if (key === "공격력") attack += v;
        else if (key === "마력") magic += v;
        else if (key === "보스몬스터데미지") bossDmg += v;
        else if (key === "올스탯") {
          for (let s of ["STR", "DEX", "INT", "LUK"]) baseStats[s] += v;
        } else if (key === "최대HP") baseStats.HP += v;
        else if (key === "최대HP%") percentStats.HP += v;
        else if (key === "크리티컬데미지") critDmg += v;
      }
    }
  }

  // 주스탯, 부스탯
  const main = jobInfo.main_stat;
  const sub = jobInfo.sub_stat;

  const getFinalStat = (key) => {
    const base = baseStatsInput?.[key] || 0;  // 기존 flat 값
    const percent = baseStatsInput?.[`${key}Percent`] || 0; // 기존 percent 값
    const fixed = baseStatsInput?.[`${key}Fixed`] || 0; // % 미적용 값
    const itemFlat = baseStats[key] || 0; // 장비 flat 값
    const itemPercent = percentStats[key] || 0; // 장비 percent 값
    return Math.floor((base + itemFlat) * ((100 + percent + itemPercent) / 100)) + fixed;
  };

  const mainStat = getFinalStat(main);
  const subStat = Array.isArray(sub) ? sub.reduce((a, s) => a + getFinalStat(s), 0) : getFinalStat(sub);
  const finalStat = Math.floor((mainStat * 4 + subStat) / 100);

  const atkBase = baseStatsInput?.[isMagicClass ? "magic" : "attack"] ?? 0;
  const atkPercent = baseStatsInput?.[isMagicClass ? "magicPercent" : "attackPercent"] || 0;
  const equipBase = isMagicClass ? magic : attack;
  const equipPercent = isMagicClass ? magicPercent : attackPercent;
  const finalAtk = Math.floor((atkBase + equipBase) * ((100 + atkPercent + equipPercent) / 100));

  const finalBoss = bossDmg / 100;
  const finalCrit = critDmg / 100;
  console.log("전투력 계산:", {
    mainStat,
    subStat, 
    atkBase,
    atkPercent,
    equipBase,
    equipPercent,
    finalBoss,
    finalCrit,
  });
  const power = Math.floor(finalStat * finalAtk * finalBoss * finalCrit * finalDamage);
  return isNaN(power) ? 0 : power;
}
