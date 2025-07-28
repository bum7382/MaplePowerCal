import { or } from "firebase/firestore/lite";
import jobStat from "../data/jobStat.json";
import starforceStatTable from "../data/starforceStatTable"

export default function calculateStarforceStat(character_class, item, starforce){
  
  const jobInfo = jobStat.find(j => j.class === character_class);
  if (!jobInfo) return 0;
  // 주스탯이 INT일 경우 공격력이 아닌 마력 사용
  const isMagicClass = jobInfo.main_stat === "INT";

  let stat = 0, speed = 0, jump = 0, max_hp = 0, max_mp = 0;
  const originalArmor = Number(item.item_base_option?.armor || 0) + Number(item.item_etc_option?.armor || 0)
  const originalAttack = Number(item.item_base_option?.attack_power || 0) +  Number(item.item_etc_option?.attack_power || 0);
  const originalMagic = Number(item.item_base_option?.magic_power || 0) + Number(item.item_etc_option?.magic_power || 0);

  let armor = originalArmor;
  let attack = originalAttack;
  let magic = originalMagic;

  const armorSlot = ["모자", "상의", "하의", "한벌옷", "장갑", "망토", "신발", "방패"]
  const accessorySlot = ["얼굴장식", "눈장식", "귀고리", "어깨장식", "반지1", "반지2", "반지3", "반지4", "펜던트", "펜던트2", "벨트"]
  const slot = item.item_equipment_slot;
  const level = Number(item.item_base_option?.base_equipment_level || 0);

  // 스타포스 15성 이하일 때
  if(starforce > 0){
    const limit = Math.min(starforce, 15);

    /* 스탯 증가량 */
    for(let i = 0; i < limit; i++){
      stat += (i < 5) ? 2 : 3;
    }

    /* 공/마 증가량 */
    if(slot == "무기" || slot == "보조무기"){
      for(let i = 0; i < limit; i++){
        isMagicClass ? magic += Math.floor(magic / 50) + 1 : attack += Math.floor(attack / 50) + 1;
      }
    }
    if(slot == "장갑"){
      for(let i = 0; i < starforce; i++){
        if([5, 7, 9, 11, 13, 14, 15].includes(i)){
          isMagicClass ? magic++ : attack++;
        }
      }
    }

    /* 기타 스탯 */
    if(slot == "신발"){
      for(let i = 0; i < limit; i++){
        if(i < 12){
          speed++;
          jump++;
        }
        else if(i < 15){
          speed += 2;
          jump += 2;
        }
      }
    }
    if(slot == "무기" || slot == "보조무기"){
      for(let i = 0; i < limit; i++){
        if(i < 3){
          max_hp += 5;
          max_mp += 5;
        }
        else if(i < 6){
          max_hp += 10;
          max_mp += 10;
        }
        else if(i < 9){
          max_hp += 20;
          max_mp += 20;
        }
        else if(i < 15){
          max_hp += 25;
          max_mp += 25;
        }
      }
    }
    if(armorSlot.includes(slot) || accessorySlot.includes(slot)){
      // 최대 HP 상승
      if(slot != "신발" && slot != "장갑"){
        for(let i = 0; i < limit; i++){
          if(i < 3) max_hp += 5;
          else if(i < 6) max_hp += 10;
          else if(i < 9) max_hp += 20;
          else if(i < 15) max_hp += 25;
        }
      }
      // 방어력 상승
      for(let i = 0; i < starforce; i++){
        armor += Math.floor(armor / 20) + 1;
      }
    }
  }


  // 스타포스 16성 이상 - 방어구 및 장신구
  if(starforce > 15){
    if(armorSlot.includes(slot) || accessorySlot.includes(slot)){
      const sortedTable = [...starforceStatTable].sort((a, b) => a.level - b.level);
      const table = [...sortedTable].reverse().find(row => level >= row.level);
      if (!table) return;

      for (let i = 15; i < starforce; i++) {
        if(i < 22) stat += table.stat;
        const idx = i - 15;
        const bonus = table.armor?.[idx];
        if (bonus != null) {
          attack += bonus;
          magic += bonus;
        }
      }
    }

    // 스타포스 16성 이상 - 무기
    if(slot == "무기" || slot == "보조무기"){
      const sortedTable = [...starforceStatTable].sort((a, b) => a.level - b.level);
      const table = [...sortedTable].reverse().find(row => level >= row.level);
      if (!table) return;

      for (let i = 15; i < starforce; i++) {
        if(i < 22) stat += table.stat;
        const idx = i - 15;
        const bonus = table.weapon?.[idx];
        if (bonus != null) {
          isMagicClass ? magic += bonus : attack += bonus;
        }
      }
    }
  }
  armor -= originalArmor;
  attack -= originalAttack;
  magic -= originalMagic;
  const result = {stat, attack, magic, speed, jump, max_hp, max_mp, armor }
  return result;
}
  
