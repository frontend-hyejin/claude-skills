# 기존 정적 리소스 어드민 도메인 참조

새 도메인 스캐폴딩 시 이 표를 참고해서 어떤 패턴을 따를지 결정하세요.

## 도메인별 특수성 매트릭스

| 항목 | 첫구매 (WelcomeBenefit) | 친구초대 회원가입 (InviteFriendSignup) | 친구초대 더블적립금 (InviteFriend) | (V)VIP (VipMembership) | 컬리나우 배너관리 (NowMainBanner) |
|---|---|---|---|---|---|
| **패턴** | 버전형 | 버전형 | 버전형 | 버전형 | **목록형** |
| **메뉴 위치** | 회원 > 프로모션 | 회원 > 프로모션 | 회원 > 프로모션 | 회원 > 프로모션 | 프로모션 (대분류 바로 아래) |
| **MenuItemId** | 891001 | 891002 | 891003 | 891004 | 588000 |
| **RoutePrefix / Router** | 회원 / UserRouter | 회원 / UserRouter | 회원 / UserRouter | 회원 / UserRouter | 프로모션 / PromotionRouter |
| **디렉터리** | `app/memberPromotion` | `app/memberPromotion` | `app/memberPromotion` | `app/memberPromotion` | `app/nowMainBanner` (전용) |
| **S3 경로** | prefix `welcome-benefit/general` | prefix `welcome-benefit/friend` | prefix `member-benefit/friend` | prefix `member-benefit/vip` | `json/now-main-banners/nowMainBanners{_dev}.json` |
| **환경별 파일명** | 없음 (버킷만 다름) | 없음 | 없음 | 없음 | 운영 `nowMainBanners.json` / 그 외 `_dev` ⚠️ 따라 하지 말 것 (버킷이 이미 환경별이라 불필요) |
| **노출 기간** | 시작일 + 종료일 | 시작일 + 종료일 | 시작일 + 종료일 | 시작일만 | 항목별 시작+종료 + 상시(2099-12-31) 체크박스 |
| **이미지 필드** | 1개 (signupCouponImage) | 1개 (signupCouponImage) | 2개 (PC / 모바일) | 0개 | 1개 (png/jpg/jpeg, 640×240, 350KB) |
| **데이터 모델** | 단순 (image + text + link) | 단순 (image + text + link) | 콘텐츠 + 공지 목록(현재 비노출) | 5개 영역 (head/selection/tiers/notice/…) | `{ id, imageUrl, link, name, startDate, endDate }[]` |
| **목록 운영** | 버전 테이블 | 버전 테이블 | 버전 테이블 | 버전 테이블 | 최대 50개 · 순서 이동 · 선택 삭제 · 기준일시/상태 필터 |
| **소비 측 노출 URL** | `/member/login`, `/member/signup/success` | `/member/signup/success` | `/events/member/friend` | `/events/member/vip` | 컬리나우 메인 |
| **생성 PR** | — | — | — | — | #7068 (KCW-5467) |

## 파일 위치 규칙

### 버전형 (회원>프로모션 안)

```
src/app/memberPromotion/
├── constants/
│   └── pathConstant.ts              [RES_WEB_BASE + 상수 5종 세트 × N개 도메인]
├── components/                      [ImageUploadField · PromotionLoadModal — 다른 디렉터리에서도 import]
├── utils/                           [dateUtil · uploadUtil · versionUtil — 다른 디렉터리에서도 import]
├── hooks/
│   ├── use{Domain}Query.ts          [타입 정의 + meta/version 조회]
│   └── use{Domain}Form.ts           [상태 · 검증 · 발행/수정 로직]
└── pages/
    ├── index.ts                     [export * as {Domain} from './...']
    └── {domain}/
        ├── index.ts                 [List/Default/Create/Detail export]
        ├── {Domain}PromotionListPage.tsx
        ├── {Domain}DefaultVersionPage.tsx
        ├── {Domain}PromotionCreatePage.tsx
        └── {Domain}PromotionDetailPage.tsx
```

### 목록형 (전용 디렉터리)

```
src/app/nowMainBanner/
├── constants/
│   ├── pathConstant.ts              [FILE_NAME · RESOURCE_ID · IMAGE_BASE · JSON_PATH · RES_WEB_*_PATH]
│   └── bannerPolicy.ts              [최대 개수 · 안내 문구 · 이미지 정책 · 상시 라벨]
├── data/                            [전시 카테고리 category-v2 구조]
│   ├── types/nowMainBanner.ts       [NowMainBanner · NowMainBannerData]
│   ├── api/                         [getNowMainBanners · postNowMainBannerImage · putNowMainBanners]
│   └── hooks/                       [queryKeys · useGet… · usePost…Image · usePut…]
├── utils/bannerUtil.ts              [getBannerStatus · formatDateToKST · getNextBannerId · insertBannerAtPosition · isAllowedBannerLink]
├── hooks/
│   ├── useNowMainBannerForm.ts      [등록/수정 공용]
│   ├── useNowMainBannerList.ts      [순서 변경 · 삭제]
│   ├── useNowMainBannerFilter.ts    [기준일시 · 상태]
│   └── useNowMainBannerSelection.ts [체크박스]
├── components/DeleteConfirmModal.tsx
└── pages/
    ├── index.ts                     [named export 2개]
    ├── NowMainBannerListPage.tsx
    └── NowMainBannerFormPage.tsx    [isEditMode prop]
```

## 공통 재사용 요소 (모두 `app/memberPromotion/` 에 있음 — 전용 디렉터리에서도 그대로 import)

### 상수
- `app/memberPromotion/constants/pathConstant.ts`
  - `RES_S3_DOMAIN` — `.env.{env}`의 `VITE_REACT_APP_PUBLIC_RES_S3` (dev: res-dev / stg·perf: res-stg / prod: res.kurly.com)
  - `RES_WEB_BASE` — `${RES_S3_DOMAIN}/web`. 모든 도메인의 조회/업로드 기준 경로

### 유틸
- `app/memberPromotion/utils/dateUtil.ts`
  - `formatDateToISO(date)` — Date → `YYYY-MM-DDTHH:mm:ss` (버전형 meta 저장용, 타임존 없음)
  - `getVersionFromDate(date)` — Date → `YYYYMMDD` (버전명)
  - `validatePromotionPeriod({ startDate, endDate })` — 빈값·시작≥종료 검증. 목록형도 사용
- `app/memberPromotion/utils/uploadUtil.ts`
  - `uploadToS3({ file, path })` — 파일 서비스 API(`web-static` / `RES`). `/web/images/` 하위는 CDN 캐시 자동 퍼지
  - `createJsonFile(data, filename)` — JSON을 File 객체로
- `app/memberPromotion/utils/versionUtil.ts`
  - `getVersionStatus(version, meta)` — `scheduled / active / expired` (버전형)
  - `VersionStatus` 타입 · `STATUS_LABEL` — Chip 라벨·색상. 목록형은 타입과 라벨만 재사용하고 상태 계산은 자체 `getBannerStatus(item, baseDate)`
  - VIP처럼 종료일이 없는 케이스는 별도 `getVipVersionStatus` 인라인 구현 (List 페이지 안)

### 컴포넌트
- `app/memberPromotion/components/ImageUploadField.tsx`
  - `IMAGE_UPLOAD_GUIDE_REQUIRE_START_DATE` (버전형: 시작일 먼저) · `IMAGE_UPLOAD_REQUIRED_GUIDE` (업로드 버튼 안내)
  - `showUploadHint` prop — 파일만 고르고 업로드 안 했을 때 노란 안내 박스
- `app/memberPromotion/components/PromotionLoadModal.tsx` — "기존 프로모션 불러오기" (버전형 Create 전용)

### shared
- `shared/components/ConfirmDialogProvider` → `useConfirmDialogActions().openConfirm` — 목록형 폼 이탈 확인
- `shared/providers/ModalProvider` → `useModal()` — 모달 결과를 Promise 로 받음
- `shared/utils/removeWhitespace` — 링크 입력 공백 제거

## 메뉴 트리 · 라우터 위치

| 위치 | fixtures.ts / managerRest.ts | path.ts | Router |
|---|---|---|---|
| 회원 > 프로모션 > … | `MenuGroupId.회원` → `MenuItemId.회원_프로모션 (891000)` 의 `subMenus` | `RoutePrefix.회원` + `/promotion/{kebab}` | `app/user/UserRouter.tsx` |
| 프로모션 > … | `MenuGroupId.프로모션` 의 `menus` 끝 | `RoutePrefix.프로모션` + `/{kebab}` | `app/promotion/PromotionRouter.tsx` |
| 그 외 | `MenuGroupId.{Group}` 의 `menus` 또는 부모 `subMenus` | 형제 메뉴의 prefix 확인 | `shared/layout/MainApp.tsx` routerMap에서 `[RoutePrefix.X]` 로 찾기 |

- `fixtures.ts`와 `managerRest.ts`의 sort 번호는 서로 다름 (컬리나우 배너관리: fixtures 17 / managerRest 23). 각 파일에서 따로 마지막 + 1.
- 실제 메뉴 노출은 서버(manager API) 권한 데이터 기준. fixtures/managerRest 는 로컬·테스트용 mock 이므로 운영 반영 시 메뉴 등록 요청이 별도로 필요할 수 있음 (사용자에게 확인).

## 정책 참고

- **JSON 본문 `id` 필드** — 버전형 `${RESOURCE_PREFIX}/{버전}.json` (또는 `meta.json`), 목록형 `{resource-dir}/{fileName}.json`. 소비 측 포맷 호환용
- **버전명**은 시작일 기반 `YYYYMMDD` (예: `20260701`). 상시운영은 `default`
- **목록형 id**는 목록 내 최대값 + 1 채번. 삭제해도 재사용하지 않음(최대값 기준이므로 중간 번호는 비어 있을 수 있음)
- **목록형 날짜**는 KST 오프셋 포함 ISO8601 (`2026-07-01T00:00:00+09:00`). 버전형은 오프셋 없음. 소비 측 포맷을 따를 것
- **목록형 저장은 배열 전체 덮어쓰기** → 저장 직전 `refetch` 필수
- **삭제는 파일 삭제가 아님** — 두 패턴 모두 파일 서비스 호출은 `POST /file-service/v2/file` 업로드 하나뿐. 목록형 삭제·순서 변경은 JSON 재업로드, 버전형도 meta.json 갱신뿐. 버킷의 실제 파일은 삭제되지 않고 그대로 남음 (PROD 버킷 내 파일 삭제는 권한 불가)
- **환경별 S3 도메인**은 `.env.{env}`의 `VITE_REACT_APP_PUBLIC_RES_S3`로 통일. 파일명에 환경 접미어(`_dev`)를 붙이지 않음 — 컬리나우 배너관리의 `_dev` 분기는 불필요한 구현이므로 새 도메인에서는 사용 금지

## 과거 결함·리뷰 사례 (같은 실수 방지)

| 이슈 | 어디서 발생 | 어떻게 해결 |
|---|---|---|
| KQA-31925 | 프로모션 기간 검증 부재 → invalid 데이터 저장 | `validatePromotionPeriod` 신규 유틸 추가 |
| KQA-31925 | DatePicker input clear 시 state 불일치 | shared `DatePicker.handleChange` 수정 |
| XPD1-601 | 시즌 안내 표 파싱 오류 (thead 흡수) | `parseNoticeTable`에서 tbody만 매칭 |
| XPD1-601 | DatePicker 모달 재오픈 시 이전 selection 잔재 | `DatePickerModal`에 `useEffect`로 defaultDate 동기화 |
| PR #7068 리뷰 | 링크를 `a[href]`로 렌더링 → `javascript:` 스킴 실행 가능 | `isAllowedBannerLink`로 입력·표시 양쪽 검증, 공백 제거, 필드 에러 표시 |
| PR #7068 리뷰 | 수정 모드 URL 파라미터가 숫자가 아니면 `NaN`이 경로·id에 섞임 | `parseBannerId` → 정수 아니면 `undefined` 처리 |
| PR #7068 리뷰 | 등록 모드 id가 목록 갱신 시 바뀌어 이미지 경로와 저장 id 불일치 | 최초 로드 시 `newBannerId` state로 고정, 확정 전 업로드 비활성화 |
| PR #7068 리뷰 | 배열 전체 덮어쓰기로 다른 담당자 변경 유실 가능 | 저장 직전 `refetch` 후 최신 목록 위에 적용 + 최대 개수 재확인 |

새 도메인 개발 시 동일한 함정에 빠지지 않도록 위 fix 들이 템플릿에 반영된 상태인지 확인.
