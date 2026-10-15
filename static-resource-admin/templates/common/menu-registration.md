# 메뉴/라우팅 등록 가이드 (공통)

새 도메인을 LaCMS 메뉴 트리에 등록하려면 아래 5개 파일을 수정합니다. 메뉴 위치는 **어느 대분류/부모든 가능**합니다.

**치환 규칙:**
- `{Domain}` = PascalCase (예: `VipMembership`, `NowMainBanner`)
- `{domain}` = camelCase 디렉터리 (예: `nowMainBanner`)
- `{DOMAIN_SNAKE}` = SNAKE_CASE (예: `VIP_MEMBERSHIP`, `NOW_MAIN_BANNER`)
- `{도메인_한글}` = MenuItemId enum 키 (예: `VIP_제도_안내`, `컬리나우_배너_관리`)
- `{한글 라벨}` = 메뉴 노출 문자열 (예: `(V)VIP 제도 안내`, `컬리나우 배너관리`)
- `{domain-kebab}` = URL kebab-case (예: `vip-membership`, `now-main-banner`)
- `{Group}` = `MenuGroupId` 키 (예: `회원`, `프로모션`)
- `{Prefix}` = `RoutePrefix` 키 (예: `회원`, `프로모션`)
- `{Router}` = 라우터 파일 (예: `app/user/UserRouter.tsx`, `app/promotion/PromotionRouter.tsx`)
- `{itemId}` = 다음 MenuItemId 번호
- `{sort}` = 추가 위치의 마지막 sort + 1 (**fixtures.ts와 managerRest.ts 각각 따로 계산**)

---

## 0. 메뉴 위치 찾기 (코드 생성 전 확정)

1. **대분류** — `src/shared/lib/menu/constants.ts`의 `MenuGroupId` enum에서 고른다.
2. **부모** — 두 가지 중 하나
   - (a) 대분류 바로 아래: `fixtures.ts`에서 `menuGroupId: MenuGroupId.{Group}` 블록의 `menus` 배열 끝에 추가 (컬리나우 배너관리 방식)
   - (b) 기존 메뉴 하위: 그 메뉴 객체의 `subMenus` 배열 끝에 추가 (회원>프로모션 방식. 부모 메뉴에 `subMenus`가 없으면 새로 만들지 말고 사용자 확인)
3. **RoutePrefix** — `src/shared/lib/menu/path.ts`의 `RoutePrefix` enum. 대분류와 1:1이 아니므로 형제 메뉴의 PATH가 어떤 prefix를 쓰는지 확인.
4. **Router 파일** — `src/shared/layout/MainApp.tsx`의 routerMap에서 `[RoutePrefix.{Prefix}]: XRouter` 를 찾고 lazy import 경로를 따라간다. (예: `회원 → app/user/UserRouter`, `프로모션 → app/promotion/PromotionRouter`)
   - routerMap에 없는 prefix는 `src/pages/Route.tsx`에 직접 Route가 있을 수 있음. 그래도 없으면 사용자 확인.
5. **MenuItemId 번호대** — 같은 부모 아래 형제들의 번호를 보고 규칙을 따른다.
   - 회원>프로모션 subMenus: `891001, 891002, …` → 다음 `+1`
   - 프로모션 대분류 menus: `581000, 582000, … 588000` → 다음 `+1000`
   - 규칙이 보이지 않으면 사용자 확인

---

## 1. `src/shared/lib/menu/constants.ts`

`MenuRoleName` enum에 추가 (같은 대분류 role들 뒤에 append):
```ts
{Domain} = '{DOMAIN_SNAKE}', // {한글 라벨}
```
> 회원>프로모션 하위 버전형은 기존 관례대로 `{Domain}Promotion = '{DOMAIN_SNAKE}_PROMOTION'`

`MenuItemId` enum에 추가 (형제 id 뒤에):
```ts
{도메인_한글} = {itemId},
```

---

## 2. `src/shared/lib/menu/path.ts`

`PATH` 객체에 라우트 추가 (형제 PATH 뒤에). 주석으로 한글 라벨 표기.

**버전형 (4개):**
```ts
// {한글 라벨}
{DOMAIN_SNAKE}_PROMOTION: `/${RoutePrefix.{Prefix}}/promotion/{domain-kebab}`,
{DOMAIN_SNAKE}_PROMOTION_DEFAULT: `/${RoutePrefix.{Prefix}}/promotion/{domain-kebab}/default`,
{DOMAIN_SNAKE}_PROMOTION_CREATE: `/${RoutePrefix.{Prefix}}/promotion/{domain-kebab}/create`,
{DOMAIN_SNAKE}_PROMOTION_DETAIL: `/${RoutePrefix.{Prefix}}/promotion/{domain-kebab}/:version`,
```
> 회원>프로모션이 아닌 곳에 버전형을 만들면 `/promotion/` 중간 세그먼트와 `_PROMOTION` 접미어는 빼고 `{DOMAIN_SNAKE}`, `{DOMAIN_SNAKE}_DEFAULT` … 로.

**목록형 (3개):**
```ts
// {한글 라벨}
{DOMAIN_SNAKE}: `/${RoutePrefix.{Prefix}}/{domain-kebab}`,
{DOMAIN_SNAKE}_CREATE: `/${RoutePrefix.{Prefix}}/{domain-kebab}/create`,
{DOMAIN_SNAKE}_EDIT: `/${RoutePrefix.{Prefix}}/{domain-kebab}/:id`,
```

`pathForMenuItem` 매핑에 추가 (형제 매핑 뒤에):
```ts
[MenuItemId.{도메인_한글}]: PATH.{DOMAIN_SNAKE}{_PROMOTION},
```

---

## 3. `src/shared/lib/menu/fixtures/fixtures.ts`

0단계에서 정한 위치(대분류 `menus` 또는 부모 `subMenus`)의 배열 끝에 추가:
```ts
{
  menuId: MenuItemId.{도메인_한글},
  menuName: '{한글 라벨}',
  roleName: MenuRoleName.{Domain},
  menuGroupId: MenuGroupId.{Group},
  sort: {sort},
  operation: ['{DOMAIN_SNAKE}_VIEW'],
},
```

---

## 4. `src/shared/rest/__mocks__/managerRest.ts`

fixtures.ts와 동일한 위치에 동일한 오브젝트 추가. **sort는 이 파일 기준으로 다시 계산** (fixtures와 번호가 다름. 예: 컬리나우 배너관리는 fixtures `17`, managerRest `23`).

---

## 5. `{Router}.tsx`

import 추가:
```ts
// 버전형 (memberPromotion 안) — 기존 import에 {Domain} 추가
import { WelcomeBenefit, InviteFriendSignup, InviteFriend, VipMembership, {Domain} } from 'app/memberPromotion/pages';

// 목록형 / 전용 디렉터리
import { {Domain}FormPage, {Domain}ListPage } from 'app/{domain}/pages';
```

`<Switch>` 안 형제 라우트 뒤에 추가:

**버전형:**
```tsx
{/* {한글 라벨} */}
<Route exact path={PATH.{DOMAIN_SNAKE}_PROMOTION}>
  <{Domain}.List />
</Route>
<Route exact path={PATH.{DOMAIN_SNAKE}_PROMOTION_DEFAULT}>
  <{Domain}.Default />
</Route>
<Route exact path={PATH.{DOMAIN_SNAKE}_PROMOTION_CREATE}>
  <{Domain}.Create />
</Route>
<Route exact path={PATH.{DOMAIN_SNAKE}_PROMOTION_DETAIL}>
  <{Domain}.Detail />
</Route>
```

**목록형:**
```tsx
{/* {한글 라벨} */}
<Route exact path={PATH.{DOMAIN_SNAKE}}>
  <{Domain}ListPage />
</Route>
<Route exact path={PATH.{DOMAIN_SNAKE}_CREATE}>
  <{Domain}FormPage />
</Route>
<Route exact path={PATH.{DOMAIN_SNAKE}_EDIT}>
  <{Domain}FormPage isEditMode />
</Route>
```
> `_EDIT`(`:id`)는 `_CREATE` 뒤에 둬야 `/create`가 `:id`로 잡히지 않음 (`exact`라도 순서 유지 권장).

---

## 6. 페이지 barrel

**버전형 (memberPromotion 안)** — `src/app/memberPromotion/pages/index.ts`:
```ts
export * as {Domain} from './{domain}';
```

**목록형 / 전용 디렉터리** — `src/app/{domain}/pages/index.ts`:
```ts
export { default as {Domain}ListPage } from './{Domain}ListPage';
export { default as {Domain}FormPage } from './{Domain}FormPage';
```
