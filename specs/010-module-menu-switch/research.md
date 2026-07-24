# Research: Module Menu Switch

## Decision: Add modules as persistent menu grouping

**Decision**: Add a `system_modules` table and associate every menu row with one module.

**Rationale**: Modules must be manageable and visible through the same database-backed menu system. A persisted module table avoids hard-coding business domains in frontend routes.

**Alternatives considered**:

- Use top-level menu directories as modules: rejected because system directories and business modules have different lifecycle and UI placement.
- Frontend-only module map: rejected because menu management and role authorization would not share the same source of truth.

## Decision: Keep permissions menu/button based

**Decision**: Modules do not get a separate user-visible permission binding model in this feature. A user can see a module when they have at least one enabled authorized directory/page menu under it.

**Rationale**: This preserves the existing role-menu binding model and avoids a second permission source.

## Decision: Default module is `系统设置`

**Decision**: Seed `module-system` with code `system` and name `系统设置`; existing menus migrate to that module.

**Rationale**: This is the least disruptive migration and gives all existing system/admin/template menus a home.

## Decision: Frontend stores current module locally

**Decision**: The selected module code/id is stored in browser local storage and validated against `currentUser.modules` at runtime.

**Rationale**: This gives refresh persistence without adding backend user preference tables.
