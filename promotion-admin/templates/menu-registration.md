# 메뉴/라우팅 등록 가이드

새 도메인을 회원 > 프로모션 하위에 등록하려면 아래 5개 파일을 수정합니다.

**치환 규칙:**
- `{Domain}` = PascalCase (예: `VipMembership`)
- `{DOMAIN_SNAKE}` = SNAKE_CASE (예: `VIP_MEMBERSHIP`)
- `{도메인_한글}` = MenuItemId enum 키 (예: `VIP_제도_안내`)
- `{한글 라벨}` = 메뉴 노출 문자열 (예: `(V)VIP 제도 안내`)
- `{domain-kebab}` = URL kebab-case (예: `vip-membership`)
- `{itemId}` = 다음 MenuItemId 번호 (예: 891005)
- `{sort}` = 회원>프로모션 subMenus 마지막 sort + 1

---

## 1. `src/shared/lib/menu/constants.ts`

`MenuRoleName` enum에 추가 (다른 프로모션 role 뒤에 append):
```ts
{Domain}Promotion = '{DOMAIN_SNAKE}_PROMOTION',
```

`MenuItemId` enum에 추가 (기존 프로모션 subMenu id 뒤에):
```ts
{도메인_한글} = {itemId},
```

---

## 2. `src/shared/lib/menu/path.ts`

`PATH` 객체에 라우트 4개 추가 (다른 프로모션 PATH 뒤에):
```ts
// {한글 라벨}
{DOMAIN_SNAKE}_PROMOTION: `/${RoutePrefix.회원}/promotion/{domain-kebab}`,
{DOMAIN_SNAKE}_PROMOTION_DEFAULT: `/${RoutePrefix.회원}/promotion/{domain-kebab}/default`,
{DOMAIN_SNAKE}_PROMOTION_CREATE: `/${RoutePrefix.회원}/promotion/{domain-kebab}/create`,
{DOMAIN_SNAKE}_PROMOTION_DETAIL: `/${RoutePrefix.회원}/promotion/{domain-kebab}/:version`,
```

`pathForMenuItem` 매핑에 추가:
```ts
[MenuItemId.{도메인_한글}]: PATH.{DOMAIN_SNAKE}_PROMOTION,
```

---

## 3. `src/shared/lib/menu/fixtures/fixtures.ts`

`MenuItemId.회원_프로모션`의 `subMenus` 배열에 추가 (마지막 항목 뒤):
```ts
{
  menuId: MenuItemId.{도메인_한글},
  menuName: '{한글 라벨}',
  roleName: MenuRoleName.{Domain}Promotion,
  menuGroupId: MenuGroupId.회원,
  sort: {sort},
  operation: ['{DOMAIN_SNAKE}_PROMOTION_VIEW'],
},
```

---

## 4. `src/shared/rest/__mocks__/managerRest.ts`

fixtures.ts와 동일한 위치(회원>프로모션 subMenus)에 동일한 오브젝트 추가.

---

## 5. `src/app/user/UserRouter.tsx`

import 문에 `{Domain}` 추가:
```ts
import { WelcomeBenefit, InviteFriendSignup, InviteFriend, VipMembership, {Domain} } from 'app/memberPromotion/pages';
```

`<Switch>` 안에 다른 프로모션 라우트 뒤에 추가:
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

---

## 6. `src/app/memberPromotion/pages/index.ts`

barrel export 추가:
```ts
export * as {Domain} from './{domain}';
```
