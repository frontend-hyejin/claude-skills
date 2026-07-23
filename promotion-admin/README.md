# promotion-admin

LaCMS 어드민의 **회원 > 프로모션** 하위에 새 어드민 페이지를 스캐폴딩하는 Claude Code 스킬.

## 뭘 하는 스킬?

컬리몰의 정적 리소스 노출 페이지(첫구매·친구초대·(V)VIP 등)를 LaCMS 어드민에서 관리하기 위한 파일들을 일괄 생성합니다.

- **메뉴/라우팅 등록** (`constants.ts`, `path.ts`, `fixtures.ts`, `managerRest.ts`, `UserRouter.tsx`)
- **S3 경로 상수** (`pathConstant.ts`)
- **React Query 훅** — meta.json / version.json 조회
- **폼 상태·발행/수정 훅** — 검증·업로드·publish 흐름
- **페이지 4종** — List · Default(상시운영) · Create(신규 발행) · Detail(수정)

기존 4개 도메인(첫구매 / 친구초대 회원가입 / 친구초대 더블적립금 / (V)VIP)이 이 패턴으로 만들어졌습니다.

## 언제 트리거되나

- **슬래시 커맨드**: `/promotion-admin`
- **자연어**: "회원>프로모션 하위에 X 어드민 페이지 추가해줘" · "새 프로모션 어드민 만들어줘" 등

## 파일 구조

```
promotion-admin/
├── SKILL.md               # 스킬 지침 (Claude Code가 로드)
├── templates/             # 코드 스켈레톤 ({Domain} 등 placeholder 치환)
│   ├── pathConstant.snippet.ts
│   ├── menu-registration.md
│   ├── useDomainQuery.ts.template
│   ├── useDomainForm.ts.template
│   ├── DomainListPage.tsx.template
│   ├── DomainDefaultVersionPage.tsx.template
│   ├── DomainPromotionCreatePage.tsx.template
│   ├── DomainPromotionDetailPage.tsx.template
│   └── index.ts.template
└── examples/
    └── reference.md       # 기존 4개 도메인 비교 매트릭스
```

## 사용 흐름

1. 스킬 트리거 (`/promotion-admin` 또는 자연어)
2. 대화형으로 7개 항목 수집:
   1. 도메인 명칭 (한글/PascalCase/camelCase 등 6종 표기)
   2. 메뉴 등록 정보 (MenuItemId, sort)
   3. S3 리소스 경로 (`RESOURCE_PREFIX`)
   4. 노출 기간 정책 (시작+종료일 / 시작일만)
   5. 이미지 필드 개수
   6. **데이터 모델 필드** — 기획서 or 컬리몰이 소비 중인 JSON 필수. 없으면 스캐폴딩 중단 (테스트 모드 예외)
   7. 컬리몰 노출 JSON 포맷 확정
3. 파일 생성 (신규 7개) + 기존 파일 수정 (7개)
4. 타입체크 (`npx tsc --noEmit`)

## 대상 프로젝트

이 스킬은 [LaCMS 프런트엔드 레포](https://github.com/kurly-org/la-cms-front-react) 구조를 전제로 합니다.

- `src/app/memberPromotion/` 하위에 hooks/pages/constants 구조
- `src/shared/lib/menu/` 에 fixtures/constants/path 파일
- `src/app/user/UserRouter.tsx`가 회원 라우팅 담당

다른 프로젝트에는 그대로 맞지 않고, 유사 패턴이 있다면 `templates/` 파일들을 그에 맞게 수정해야 합니다.
