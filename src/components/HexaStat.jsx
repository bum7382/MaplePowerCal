import React, { useState } from "react";
import CoreActive from "./CoreActive";
import { AnimatePresence, motion } from "framer-motion";


export default function HexaStat({ hexaStat, onClose }) {
  const [selectedCore, setSelectedCore] = useState("core1"); // 기본값 코어1
	const [showCoreActive, setShowCoreActive] = useState(false)	// 코어 활성화 창

  // hexaStat에서 해금 여부 계산 (스타일 변경 없음)
	const coreUnlocked = {
		core1: Array.isArray(hexaStat?.character_hexa_stat_core) && hexaStat.character_hexa_stat_core.length > 0,
		core2: Array.isArray(hexaStat?.character_hexa_stat_core_2) && hexaStat.character_hexa_stat_core_2.length > 0,
		core3: Array.isArray(hexaStat?.character_hexa_stat_core_3) && hexaStat.character_hexa_stat_core_3.length > 0,
	};

  // 슬롯 1개 렌더 (코어.bg + 헥사스탯 아이콘 + 선택 오버레이)
  const getCoreContent = (coreKey, iconPath, disabledIconPath) => {
    const unlocked = coreUnlocked[coreKey];
    const isSelected = selectedCore === coreKey;

    return (
      <div className="relative inline-block select-none">
        {/* 코어.bg (선택 영역의 바닥 이미지) */}
        <img
          src="/images/hexa/코어.bg.png"
          alt="코어 슬롯"
          draggable={false}
        />

        {/* 헥사스탯 아이콘 (열림/닫힘: 슬롯별 disabled 아이콘 사용) */}
        <img
					src={unlocked ? iconPath : disabledIconPath}
					alt="코어 아이콘"
					className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
					draggable={false}
				/>

        {/* 선택된 경우에만 오버레이 */}
        {isSelected && (
          <img
            src="/images/hexa/코어.selected.png"
            alt="코어 선택됨"
            className="absolute inset-0 scale-110"
            draggable={false}
          />
        )}

        {/* 클릭 판정 전용 투명 오버레이 (육각형) */}
        <button
          type="button"
          onClick={() => setSelectedCore(coreKey)}
          className="absolute inset-0"
          style={{
            background: "transparent",
            WebkitClipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
          aria-label={`${coreKey} 선택`}
        />
      </div>
    );
  };

  return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 0 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
		>
			<div className="fixed top-0 left-0 w-full h-full z-[9999]">
				{/* 헥사 메인 배경 (네가 준 스타일 그대로) */}
				<img
					src="/images/hexa/헥사메인배경.png"
					alt="헥사 메인 배경"
					className="absolute inset-0 w-[48%] h-auto m-auto"
					draggable={false}
				/>

				{/* 헥사 코어 */}
				<div className="absolute top-[28.1%] left-[34.45%]">
					{getCoreContent(
						"core1",
						"/images/hexa/헥사스탯1.png",
						"/images/hexa/헥사스탯1.disabled.png"
					)}
				</div>
				<div className="absolute top-[33%] left-[38.55%]">
					{getCoreContent(
						"core2",
						"/images/hexa/헥사스탯2.png",
						"/images/hexa/헥사스탯2.disabled.png"
					)}
				</div>
				<div className="absolute top-[42.7%] left-[38.55%]">
					{getCoreContent(
						"core3",
						"/images/hexa/헥사스탯3.png",
						"/images/hexa/헥사스탯3.disabled.png"
					)}
				</div>
				{/* 미개방 헥사 코어 */}
				<div className="absolute top-[47.6%] left-[34.45%]">
					<img src = "/images/hexa/코어.lock.png" />
				</div>
				<div className="absolute top-[42.7%] left-[30.25%]">
					<img src = "/images/hexa/코어.lock.png" />
				</div>
				<div className="absolute top-[33%] left-[30.25%]">
					<img src = "/images/hexa/코어.lock.png" />
				</div>

				{/* 선택된 코어에 따라 옆 패널 이미지 표시 */}
				<div className="absolute top-[27%] left-[46.45%]">
					<img
						src={
							coreUnlocked[selectedCore]
								? "/images/hexa/헥사배경-코어있음.png"
								: "/images/hexa/헥사배경-코어없음.png"
						}
						alt="선택된 코어 상세 배경"
						draggable={false}
					/>
				</div>
				{!coreUnlocked[selectedCore] && (
					<button
						className="absolute bottom-[20.7%] right-[37%]"
						onClick={() => setShowCoreActive((prev) => !prev)}
					>
						<img
							src="/images/hexa/코어활성화.normal.png"
							alt="코어 활성화"
							className="
								hover:content-[url('/images/hexa/코어활성화.hover.png')]
								active:content-[url('/images/hexa/코어활성화.pressed.png')]
							"
						/>
					</button>
				)}
				{!coreUnlocked[selectedCore] && (
					<div className="relative inline-block select-none top-[33.3%] left-[53.35%]">
						<span className="absolute top-[20%] left-1/2 -translate-x-1/2 z-10 font-galmuri text-white text-[7px]">
							0 0
						</span>

						{/* 코어.bg */}
						<img
							src="/images/hexa/코어.bg.png"
							alt="코어 슬롯"
							draggable={false}
						/>

						{/* 헥사스탯 아이콘 */}
						<img
							src={`/images/hexa/헥사스탯${selectedCore.replace(/\D/g, '')}.disabled.png`}
							alt="코어 아이콘"
							className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
							draggable={false}
						/>
					</div>
				)}

				{/* 닫기 버튼 */}
				<button
					onClick={onClose}
					className="absolute top-[14.7%] right-[25.9%] w-[40px] h-[40px] custom-cursor"
				>
					<img
						src="/images/hexa/닫기.normal.png"
						alt="닫기"
						className="
							hover:content-[url('/images/hexa/닫기.hover.png')]
							active:content-[url('/images/hexa/닫기.pressed.png')]
						"
					/>
				</button>

				{/* 코어 활성화 창 */}
				<AnimatePresence>
					{showCoreActive && 
						<CoreActive 
							onClose={() => setShowCoreActive(false)}
							selectedCore = {selectedCore}
						/>
					}
				</AnimatePresence>
			</div>
		</motion.div>
  );
}
