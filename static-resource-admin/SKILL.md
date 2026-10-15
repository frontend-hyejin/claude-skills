---
name: static-resource-admin
description: |
  LaCMS에서 S3 정적 JSON(res.kurly.com/web/json/…)을 읽고 쓰는 어드민 메뉴를 새로 추가할 때 사용합니다.
  메뉴 위치(대분류·부모 메뉴·Router)는 어디든 가능하며, 데이터 구조에 따라 두 패턴 중 하나로 스캐폴딩합니다.
  - 버전형(versioned): meta.json + {version}.json + 상시운영(default). 회원>프로모션 4개 도메인 패턴. 페이지 List/Default/Create/Detail
  - 목록형(collection): JSON 하나에 항목 배열. 순서 변경·선택 삭제·기준일시 필터. 컬리나우 배너관리 패턴. 페이지 List/Form
  메뉴/라우팅 등록 + pathConstant + data/hook + 페이지를 일괄 생성합니다.

  Trigger when: S3 JSON 기반 정적 리소스 어드민 페이지 생성, 컬리몰/컬리나우가 읽는 JSON을 LaCMS에서 관리하는 메뉴 추가,
  "X 배너관리 메뉴 만들어줘", "회원>프로모션 하위에 X 추가", "프로모션 어드민 하나 더", "컬리나우 배너관리 같은 거 하나 더",
  LaCMS 정적 리소스 어드민 스캐폴딩, promotion-admin(구 이름) 요청.
---

# LaCMS 정적 리소스 어드민 스캐폴딩 스킬

컬리몰·컬리나우 등 프런트가 소비하는 **S3 정적 JSON**을 LaCMS 어드민에서 관리하는 표준 패턴을 자동 생성합니다.
(구 이름 `promotion-admin`. 회원>프로모션 외 도메인에서도 쓰이게 되어 범용화)

현재까지 이 패턴으로 만들어진 도메인:

| 패턴 | 도메인 | 메뉴 위치 | 디렉터리 |
|---|---|---|---|
| 버전형 | 첫구매 (WelcomeBenefit) · 친구초대 회원가입 (InviteFriendSignup) · 친구초대 더블적립금 (InviteFriend) · (V)VIP 제도 안내 (VipMembership) | 회원 > 프로모션 > … | `src/app/memberPromotion/` |
| 목록형 | 컬리나우 배너관리 (NowMainBanner) | 프로모션 > 컬리나우 배너관리 | `src/app/nowMainBanner/` |

기존 도메인의 실제 코드 예시와 비교 매트릭스는 `examples/reference.md` 참조.

---

## 🧭 패턴 선택 기준 (가장 먼저 결정)

| | 버전형 (versioned) | 목록형 (collection) |
|---|---|---|
| **데이터 모양** | 기간마다 **콘텐츠 세트 전체**가 바뀜. 기간 밖엔 상시운영(default) 세트 노출 | **여러 항목이 동시에** 노출. 항목마다 개별 노출기간·순서 |
| **S3 파일** | `json/{prefix}/meta.json` + `json/{prefix}/{YYYYMMDD}.json` + `default.json` | `json/{dir}/{fileName}.json` 하나. `{ id, data: [...] }` |
| **식별자** | 버전명(시작일 `YYYYMMDD`) | 숫자 `id` (목록 내 최대값 + 1 채번) |
| **목록 화면** | 버전 테이블 + 상시운영 카드 | 항목 테이블 + 순서 이동 + 선택 삭제 + 기준일시/상태 필터 |
| **편집 화면** | Default / Create / Detail 3종 | Form 1종 (`isEditMode` prop으로 등록·수정 공용) |
| **라우트** | `/{prefix}/{kebab}`, `/default`, `/create`, `/:version` | `/{prefix}/{kebab}`, `/create`, `/:id` |
| **기존 예시** | 첫구매·친구초대·VIP | 컬리나우 배너관리 |

판단이 애매하면 사용자에게 두 패턴의 차이를 위 표로 보여주고 고르게 하세요. 두 패턴을 섞은 요청(예: 버전마다 배너 배열)은 **패턴에서 벗어난 요청**으로 보고 확인 후 진행.

---

## 🎯 사전 수집 정보 (사용자에게 질문)

**아래 항목을 대화형으로 수집한 뒤 파일 생성을 시작하세요.** 하나라도 빠지면 되묻습니다.

### 진행 방식 (반드시 지킬 것)

1. **첫 턴에는 전체 질문을 상세히 보여준다** — 아래 0~9번 항목을 제목만이 아니라 **각 항목의 선택지·예시·설명까지 포함해** 한 화면에 전부 나열한다 (사용자가 전체 그림을 먼저 보고 답을 준비할 수 있도록). 그 뒤 "하나씩 순서대로 물어보겠다"고 안내하고 **첫 질문(게이트) 하나만** 던진다.
2. **한 턴에 질문 하나.** 여러 항목을 묶어서 묻지 않는다. 답을 받으면 다음 항목으로 넘어간다.
3. **선택형 질문은 `AskUserQuestion` 도구로** — 패턴, 부모 메뉴 위치, 노출 기간 정책, 이미지 개수, 상시 노출 여부, 목록 정책(순서 변경/선택 삭제/필터) 등. 자유 입력(기획서 링크, 한글 라벨, 영문 이름, 티켓 번호, 규격 값)은 텍스트로 묻는다. 각 선택지 설명에는 **그 선택지에 해당하는 기존 도메인 예시를 빠짐없이** 적는다 (첫구매 / 친구초대 회원가입 / 친구초대 더블적립금 / (V)VIP / 컬리나우 배너관리 중 해당하는 것 전부. 버전형 질문이라도 컬리나우 배너가 해당되면 함께 표기).
4. **파생 가능한 값은 묻지 말고 제안 후 확인** — 영문 이름 하나를 받으면 PascalCase/camelCase/kebab/SNAKE/한글 스네이크 6종을 만들어 보여주고 확인받는다. MenuItemId 번호·sort·Router 파일·MenuRoleName 도 코드를 읽어 제안한다.
5. **질문 순서**: 8번 게이트(기획서/JSON) → 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7(목록형만) → 9. 게이트를 통과하지 못하면 그 자리에서 중단.
6. **기획서/JSON 에서 읽을 수 있는 항목은 먼저 읽고 "이렇게 이해했는데 맞나요?" 로 확인**만 받는다 (예: 이미지 규격, 필드 목록, 최대 개수).
7. **모두 수집한 뒤 요약표를 한 번 보여주고 최종 확인**을 받은 다음에 브랜치 생성·파일 생성을 시작한다.

### 0. 패턴
- 버전형 / 목록형 (위 기준표)

### 1. 도메인 명칭
- **한글 라벨** (메뉴 노출용, 예: `(V)VIP 제도 안내`, `컬리나우 배너관리`)
- **PascalCase** (파일·hook·페이지·타입 이름, 예: `VipMembership`, `NowMainBanner`)
- **camelCase** (디렉터리·변수, 예: `vipMembership`, `nowMainBanner`)
- **kebab-case** (URL·queryKey, 예: `vip-membership`, `now-main-banner`)
- **SNAKE_CASE** (상수·PATH·role 접두어, 예: `VIP_MEMBERSHIP`, `NOW_MAIN_BANNER`)
- **한글 스네이크** (`MenuItemId` enum 키, 예: `VIP_제도_안내`, `컬리나우_배너_관리`)
- (목록형) **항목 라벨** — UI 문구에 쓰는 단수 명사 (예: `배너` → "배너 등록", "배너명")

### 2. 메뉴 위치 · 라우팅
회원>프로모션에 고정되어 있지 않습니다. 아래 4가지를 확정하세요. 찾는 방법은 `templates/common/menu-registration.md` 0단계 참조.
- **MenuGroupId** (대분류, 예: `회원`, `프로모션`)
- **부모 메뉴** — (a) 대분류 바로 아래 `menus` 항목으로 추가 / (b) 기존 메뉴의 `subMenus` 하위로 추가 (예: `MenuItemId.회원_프로모션`)
- **RoutePrefix** — URL 첫 세그먼트. `src/shared/lib/menu/path.ts`의 `RoutePrefix` enum
- **Router 파일** — `src/shared/layout/MainApp.tsx`의 routerMap에서 `[RoutePrefix.X]: XRouter`로 찾음 (예: 회원 → `app/user/UserRouter.tsx`, 프로모션 → `app/promotion/PromotionRouter.tsx`)
- **MenuItemId 번호** — 같은 부모 아래 형제 메뉴들의 번호대 확인 후 다음 번호 제안 (예: 회원>프로모션 `891001~891004` → `891005`, 프로모션 대분류 `58x000` → 마지막 + 1000)
- **MenuRoleName** / operation — 예: `NowMainBanner` / `NOW_MAIN_BANNER_VIEW`
- **sort** — `fixtures.ts`와 `managerRest.ts` **각각** 해당 위치의 마지막 sort + 1 (두 파일의 sort 값은 서로 다를 수 있음)

### 3. 디렉터리 위치
- 회원>프로모션 하위 버전형 → 기존 `src/app/memberPromotion/` 안에 `hooks/use{Domain}*.ts` + `pages/{domain}/`
- 그 외 → **도메인 전용 디렉터리** `src/app/{domain}/` 신설 (컬리나우 배너관리 방식)
- 공통 유틸(`RES_WEB_BASE`, `uploadToS3`, `createJsonFile`, `ImageUploadField`, `validatePromotionPeriod`, `STATUS_LABEL`)은 현재 `app/memberPromotion/` 에 있고 **다른 디렉터리에서도 그대로 import**합니다. 옮기지 마세요 (옮기려면 사용자 확인).

### 4. S3 리소스 경로
- **버전형**: `RESOURCE_PREFIX` (JSON 본문 `id` prefix, 예: `member-benefit/vip`) → `IMAGE_BASE`/`JSON_BASE`/`JSON_META_PATH`/`RES_WEB_*_PATH` 자동 파생
- **목록형**: `{resource-dir}` (예: `now-main-banners`) + `{fileName}` (예: `nowMainBanners`)
  - `RESOURCE_ID` = `{resource-dir}/{fileName}.json` (JSON 본문 `id`)
  - 파일명은 **환경과 무관하게 하나**. 환경 분리는 버킷(res-dev / res-stg / res)이 담당. 컬리나우 배너관리의 `_dev` 접미어 분기는 따라 하지 말 것

### 5. 노출 기간 정책
- **버전형** (A) 시작일+종료일 — `FormDateRangePickerField` / (B) 시작일만 — 다음 버전 시작일이 자동 종료. `FormDatePickerField`
- **목록형** 시작일+종료일 기본. **상시 노출(종료일 없음) 체크박스** 필요 여부 → 필요하면 `ALWAYS_ON_END_DATE = 2099-12-31T23:59:59+09:00` 저장 방식

### 6. 이미지 필드 개수
- 0개 (VIP 스타일 — 텍스트 위주)
- 1개 (첫구매·친구초대 회원가입·컬리나우 배너 스타일)
- 2개 (친구초대 PC + 모바일 스타일)
- 그 외 (여러 개 반복 세트 등 — 커스텀 필요)
- 이미지 제약(확장자·규격·용량)과 검사 여부: 허용 확장자 / 권장 규격 / 최대 용량(KB) 값을 받고, 파일 선택 시 실제로 검사해 막을지 결정. 목록형은 `constants/{domain}Policy.ts`에 상수화해 검사(컬리나우), 버전형은 helperText 안내만

### 7. (목록형만) 목록 운영 정책
- **최대 등록 개수** (컬리나우: 50) — 없으면 상한 체크 로직 삭제
- **순서 변경** 필요 여부 (맨위/위/아래/맨아래)
- **선택 삭제** 필요 여부 — 삭제는 항목을 뺀 배열을 같은 경로에 재업로드하는 것. 버킷의 실제 파일은 삭제되지 않고 그대로 남음 (PROD 버킷 내 파일 삭제는 권한 불가)
- **기준일시 + 상태 필터** 필요 여부
- **링크 필드** 있으면 `http(s)://` 또는 `/`로 시작하는 값만 허용 (XSS 방지, 입력·표시 양쪽)

### 8. 데이터 모델 필드

**⚠️ 필수 소스 먼저 확인 (게이트):**
아래 둘 중 하나가 없으면 **스캐폴딩 중단**. 임의로 필드를 만들지 말 것.
- **기획서 링크** — 마케팅/기획팀이 확정한 노출 데이터 명세
- **소비 측이 이미 읽고 있는 JSON URL** — 실제 정적 리소스 URL. 있으면 그 포맷을 그대로 유지 (컬리몰/컬리나우 코드 변경 방지)

**테스트 모드 예외:** 사용자가 명시적으로 "테스트용" · "가상 도메인" · "드라이런"이라고 밝힌 경우에만 기본 세트(버전형: image + text + link / 목록형: image + name + link + 기간)로 진행 가능. 이 경우에도 "실제 도메인이면 기획서/JSON 없이 진행하면 안 된다"는 점을 명확히 안내.

**필드 정의 방법** — 위 소스에서 각 필드마다 아래 항목 추출:
- **키 이름** (JSON key)
- **한글 라벨**
- **타입** — text / multiline text / image / link URL / date range / list / nested object
- **필수 여부**
- **placeholder / 예시 값** (선택)

### 9. 노출 JSON 포맷 확정
8번의 소스가 실제 JSON이라면 그 포맷을 그대로 사용. 기획서만 있다면 어드민 폼 상태를 그대로 저장하는 형태로 설계하되, 저장 전에 사용자에게 최종 JSON 스키마를 확인받고 진행.

---

## 📁 생성/수정할 파일 목록

### 공통 — 기존 파일 수정 (5~6개)
- `src/shared/lib/menu/constants.ts` — `MenuItemId.{도메인_한글}` + `MenuRoleName.{Domain}` 추가
- `src/shared/lib/menu/path.ts` — `PATH.{DOMAIN_SNAKE}_*` (버전형 4개 / 목록형 3개) + `pathForMenuItem` 매핑
- `src/shared/lib/menu/fixtures/fixtures.ts` — 지정 위치(대분류 `menus` 또는 부모 `subMenus`)에 추가
- `src/shared/rest/__mocks__/managerRest.ts` — fixtures와 동일 위치에 추가
- `{Router}.tsx` — `import` + Route (버전형 4개 / 목록형 3개)
- (memberPromotion 안에 만들 때만) `src/app/memberPromotion/pages/index.ts` — `export * as {Domain}` 추가

### 버전형 — 신규 생성 (7개) + pathConstant 수정
`{app-dir}` = `src/app/memberPromotion` (회원>프로모션) 또는 `src/app/{domain}` (전용 디렉터리)
- `{app-dir}/constants/pathConstant.ts` — 상수 5개 세트 추가 (전용 디렉터리면 파일 신설, `RES_WEB_BASE`는 memberPromotion에서 import)
- `{app-dir}/hooks/use{Domain}Query.ts`
- `{app-dir}/hooks/use{Domain}Form.ts`
- `{app-dir}/pages/{domain}/index.ts`
- `{app-dir}/pages/{domain}/{Domain}PromotionListPage.tsx`
- `{app-dir}/pages/{domain}/{Domain}DefaultVersionPage.tsx`
- `{app-dir}/pages/{domain}/{Domain}PromotionCreatePage.tsx`
- `{app-dir}/pages/{domain}/{Domain}PromotionDetailPage.tsx`

템플릿: `templates/versioned/`

### 목록형 — 신규 생성 (19개, 전용 디렉터리 `src/app/{domain}/`)
```
src/app/{domain}/
├── constants/pathConstant.ts            S3 경로 상수
├── constants/{domain}Policy.ts          최대 개수·안내 문구·이미지 정책
├── data/types/{domain}.ts               항목 타입 + 파일 전체 타입
├── data/api/get{Domain}s.ts             JSON 조회
├── data/api/post{Domain}Image.ts        이미지 업로드
├── data/api/put{Domain}s.ts             배열 전체 덮어쓰기
├── data/hooks/queryKeys.ts
├── data/hooks/useGet{Domain}s.ts
├── data/hooks/usePost{Domain}Image.ts
├── data/hooks/usePut{Domain}s.ts
├── utils/{domain}Util.ts                상태 판단·KST 포맷·id 채번·위치 삽입·링크 검증
├── hooks/use{Domain}Form.ts             등록/수정 폼
├── hooks/use{Domain}List.ts             순서 변경·삭제
├── hooks/use{Domain}Filter.ts           기준일시·상태 필터
├── hooks/use{Domain}Selection.ts        체크박스 선택
├── components/DeleteConfirmModal.tsx
├── pages/index.ts
├── pages/{Domain}ListPage.tsx
└── pages/{Domain}FormPage.tsx
```
템플릿: `templates/collection/` (작은 파일들은 `data-layer.ts.template`, `list-hooks.ts.template`에 `// ===== 목적지:` 구분자로 묶여 있음 — 구분자 단위로 쪼개서 각 파일로 저장)

---

## 🛠️ 작업 순서

1. **사전 정보 수집** (위 0~9번). **8번 필수 소스(기획서 or 소비 측 JSON) 미확인 시 스캐폴딩 중단** — 사용자가 명시적으로 테스트 모드라 밝힌 경우만 예외.
2. **git 브랜치 생성** — 최신 `origin/main`에서 `feat/{티켓번호}` (티켓 번호 없으면 물어봄)
3. **pathConstant 상수 추가/신설**
4. **메뉴/라우팅 등록** — `templates/common/menu-registration.md` 순서대로 (constants.ts / path.ts / fixtures.ts / managerRest.ts / Router)
5. **데이터 레이어** — 버전형: `use{Domain}Query.ts` / 목록형: `data/types` + `data/api` + `data/hooks`
6. **도메인 훅** — 버전형: `use{Domain}Form.ts` / 목록형: `utils` + `hooks` 4종 + `constants/{domain}Policy.ts`
7. **페이지** — 버전형 4종 / 목록형 2종 (+ `DeleteConfirmModal`)
8. **타입체크** — `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v node_modules | head`
9. **간단한 검증** — PATH 상수 위치, `pathForMenuItem` 매핑, 메뉴 fixture/managerRest 순서, Router import
10. **커밋 안내** (자동 커밋 X, 사용자 확인 후)

---

## 📝 템플릿 사용법

| 디렉터리 | 기준 패턴 | 비고 |
|---|---|---|
| `templates/common/` | 메뉴/라우팅 등록 가이드 | 두 패턴 공통. 대분류·부모·Router 치환 |
| `templates/versioned/` | 첫구매(WelcomeBenefit) 기준 | 목적지 경로의 `{app-dir}` 치환 |
| `templates/collection/` | 컬리나우 배너관리(NowMainBanner) 기준 | 항목 필드는 `imageUrl / link / name / startDate / endDate` 예시 |

다른 정책이면 아래와 같이 변형:

| 결정 사항 | 변형 방법 |
|---|---|
| **(버전형) 노출 기간이 시작일만** | `FormDateRangePickerField` → `FormDatePickerField`. `endDate` 상태/setter 제거. `meta.json.versions[v].endDate`는 빈 문자열로 저장. 목록 페이지 상태 계산은 시작일 기반 (`getVipVersionStatus` 패턴 참고) |
| **(버전형) 회원>프로모션 밖에 생성** | 전용 디렉터리 `src/app/{domain}/` 신설. `constants/pathConstant.ts`를 새로 만들고 `RES_WEB_BASE`만 memberPromotion에서 import. PATH 이름에서 `_PROMOTION` 접미어·`/promotion/` 세그먼트 제거. `pages/index.ts`는 목록형과 같은 named export 방식 |
| **(목록형) 상시 노출 불필요** | `isAlwaysOn` 상태·체크박스·`ALWAYS_ON_END_DATE`·`isAlwaysOnBanner` 삭제. 기간 검증은 항상 수행 |
| **(목록형) 최대 개수 없음** | `MAX_*_COUNT` 관련 상수·툴팁·저장 전 재조회 체크·`isMaxCountReached` 삭제 (저장 직전 `refetch`는 동시 편집 방지용이라 유지 권장) |
| **(목록형) 순서 변경 / 선택 삭제 / 필터 불필요** | 해당 훅(`use{Domain}List.moveBanner` / `removeBanners` / `use{Domain}Filter`·`Selection`)과 ListPage의 컬럼·버튼 블록 삭제 |
| **이미지 필드 0개** | `ImageUploadField` 임포트/사용부 삭제. hook의 이미지 관련 state/handler 제거 |
| **이미지 필드 2개 이상** | `pcFileInputRef` / `mobileFileInputRef`처럼 접미어 붙여 각각 관리 (InviteFriend 예시 참고) |
| **데이터 모델 복잡 (탭·중첩 배열 등)** | Form hook에 `state` 통째로 관리 + `formStateToVersionData` / `versionDataToFormState` 변환 함수 (VipMembership 예시) |

---

## ⚠️ 절대 잊지 말 것

1. **메뉴 위치는 사용자가 지정한 대분류·부모 아래에만 추가**. 지정이 없으면 물어볼 것. 기본값을 회원>프로모션으로 가정하지 말 것.
2. **MenuItemId 값 중복 금지** — 같은 부모 아래 형제 번호대 확인 후 다음 번호 사용
3. **커밋은 사용자 명시 시에만** — 자동 커밋 금지
4. **shared 컴포넌트·`app/memberPromotion`의 공통 유틸 수정 필요 시 반드시 사용자에게 알림** — 다른 도메인에 영향
5. **코드 파일은 반드시 Write/Edit로만 처리**, `sed`/`awk` 사용 금지
6. **타입체크 통과 확인** — 특히 `noUnusedLocals`/`noUnusedParameters` 걸리는 경우 많음
7. **패턴에서 벗어난 요청은 확인 후 진행** — 예: 두 패턴 혼합, S3가 아닌 API 저장, 완전히 새로운 데이터 저장 방식 등
8. **실제 도메인은 반드시 기획서 or 소비 측 JSON 있어야 함** — 데이터 모델 필드를 임의로 만들지 말 것
9. **(목록형) 링크를 `a[href]`로 렌더링하면 스킴 검증 필수** — `javascript:` 등 차단. 입력 시 공백 제거 + 형식 에러 표시
10. **(목록형) 등록 모드 id는 최초 로드 시점에 state로 고정** — 목록 갱신으로 id가 바뀌면 업로드된 이미지 경로와 저장 id가 어긋남. id 확정 전엔 이미지 업로드 비활성화
11. **(목록형) 저장은 배열 전체 덮어쓰기** — 저장 직전 반드시 `refetch`로 최신 목록을 다시 읽고 그 위에 적용 (다른 담당자의 변경 유실 방지)

---

## 🔗 참고

- 기존 도메인 코드 예시·비교 매트릭스·과거 결함 사례: `examples/reference.md`
- 메뉴/라우팅 등록 절차: `templates/common/menu-registration.md`
- 프로젝트 배경: [Confluence 문서](https://kurly0521.atlassian.net/wiki/spaces/CMWD/pages/5918931769)
