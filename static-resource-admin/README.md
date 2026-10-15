# static-resource-admin

LaCMS 어드민에 **S3 정적 JSON을 읽고 쓰는 메뉴**를 스캐폴딩하는 Claude Code 스킬입니다.
(구 이름 `promotion-admin`. 회원>프로모션 외 도메인에서도 쓰이게 되어 범용화)

## 사용 용도

컬리몰·컬리나우 등 프런트가 소비하는 정적 리소스(`res.kurly.com/web/json/…`)를 LaCMS 어드민에서 관리하기 위한 파일들을 표준 패턴에 따라 일괄 생성합니다. 메뉴 위치(대분류·부모 메뉴·Router)는 어디든 지정할 수 있습니다.

| 패턴 | 데이터 모양 | 페이지 | 기존 예시 |
|---|---|---|---|
| **버전형** (versioned) | `meta.json` + `{YYYYMMDD}.json` + 상시운영 `default`. 기간마다 콘텐츠 세트 전체가 바뀜 | List · Default · Create · Detail | [첫구매](https://lacms2.stg.kurlycorp.kr/user/promotion/welcome-benefit) / [친구초대 회원가입](https://lacms2.stg.kurlycorp.kr/user/promotion/invite-friend-signup) / [친구초대 더블적립금](https://lacms2.stg.kurlycorp.kr/user/promotion/invite-friend) / [(V)VIP 제도 안내](https://lacms2.stg.kurlycorp.kr/user/promotion/vip-membership) |
| **목록형** (collection) | JSON 하나에 항목 배열 `{ id, data: [] }`. 여러 항목이 동시에 노출되고 항목마다 순서·개별 기간 | List · Form(등록/수정 공용) | [컬리나우 배너관리](https://lacms2.stg.kurlycorp.kr/promotion/now-main-banner) |

기존 예시 링크는 LaCMS stg 환경입니다.

생성 범위:
- **메뉴/라우팅 등록** — `constants.ts`, `path.ts`, `fixtures.ts`, `managerRest.ts`, 해당 Router
- **S3 경로 상수** — `pathConstant.ts`
- **데이터 레이어** — `hooks/use{Domain}Query.ts` 하나 (타입 + S3 조회/저장 + React Query 훅). 두 패턴 공통
- **도메인 훅** — 폼 상태·검증·이미지 업로드·저장, (목록형) 순서 변경·삭제·필터·선택
- **페이지** — 버전형 4종 / 목록형 2종 + 삭제 확인 모달

## 트리거 방법

- **슬래시 커맨드**: `/static-resource-admin`
- **자연어**: "X 배너관리 메뉴 만들어줘", "회원>프로모션 하위에 X 어드민 추가", "컬리나우 배너관리 같은 거 하나 더", "S3 JSON 어드민 페이지 생성" 등

## 사용 흐름

1. 스킬 트리거 (`/static-resource-admin` 또는 자연어)
2. 아래 **사전 수집 질문**을 수집 — 첫 턴에 아래 질문 전체를 선택지·예시까지 상세히 보여준 뒤 **한 턴에 하나씩** 묻습니다. 선택형은 선택지 UI로, 파생 가능한 값(명칭 6종·MenuItemId·sort·Router)은 제안 후 확인만 받습니다. 모두 모이면 요약표로 최종 확인 후 생성 시작
3. 최신 `origin/main`에서 `feat/{티켓번호}` 브랜치 생성
4. 파일 생성 — 공통 수정 5~6개 + 버전형 신규 7개 / 목록형 신규 9개
5. 타입체크 — `npx tsc --noEmit`
6. 커밋은 자동으로 하지 않으며, 사용자 확인 후 진행

## 사전 수집 질문

스킬이 코드를 생성하기 전에 아래 순서로 묻습니다.

### 0. 패턴
- **버전형** — 기간마다 콘텐츠 세트 전체가 바뀌고, 기간 밖에는 상시운영(default) 세트가 노출되는 경우
- **목록형** — 여러 항목이 동시에 노출되고, 항목마다 개별 노출기간·순서가 있는 경우
- 두 패턴을 섞은 요청(예: 버전마다 배너 배열)은 패턴 밖으로 보고 확인 후 진행

### 1. 도메인 명칭
| 표기 | 용도 | 예시 |
|---|---|---|
| 한글 라벨 | 메뉴 노출 | `(V)VIP 제도 안내`, `컬리나우 배너관리` |
| PascalCase | 파일·hook·페이지·타입 | `VipMembership`, `NowMainBanner` |
| camelCase | 디렉터리·변수 | `vipMembership`, `nowMainBanner` |
| kebab-case | URL·queryKey | `vip-membership`, `now-main-banner` |
| SNAKE_CASE | 상수·PATH·role 접두어 | `VIP_MEMBERSHIP`, `NOW_MAIN_BANNER` |
| 한글 스네이크 | `MenuItemId` enum 키 | `VIP_제도_안내`, `컬리나우_배너_관리` |
| (목록형) 항목 라벨 | UI 문구의 단수 명사 | `배너` → "배너 등록", "배너명" |

### 2. 메뉴 위치 · 라우팅
회원>프로모션에 고정되어 있지 않습니다. 아래를 확정합니다.
- **MenuGroupId** (대분류, 예: `회원`, `프로모션`)
- **부모 메뉴** — (a) 대분류 바로 아래 `menus` 항목 / (b) 기존 메뉴의 `subMenus` 하위 (예: `MenuItemId.회원_프로모션`)
- **RoutePrefix** — URL 첫 세그먼트 (`src/shared/lib/menu/path.ts`)
- **Router 파일** — `src/shared/layout/MainApp.tsx` routerMap에서 `[RoutePrefix.X]: XRouter` 로 찾음 (회원 → `UserRouter`, 프로모션 → `PromotionRouter`)
- **MenuItemId 번호** — 같은 부모 아래 형제들의 번호대를 따름 (회원>프로모션 `891001~` → +1, 프로모션 대분류 `58x000` → +1000)
- **MenuRoleName** / operation (예: `NowMainBanner` / `NOW_MAIN_BANNER_VIEW`)
- **sort** — `fixtures.ts`와 `managerRest.ts` 각각 마지막 sort + 1 (두 파일의 번호가 다름)

### 3. 디렉터리 위치
- 회원>프로모션 하위 버전형 → 기존 `src/app/memberPromotion/` 안에
- 그 외 → 도메인 전용 디렉터리 `src/app/{domain}/` 신설
- 공통 유틸(`RES_WEB_BASE`, `uploadToS3`, `ImageUploadField`, `validatePromotionPeriod`, `STATUS_LABEL`)은 `app/memberPromotion/` 에 두고 그대로 import (옮기려면 사용자 확인)

### 4. S3 리소스 경로
- **버전형** — `RESOURCE_PREFIX` (예: `member-benefit/vip`). `IMAGE_BASE` / `JSON_BASE` / `JSON_META_PATH` / `RES_WEB_*_PATH` 자동 파생
- **목록형** — S3 디렉터리 `{resource-dir}` (예: `now-main-banners`) + 파일명 `{fileName}` (예: `nowMainBanners`)
  - 파일명은 환경과 무관하게 하나만 사용. 환경 분리는 버킷(res-dev / res-stg / res)이 담당하므로 `_dev` 같은 접미어를 붙이지 않음

### 5. 노출 기간 정책
- **버전형** — (A) 시작일+종료일 / (B) 시작일만 (다음 버전 시작일이 자동 종료)
- **목록형** — 시작일+종료일 기본. **상시 노출(종료일 없음) 체크박스** 필요 여부 (`2099-12-31T23:59:59+09:00` 저장)

### 6. 이미지 필드
- 개수 — 0개 / 1개 / 2개(PC+모바일) / 그 외(커스텀)
- 이미지 제약(확장자·규격·용량)과 검사 여부 — 허용 확장자 / 권장 규격 / 최대 용량(KB) 값을 받고, 파일 선택 시 실제로 검사해 막을지 결정. 목록형은 `constants/pathConstant.ts` 운영 정책 섹션에 상수화해 검사(컬리나우는 별도 `bannerPolicy.ts`), 버전형 도메인들은 helperText로 안내만 함

### 7. (목록형만) 목록 운영 정책
- 최대 등록 개수 (컬리나우: 50) — 없으면 상한 체크 삭제
- 순서 변경(맨위/위/아래/맨아래) 필요 여부
- 선택 삭제 필요 여부 — 삭제는 목록 JSON에서 항목을 뺀 배열을 같은 경로에 다시 업로드하는 것. 버킷의 실제 파일은 삭제되지 않고 그대로 남음 (PROD 버킷 내 파일 삭제는 권한 불가)
- 기준일시 + 상태(예정/진행중/종료) 필터 필요 여부
- 링크 필드가 있으면 `http(s)://` 또는 `/`로 시작하는 값만 허용 (XSS 방지)

### 8. 데이터 모델 필드 (게이트)
아래 둘 중 하나가 **반드시** 있어야 합니다. 없으면 스캐폴딩을 중단하고 임의로 필드를 만들지 않습니다.
- 기획서 링크 — 확정된 노출 데이터 명세
- 소비 측이 이미 읽고 있는 JSON URL — 있으면 그 포맷을 그대로 유지 (컬리몰/컬리나우 코드 변경 방지)

각 필드마다 수집: JSON key / 한글 라벨 / 타입(text · multiline · image · link · date range · list · nested) / 필수 여부 / placeholder.

예외: "테스트용 · 가상 도메인 · 드라이런"이라고 명시한 경우만 기본 세트(버전형 image+text+link / 목록형 image+name+link+기간)로 진행. 이때도 실제 도메인이면 기획서/JSON 없이 진행하면 안 된다고 안내합니다.

### 9. 노출 JSON 포맷 확정
8번 소스가 실제 JSON이면 그대로 사용. 기획서만 있으면 폼 상태를 그대로 저장하는 형태로 설계하되, 저장 전에 최종 JSON 스키마를 사용자에게 확인받습니다.

## 파일 구조

```
static-resource-admin/
├── SKILL.md                     # 스킬 지침 (Claude Code가 로드)
├── templates/
│   ├── common/
│   │   └── menu-registration.md # 메뉴/라우팅 등록 (대분류·부모·Router 찾는 법 포함)
│   ├── versioned/               # 버전형 — 첫구매(WelcomeBenefit) 기준
│   │   ├── pathConstant.snippet.ts.template
│   │   ├── useDomainQuery.ts.template
│   │   ├── useDomainForm.ts.template
│   │   ├── DomainListPage.tsx.template
│   │   ├── DomainDefaultVersionPage.tsx.template
│   │   ├── DomainPromotionCreatePage.tsx.template
│   │   ├── DomainPromotionDetailPage.tsx.template
│   │   └── index.ts.template
│   └── collection/              # 목록형 — 컬리나우 배너관리(NowMainBanner) 기준, 버전형 골격으로 축약
│       ├── pathConstant.ts.template    # S3 경로 + 운영 정책 상수
│       ├── useDomainQuery.ts.template  # 타입 + S3 조회/저장 + React Query 훅
│       ├── useDomainForm.ts.template
│       ├── useDomainList.ts.template   # 순서 변경·삭제 + 필터 + 선택
│       ├── util.ts.template
│       ├── DeleteConfirmModal.tsx.template
│       ├── DomainListPage.tsx.template
│       ├── DomainFormPage.tsx.template
│       └── index.ts.template
└── examples/
    └── reference.md             # 기존 5개 도메인 비교 매트릭스 · 공통 유틸 · 메뉴/라우터 위치 · 과거 결함 사례
```

## 생성/수정 파일

**공통 수정 (5~6개)** — `constants.ts` · `path.ts` · `fixtures.ts` · `managerRest.ts` · 해당 Router · (memberPromotion 안일 때) `pages/index.ts`

**버전형 신규 (7개)** — `use{Domain}Query.ts` · `use{Domain}Form.ts` · `pages/{domain}/` 하위 index + List/Default/Create/Detail (+ `pathConstant.ts` 상수 5종)

**목록형 신규 (9개)** — `constants/pathConstant.ts` · `hooks/` 3개(Query/Form/List) · `utils/{domain}Util.ts` · `components/DeleteConfirmModal.tsx` · `pages/` 3개. 버전형과 같은 골격으로 맞춘 축약 구조이며, 컬리나우 배너관리(19개)보다 잘게 나누지 않음. `util`·`DeleteConfirmModal`을 `app/memberPromotion/`으로 공통화하면 7개가 되지만 이는 사용자가 코드 변경을 요청할 때만 진행

## 지켜야 할 규칙

- 메뉴 위치는 사용자가 지정한 곳에만. 회원>프로모션을 기본값으로 가정하지 않음
- `MenuItemId` 중복 금지. 형제 번호대 확인 후 다음 번호
- 커밋은 사용자 명시 시에만
- shared 컴포넌트·`app/memberPromotion` 공통 유틸 수정이 필요하면 반드시 알림
- 코드 파일은 Write/Edit로만 (sed/awk 금지)
- 타입체크 통과 (`noUnusedLocals` 주의)
- (목록형) 링크는 스킴 검증 / 등록 id는 최초 로드 시 고정 / 저장 직전 `refetch` 후 배열 전체 덮어쓰기

## 대상 프로젝트

이 스킬은 LaCMS 프런트엔드 레포(`la-cms-front-react`) 구조를 전제로 합니다.

- `src/shared/lib/menu/`에 fixtures / constants / path 파일, `src/shared/layout/MainApp.tsx`에 RoutePrefix → Router 매핑
- 공통 유틸은 `src/app/memberPromotion/` 에 있고 다른 디렉터리에서도 그대로 import
- 컬리나우 배너관리는 전시 카테고리(`category-v2`)의 `data/api` + `data/hooks` 구조를 따르지만, 스킬이 생성하는 목록형은 버전형과 같은 `hooks/use{Domain}Query.ts` 단일 파일 구조

다른 프로젝트에는 그대로 적용되지 않으며, 유사한 패턴이 있다면 `templates/` 파일들을 해당 구조에 맞게 수정해야 합니다.
