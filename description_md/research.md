# MaplePowerCal - 프로젝트 분석 보고서

## 1. 프로젝트 개요

**메이플 전투력 맛보기** (MaplePowerCal)는 메이플스토리의 캐릭터 장비를 시뮬레이션하여 **전투력 변화량을 계산**하는 웹 애플리케이션이다. 사용자가 넥슨 Open API를 통해 캐릭터 정보를 불러온 뒤, 장비의 스타포스/추가옵션/주문서작/잠재능력 등을 자유롭게 편집하고 그에 따른 전투력 증감을 실시간으로 확인할 수 있다.

- **기술 스택**: React 19 + Vite + Tailwind CSS + Zustand + Framer Motion
- **배포**: Vercel (SPA + Serverless Function)
- **외부 API**: 넥슨 Open API (캐릭터 정보), maplestory.io API (장비 검색/아이콘)

---

## 2. 디렉토리 구조

```
MaplePowerCal/
├── api/                        # Vercel Serverless Function
│   └── characterSearch.js      # 넥슨 API 프록시
├── public/                     # 정적 에셋
│   ├── data/notices.json       # 공지사항 JSON
│   ├── fonts/                  # 커스텀 폰트 (KOHIBaeum, KoPubWorldDotum 등)
│   └── images/                 # UI 이미지 에셋
│       ├── hexa/               # 헥사스탯 UI 이미지
│       ├── icons/              # 아이콘 (가방, 즐겨찾기, SNS 등)
│       ├── info/               # 장비 정보 UI (잠재등급, 스타포스, 툴팁)
│       ├── inventory/          # 인벤토리/프리셋 UI
│       ├── loading/            # 로딩 애니메이션 프레임
│       ├── mouse/              # 커스텀 커서 이미지
│       ├── recipt/             # 영수증 UI (미사용)
│       ├── scroll/             # 주문서 UI
│       ├── symbols/            # 심볼 이미지
│       └── tutorial/           # 튜토리얼 스크린샷
├── src/
│   ├── main.jsx                # React 엔트리포인트
│   ├── App.jsx                 # 라우팅 & 레이아웃
│   ├── index.css               # 글로벌 스타일 (커서, 폰트, 스크롤바)
│   ├── pages/
│   │   ├── IntroPage.jsx       # 첫 화면 (검색 & 즐겨찾기)
│   │   └── MainPage.jsx        # 메인 화면 (장비창 & 편집)
│   ├── components/
│   │   ├── SearchModal.jsx     # 캐릭터 검색 모달
│   │   ├── EquipmentInfo.jsx   # 장비 상세정보 & 편집 패널
│   │   ├── EquipmentSearch.jsx # 장비 검색 (maplestory.io API)
│   │   ├── InventoryPanel.jsx  # 인벤토리 패널 (저장된 장비)
│   │   ├── OptionGroupEditor.jsx # 잠재/에디셔널 잠재 편집기
│   │   ├── SoulOptionEditor.jsx  # 소울 옵션 편집기
│   │   ├── ScrollModal.jsx     # 주문서 시뮬레이터
│   │   ├── HexaStat.jsx        # 헥사스탯 뷰어
│   │   ├── CoreActive.jsx      # 헥사 코어 활성화 모달
│   │   ├── Loading.jsx         # 로딩 애니메이션
│   │   ├── NoticeModal.jsx     # 공지사항 모달
│   │   ├── Tutorial.jsx        # PC 튜토리얼
│   │   └── TutorialMobile.jsx  # 모바일 튜토리얼
│   ├── utils/
│   │   ├── calculatePower.js       # 전투력 계산 (장비 기반)
│   │   ├── initcalPower.js         # 초기 전투력 계산 (장비 외 요소)
│   │   ├── calculateStarforceStat.jsx # 스타포스 스탯 계산
│   │   ├── fetchCharacterByName.js # 캐릭터 API 호출 & 데이터 가공
│   │   ├── charCache.js            # localStorage 캐시 (30분 TTL)
│   │   ├── equipmentUtils.js       # 장비 변경 비교 유틸리티
│   │   └── toastContext.jsx        # 전역 토스트 알림 Context
│   ├── constants/
│   │   └── translationMap.js   # 한/영 번역 매핑 (부위, 직업, 스탯)
│   └── data/
│       ├── jobStat.json        # 직업별 주스탯/부스탯 매핑 (46개 직업)
│       ├── jobKind.json        # 직업군별 직업 리스트
│       ├── potentialOptions.json # 잠재능력 옵션 템플릿
│       ├── soulOptions.json    # 소울 옵션 템플릿
│       ├── setEffect.json      # 세트 효과 데이터
│       ├── MagicScroll.json    # 주문의 흔적 데이터
│       ├── SpellScroll.json    # 전용 주문서 데이터
│       ├── Exceptional.json    # 익셉셔널 데이터
│       ├── starforceStatTable.json   # 스타포스 16성+ 스탯 테이블
│       ├── starforceTyrantStatTable.json # 타일런트 스타포스 테이블
│       ├── statMap.json        # maplestory.io → 넥슨 API 스탯키 매핑
│       ├── itemTypeToSlot.json # maplestory.io 카테고리 → 슬롯 매핑
│       └── scripts.js          # 튜토리얼 대사 스크립트
├── vercel.json                 # Vercel SPA rewrites 설정
├── vite.config.js              # Vite 설정 (프록시, alias)
├── tailwind.config.js          # Tailwind 설정 (커스텀 폰트, 애니메이션)
├── package.json                # 의존성 & 스크립트
└── eslint.config.js            # ESLint 설정
```

---

## 3. 파일별 상세 역할

### 3.1 설정 파일

| 파일 | 역할 |
|------|------|
| `package.json` | React 19, axios, firebase, framer-motion, zustand, uuid 등 의존성 관리 |
| `vite.config.js` | `@` alias 설정, 개발 서버에서 `/api` 요청을 Vercel로 프록시 |
| `vercel.json` | 모든 경로를 `/`로 rewrite하여 SPA 라우팅 지원 |
| `tailwind.config.js` | 커스텀 폰트(maple, kohi, galmuri, dotum), fadeIn/Out 애니메이션 정의 |
| `index.html` | 넥슨 analytics 스크립트 & Google AdSense 삽입 |

### 3.2 API (Serverless)

| 파일 | 역할 |
|------|------|
| `api/characterSearch.js` | 넥슨 Open API 프록시. 캐릭터 이름 → ocid 조회 후 14개 엔드포인트(기본정보, 스탯, 장비, 하이퍼스탯, 어빌리티, 심볼, 스킬, 헥사스탯, 유니온, 아티팩트, 챔피언, 펫, 성향)를 5개씩 배치 호출. 429 에러 시 최대 2회 재시도 |

### 3.3 페이지 (Pages)

| 파일 | 역할 |
|------|------|
| `IntroPage.jsx` | 첫 화면. 로고, 캐릭터 검색 버튼, 즐겨찾기 목록, 공지사항 표시. 즐겨찾기 클릭 시 캐시 확인 후 API 호출 → MainPage로 이동 |
| `MainPage.jsx` | 핵심 페이지. 장비창 UI(인게임 레이아웃 재현), 슬롯별 장비 표시, 호버 시 정보 표시, 더블클릭 시 편집 모드. 프리셋 전환, 인벤토리, 헥사스탯, 전투력 증감 표시, 즐겨찾기, 정보 갱신, 튜토리얼 기능 포함 |

### 3.4 컴포넌트 (Components)

| 파일 | 역할 |
|------|------|
| `SearchModal.jsx` | 캐릭터 이름 입력 → 검색 모달. 최근 검색 기록(5개) 관리, 캐시 우선 조회 |
| `EquipmentInfo.jsx` | 장비 상세정보 패널. 읽기/편집 모드 지원. 스타포스 별 클릭 UI, 옵션별 수치 표시(기본/주문서작/스타포스작/추옵), 잠재/에디셔널/소울 옵션 편집, 저장 시 전투력 재계산 |
| `EquipmentSearch.jsx` | 빈 슬롯에서 장비 검색. maplestory.io API 호출, 직업 필터링, 선택 시 넥슨 API 포맷으로 변환 |
| `InventoryPanel.jsx` | 인벤토리 UI. 18칸/페이지, 페이징 지원, 아이템 클릭으로 장착, 삭제 버튼 |
| `OptionGroupEditor.jsx` | 잠재/에디셔널 잠재능력 편집기. 등급 선택, 옵션 드롭다운(부위/등급별 필터링), 수치 입력 |
| `SoulOptionEditor.jsx` | 소울 옵션 편집기. 소울 종류 드롭다운 + 수치 입력 |
| `ScrollModal.jsx` | 주문서 시뮬레이터. 주문의 흔적/전용 주문서 전환, 주문서 슬롯별 적용/취소, 합산 수치 실시간 계산 |
| `HexaStat.jsx` | 헥사스탯 뷰어. 3개 코어 선택, 메인/서브 스탯 레벨별 수치 표시, 게이지 시각화, 프리셋 지원 |
| `CoreActive.jsx` | 헥사 코어 활성화 모달 UI (활성화/취소 버튼) |
| `Loading.jsx` | 로딩 애니메이션. 5프레임 핑퐁 재생 (200ms 간격) |
| `NoticeModal.jsx` | 공지사항 리스트/상세 보기 모달 |
| `Tutorial.jsx` | PC 튜토리얼. 타이핑 애니메이션 + 이전/다음 버튼 + 23개 스크립트 장면 |
| `TutorialMobile.jsx` | 모바일 튜토리얼. 스와이프/터치로 25장 이미지 슬라이드 |

### 3.5 유틸리티 (Utils)

| 파일 | 역할 |
|------|------|
| `calculatePower.js` | **전투력 계산 핵심 로직**. 장비 옵션(기본/추옵/주문서/스타포스) 합산, 잠재능력 파싱, 소울 옵션, 세트 효과, 제네시스 최종데미지 적용. 직업별 공식 분기(일반/데몬어벤져/제논). 최종 전투력 = finalStat * finalAtk * finalDmg * finalCrit * finalDamage |
| `initcalPower.js` | **장비 외 스탯 초기화**. 레벨 기본스탯, 칭호, 어빌리티, 아티팩트, 챔피언, 헥사스탯, 하이퍼스탯, 0차스킬, 심볼, 유니온, 펫장비, 성향(의지) 총 12개 요소의 스탯 기여분을 정규식 파싱하여 baseStat/noPerStat/perStat으로 분류 |
| `calculateStarforceStat.jsx` | 스타포스 변경 시 스탯 계산. 15성 이하(부위별 분기), 16성 이상(레벨 테이블 기반), 타일런트 장비 별도 처리 |
| `fetchCharacterByName.js` | 서버리스 API 호출 → initcalPower로 기본스탯 계산 → 프론트용 데이터 구조로 가공 |
| `charCache.js` | localStorage 기반 캐릭터 캐시. 30분 TTL, 캐릭터별 저장/조회/삭제 |
| `equipmentUtils.js` | 장비 변경 감지. 추옵/주문서작/스타포스작/잠재/소울 등 비교하여 변경 여부 반환 |
| `toastContext.jsx` | React Context 기반 전역 토스트 알림. 성공(파란)/에러(빨간) 타입, 1.5초 자동 소멸 |

### 3.6 데이터 파일 (Data)

| 파일 | 역할 |
|------|------|
| `jobStat.json` | 46개 직업의 주스탯(main_stat)/부스탯(sub_stat) 매핑. 제논은 배열, 데몬어벤져는 HP |
| `jobKind.json` | 직업군(전사/궁수/마법사/도적/해적)별 소속 직업 리스트. 장비 필터링에 사용 |
| `potentialOptions.json` | 잠재능력 옵션 정의. id/label/template/type(percent/flat)/grades/applicableTo/slots |
| `soulOptions.json` | 15개 소울 옵션 템플릿 (방무, 공%, 마%, 보공%, 크확%, 공격력, 마력, 스탯, 올스탯 등) |
| `setEffect.json` | 세트 효과 데이터. 세트명, 매칭 키워드, 세트 수 별 보너스 스탯 |
| `MagicScroll.json` | 주문의 흔적 데이터. 부위별/레벨별/확률별 스탯 보너스 |
| `SpellScroll.json` | 전용 주문서 데이터. 부위별 주문서 목록, 이미지, 공통/선택 옵션 |
| `starforceStatTable.json` | 16성 이상 스타포스 스탯 테이블. 레벨 구간별 스탯/방어구 공마/무기 공마 |
| `starforceTyrantStatTable.json` | 타일런트 장비 스타포스 테이블. 부위별 스탯/공마 증가량 |
| `statMap.json` | maplestory.io API 키 → 넥슨 Open API 키 변환 (예: incSTR → str) |
| `itemTypeToSlot.json` | maplestory.io 서브카테고리 → 한글 슬롯명 매핑 (예: Hat → 모자) |
| `scripts.js` | 튜토리얼 대사 23장면. 이미지 경로 + 대사 텍스트 배열 |

### 3.7 상수 (Constants)

| 파일 | 역할 |
|------|------|
| `translationMap.js` | 3개 맵 export: `CATEGORY_KR_MAP`(부위 한영), `JOBTREE_KR_MAP`(직업군 한영), `STAT_KR_MAP`(스탯키 → 한글명) |

---

## 4. 파일 간 관계 (데이터 흐름)

### 4.1 캐릭터 검색 흐름

```
IntroPage/SearchModal
    → fetchCharacterByName.js
        → api/characterSearch.js (Vercel Serverless)
            → 넥슨 Open API (14개 엔드포인트)
        ← 캐릭터 원본 데이터
        → initcalPower.js (장비 외 스탯 계산)
            → jobStat.json
        ← { baseStat, noPerStat, perStat }
    ← mappedChar (프론트용 데이터)
    → localStorage("selectedCharacter")에 저장
    → charCache.js에 캐시 저장
    → navigate("/main")
```

### 4.2 전투력 계산 흐름

```
MainPage
    → initcalPower.js (최초 1회, 장비 외 요소)
        ├── basicPower (레벨 기본스탯)
        ├── titlePower (칭호)
        ├── abilityPower (어빌리티)
        ├── artifactPower (유니온 아티팩트)
        ├── championPower (유니온 챔피언)
        ├── hexaStatPower (헥사스탯)
        ├── hyperStatPower (하이퍼스탯)
        ├── skillPower (0차 스킬)
        ├── symbolPower (심볼)
        ├── unionPower (유니온)
        ├── petPower (펫장비)
        └── willingnessPower (성향 의지)
    ← { baseStat, noPerStat, perStat }

    → calculatePower.js (장비 변경마다 호출)
        ├── 장비 전체 옵션 합산 (기본/추옵/주문서/스타포스)
        ├── 소울 옵션 파싱
        ├── 잠재능력 파싱
        ├── 세트 효과 계산
        ├── 직업별 최종스탯 계산
        └── 전투력 = finalStat * finalAtk * finalDmg * finalCrit * finalDamage
    ← power (정수)
```

### 4.3 장비 편집 흐름

```
MainPage (슬롯 더블클릭)
    → EquipmentInfo.jsx (편집 모드)
        ├── 스타포스 클릭 → calculateStarforceStat.jsx
        ├── 옵션 직접 편집 (추옵/주문서작/스타포스작)
        ├── 잠재능력 편집 → OptionGroupEditor.jsx
        │       → potentialOptions.json
        ├── 소울 옵션 편집 → SoulOptionEditor.jsx
        │       → soulOptions.json
        ├── 주문서 시뮬레이션 → ScrollModal.jsx
        │       → MagicScroll.json / SpellScroll.json
        └── 저장 버튼 클릭
            → equipmentUtils.js (변경 여부 확인)
            → calculatePower.js (전투력 재계산)
            → MainPage 상태 갱신 (equipment, powerDiff, slotColors)
```

### 4.4 인벤토리 흐름

```
MainPage
    ├── "인벤토리에 저장" 버튼 → inventory 상태 + localStorage
    ├── 가방 아이콘 클릭 → InventoryPanel.jsx
    │   ├── 아이템 클릭 → 선택된 슬롯에 장착 + 전투력 재계산
    │   ├── 아이템 삭제 → inventory에서 제거
    │   └── 아이템 호버 → EquipmentInfo (읽기 모드)
    └── 빈 슬롯 더블클릭 → EquipmentSearch.jsx
            → maplestory.io API (장비 검색)
            → 선택 시 넥슨 API 포맷으로 변환 → 슬롯에 장착
```

---

## 5. 상태 관리

### 5.1 전역 상태
- **ToastContext** (`toastContext.jsx`): React Context로 전역 토스트 알림 관리
- **localStorage**: 캐릭터 캐시(`characterCache`), 즐겨찾기(`favorites`), 인벤토리(`inventory`), 최근 검색(`recentSearches`), 튜토리얼 완료(`tutorialSeen`), 선택된 캐릭터(`selectedCharacter`)

### 5.2 MainPage 핵심 상태
| 상태 | 용도 |
|------|------|
| `character` | 현재 캐릭터 정보 전체 (이름, 직업, 레벨, 이미지, 전투력, 장비, 스탯 등) |
| `equipment` | 현재 장착 장비 맵 (슬롯명 → 장비 객체) |
| `originalEquipment` | 원본 장비 맵 (변경 감지/초기화 기준) |
| `originalPower` | 기준 전투력 (변경량 계산 기준) |
| `powerDiff` | 현재 전투력 변화량 |
| `hoveredSlot` / `selectedSlot` | 호버/선택 중인 슬롯 |
| `isInfoLocked` | 장비 편집 모드 여부 |
| `slotColors` | 슬롯별 배경색 (변경된 장비 표시) |
| `inventory` | 인벤토리 아이템 배열 |
| `preset` | 현재 프리셋 번호 (1/2/3) |

---

## 6. 전투력 계산 공식

### 6.1 일반 직업
```
mainStat = baseStat[주스탯] * (100 + perStat[주스탯]) / 100 + noPerStat[주스탯]
subStat = baseStat[부스탯] * (100 + perStat[부스탯]) / 100 + noPerStat[부스탯]
finalStat = floor((mainStat * 4 + subStat) / 100)
finalAtk = floor(baseStat[공/마] * (100 + perStat[공/마]) / 100)
finalDmg = (100 + 보공 + 데미지) / 100
finalCrit = (135 + 크뎀) / 100
finalDamage = 제네시스 무기면 1.1, 아니면 1.0

전투력 = floor(finalStat * finalAtk * finalDmg * finalCrit * finalDamage)
```

### 6.2 데몬어벤져 (HP 기반)
```
maxHP = baseStat.HP * (1 + perStat.HP/100) + noPerStat.HP
subStat = floor(baseStat[STR] * (1 + perStat.STR/100)) + noPerStat.STR
finalStat = floor((floor(pure_HP / 3.5) + 0.8 * floor(maxHP / 3.5) + subStat) * 0.01)
```

### 6.3 제논 (3스탯)
```
totalMain = (STR + DEX + LUK) 각각 % 적용 후 합산
finalStat = floor(totalMain * 4 / 100)
```

### 6.4 스탯 분류 체계
- **baseStat**: 장비/세트효과/칭호/스킬 등에서 오는 "기본값" (% 적용 대상)
- **perStat**: 잠재능력/올스탯%/하이퍼스탯 등에서 오는 "퍼센트"
- **noPerStat**: 어빌리티/유니온 공격대/심볼/헥사스탯 등에서 오는 "고정값" (% 미적용, 최종 합산)

---

## 7. 주요 기능 목록

1. **캐릭터 검색**: 넥슨 Open API로 캐릭터 정보 조회 (14개 API 배치 호출)
2. **장비 시뮬레이션**: 스타포스/추옵/주문서작/잠재/에디셔널/소울 수정
3. **전투력 계산**: 장비 변경 시 실시간 전투력 증감 계산
4. **주문서 시뮬레이터**: 주문의 흔적/전용 주문서 슬롯별 적용
5. **인벤토리**: 장비 저장/불러오기/삭제 (localStorage)
6. **프리셋 전환**: 프리셋 1/2/3 장비 전환 및 적용
7. **장비 검색**: maplestory.io에서 장비 검색 후 빈 슬롯에 장착
8. **헥사스탯 뷰어**: 3개 코어 스탯/레벨/게이지 시각화
9. **즐겨찾기**: 캐릭터 즐겨찾기 추가/삭제 (localStorage)
10. **정보 갱신**: 캐시 삭제 후 최신 정보 재조회
11. **튜토리얼**: PC(타이핑 애니메이션)/모바일(스와이프) 분리
12. **공지사항**: JSON 기반 공지 리스트/상세 보기
13. **커스텀 커서**: 메이플스토리 스타일 커서 (기본/호버/클릭/스크롤)
14. **30분 캐시**: API 중복 호출 방지

---

## 8. 외부 API 의존성

| API | 용도 | 호출 위치 |
|-----|------|-----------|
| 넥슨 Open API (`NEXON_OPEN_API_URL`) | 캐릭터 정보 14종 조회 | `api/characterSearch.js` |
| maplestory.io API (KMS/389) | 장비 검색, 아이콘 이미지, 장비 상세정보 | `EquipmentSearch.jsx` |
| Google AdSense | 광고 | `index.html` |
| 넥슨 Analytics | 분석 | `index.html` |

---

## 9. 핵심 설계 특징

1. **스탯 3분류 체계**: baseStat(기본) + perStat(%) + noPerStat(고정)로 분리하여 정확한 전투력 계산
2. **장비 포맷 통일**: maplestory.io API 응답을 넥슨 Open API 포맷으로 변환하여 동일한 계산 로직 사용
3. **정규식 기반 파싱**: 어빌리티/하이퍼스탯/유니온 등 텍스트 형태의 효과를 정규식으로 파싱
4. **인게임 UI 재현**: 메이플스토리 인게임과 유사한 장비창/주문서/헥사스탯 UI 구현
5. **오프라인 지원**: 캐시/인벤토리/즐겨찾기를 localStorage에 저장하여 재방문 시 유지
