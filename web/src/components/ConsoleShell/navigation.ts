import routes from '../../../config/routes';

export type ConsolePage = {
  moduleId: string;
  path: string;
  name: string;
  parents: string[];
  permissionCode: string;
};

export type ConsoleModule = {
  id: string;
  name: string;
  icon?: string;
  pages: ConsolePage[];
};

type StaticRoute = {
  path?: string;
  permissionCode?: string;
  component?: string;
  routes?: StaticRoute[];
};

const recentPrefix = 'go-ant-design-pro-admin:console-recent:';
const recentLimit = 8;

const routeByPermission = new Map<string, StaticRoute>();
const routeByPath = new Map<string, StaticRoute>();

function indexRoutes(items: readonly StaticRoute[]) {
  for (const route of items) {
    if (route.component && route.path) {
      routeByPath.set(route.path, route);
      if (route.permissionCode) routeByPermission.set(route.permissionCode, route);
    }
    if (route.routes) indexRoutes(route.routes);
  }
}

indexRoutes(routes as readonly StaticRoute[]);

export function getConsoleModules(user?: API.CurrentUser): ConsoleModule[] {
  if (!user) return [];
  const modules = (user.modules || [])
    .filter((module) => module.id && module.status !== 'DISABLED' && !module.hidden)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const result = new Map<string, ConsoleModule>();
  for (const module of modules) {
    const id = module.id as string;
    result.set(id, {
      id,
      name: module.name || module.code || id,
      icon: module.icon,
      pages: [],
    });
  }

  function visit(menus: API.CurrentUserMenu[], parents: string[]) {
    for (const menu of [...menus].sort((a, b) => (a.sort || 0) - (b.sort || 0))) {
      if (menu.status && menu.status !== 'ACTIVE') continue;
      if (menu.hidden) continue;
      const moduleId = menu.moduleId || menu.module_id || '';
      const permissionCode = menu.permissionCode || menu.permission_code || '';
      const route = routeByPermission.get(permissionCode) || routeByPath.get(menu.path || '');
      if (
        menu.type === 'page' &&
        route?.component &&
        route.path &&
        menu.path === route.path &&
        (!menu.component || menu.component === route.component) &&
        result.has(moduleId)
      ) {
        result.get(moduleId)?.pages.push({
          moduleId,
          path: route.path,
          name: menu.name || route.path,
          parents,
          permissionCode,
        });
      }
      visit(menu.children || [], menu.type === 'directory' ? [...parents, menu.name || ''] : parents);
    }
  }

  visit(user.menus || [], []);
  return [...result.values()].filter((module) => module.pages.length > 0);
}

export function getConsolePage(modules: ConsoleModule[], pathname: string) {
  return modules.flatMap((module) => module.pages).find((page) => page.path === pathname);
}

function recentKey(user?: API.CurrentUser) {
  const id = user?.userid || user?.username;
  return id ? `${recentPrefix}${encodeURIComponent(id)}` : undefined;
}

export function readRecentPages(user: API.CurrentUser | undefined, modules: ConsoleModule[]) {
  const key = recentKey(user);
  if (!key || typeof window === 'undefined') return [] as ConsolePage[];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(key) || '[]');
    if (!Array.isArray(stored)) return [];
    const allowed = new Map(modules.flatMap((module) => module.pages).map((page) => [page.path, page]));
    const validPaths = stored
      .filter((path): path is string => typeof path === 'string' && allowed.has(path))
      .slice(0, recentLimit);
    if (validPaths.length !== stored.length) {
      window.localStorage.setItem(key, JSON.stringify(validPaths));
    }
    return validPaths.map((path) => allowed.get(path) as ConsolePage);
  } catch {
    return [];
  }
}

export function recordRecentPage(user: API.CurrentUser | undefined, modules: ConsoleModule[], pathname: string) {
  const key = recentKey(user);
  if (!key || typeof window === 'undefined' || !getConsolePage(modules, pathname)) return;
  const paths = readRecentPages(user, modules).map((page) => page.path);
  try {
    window.localStorage.setItem(key, JSON.stringify([pathname, ...paths.filter((path) => path !== pathname)].slice(0, recentLimit)));
  } catch {
    // Navigation remains available when local storage is blocked.
  }
}
