# 기존 프로모션 어드민 도메인 참조

새 도메인 스캐폴딩 시 이 표를 참고해서 어떤 패턴을 따를지 결정하세요.

## 도메인별 특수성 매트릭스

| 항목 | 첫구매 (WelcomeBenefit) | 친구초대 회원가입 (InviteFriendSignup) | 친구초대 더블적립금 (InviteFriend) | (V)VIP (VipMembership) |
|---|---|---|---|---|
| **MenuItemId** | 891001 | 891002 | 891003 | 891004 |
| **RESOURCE_PREFIX** | `welcome-benefit/general` | `welcome-benefit/friend` | `member-benefit/friend` | `member-benefit/vip` |
| **노출 기간** | 시작일 + 종료일 | 시작일 + 종료일 | 시작일 + 종료일 | 시작일만 |
| **이미지 필드** | 1개 (signupCouponImage) | 1개 (signupCouponImage) | 2개 (PC / 모바일) | 0개 |
| **데이터 모델** | 단순 (image + text + link) | 단순 (image + text + link) | 콘텐츠 + 공지 목록(현재 비노출) | 5개 영역 (head/selection/tiers/notice/…) |
| **컬리몰 노출 URL** | `/member/login`, `/member/signup/success` | `/member/signup/success` | `/events/member/friend` | `/events/member/vip` |

## 파일 위치 규칙

```
src/app/memberPromotion/
├── constants/
│   └── pathConstant.ts              [상수 5종 세트 × N개 도메인]
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

## 공통 재사용 요소

### 유틸
- `app/memberPromotion/utils/dateUtil.ts`
  - `formatDateToISO(date)` — Date → `YYYY-MM-DDTHH:mm:ss`
  - `getVersionFromDate(date)` — Date → `YYYYMMDD` (버전명)
  - `validatePromotionPeriod({ startDate, endDate })` — 빈값·시작≥종료 검증
- `app/memberPromotion/utils/uploadUtil.ts`
  - `uploadToS3({ file, path })` — 파일 서비스 API 호출
  - `createJsonFile(data, filename)` — JSON을 File 객체로

### 컴포넌트
- `app/memberPromotion/components/ImageUploadField.tsx`
  - `IMAGE_UPLOAD_GUIDE_REQUIRE_START_DATE` 상수 export
- `app/memberPromotion/components/PromotionLoadModal.tsx`
  - "기존 프로모션 불러오기" 모달. 신규 발행 시 콘텐츠 복사용

### 상태 유틸
- `app/memberPromotion/utils/versionUtil.ts`
  - `getVersionStatus(version, meta)` — `scheduled / active / expired`
  - `STATUS_LABEL` — Chip 라벨 · 색상 매핑
  - VIP처럼 종료일이 없는 케이스는 별도 `getVipVersionStatus` 인라인 구현 (List 페이지 안)

### 메뉴 트리 위치
- `MenuGroupId.회원` 하위 → `MenuItemId.회원_프로모션 (891000)` 부모 → 각 도메인 서브메뉴
- 파일: `src/shared/lib/menu/fixtures/fixtures.ts`, `src/shared/rest/__mocks__/managerRest.ts`

## 정책 참고

- **JSON 본문 `id` 필드**는 `${RESOURCE_PREFIX}/{버전}.json` (또는 `meta.json`) 형식으로 유지 — 컬리몰 노출 데이터 포맷 호환
- **버전명**은 시작일 기반 `YYYYMMDD` (예: `20260701`). 상시운영은 `default`
- **환경별 S3 도메인**은 `.env.{env}`의 `VITE_REACT_APP_PUBLIC_RES_S3`로 통일
  - dev: `https://res-dev.kurly.com`
  - stg: `https://res-stg.kurly.com`
  - prod: `https://res.kurly.com`

## 과거 결함 사례 (같은 실수 방지)

| 이슈 | 어디서 발생 | 어떻게 해결 |
|---|---|---|
| KQA-31925 | 프로모션 기간 검증 부재 → invalid 데이터 저장 | `validatePromotionPeriod` 신규 유틸 추가 |
| KQA-31925 | DatePicker input clear 시 state 불일치 | shared `DatePicker.handleChange` 수정 |
| XPD1-601 | 시즌 안내 표 파싱 오류 (thead 흡수) | `parseNoticeTable`에서 tbody만 매칭 |
| XPD1-601 | DatePicker 모달 재오픈 시 이전 selection 잔재 | `DatePickerModal`에 `useEffect`로 defaultDate 동기화 |

새 도메인 개발 시 동일한 함정에 빠지지 않도록 위 4개 fix가 이미 반영된 상태인지 확인.
