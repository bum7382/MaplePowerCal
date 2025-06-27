// frontend/src/components/InventoryPanel.jsx
// 인벤토리 패널 컴포넌트
import React, { useState } from "react";

const SLOTS_PER_PAGE = 18;  // 한 페이지에 표시할 슬롯 수

export default function InventoryPanel({ items = [], onSlotClick, onDeleteClick, onHoverItem, onHoverOut }) {
  const [page, setPage] = useState(0);  // 현재 페이지 인덱스 (0부터 시작)
  // 전체 페이지 수 계산 (0~N)
  const totalPages = Math.ceil(items.length / SLOTS_PER_PAGE) || 1;

  // 현재 페이지에 보여줄 아이템 추출
  const startIdx = page * SLOTS_PER_PAGE;
  const currentItems = items.slice(startIdx, startIdx + SLOTS_PER_PAGE);

  // 항상 SLOTS_PER_PAGE만큼 슬롯 생성 → 비어있으면 null로 채움
  const slots = [...Array(SLOTS_PER_PAGE)].map((_, idx) => currentItems[idx] || null);
  return (
    <div className="relative bottom-10 inline-block w-[500px] overflow-visible">
      {/* 인벤토리 배경 */}
      <img src="/images/inventory/inventory.png" alt="inventory background" className="w-[500px]" />

      {/* 슬롯 오버레이 */}
      <div className="absolute top-[32px] left-[20px]">
        {/* 첫 번째 줄 (0~8) */}
        <div className="flex gap-[5.7px] mb-[6px]">
          {slots.slice(0, 9).map((item, idx) => {
            const globalIdx = startIdx + idx;
            return (
              <div
                key={idx}
                className="relative w-[46px] h-[46px] flex items-center justify-center active:bg-[#000000]/20 hover:bg-[#FFFFFF]/20 transition shadow-md"
                onClick={() => onSlotClick?.(item, globalIdx)}
                onMouseEnter={() => item && onHoverItem?.(item)}
                onMouseLeave={() => item && onHoverOut?.()}
              >
                {item && (
                  <>
                    <img
                      src={item.item_icon}
                      className="w-[30px] h-[30px] object-contain object-center aspect-square"
                    />
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 아이템 클릭 방지
                        onDeleteClick?.(item);
                      }}
                      className="absolute top-[-5px] right-[-5px] w-[16px] h-[16px] bg-red-600 text-white text-[10px] rounded-full leading-[16px] text-center"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 두 번째 줄 (9~17) */}
        <div className="flex gap-[5.7px]">
          {slots.slice(9, 18).map((item, idx) => {
            const globalIdx = startIdx + idx + 9;
            return (
              <div
                key={idx + 10}
                className="relative w-[46px] h-[46px] flex items-center justify-center active:bg-[#000000]/20 hover:bg-[#FFFFFF]/20 transition shadow-md"
                onClick={() => onSlotClick?.(item, globalIdx)}
                onMouseEnter={() => item && onHoverItem?.(item)}
                onMouseLeave={() => item && onHoverOut?.()}
              >
                {item && (
                  <>
                    <img
                      src={item.item_icon}
                      className="w-[30px] h-[30px] object-contain object-center aspect-square"
                    />
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 아이템 클릭 방지
                        onDeleteClick?.(item);
                      }}
                      className="absolute top-[-5px] right-[-5px] w-[16px] h-[16px] bg-red-600 text-white text-[10px] rounded-full leading-[16px] text-center"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 좌우 버튼 */}
      {page > 0 && (
        <button
          className="absolute left-[-20px] top-[28px] w-[17px]"
          onClick={() => setPage((p) => p - 1)}
        >
          <img src="/images/inventory/btnL_normal.png" alt="prev" className="w-full h-full object-contain" />
        </button>
      )}
      {page < totalPages - 1 && (
        <button
          className="absolute right-[-20px] top-[28px] w-[17px]"
          onClick={() => setPage((p) => p + 1)}
        >
          <img src="/images/inventory/btnR_normal.png" alt="next" className="w-full h-full object-contain" />
        </button>
      )}
    </div>
  );
}
