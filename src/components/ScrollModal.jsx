import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import magicScroll from '../data/MagicScroll.json';
import spellScroll from "../data/SpellScroll.json";
import { useToast } from "../utils/toastContext";
import jobStat from "../data/jobStat.json";

// 주문서 표현식: json-API 순
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
function getScrollOptions(item, type = "scroll", character_class) {
	const jobInfo = jobStat.find(j => j.class === character_class);
	const mainStat = jobInfo?.main_stat || "STR";
	const isMagicClass = mainStat === "INT";

	// 전용 주문서
	if (type === "spell") {
		// 부위에 해당하는 주문서만 필터링
    return Object.entries(spellScroll)
      .filter(([_, info]) => info.part.includes(item.item_equipment_slot))	// 주문서가 부위에 해당하는지 체크
      .map(([name, info]) => ({	// 조건에 맞을 경우 반환
        name,           	 // 주문서 이름
        image: info.image, // 주문서 이미지
        value: info.value,
        common: info.common,
      }));
  }

	// 주문의 흔적
	const STAT_KR = { STR: "힘", INT: "지력", DEX: "민첩", LUK: "운" };	// 한영 변환
	// 부위에 맞는 주문서만 필터링
  let scrollCategory = Object.entries(magicScroll).find(([_, val]) =>
    val.part.includes(item.item_equipment_slot)
  );
  if (!scrollCategory) return [];	// 부위에 맞는 주문서가 없을 경우
  let [key, value] = scrollCategory;	// key: 카테고리명, value: 옵션 세부
  
  // 몇제 장비인지 계산
  let reqLevel = Number(item.item_base_option.base_equipment_level);	// 아이템 렙제
	// 해당 레벨 이하에서의 최소 상한 찾기
  let limitKey = Object.keys(value.bonuses).map(Number)
    .sort((a, b) => a - b)
    .find(lv => reqLevel <= lv) ?? Math.max(...Object.keys(value.bonuses).map(Number));

  // 해당 구간의 주문서 타입별 옵션들 추출
  let scrollTypes = value.bonuses[limitKey];
  
  // 주문서 종류(%) 별로 [{type, scroll, value}] 형태로 변환
  let result = [];
  Object.entries(scrollTypes).forEach(([type, options]) => {
    Object.entries(options).forEach(([scroll, value]) => {
			// 스탯 주문서: STR, INT, DEX, LUK
      if (type === "stat" && value["스탯"] !== undefined) {
        ["STR", "INT", "DEX", "LUK"].forEach(statType => {
          let v = {};
          if ("스탯" in value) v[statType] = value["스탯"];
          Object.keys(value).forEach(k => {
            if (k !== "스탯") v[k] = value[k];
          });
					let name;
					if (["무기", "보조무기"].includes(item.item_equipment_slot)) {
						if (statType === "INT") {
							name = `${scroll}% 마력(지력) 주문서`;
						} else if (statType === "STR") {
							name = `${scroll}% 공격력(힘) 주문서`;
						} else if (statType === "DEX") {
							name = `${scroll}% 공격력(민첩) 주문서`;
						} else if (statType === "LUK") {
							name = `${scroll}% 공격력(운) 주문서`;
						}
					} else {
						name = `${scroll}% ${STAT_KR[statType]} 주문서`;
					}
          result.push({
            type: "stat",
            scroll,
            statType,
            name,
            value: v,
          });
        });
      } 
			else {
      	// 일반 주문서 처리 (공격력/마력 등)
				let readableName = `${scroll}% ${type.toUpperCase()}`;

				// 이름 정규화
				if (type === "hp") readableName = `${scroll}% 체력 주문서`;
				else if (type === "all_stat") readableName = `${scroll}% 올스탯 주문서`;
				else if (value["공격력"]) readableName = `${scroll}% 공격력 주문서`;
				else if (value["마력"]) readableName = `${scroll}% 마력 주문서`;
				result.push({
					type,
					scroll,
					name: readableName,
					value
				});
			}
		});
	});
	//  각 주문서에 이미지 경로 추가
	result.forEach(r => {
    r.image = `/images/scroll/${r.scroll}mark.png`;
  });
  return result;
}

// 주문서 리스트 정렬 함수
function getSortKey(scroll) {
	const STAT_ORDER = ["STR", "INT", "DEX", "LUK"];	// 이름 정렬 순
	const SCROLL_ORDER = [100, 70, 30, 15];	// % 정렬 순

	// 스탯 주문서
  if (scroll.type === "stat") {
    return [
      0,	// 우선순위
      STAT_ORDER.indexOf(scroll.statType ?? ""),	// 이름 정렬
      SCROLL_ORDER.indexOf(Number(scroll.scroll)),	// % 정렬
    ];
  }
	// 체력 주문서
  if (scroll.type === "hp") {
    return [1, 0, SCROLL_ORDER.indexOf(Number(scroll.scroll))];	// % 정렬
  }
	// 올스탯 주문서
  if (scroll.type === "all_stat") {
    return [2, 0, SCROLL_ORDER.indexOf(Number(scroll.scroll))];	// % 정렬
  }
	// 그외 주문서(공, 마)는 마지막
  return [3, 0, 0];
}

export default function ScrollModal({item, character_class, setEtcOptions, onClose, onApply}) {
	const [selectedScroll, setSelectedScroll] = useState(0);	// 현재 선택한 주문서 종류
	const scroll_upgrade = Number(item.scroll_upgrade);	// 주문서 사용 가능 횟수
	const [selectedType, setSelectedType] = useState("scroll");	// 주문의 흔적 or 전용 주문서 선택 여부
	const [scrollTryIdx, setScrollTryIdx] = useState(-1);	// 주문서 슬롯 인덱스
	const [slotScrolls, setSlotScrolls] = useState(Array(Number(scroll_upgrade) || 0).fill(null));	// 주문서 슬롯 별 적용된 주문서
	const [hoveredIdx, setHoveredIdx] = useState(null);	// hover 중인 주문서 슬롯 인덱스
	const scrollList = getScrollOptions(item, selectedType, character_class);	// 전체 주문서 목록
	const [spellValueSelect, setSpellValueSelect] = useState(null);	// 선택한 전용 주문서 값

	const { showToast } = useToast(); // 토스트

	// 주문서 목록 정렬
	const sortedScrollList = useMemo(() =>
		[...scrollList].sort((a, b) => {
			const keyA = getSortKey(a);
			const keyB = getSortKey(b);
			for (let i = 0; i < keyA.length; i++) {
				if (keyA[i] !== keyB[i]) return keyA[i] - keyB[i];
			}
			return 0;
	}), [scrollList]);	// scrollList 변경 시 재계산

	// 주문서 슬롯 클릭 핸들러
	function handleTry(idx) {
		let selectedScrollInfo;	// 선택한 주문서 종류

		// 전용 주문서
		if (selectedType === "spell") {
			if ( spellValueSelect && spellValueSelect.scroll && typeof spellValueSelect.valueIdx === "number") {
				const base = spellValueSelect.scroll.common || {};	// 공통 옵션
				const selected = spellValueSelect.scroll.value[spellValueSelect.valueIdx] || {};	// 추가로 선택해야 하는 옵션

				// 공통 옵션 + 추가 선택 옵션
				const merged = { ...base };	
				for (const [k, v] of Object.entries(selected)) {
					merged[k] = (merged[k] || 0) + v;
				}

				// 주문서 정보 저장
				selectedScrollInfo = {
					...spellValueSelect.scroll,
					value: merged,
				};
			} else {
				showToast("전용 주문서와 수치를 먼저 선택해주세요.", "error");
				return;
			}
		}

		// 주문의 흔적
		else {
			selectedScrollInfo = sortedScrollList[selectedScroll];	// 현재 선택한 주문서 정보
			if (!selectedScrollInfo) {
				showToast("주문서를 선택해주세요.", "error");
				return;
			}
  	}

		let newScrolls;

		// 해당 슬롯에 주문서가 존재 시 취소
		if (slotScrolls[idx]) {
			newScrolls = slotScrolls.map((s, i) => (i < idx ? s : null));
			setSlotScrolls(newScrolls);
			setScrollTryIdx(idx - 1);
		} 
		// 해당 슬롯에 주문서 X
		// 첫 슬롯이 null -> 왼쪽 끝 부터 선택한 슬롯까지 선택한 주문서로 채움
		else if (slotScrolls[0] === null) {
			newScrolls = slotScrolls.map((s, i) =>
				i <= idx ? selectedScrollInfo : s
			);
			setSlotScrolls(newScrolls);
			setScrollTryIdx(idx);
		} 
		// 왼쪽에 이미 작이 되어있을 경우 null인 부분부터 선택한 슬롯까지 선택한 주문서로 채움
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

		// 적용된 주문서 옵션 수치를 더해서 상태 업데이트
		const newEtcOption = sumEtcOptionFromArray(newScrolls);
		setEtcOptions(newEtcOption);
	}

	// 주문서 합산
	function sumEtcOptionFromArray(arr) {
		const sum = {};
		arr.forEach(scroll => {
			if (!scroll) return;	// 주문서가 적용되지 않은 슬롯 패스

			// 주문서 속성 반복
			Object.entries(scroll.value).forEach(([k, v]) => {
				// 올스탯의 경우 STR, DEX, INT, LUK 전부 올라감
				if (k === "올스탯") {
					["STR", "DEX", "INT", "LUK"].forEach(stat => {
						const key = ETC_KEY_MAP[stat];
						if (!sum[key]) sum[key] = 0;
						sum[key] += Number(v);
					});
				} 
				// 나머지(공, 마, HP) 처리
				else {
					const key = ETC_KEY_MAP[k] || k;
					if (!sum[key]) sum[key] = 0;
					sum[key] += Number(v);
				}
			});
		});

		const result = {};
		Object.keys(item.item_etc_option).forEach(k => {
			result[k] = (sum[k] ?? 0).toString();
		});

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
							// 주문서 완료 슬롯
							if (i <= scrollTryIdx) {
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
							} 
							// 주문서 선택 슬롯
							else if (i === scrollTryIdx + 1) {
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
						// 주문서 미완료 슬롯
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

				{/* hover 시 각 슬롯에 적용된 주문서 수치 표시 */}
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

				{/* 상승 수치 텍스트 */}
				{(() => {
					let optionObj = null;
					// 전용 주문서
					if (selectedType === "spell") {
						if (!spellValueSelect || spellValueSelect.valueIdx === undefined) {
							optionObj = "select"; // 수치 선택 안내
						} 
						else if (spellValueSelect.scroll) {
							// 공통 옵션 + 선택 옵션
							const base = spellValueSelect.scroll.common || {};
							const selected = spellValueSelect.scroll.value[spellValueSelect.valueIdx] || {};
							optionObj = { ...base };
							for (const [k, v] of Object.entries(selected)) {
								optionObj[k] = (optionObj[k] || 0) + v;
							}
						}
					} 

					// 일반 주문서
					else if (sortedScrollList[selectedScroll]?.value) {
						optionObj = sortedScrollList[selectedScroll].value;
					}

					// 전용 주문서의 경우 수치 선택 X 시 안내 문구
					if (optionObj === "select") {
						return (
							<div className="absolute top-[48.8%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-dotum text-xs text-[#BBDDDD]
									flex flex-col items-center justify-center w-full pointer-events-none max-w-[150px]">
								<span className="text-center">수치를 선택해주세요</span>
							</div>
						);
					}

					// 옵션값 없으면 아무것도 렌더 안함
					if (!optionObj) return null;

					return (
						<div className="absolute top-[48.8%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-dotum text-xs text-[#BBDDDD]
							flex flex-col items-center justify-center w-full pointer-events-none max-w-[150px]">
							<div className="grid grid-cols-2 gap-x-3">
								{Object.entries(optionObj).map(([k, v]) => (
									<div key={k} className="contents">
										<span className="text-right">{k}</span>
										{typeof v === "object" && v !== null
											? Object.entries(v).map(([kk, vv]) => (
													<span key={kk} className="font-bold text-left">{kk} +{vv}</span>
												))
											: <span className="font-bold text-left">+{v}</span>
										}
									</div>
								))}
							</div>
						</div>
					);
				})()}

				{/* 주문의 흔적 선택 이미지 */}
				<img
					src={selectedType === "scroll"
						? "../images/scroll/scrollDescOn.png"
						: "../images/scroll/scrollDescOff.png"}
					className="absolute top-[58.5%] left-[2.5%] cursor-custom w-[46.5%]"
					alt="주문의 흔적"
					onClick={() => setSelectedType("scroll")}
				/>

				{/* 전용 주문서 선택 이미지 */}
				<img
					src={selectedType === "spell"
						? "../images/scroll/spellDescOn.png"
						: "../images/scroll/spellDescOff.png"}
					className="absolute top-[58.5%] right-[2.5%] cursor-custom w-[46.5%]"
					alt="전용 주문서"
					onClick={() => setSelectedType("spell")}
				/>

				{/* 주문서 리스트 */}
				<div className="absolute bg-[#EEEEEE] top-[62.5%] rounded-[5px] w-[95%] max-h-[25%] p-2 shadow-lg left-1/2 -translate-x-1/2 overflow-y-auto font-dotum">
					{sortedScrollList.length === 0 ? (
						<div className="w-full h-[60px] flex items-center justify-center text-center text-gray-400">
							적용 가능한 주문서가 없습니다.
						</div>
					) :(
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
									onClick={() => {
										setSelectedScroll(i);
										if (selectedType === "spell") {
											setSpellValueSelect({ scroll: scroll });
										}
									}}
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
											src={scroll.image}
											alt={scroll.name}
											className="w-[30px] inline-block align-middle"
											draggable="false"
										/>
										<span>{scroll.name}</span>
									</div>
								</button>
							);
						})}

						{/* 홀수개일 때 남은 부분은 empty */}
						{scrollList.length % 2 === 1 && (
							<div
								className="relative flex items-center justify-center p-1"
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
					</div>)}
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
						showToast("주문서 사용이 완료되었습니다.", "success")
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

				{/* 전용 주문서 값 선택 */}
				{spellValueSelect && !("valueIdx" in spellValueSelect) && (
				<div
					className= "absolute top-[41%] z-[999] left-1/2 -translate-x-1/2 bg-[#1F2735] bg-opacity-80 p-3 rounded-xl shadow-lg flex flex-col items-center font-galmuri"
				>
					{spellValueSelect.scroll.value.map((v, i) => (
						<button
							key={i}
							className="px-4 py-2 -m-1 rounded hover:text-gray-300 text-[15px] text-white"
							onClick={() =>
								setSpellValueSelect({
									scroll: spellValueSelect.scroll,
									valueIdx: i,
								})
							}
						>
							{Object.entries(v).map(([k, val]) => `${k} +${val}`).join(" / ")}
						</button>
					))}
					<button
						className="mt-2 text-sm text-gray-400 hover:text-gray-600"
						onClick={() => setSpellValueSelect(null)}
					>
						취소
					</button>
				</div>
			)}

			</div>	
    </motion.div>
  );
}
