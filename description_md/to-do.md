# MaplePowerCal - 수정 필요 사항 (To-Do)

---

## 1. 반응형 (Responsive) - 최우선

현재 대부분의 레이아웃이 **고정 px 값 + absolute 포지셔닝**으로 구현되어 있어, 특정 해상도 외에서는 UI가 깨진다. `max-sm:` 하나로 PC/모바일 두 분기만 존재하며 중간 해상도(태블릿 등)는 고려되지 않았다.

### 1-1. MainPage.jsx - 장비창 레이아웃

- [ ] 장비창 `w-[420px]` 고정 → 반응형 단위(`w-full max-w-[420px]` 등)로 변경
- [ ] 전투력 증가량 바 `w-[600px]` 고정 → 장비창 너비에 맞게 조정
- [ ] 슬롯 위치가 `%` 기반이지만 장비창 자체가 고정폭이라 모바일에서 슬롯이 너무 작음
- [ ] 슬롯 크기 `w-[48px] h-[48px]` 고정 → `w-[11%]`와 충돌 (둘 다 적용 중)
- [ ] 하단 버튼들(처음으로/초기화/인벤토리 저장)이 모바일에서 겹치거나 잘림
- [ ] 프리셋 버튼 영역 `left-[52.5%]` 고정 → 모바일에서 위치가 어긋남

### 1-2. EquipmentInfo.jsx - 장비 정보 패널

- [ ] `left-[180px] top-[30px] w-[450px]` 고정 → 모바일에서 화면 밖으로 벗어남
- [ ] 주문서 모달 위치 `left-[calc(180px+450px+24px)]` → 모바일에서 완전히 화면 밖
- [ ] 모바일 대응이 `max-sm:left-1/2 max-sm:-translate-x-1/2`로만 처리 → 태블릿 해상도 미대응
- [ ] 장비 정보 내부 `w-[320px]` 고정 → 좁은 화면에서 오버플로우

### 1-3. Tutorial.jsx - PC 튜토리얼

- [ ] **모든 위치가 하드코딩 px**: `top-[110px] left-[210px] w-[1500px]`, `top-[785px] left-[470px]`, `left-[1030px]`, `right-[760px]` 등
- [ ] 특정 모니터 해상도(1920x1080)에서만 정상 표시, 그 외 해상도에서 완전히 깨짐
- [ ] → `%` 또는 `vw/vh` 기반으로 전면 재작업 필요

### 1-4. HexaStat.jsx - 헥사스탯 뷰어

- [ ] 배경 이미지 `w-[48%]` + 내부 요소 `left-[34.45%]`, `left-[38.55%]` 등 미세 % 조정 → 화면 비율 바뀌면 코어 위치 어긋남
- [ ] 스탯 정보 `w-[400px]` 고정 → 작은 화면에서 잘림
- [ ] 게이지 영역 `w-[400px]` 고정
- [ ] 모바일 대응 전무 (`max-sm:` 브레이크포인트 없음)

### 1-5. ScrollModal.jsx - 주문서 모달

- [ ] 이미지 기반 레이아웃이라 비율이 고정 → 모바일에서 너무 작거나 잘림
- [ ] 모바일 대응 없음

### 1-6. InventoryPanel.jsx

- [ ] `w-[500px]` 고정, 모바일에서 `max-sm:w-[80vw]`로 대응하지만 내부 아이콘 비율이 안 맞음

### 1-7. SearchModal.jsx

- [ ] `w-[600px]` 고정 → 모바일에서 화면 밖으로 벗어남 (max-sm 대응 없음)

### 1-8. 공통 문제

- [ ] `window.innerWidth <= 640` 직접 비교 (MainPage, EquipmentInfo) → 리사이즈 시 반영 안 됨, Tailwind 브레이크포인트와 불일치
- [ ] `max-sm:` 하나의 브레이크포인트만 사용 → `md:`, `lg:` 등 중간 단계 필요
- [ ] 모바일에서 장비 편집 시 정보 패널 + 주문서 모달이 겹쳐서 조작 불가

---

## 2. 코드 품질

### 2-1. 중복 코드

- [ ] `hexaCoreValue` 테이블이 `initcalPower.js`와 `HexaStat.jsx` 두 곳에 동일하게 정의됨 → 공통 상수로 분리
- [ ] `formatKoreanNumber()` 함수가 `MainPage.jsx`와 `EquipmentInfo.jsx`에 중복 → 유틸리티로 분리
- [ ] `mapPresetEquipmentToSlot` 로직이 `MainPage.jsx`에서 장비 로드와 프리셋 로드에 동일하게 반복

### 2-2. console.log 제거

- [ ] `MainPage.jsx:165` - `console.log(equipment)`
- [ ] `fetchCharacterByName.js:48` - `console.log(mappedChar)`
- [ ] `fetchCharacterByName.js:51` - `console.log(err)`
- [ ] `calculatePower.js:294` - 주석 처리된 console.log 블록 정리

### 2-3. 미사용 의존성/파일

- [ ] `apitest.js` (414KB) - 테스트 데이터 파일이 루트에 남아 있음 → 삭제 또는 .gitignore
- [ ] `package.json`의 미사용 의존성: `firebase`, `ngrok`, `axios`, `zustand` → 실제 import 없음, 삭제 권장
- [ ] `translationMap.js` - 어디에서도 import되지 않음 → 사용 예정이 아니면 삭제
- [ ] `Exceptional.json` - 어디에서도 import되지 않음

### 2-4. 주석 처리된 코드

- [ ] `EquipmentInfo.jsx` - 가격(price) 관련 코드가 여러 곳에 주석으로 남아 있음 → 정리

---

## 3. 기능/로직 문제

### 3-1. 전투력 계산

- [ ] `calculatePower.js:98` - `baseStat.damage` 계산 시 `+ +` (불필요한 연산자) 존재
- [ ] `initcalPower.js` - `abilityPower`에서 `최대 HP N% 증가` 파싱 시 `noPerStat.HP`에 넣고 있는데 이는 `perStat.HP`에 넣어야 할 수 있음 (계산 의도 확인 필요)

### 3-2. CoreActive.jsx

- [ ] 활성화 버튼 클릭 시 실제 코어 활성화 로직 없음 → `onClose`만 호출. 활성화 기능 구현 필요

### 3-3. EquipmentInfo.jsx - 스타포스 변경

- [ ] 스타포스 클릭 시 `starforceOption` 객체를 직접 mutate하고 있음 (`starforceOption.armor = ...`) → React 상태 불변성 위반, 리렌더 안 될 수 있음

### 3-4. 캐시/상태 관리

- [X] 장비 편집 후 캐릭터 재검색하면 편집 내용이 모두 날아감 (의도된 동작인지 확인) -> 의도적 동작임.
- [ ] `selectedCharacter` localStorage와 `characterCache`가 별도로 관리되어 동기화 이슈 가능

---

## 4. 성능

- [ ] `EquipmentInfo.jsx` - 컴포넌트 렌더링마다 `calculatePower`를 2번 호출 (currentPower, originalPowerForSlot) → `useMemo`로 최적화
- [ ] `EquipmentSearch.jsx` - 검색어 빈 상태에서 전체 장비 목록 fetch → 불필요한 대량 요청, 초기 로딩 방지 필요
- [ ] `OptionGroupEditor.jsx` - `filteredOptions` useMemo 의존성에 `parsedOptions` 포함 → 옵션 변경마다 전체 재필터링

---

## 5. UX 개선

- [ ] 모바일에서 장비 슬롯 터치 영역이 너무 작음 → 터치 타겟 최소 44x44px 권장
- [ ] 장비 편집 모드에서 뒤로가기/ESC로 닫을 수 없음
- [ ] 주문서 모달에서 뒤로가기 시 페이지가 이동됨 (모달 닫기가 아님)
- [ ] 로딩 화면에서 뒤로가기 방지 없음

---

## 우선순위 요약

| 순위 | 카테고리  | 핵심                                                         |
| ---- | --------- | ------------------------------------------------------------ |
| 1    | 반응형    | Tutorial/HexaStat/EquipmentInfo px 하드코딩 전면 수정        |
| 2    | 반응형    | 중간 해상도(태블릿) 브레이크포인트 추가                      |
| 3    | 반응형    | `window.innerWidth` 직접 비교 → Tailwind 또는 훅으로 교체 |
| 4    | 코드 품질 | 중복 코드/미사용 파일 정리                                   |
| 5    | 기능      | 스타포스 상태 불변성 수정                                    |
| 6    | 성능      | 전투력 계산 메모이제이션                                     |
| 7    | UX        | 모바일 터치 영역 확대                                        |
