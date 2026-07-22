# Frontend Auth Contract

## Existing Ant Design Pro Entry Points

The implementation should reuse the current Ant Design Pro auth surfaces:

- `web/src/pages/user/login/index.tsx`
- `web/src/app.tsx`
- `web/src/access.ts`
- `web/src/requestErrorConfig.ts`
- `web/src/services/ant-design-pro/api.ts`
- `web/src/services/ant-design-pro/typings.d.ts`

## Login Behavior

- The login page submits account credentials through `login()`.
- A successful login response has `status: "ok"`.
- The returned token is persisted through the planned browser auth-state helper.
- After login, the page calls `fetchUserInfo()` and redirects to the safe
  redirect target or the admin home page.
- Failed login keeps the user on the login page and shows the existing failure
  UI.

## Current User Behavior

- `getInitialState()` calls `currentUser()` for non-login pages.
- A successful current-user response returns `{ data: CurrentUser }`.
- `CurrentUser.access` continues to drive `access.canAdmin`.
- `CurrentUser.menuPermissions` is stored for later menu expansion, but this
  first feature only requires menu-level admin visibility.
- After `specs/005-system-role-management`, `CurrentUser.buttonPermissions` is
  available for page action access, and role/menu/button permission values are
  resolved from database role bindings.

## Request Behavior

- Protected requests include `Authorization: Bearer <token>`.
- A 401 response clears local auth state and redirects to `/user/login`.
- Network/backend unavailability shows a clear Ant Design message and does not
  leave stale authenticated state.

## Menu Behavior

- Admin-only routes continue using `access: "canAdmin"`.
- Users with `access: "admin"` can see admin-only menu entries.
- Users with `access: "user"` cannot see admin-only menu entries.

## Out Of Scope

- Dynamic backend-driven route generation.
- User management CRUD UI.
- Replacing Ant Design Pro layout or login UI.
