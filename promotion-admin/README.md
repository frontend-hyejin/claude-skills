# promotion-admin

LaCMS 어드민의 **회원 > 프로모션** 하위에 새 어드민 페이지를 스캐폴딩하는 Claude Code 스킬입니다.

## 사용 용도

컬리몰의 정적 리소스 노출 페이지(첫구매·친구초대·(V)VIP 등)를 LaCMS 어드민에서 관리하기 위한 파일들을 표준 패턴에 따라 일괄 생성합니다.

- **메뉴/라우팅 등록** — `constants.ts`, `path.ts`, `fixtures.ts`, `managerRest.ts`, `UserRouter.tsx`
- **S3 경로 상수** — `pathConstant.ts`
- **React Query 훅** — meta.json / 버전별 JSON 조회
- **폼 상태·발행/수정 훅** — 입력 검증 · 이미지 업로드 · 발행(publish) 흐름
- **페이지 4종** — 목록(List) · 상시운영(Default) · 신규 발행(Create) · 상세/수정(Detail)

기존 4개 도메인(첫구매 / 친구초대 회원가입 / 친구초대 더블적립금 / (V)VIP 제도 안내)이 이 패턴으로 개발되었습니다.

## 트리거 방법

- **슬래시 커맨드**: `/promotion-admin`
- **자연어**: "회원>프로모션 하위에 X 어드민 페이지 추가해줘", "새 프로모션 어드민 만들어줘" 등

## 파일 구조

```
promotion-admin/
├── SKILL.md               # 스킬 지침 (Claude Code가 로드)
├── templates/             # 코드 스켈레톤 ({Domain} 등 placeholder 치환 후 사용)
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
    └── reference.md       # 기존 4개 도메인 비교 매트릭스 · 공통 유틸 · 과거 결함 사례
```

## 사용 흐름

1. 스킬 트리거 (`/promotion-admin` 또는 자연어)
2. 대화형으로 7개 항목 수집
   1. 도메인 명칭 — 한글 라벨/PascalCase/camelCase/kebab-case/SNAKE_CASE/한글 스네이크 6종 표기
   2. 메뉴 등록 정보 — MenuItemId 번호, MenuRoleName, sort 값
   3. S3 리소스 경로 — `RESOURCE_PREFIX`
   4. 노출 기간 정책 — 시작일+종료일 / 시작일만
   5. 이미지 필드 개수 — 0 / 1 / 2 / 그 외
   6. **데이터 모델 필드** — 기획서 또는 컬리몰이 소비 중인 JSON이 필수입니다. 둘 다 없으면 스캐폴딩을 중단합니다 (테스트 목적임을 명시한 경우만 예외)
   7. 컬리몰 노출 JSON 포맷 확정
3. 파일 생성 — 신규 7개 생성 + 기존 7개 수정
4. 타입체크 — `npx tsc --noEmit`
5. 커밋은 자동으로 하지 않으며, 사용자 확인 후 진행합니다

## 대상 프로젝트

이 스킬은 LaCMS 프런트엔드 레포(`la-cms-front-react`) 구조를 전제로 합니다.

- `src/app/memberPromotion/` 하위에 hooks / pages / constants 구조
- `src/shared/lib/menu/`에 fixtures / constants / path 파일
- `src/app/user/UserRouter.tsx`가 회원 메뉴 라우팅 담당

다른 프로젝트에는 그대로 적용되지 않으며, 유사한 패턴이 있다면 `templates/` 파일들을 해당 구조에 맞게 수정해야 합니다.
