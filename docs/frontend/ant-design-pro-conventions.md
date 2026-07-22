# Ant Design Pro Frontend Conventions

This project uses Ant Design Pro as the admin frontend foundation. Frontend work
MUST follow the existing Ant Design Pro v6 stack and avoid creating a parallel UI
system.

## Scope

Use this guide when a feature touches `web/`, including pages, routes, menus,
permissions, request adapters, forms, tables, dashboards, layout, theme, tests,
or generated OpenAPI clients.

## Baseline Stack

The current `web/` package is based on:

- React 19.
- `@umijs/max` 4.
- `antd` 6.
- `@ant-design/pro-components` 3.
- `@tanstack/react-query` for query/cache workflows.
- `dayjs` for date/time handling.
- Biome for lint/format checks.
- Tailwind CSS, `antd-style`, CSS Modules, and Ant Design CSS variables for
  styling.

Do not add legacy Ant Design Pro v5 assumptions such as importing from `umi`,
using separate `@ant-design/pro-table` packages, relying on Less as the primary
style layer, or introducing `moment`.

## Component Rules

- Prefer Ant Design and `@ant-design/pro-components` before writing custom UI.
- Use `ProTable` for admin list/query/table pages unless the interaction is not
  table-like.
- Use `ProForm`, `ModalForm`, `DrawerForm`, `StepsForm`, and related
  ProComponents for CRUD forms and search forms.
- Use Pro layout, route, menu, access, and initial state conventions already in
  Ant Design Pro before creating custom navigation or permission plumbing.
- Use Ant Design icons from `@ant-design/icons` when an official icon exists.
- Use ProComponents value types, columns, request hooks, and toolbar patterns for
  dense admin pages.
- Reuse existing project components and style tokens before adding a local
  component abstraction.

Custom components are allowed only when:

- Official components cannot express the required interaction clearly.
- The component is reused by more than one page, or the feature plan explains why
  a one-off component is necessary.
- The component keeps Ant Design visual language, spacing, density, validation,
  empty states, and loading states.

## Page And UX Rules

- Admin pages should be work-focused, dense, and scannable. Avoid marketing-style
  hero sections, decorative cards, or visual-only content.
- Page state MUST cover loading, empty, error, disabled, permission-denied, and
  success states when applicable.
- Forms MUST define validation messages, submit loading, cancel behavior, and
  reset behavior.
- Tables MUST define row identity, pagination, sorting/filtering behavior, empty
  state, and destructive action confirmation.
- Do not place cards inside cards. Use cards only for repeated items, modals, or
  genuinely framed tools.
- Text and buttons MUST fit on desktop and mobile viewports supported by the
  feature. Avoid negative letter spacing and viewport-width font scaling.

## Data And API Rules

- The frontend request shape MUST follow the feature contract. Do not invent
  fields not present in `specs/[feature]/contracts/` or generated OpenAPI output.
- Prefer the existing Ant Design Pro request layer and generated API client flow.
- New backend API dependencies MUST be planned with Kratos contracts first.
- Keep mock-only behavior separate from real integration behavior. A feature is
  not complete when it only works against mocks unless the spec explicitly says
  so.
- Permission and menu behavior MUST be handled through the Ant Design Pro access,
  initial state, route, and menu conventions unless the plan documents a better
  alternative.

## Styling Rules

- Prefer Ant Design tokens, `antd-style`, CSS Modules, and Tailwind utilities
  already used by Ant Design Pro v6.
- Avoid global CSS unless the change is truly global and documented.
- Do not introduce a new visual theme without a feature spec and plan decision.
- Use the default Ant Design Pro density and component rhythm for management
  screens.

## Verification

Frontend tasks SHOULD name the relevant checks:

```powershell
cd web
npm run lint
npm run test
npm run build
```

Use focused checks when the feature is small. Use `npm run build` before
shipping route, layout, generated API, or dependency changes.

## Official References

- Ant Design Pro releases: https://github.com/ant-design/ant-design-pro/releases
- ProComponents docs: https://procomponents.ant.design/
- Ant Design docs: https://ant.design/
- Umi Max docs: https://umijs.org/docs/max/introduce
