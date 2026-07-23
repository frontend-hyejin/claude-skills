---
name: promotion-admin
description: |
  회원 > 프로모션 하위에 새 어드민 메뉴를 추가할 때 사용합니다.
  기존 첫구매·친구초대·(V)VIP 패턴을 그대로 따라
  메뉴/라우팅 등록 + pathConstant + Query hook + Form hook + 페이지 4종(List/Default/Create/Detail)을 일괄 생성합니다.

  Trigger when: 새 프로모션 어드민 페이지 추가, 회원>프로모션 하위에 X 메뉴 추가,
  S3 JSON 기반 정적 리소스 어드민 페이지 생성, LaCMS 프로모션 어드민 스캐폴딩,
  "프로모션 어드민 하나 더 만들어줘" 같은 요청.
---

# LaCMS 프로모션 어드민 스캐폴딩 스킬

컬리몰의 정적 리소스 노출 페이지를 LaCMS 어드민으로 관리하는 표준 패턴을 자동 생성합니다.
현재까지 이 패턴으로 만들어진 도메인: **첫구매 (WelcomeBenefit) · 친구초대 더블적립금 (InviteFriend) · 친구초대 회원가입 (InviteFriendSignup) · (V)VIP 제도 안내 (VipMembership)**.

기존 도메인의 실제 코드 예시는 `examples/reference.md` 참조. 새 도메인을 만들 때 어떤 도메인 패턴을 따라야 할지 판단할 근거로 활용하세요.

---

## 🎯 사전 수집 정보 (사용자에게 질문)

**아래 항목을 대화형으로 수집한 뒤 파일 생성을 시작하세요.** 하나라도 빠지면 되묻습니다.

### 1. 도메인 명칭
- **한글 라벨** (메뉴 노출용, 예: `(V)VIP 제도 안내`)
- **PascalCase** (파일·hook·페이지 이름, 예: `VipMembership`)
- **camelCase** (변수·prop 접두어, 예: `vipMembership`)
- **kebab-case** (URL·디렉터리, 예: `vip-membership`)
- **SNAKE_CASE** (상수 접두어, 예: `VIP_MEMBERSHIP`)
- **한글 스네이크** (`MenuItemId` enum 키, 예: `VIP_제도_안내`)

### 2. 메뉴 등록 정보
- **MenuItemId 번호** — `constants.ts`의 기존 값 확인 후 다음 번호 제안
  - 현재 최대: `891004 = VIP_제도_안내`
  - 다음: `891005`
- **MenuRoleName** — 예: `VipMembershipPromotion` / operation 이름: `VIP_MEMBERSHIP_PROMOTION_VIEW`
- **회원 > 프로모션 하위 sort 값** — 기존 마지막 sort + 1

### 3. S3 리소스 경로
- **RESOURCE_PREFIX** — JSON 본문 `id` 필드 prefix. 예: `member-benefit/vip`
- 자동 파생:
  - `IMAGE_BASE = images/{prefix}`
  - `JSON_BASE = json/{prefix}`
  - `JSON_META_PATH = {json_base}/meta.json`
  - `RES_WEB_*_PATH = ${RES_WEB_BASE}/{json_base}`

### 4. 노출 기간 정책
- (A) **시작일 + 종료일** — 첫구매·친구초대와 동일. `FormDateRangePickerField` 사용
- (B) **시작일만** — VIP처럼 다음 버전 시작일이 자동 종료. `FormDatePickerField` 사용

### 5. 이미지 필드 개수
- 0개 (VIP 스타일 — 텍스트 위주)
- 1개 (첫구매·친구초대 회원가입 스타일)
- 2개 (친구초대 PC + 모바일 스타일)
- 그 외 (여러 개 반복 세트 등 — 커스텀 필요)

### 6. 데이터 모델 필드

**⚠️ 필수 소스 먼저 확인 (게이트):**
아래 둘 중 하나가 없으면 **스캐폴딩 중단**. 임의로 필드를 만들지 말 것.
- **기획서 링크** — 마케팅/기획팀이 확정한 노출 데이터 명세
- **컬리몰이 이미 소비 중인 JSON URL** — 실제 정적 리소스 URL. 있으면 그 포맷을 그대로 유지 (컬리몰 코드 변경 방지)

**테스트 모드 예외:** 사용자가 명시적으로 "테스트용" · "가상 도메인" · "드라이런"이라고 밝힌 경우에만 첫구매 축약 형태(image + text + link) 같은 기본 세트로 진행 가능. 이 경우에도 사용자에게 "실제 도메인이면 기획서/JSON 없이 진행하면 안 된다"는 점을 명확히 안내.

**필드 정의 방법** — 위 소스에서 각 필드마다 아래 항목 추출:
- **키 이름** (JSON key)
- **한글 라벨**
- **타입** — text / multiline text / image / link URL / date range / list / nested object
- **필수 여부**
- **placeholder / 예시 값** (선택)

### 7. 컬리몰 노출 JSON 포맷 확정
6번의 소스가 컬리몰 JSON이라면 그 포맷을 그대로 사용. 기획서만 있다면 어드민 폼 상태를 그대로 저장하는 형태로 설계하되, 저장 전에 사용자에게 최종 JSON 스키마를 확인받고 진행.

---

## 📁 생성/수정할 파일 목록

### 신규 생성 (7개)
- `src/app/memberPromotion/hooks/use{Domain}Query.ts`
- `src/app/memberPromotion/hooks/use{Domain}Form.ts`
- `src/app/memberPromotion/pages/{domain}/index.ts`
- `src/app/memberPromotion/pages/{domain}/{Domain}PromotionListPage.tsx`
- `src/app/memberPromotion/pages/{domain}/{Domain}DefaultVersionPage.tsx`
- `src/app/memberPromotion/pages/{domain}/{Domain}PromotionCreatePage.tsx`
- `src/app/memberPromotion/pages/{domain}/{Domain}PromotionDetailPage.tsx`

### 기존 파일 수정 (7개)
- `src/app/memberPromotion/constants/pathConstant.ts` — S3 상수 5개 세트 추가
- `src/app/memberPromotion/pages/index.ts` — `{Domain}` export 추가
- `src/shared/lib/menu/constants.ts` — `MenuItemId.{도메인_한글}` + `MenuRoleName.{Domain}Promotion` 추가
- `src/shared/lib/menu/path.ts` — `PATH.{DOMAIN_SNAKE}_PROMOTION_*` 4개 + `pathForMenuItem` 매핑
- `src/shared/lib/menu/fixtures/fixtures.ts` — 회원>프로모션 subMenus에 추가
- `src/shared/rest/__mocks__/managerRest.ts` — 회원>프로모션 subMenus에 추가
- `src/app/user/UserRouter.tsx` — `import` + Route 4개 추가

---

## 🛠️ 작업 순서

1. **사전 정보 수집** (위 7개 질문). **6번 필수 소스(기획서 or 컬리몰 JSON) 미확인 시 스캐폴딩 중단** — 사용자가 명시적으로 테스트 모드라 밝힌 경우만 예외.
2. **git 브랜치 생성** — `feat/{티켓번호}-{domain-kebab}` (사용자가 티켓 번호를 주지 않으면 물어봄)
3. **pathConstant 상수 추가** — 5개 세트
4. **메뉴/라우팅 등록** — 5개 파일 수정 (constants.ts / path.ts / fixtures.ts / managerRest.ts / UserRouter.tsx)
5. **pages/index.ts export 추가**
6. **Query hook 생성** — `use{Domain}Query.ts`
7. **Form hook 생성** — `use{Domain}Form.ts`
8. **페이지 4종 생성** — List / Default / Create / Detail
9. **타입체크** — `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v node_modules | head`
10. **간단한 검증** — pages/index.ts에 잘 export됐는지, PATH 상수 위치 확인, 메뉴 fixture 순서 확인
11. **커밋 안내** (자동 커밋 X, 사용자 확인 후)

---

## 📝 템플릿 사용법

`templates/` 하위의 각 파일은 **첫구매(WelcomeBenefit) 패턴 기준**으로 작성되어 있습니다.
다른 정책이면 아래와 같이 변형:

| 결정 사항 | 변형 방법 |
|---|---|
| **노출 기간이 시작일만** | `FormDateRangePickerField` → `FormDatePickerField`. `endDate` 상태/setter 제거. `meta.json.versions[v].endDate`는 빈 문자열로 저장. 목록 페이지의 상태 계산은 시작일 기반 (`getVipVersionStatus` 패턴 참고) |
| **이미지 필드 0개** | `ImageUploadField` 임포트/사용부 삭제. hook의 이미지 관련 state/handler 제거 |
| **이미지 필드 2개 이상** | `pcFileInputRef` / `mobileFileInputRef`처럼 접미어 붙여 각각 관리 (InviteFriend 예시 참고) |
| **데이터 모델 복잡 (탭·중첩 배열 등)** | Form hook에 `state` 통째로 관리 + `formStateToVersionData` / `versionDataToFormState` 변환 함수 (VipMembership 예시) |

---

## ⚠️ 절대 잊지 말 것

1. **회원 > 프로모션 부모 메뉴 하위에만 추가**. 다른 트리에 추가 요청은 재확인.
2. **MenuItemId 값 중복 금지** — 기존 값 확인 후 다음 번호 사용
3. **커밋은 사용자 명시 시에만** — 자동 커밋 금지
4. **shared 컴포넌트 수정 필요 시 반드시 사용자에게 알림** — 다른 도메인에 영향
5. **HTML로 저장하는 경우가 아닌 코드 파일은 반드시 Write/Edit로만 처리**, `sed`/`awk` 사용 금지
6. **타입체크 통과 확인** — 특히 `noUnusedLocals`/`noUnusedParameters` 걸리는 경우 많음
7. **패턴에서 벗어난 요청은 확인 후 진행** — 예: 회원이 아닌 다른 부모 메뉴, 완전히 새로운 데이터 저장 방식 등
8. **실제 도메인은 반드시 기획서 or 컬리몰 JSON 있어야 함** — 데이터 모델 필드를 임의로 만들지 말 것. 사용자가 "테스트/가상 도메인"이라 명시한 경우에만 첫구매 축약 형태(image + text + link) 기본값 허용.

---

## 🔗 참고

- 기존 도메인 코드 예시: `examples/reference.md`
- 도메인별 특수성 매트릭스: `examples/reference.md`의 표
- 프로젝트 배경: `../../.././docs` 또는 [Confluence 문서](https://kurly0521.atlassian.net/wiki/spaces/CMWD/pages/5918931769)
