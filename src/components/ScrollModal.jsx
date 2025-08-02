import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import magicScroll from '../data/MagicScroll.json';
import spellScroll from "../data/SpellScroll.json";
import { useToast } from "../utils/toastContext";

// 주문서 작 표현식
const ETC_KEY_MAP = {
  STR: 'str',
  DEX: 'dex',
  INT: 'int',
  LUK: 'luk',
  HP: 'max_hp',
  MP: 'max_mp',
  방어력: 'armor',
  공격력: 'attack_power',
  마력: 'magic_power',
  이동속도: 'speed',
  점프력: 'jump',
};

// 아이템 부위/레벨에 맞는 주문서 목록 추출 함수
function getScrollOptions(item, type = "scroll") {
	const STAT_KR = { STR: "힘", INT: "지력", DEX: "민첩", LUK: "운" };

  let scrollCategory = Object.entries(magicScroll).find(([_, val]) =>
    val.part.includes(item.item_equipment_slot)
  );
  if (!scrollCategory) return [];
  let [key, value] = scrollCategory;
  
  // 레벨 상한 구하기
  let reqLevel = Number(item.item_base_option.base_equipment_level);
  let limitKey = Object.keys(value.bonuses).map(Number)
    .sort((a, b) => a - b)
    .find(lv => reqLevel <= lv) ?? Math.max(...Object.keys(value.bonuses).map(Number));

  // 해당 상한 구간의 주문서 타입별 옵션들 추출
  let scrollTypes = value.bonuses[limitKey];
  
  // 주문서 종류(100/70/30/15 등)별로 [{type, scroll, value}] 형태로 변환
  let result = [];
  Object.entries(scrollTypes).forEach(([type, options]) => {
    Object.entries(options).forEach(([scroll, value]) => {
      if (type === "stat" && value["스탯"] !== undefined) {
        // 스탯 주문서 → 4개로 나눠서
        ["STR", "INT", "DEX", "LUK"].forEach(statType => {
          // 1. 각 주문서에 이 stat만 value["스탯"] 추가
          // 2. 나머지 key(공격력, 마력, HP 등)는 그대로 복사
          let v = {};
          if ("스탯" in value) v[statType] = value["스탯"];
          // 추가 가능한 모든 key 반복해서 복사
          Object.keys(value).forEach(k => {
            // 이미 statType으로 처리한 "스탯"은 건너뜀
            if (k !== "스탯") v[k] = value[k];
          });
          result.push({
            type: "stat",
            scroll,
            statType,
            name: `${scroll}% ${STAT_KR[statType]} 주문서`,
            value: v,
          });
        });
      } else {
        // 일반 주문서는 원래대로
        result.push({
          type,
          scroll,
          name:
            type === "hp"
              ? `${scroll}% 체력 주문서`
              : type === "all_stat"
              ? `${scroll}% 올스탯 주문서`
              : `${scroll}% ${type.toUpperCase()}`,
          value
        });
      }
    });
  });
  return result;
}

// 주문서 리스트 정렬 함수
function getSortKey(scroll) {
	const STAT_ORDER = ["STR", "INT", "DEX", "LUK"];
	const SCROLL_ORDER = [100, 70, 30, 15];
  if (scroll.type === "stat") {
    return [
      0,
      STAT_ORDER.indexOf(scroll.statType ?? ""),
      SCROLL_ORDER.indexOf(Number(scroll.scroll)),
    ];
  }
  if (scroll.type === "hp") {
    return [1, 0, SCROLL_ORDER.indexOf(Number(scroll.scroll))];
  }
  if (scroll.type === "all_stat") {
    return [2, 0, SCROLL_ORDER.indexOf(Number(scroll.scroll))];
  }
  return [3, 0, 0];
}

export default function ScrollModal({item, setEtcOptions, onClose, onApply}) {
	const scrollList = getScrollOptions(item);	// 주문서 목록
	const [selectedScroll, setSelectedScroll] = useState(null);	// 선택한 주문서
	const scroll_upgrade = Number(item.scroll_upgrade);	// 주문서 사용 가능 횟수
	const [selectedType, setSelectedType] = useState("scroll");	// 주문서 작 선택 종류
	const [scrollTryIdx, setScrollTryIdx] = useState(-1);	// 현재 주문서 인덱스
	const [slotScrolls, setSlotScrolls] = useState(Array(Number(scroll_upgrade) || 0).fill(null));	// 각 슬롯 별 적용된 주문서
	const [hoveredIdx, setHoveredIdx] = useState(null);	// hover 중인 인덱스
	const { showToast } = useToast(); // 토스트


	// 주문서 클릭 핸들러
	function handleTry(idx) {
		const selectedScrollInfo = sortedScrollList[selectedScroll];
		if (!selectedScrollInfo) {
			showToast("주문서를 선택해주세요.", "error");
			return;
		}

		let newScrolls;

		// 이미 적용된 스크롤 존재
		if (slotScrolls[idx]) {
			newScrolls = slotScrolls.map((s, i) => (i < idx ? s : null));
			setSlotScrolls(newScrolls);
			setScrollTryIdx(idx - 1);
		} 
		// 맨 앞이 null이면 0~idx까지 모두 같은 주문서로 채움
		else if (slotScrolls[0] === null) {
			newScrolls = slotScrolls.map((s, i) =>
				i <= idx ? selectedScrollInfo : s
			);
			setSlotScrolls(newScrolls);
			setScrollTryIdx(idx);
		}
		// 맨 앞이 null이 아니면 idx부터 null이 아닌 앞까지 모두 같은 주문서로 채움
		else {
			newScrolls = [...slotScrolls];
			let i = idx;
			while (i >= 0 && newScrolls[i] === null) {
				newScrolls[i] = selectedScrollInfo;
				i--;
			}
			setSlotScrolls(newScrolls);
			setScrollTryIdx(idx);
		}

		// **여기서 실시간 반영!**
		const newEtcOption = sumEtcOptionFromArray(newScrolls);
		setEtcOptions(newEtcOption);
	}


	useEffect(() => {
		console.log("slotScrolls 변화:", slotScrolls);
	}, [slotScrolls]);

	// 주문서 목록 정렬
	const sortedScrollList = useMemo(() =>
		[...scrollList].sort((a, b) => {
			const keyA = getSortKey(a);
			const keyB = getSortKey(b);
			for (let i = 0; i < keyA.length; i++) {
				if (keyA[i] !== keyB[i]) return keyA[i] - keyB[i];
			}
			return 0;
	}), [scrollList]);

	// 주문서 적용 핸들러
	function sumEtcOptionFromArray(arr) {
		const sum = {};
		arr.forEach(scroll => {
			if (!scroll) return;
			Object.entries(scroll.value).forEach(([k, v]) => {
				const key = ETC_KEY_MAP[k] || k;
				if (!sum[key]) sum[key] = 0;
				sum[key] += Number(v);
			});
		});
		const result = {};
		Object.keys(item.item_etc_option).forEach(k => {
			result[k] = (sum[k] ?? 0).toString();
		});
		console.log(result);
		return result;
	}

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}      
      animate={{ opacity: 1, y: 0 }}       
      exit={{ opacity: 0, y: 10 }} 
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
			<div className="relative">
				<img src = "../images/scroll/scrollBG.png" alt="주문서 배경" />
				<img src = {item.item_icon} className="w-[12%] absolute left-1/2 top-[11.9%] -translate-x-1/2" alt = "장비 이미지"/>
				<span className="absolute left-1/2 top-[25.5%] -translate-x-1/2 font-galmuri text-white text-[15px]">{item.item_name}</span>
				<img src = "../images/scroll/scrollSummary.png" alt = "주문서 작" className="absolute top-[34%] left-1/2 -translate-x-1/2"></img>

				{/* 주문서 작 표시 */}
				<div className="absolute top-[34%] left-1/2 -translate-x-1/2 flex flex-row gap-[3px] items-center justify-center w-auto mt-[2.3%]">
					{[...Array(scroll_upgrade || 0)].map((_, i) => {
						if (scrollTryIdx !== null) {
							if (i <= scrollTryIdx) {
								// 주문서 작 O
								return (
									<img
										key={i}
										src="../images/scroll/scrollSuccess.png"
										alt="scrollSuccess"
										className={`w-[15px] h-[15px] object-contain cursor-custom ${i > 0 && i % 5 === 0 ? 'ml-[10px]' : ''}`}
										draggable="false"
										onClick={() => handleTry(i)}
										onMouseEnter={() => setHoveredIdx(i)}
										onMouseLeave={() => setHoveredIdx(null)}
									/>
								);
							} else if (i === scrollTryIdx + 1) {
								// 다음 주문서 작 위치
								return (
									<img
										key={i}
										src={`../images/scroll/scrollTry.png`}
										alt="scrollTry"
										style={{
											filter:
												"drop-shadow(0 0 6px #ffdc63) drop-shadow(0 0 12px #ffdc63) drop-shadow(0 0 18px #ffd751)",
										}}
										className={`w-[15px] h-[15px] object-contain cursor-custom ${i > 0 && i % 5 === 0 ? 'ml-[10px]' : ''}`}
										draggable="false"
										onClick={() => handleTry(i)}
									/>
								);
							}
						}
						// 주문서 작 X
						return (
							<img
								key={i}
								src="../images/scroll/scrollEmpty.png"
								alt="scrollEmpty"
								className={`w-[15px] h-[15px] object-contain block cursor-custom ${i > 0 && i % 5 === 0 ? 'ml-[10px]' : ''}`}
								draggable="false"
								onClick={() => handleTry(i)}
							/>
						);
					})}
				</div>

				{/* hover 시 주문서 수치 표시 */}
				{hoveredIdx !== null && slotScrolls[hoveredIdx] && (
					<div className="absolute top-[20%] left-1/2 -translate-x-1/2 z-20 font-dotum text-xs bg-black/80 rounded p-2 text-center min-w-[120px] text-white">
						<div className="mb-1 text-[#BBDDDD]">{slotScrolls[hoveredIdx].name}</div>
						{Object.entries(slotScrolls[hoveredIdx].value).map(([k, v]) => (
							<div key={k}>{k} +{v}</div>
						))}
					</div>
				)}
				{/* 상승 수치 */}
				<img
					src="../images/scroll/scrollUPStat.png"
					className="absolute top-[41%] left-1/2 -translate-x-1/2"
					alt="상승 수치"
				/>

				{/* 상승 수치 텍스트*/}
				{selectedScroll !== null && (
					<div
						className="absolute top-[48.8%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-dotum text-xs text-[#BBDDDD] 
											flex flex-col items-center justify-center w-full pointer-events-none max-w-[120px]">
						<div className="grid grid-cols-2 gap-x-3">
							{Object.entries(sortedScrollList[selectedScroll].value).map(([k, v]) => (
								<>
									<span className="text-right">{k}</span>
									<span className="font-bold text-left">+{v}</span>
								</>
							))}
						</div>
					</div>
				)}

				
			{/* 주문의 흔적 */}
			<img
				src={selectedType === "scroll"
					? "../images/scroll/scrollDescOn.png"
					: "../images/scroll/scrollDescOff.png"}
				className="absolute top-[58.5%] left-[2.5%] cursor-custom"
				alt="주문의 흔적"
				onClick={() => setSelectedType("scroll")}
			/>

			{/* 전용 주문서 */}
			<img
				src={selectedType === "spell"
					? "../images/scroll/spellDescOn.png"
					: "../images/scroll/spellDescOff.png"}
				className="absolute top-[58.5%] right-[2.5%] cursor-custom"
				alt="전용 주문서"
				onClick={() => setSelectedType("spell")}
			/>

				{/* 주문서 리스트 */}
				<div className="absolute bg-[#EEEEEE] top-[62.5%] rounded-[5px] w-[95%] max-h-[25%] p-2 shadow-lg left-1/2 -translate-x-1/2 overflow-y-auto font-dotum">
					<div className="grid grid-cols-2 gap-1 w-full h-full">
						{sortedScrollList.map((scroll, i) => {
							const isSelected = selectedScroll === i;
							return (
								<button
									key={i}
									className={`
										relative flex flex-col items-start justify-center
										p-1 h-[40px] text-[12px]
									`}
									onClick={() => setSelectedScroll(i)}
									type="button"
									style={{ background: "none" }}
								>
									{/* 배경이미지 */}
									<img
										src={
											isSelected
												? "../images/scroll/scrollBoxOn.png"
												: "../images/scroll/scrollBoxOff.png"
										}
										alt="scroll box"
										className="absolute top-0 left-0 w-full h-full object-contain z-0 pointer-events-none"
										draggable="false"
									/>
									{/* 내용 */}
									<div className={`mb-1 flex items-center gap-2 mt-1 relative z-10 ${isSelected ? "text-white" : "text-[#636F7E]"}`}>
										<img
											src={`../images/scroll/${scroll.scroll}mark.png`}
											alt={`${scroll.scroll}% 마크`}
											className="w-[30px] inline-block align-middle"
											draggable="false"
										/>
										<span>{scroll.name}</span>
									</div>
								</button>
							);
						})}
						{/* 홀수개일 때 empty */}
						{scrollList.length % 2 === 1 && (
							<div
								className="relative flex items-center justify-center p-1 h-[48px]"
								style={{ background: "none" }}
							>
								<img
									src="../images/scroll/scrollBoxEmpty.png"
									alt="empty"
									className="absolute top-0 left-0 w-full h-full object-contain z-0"
									draggable="false"
								/>
							</div>
						)}
					</div>
				</div>


				{/* 사용하기 버튼 */}
				<button
					className={`
						absolute top-[90.5%] w-[40%] left-1/2 -translate-x-1/2
						bg-[url('../images/scroll/useNormal.png')]
						hover:bg-[url('../images/scroll/useHover.png')]
						active:bg-[url('../images/scroll/usePressed.png')]
						disabled:bg-[url('../images/scroll/useDisable.png')]
						bg-center bg-no-repeat bg-contain h-[50px]
						transition
					`}
					onClick={() => {
						const etcOption = sumEtcOptionFromArray(slotScrolls);
						onApply?.(etcOption);
						onClose();
					}}
				>
				</button>

				{/* 닫기 버튼 */}
				<button
					onClick={onClose}
					className="absolute top-1 right-2 text-gray-200 hover:text-white"
				>
					✕
				</button>
			</div>	
    </motion.div>
  );
}
