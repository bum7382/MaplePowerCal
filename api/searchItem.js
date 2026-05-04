// /api/searchItem.js
// MongoDB Maple.Item 컬렉션에서 장비 검색
import { MongoClient } from "mongodb";

// Serverless 환경에서 connection 재사용
let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  const { slot, query, jobBit, types } = req.query;

  try {
    const client = await getClient();
    const db = client.db("Maple");
    const collection = db.collection("Item");

    const filter = {};

    // 슬롯 필터링
    // - 무기/보조무기는 DB에 세부 종류(예: "창", "검", "방패")로 들어있고 item_equipment_part가 "무기"/"보조무기"
    // - 그 외 부위는 item_equipment_slot이 슬롯명과 일치 (반지1/2/3/4 → 반지, 펜던트2 → 펜던트로 정규화)
    if (slot) {
      const baseSlot = slot.replace(/[0-9]/g, "");
      if (baseSlot === "무기" || baseSlot === "보조무기") {
        filter.item_equipment_part = baseSlot;
        // 직업이 사용 가능한 무기 종류로 추가 필터 (예: 다크나이트 → 창/폴암)
        if (types && typeof types === "string") {
          const typeList = types.split(",").map((t) => t.trim()).filter(Boolean);
          if (typeList.length > 0) {
            filter.item_equipment_slot = { $in: typeList };
          }
        }
      } else {
        filter.item_equipment_slot = baseSlot;
      }
    }

    // 이름 부분 일치 검색 (대소문자 무시)
    if (query && query.trim().length > 0) {
      const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    // 직업 필터링: req_job=0 (공용) 또는 jobBit과 비트 겹치는 아이템만
    // 예) 캐릭터가 마법사(bit=2)면 req_job이 0/2/3/6/30 등은 모두 매치
    const bit = Number(jobBit);
    if (Number.isFinite(bit) && bit > 0) {
      filter.$or = [
        { req_job: 0 },
        { req_job: { $bitsAnySet: bit } },
      ];
    }

    const items = await collection
      .find(filter)
      .limit(200)
      .toArray();

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
