import React, { useState } from "react";
import CoreActive from "./CoreActive";
import { AnimatePresence, motion } from "framer-motion";
import jobStat from "../data/jobStat.json";


export default function HexaStat({ hexaStat, onClose, character_class }) {
  const [selectedCore, setSelectedCore] = useState("core"); // 기본값 코어1
	const [showCoreActive, setShowCoreActive] = useState(false)	// 코어 활성화 창
	const jobInfo = jobStat.find(j => j.class === character_class);	// 직업 정보

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
			            sub: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] }
  };

	const corelevel = {
		core: hexaStat?.character_hexa_stat_core?.[0]?.stat_grade ?? "0 0",
		core_2: hexaStat?.character_hexa_stat_core_2?.[0]?.stat_grade ?? "0 0",
		core_3: hexaStat?.character_hexa_stat_core_3?.[0]?.stat_grade ?? "0 0",
	}

  // 헥사스탯 뚫었는지 여부
	const coreUnlocked = {
		core: Array.isArray(hexaStat?.character_hexa_stat_core) && hexaStat.character_hexa_stat_core.length > 0,
		core_2: Array.isArray(hexaStat?.character_hexa_stat_core_2) && hexaStat.character_hexa_stat_core_2.length > 0,
		core_3: Array.isArray(hexaStat?.character_hexa_stat_core_3) && hexaStat.character_hexa_stat_core_3.length > 0,
	};

	// 헥사스탯 프리셋 여부
	const corePresetUnlocked = {
		core: Array.isArray(hexaStat?.preset_hexa_stat_core) && hexaStat.preset_hexa_stat_core.length > 0,
		core_2: Array.isArray(hexaStat?.preset_hexa_stat_core_2) && hexaStat.preset_hexa_stat_core_2.length > 0,
		core_3: Array.isArray(hexaStat?.preset_hexa_stat_core_3) && hexaStat.preset_hexa_stat_core_3.length > 0,
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
				<span className="absolute top-[20%] left-1/2 -translate-x-1/2 z-10 font-galmuri text-white text-[7px]">{(corelevel[coreKey] + "").split("").join(" ")}</span>
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
				{/* 헥사 메인 배경 */}
				<img
					src="/images/hexa/헥사메인배경.png"
					alt="헥사 메인 배경"
					className="absolute inset-0 w-[48%] h-auto m-auto"
					draggable={false}
				/>

				{/* 헥사 코어 */}
				<div className="absolute top-[28.1%] left-[34.45%]">
					{getCoreContent(
						"core",
						"/images/hexa/헥사스탯core.png",
						"/images/hexa/헥사스탯core.disabled.png"
					)}
				</div>
				<div className="absolute top-[33%] left-[38.55%]">
					{getCoreContent(
						"core_2",
						"/images/hexa/헥사스탯core_2.png",
						"/images/hexa/헥사스탯core_2.disabled.png"
					)}
				</div>
				<div className="absolute top-[42.7%] left-[38.55%]">
					{getCoreContent(
						"core_3",
						"/images/hexa/헥사스탯core_3.png",
						"/images/hexa/헥사스탯core_3.disabled.png"
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

				{/* 개방 코어 탭 - 프리셋 존재 */}
				{coreUnlocked[selectedCore] && (
					// 현재 코어
					<div className="absolute top-[33.3%] left-[53.35%] z-20 select-none">
						<span className="absolute top-[20%] left-1/2 -translate-x-1/2 z-10 font-galmuri text-white text-[7px]">
							{(corelevel[selectedCore] + "").split("").join(" ")}
						</span>
						<img
							src="/images/hexa/코어.bg.png"
							alt="코어 슬롯"
							draggable={false}
						/>
						<img
							src={`/images/hexa/헥사스탯${selectedCore}.png`}
							alt="코어 아이콘"
							className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
							draggable={false}
						/>
					</div>
				)}

				{corePresetUnlocked[selectedCore] && (
					// 프리셋 코어
					<div className="absolute top-[34.5%] left-[61.5%] z-20 select-none">
						<span className="absolute top-[19%] left-1/2 -translate-x-1/2 z-10 font-galmuri text-white text-[7px]">
							{(corelevel[selectedCore] + "").split("").join(" ")}
						</span>
						<img
							src="/images/hexa/코어.bg.png"
							alt="코어 슬롯"
							draggable={false}
						/>
						<img
							src={`/images/hexa/헥사스탯${selectedCore}.png`}
							alt="코어 아이콘"
							className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
							draggable={false}
						/>
					</div>
				)}

				{corePresetUnlocked[selectedCore] && (
					// 스탯 정보
					<div className="absolute z-30 font-dotum text-left text-white top-[48.5%] left-[47.8%] w-[400px]">
						{(() => {
							const node = hexaStat[`character_hexa_stat_${selectedCore}`]?.[0];
							if (!node) return null;

							// 행별 className
							const MAIN_ROW_CLASS = "flex items-baseline gap-1";       // 메인
							const SUB1_ROW_CLASS = "flex items-baseline gap-1 mt-[18.5%]"; // 서브1
							const SUB2_ROW_CLASS = "flex items-baseline gap-1 mt-[10.7%]"; // 서브2

							// 퍼센트 붙여야 하는 옵션 목록
							const percentStats = ["데미지 증가", "보스 데미지 증가", "크리티컬 데미지 증가"];

							// hexaCoreValue에서 값 꺼내서 라벨/값 쪼개서 렌더
							const pick = (name, level, type) => {
								if (!name) return { label: "", val: null, passthrough: name, isPercent: false };
								const table = hexaCoreValue[name];
								if (!table) return { label: name, val: null, passthrough: name, isPercent: false };

								const val = table?.[type]?.[level] ?? 0;
								const label = name === "주력 스탯 증가"
									? jobInfo.main_stat
									: name === "보스 데미지 증가" ? "보스 몬스터 공격 시 데미지" : name.replace(" 증가", "");

								const isPercent = percentStats.includes(name);
								return { label, val, passthrough: null, isPercent };
							};

							const m  = pick(node.main_stat_name,   node.main_stat_level,   "main");
							const s1 = pick(node.sub_stat_name_1,  node.sub_stat_level_1,  "sub");
							const s2 = pick(node.sub_stat_name_2,  node.sub_stat_level_2,  "sub");

							const renderLine = (stat, rowClass, labelColor = "#FFFFFF") => (
								<div className={rowClass}>
									{stat.passthrough ? (
										<span className="text-white">{stat.passthrough}</span>
									) : (
										<>
											<span className={`text-[${labelColor}]`}>{stat.label}</span>
											<span className="text-white">
												+{stat.val}{stat.isPercent ? "%" : ""}
											</span>
										</>
									)}
								</div>
							);

							return (
								<>
									{renderLine(m,  MAIN_ROW_CLASS, "#D4C6F0")}
									{renderLine(s1, SUB1_ROW_CLASS, "#B6E3F0")}
									{renderLine(s2, SUB2_ROW_CLASS, "#B6E3F0")}
								</>
							);
						})()}
					</div>
				)}

				{corePresetUnlocked[selectedCore] && (
					// 스탯 레벨 정보
					<div className="absolute flex flex-col font-dotum text-white top-[50%] left-[68.85%] w-8 text-center [text-shadow:0_0_5px_#44B7CF,0_0_10px_#44B7CF,0_0_20px_#44B7CF,0_0_40px_#44B7CF]">
						<span className="">{hexaStat[`character_hexa_stat_${selectedCore}`]?.[0].main_stat_level}</span>
						<span className="mt-[235%]">{hexaStat[`character_hexa_stat_${selectedCore}`]?.[0].sub_stat_level_1}</span>
						<span className="mt-[135%]">{hexaStat[`character_hexa_stat_${selectedCore}`]?.[0].sub_stat_level_2}</span>
					</div>
				)}

				{corePresetUnlocked[selectedCore] && (
					// 현재 적용 중인 스탯 효과
					<div className="absolute z-30 font-dotumLight text-[13px] text-[#BFBFBF] text-left top-[65.5%] left-[29%]">
						{(() => {
							const node = hexaStat[`character_hexa_stat_${selectedCore}`]?.[0];
							if (!node) return null;

							const percentStats = ["데미지 증가", "보스 데미지 증가", "크리티컬 데미지 증가"];

							const pick = (name, level, type) => {
								if (!name) return "";
								const table = hexaCoreValue[name];
								if (!table) return name;
								const val = table?.[type]?.[level] ?? 0;
								const label = name === "주력 스탯 증가" ? jobInfo.main_stat : name;
								const isPercent = percentStats.includes(name);
								return `${label} +${val}${isPercent ? "%" : ""}`;
							};

							const m  = pick(node.main_stat_name,   node.main_stat_level,   "main");
							const s1 = pick(node.sub_stat_name_1,  node.sub_stat_level_1,  "sub");
							const s2 = pick(node.sub_stat_name_2,  node.sub_stat_level_2,  "sub");

							return (
								<>
									<div>{m}</div>
									<div className="">{s1}</div>
									<div className="">{s2}</div>
								</>
							);
						})()}
					</div>
				)}

				{corePresetUnlocked[selectedCore] && (
					// 현재 적용 중인 게이지: 레벨 N → 1..N 세그먼트 표시 
					<div className="absolute z-30 top-[51.35%] left-[47.85%] select-none">
						{(() => {
							const node = hexaStat[`character_hexa_stat_${selectedCore}`]?.[0];
							if (!node) return null;

							// ---- 설정 ----
							const MAX_LEVEL = 10;                 // 최대 레벨 가정
							const IMG_BASE = "/images/hexa";      // 게이지 이미지 경로
							// ---------------

							const clamp = (n) => Math.min(Math.max(n ?? 0, 0), MAX_LEVEL);
							const mainLv = clamp(node.main_stat_level);
							const sub1Lv = clamp(node.sub_stat_level_1);
							const sub2Lv = clamp(node.sub_stat_level_2);

							// kind: "메인게이지" | "서브게이지"
							const renderGauge = (kind, level) => {
								// 고정 폭 박스 + 중앙정렬: 글자/이미지 길이 달라도 좌표 고정
								return (
									<div className="mx-auto w-[400px]">
										<div className="flex justify-left items-left gap-[1px]">
											{Array.from({ length: level }, (_, idx) => {
												const i = idx + 1;
												const src = `${IMG_BASE}/${kind}${i}.png`;
												return (
													<img
														key={`${kind}-${i}`}
														src={src}
														alt={`${kind} ${i}`}
														className=""
														draggable={false}
													/>
												);
											})}
										</div>
									</div>
								);
							};

							return (
								<>
									{/* 메인 게이지 (가운데 고정) */}
									{renderGauge("메인게이지", mainLv)}

									{/* 서브1 게이지: 기존 Y 위치 유지 */}
									<div className="mt-[23.3%]">
										{renderGauge("서브게이지", sub1Lv)}
									</div>

									{/* 서브2 게이지: 기존 Y 위치 유지 */}
									<div className="mt-[15.5%]">
										{renderGauge("서브게이지", sub2Lv)}
									</div>
								</>
							);
						})()}
					</div>
				)}




				{coreUnlocked[selectedCore] && corePresetUnlocked[selectedCore] && (
					<div className="absolute top-[30%] left-[51.15%] z-10">
						<img src="/images/hexa/헥사레이어탭1.png" alt="헥사 그림자" className="absolute bottom-[5%] left-0 scale-[115%] z-0" />
						<div className="relative flex gap-[6px] z-10">
							<img src="/images/hexa/헥사스탯selected.png" alt="헥사스탯 프리셋" />
							<img src="/images/hexa/헥사스탯normal.png" alt="헥사스탯 프리셋" />
						</div>
					</div>
				)}
				

				{/* 개방 코어 탭 - 프리셋 미존재 */}
				{coreUnlocked[selectedCore] && !corePresetUnlocked[selectedCore] && (
					<div className="absolute flex gap-2 mt-[14.5%] pl-[51%]">
						<img src="/images/hexa/헥사스탯nopreset.png" alt="헥사스탯 프리셋" className=""/>
					</div>
				)}

				{/* 미개방 코어 탭 */}
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
							src={`/images/hexa/헥사스탯${selectedCore}.disabled.png`}
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
