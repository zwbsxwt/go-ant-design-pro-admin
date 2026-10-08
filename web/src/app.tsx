import type {
  Settings as LayoutSettings,
  MenuDataItem,
} from "@ant-design/pro-components";
import type { RequestConfig, RunTimeLayoutConfig } from "@umijs/max";
import { history, Link } from "@umijs/max";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import {
  ErrorBoundary,
  Footer,
  OfflineBanner,
} from "@/components";
import { queryCurrentUser } from "@/services/admin/auth";
import { clearAuthState } from "@/utils/authState";
import { resolveMenuIcon } from "@/utils/menuIcon";
import { ConsoleFrame, ConsoleHeader } from "@/components/ConsoleShell";
import { ConsoleUiProvider } from "@/components/ConsoleShell/context";
import { getConsoleModules, recordRecentPage } from "@/components/ConsoleShell/navigation";
import defaultSettings from "../config/defaultSettings";
import { errorConfig } from "./requestErrorConfig";

dayjs.extend(relativeTime);

const loginPath = "/user/login";
const selectedModuleStorageKey = "go-ant-design-pro-admin:selected-module-id";

type InitialState = {
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  selectedModuleId?: string;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
};

type WhitelistMenuDataItem = MenuDataItem & {
  permissionCode?: string;
  component?: string;
  routes?: WhitelistMenuDataItem[];
  children?: WhitelistMenuDataItem[];
};

export async function getInitialState(): Promise<InitialState> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      clearAuthState();
      const { pathname, search, hash } = history.location;
      history.replace(
        `${loginPath}?redirect=${encodeURIComponent(pathname + search + hash)}`
      );
    }
    return undefined;
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      selectedModuleId: resolveSelectedModuleId(
        currentUser?.modules,
        findModuleIdForPath(currentUser?.menus || [], location.pathname) ||
          getStoredSelectedModuleId()
      ),
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => ({
  menuRender: isFullWidthWorkbench(history.location.pathname) ? false : undefined,
  siderMenuRender: (_props: unknown, defaultDom: React.ReactNode) => defaultDom,
  menuItemRender: (item, dom) => {
    if (item.path) {
      return (
        <Link to={item.path} prefetch>
          {dom}
        </Link>
      );
    }
    return dom;
  },
  menuDataRender: (menuData) =>
    isFullWidthWorkbench(history.location.pathname) ? [] : buildDatabaseBackedMenuData(
      menuData as WhitelistMenuDataItem[],
      initialState?.currentUser?.menus,
      findModuleIdForPath(initialState?.currentUser?.menus || [], history.location.pathname) || initialState?.selectedModuleId
    ),
  headerRender: () => <ConsoleHeader user={initialState?.currentUser} />,
  actionsRender: () => [],
  footerRender: () =>
    isFullWidthWorkbench(history.location.pathname) ? null : <Footer />,
  onPageChange: () => {
    const { location } = history;
    if (!initialState?.currentUser && location.pathname !== loginPath) {
      history.replace(
        `${loginPath}?redirect=${encodeURIComponent(
          location.pathname + location.search + location.hash
        )}`
      );
      return;
    }
    const pathModuleId = findModuleIdForPath(
      initialState?.currentUser?.menus || [],
      location.pathname
    );
    if (pathModuleId && pathModuleId !== initialState?.selectedModuleId) {
      setStoredSelectedModuleId(pathModuleId);
      setInitialState((state) => ({ ...state, selectedModuleId: pathModuleId }));
    }
    if (
      initialState?.currentUser &&
      !isAuthorizedPath(location.pathname, initialState.currentUser)
    ) {
      history.replace("/exception/403");
      return;
    }
    recordRecentPage(initialState?.currentUser, getConsoleModules(initialState?.currentUser), location.pathname);
  },
  bgLayoutImgList: [
    {
      src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr",
      left: 85,
      bottom: 100,
      height: "303px",
    },
    {
      src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr",
      bottom: -68,
      right: -45,
      height: "303px",
    },
    {
      src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr",
      bottom: 0,
      left: 0,
      width: "331px",
    },
  ],
  links: [],
  ErrorBoundary,
  menuHeaderRender: false,
  childrenRender: (children) => <ConsoleFrame user={initialState?.currentUser}>{children}</ConsoleFrame>,
  ...initialState?.settings,
});

function isFullWidthWorkbench(pathname: string) {
  return pathname === '/workspace' || pathname.startsWith('/harness') || pathname.startsWith('/knowledge') || pathname.startsWith('/account');
}

function buildDatabaseBackedMenuData(
  staticMenus: WhitelistMenuDataItem[],
  currentUserMenus?: API.CurrentUserMenu[],
  selectedModuleId?: string
): MenuDataItem[] {
  if (!currentUserMenus || currentUserMenus.length === 0) {
    return [];
  }

  const whitelist = createRouteWhitelist(staticMenus);
  const scopedMenus = filterMenusByModule(currentUserMenus, selectedModuleId);
  return currentUserMenus
    .map((menu) => toMenuDataItem(menu, whitelist, scopedMenus))
    .filter(Boolean) as MenuDataItem[];
}

function createRouteWhitelist(staticMenus: WhitelistMenuDataItem[]) {
  const byPermissionCode = new Map<string, WhitelistMenuDataItem>();
  const byPath = new Map<string, WhitelistMenuDataItem>();

  const walk = (items: WhitelistMenuDataItem[]) => {
    for (const item of items) {
      if (item.permissionCode) {
        byPermissionCode.set(item.permissionCode, item);
      }
      if (item.path) {
        byPath.set(item.path, item);
      }
      walk((item.children || item.routes || []) as WhitelistMenuDataItem[]);
    }
  };

  walk(staticMenus);
  return { byPermissionCode, byPath };
}

function toMenuDataItem(
  menu: API.CurrentUserMenu,
  whitelist: ReturnType<typeof createRouteWhitelist>,
  allowedMenus?: Set<string>
): MenuDataItem | undefined {
  if (menu.status && menu.status !== "ACTIVE") {
    return undefined;
  }
  if (menu.hidden) {
    return undefined;
  }
  if (allowedMenus && menu.id && !allowedMenus.has(menu.id)) {
    return undefined;
  }

  const permissionCode = menu.permissionCode || menu.permission_code || "";
  const route =
    whitelist.byPermissionCode.get(permissionCode) ||
    whitelist.byPath.get(menu.path || "");
  if (!route) {
    return undefined;
  }

  if (
    menu.type === "page" &&
    menu.component &&
    route.component &&
    menu.component !== route.component
  ) {
    return undefined;
  }

  const children = (menu.children || [])
    .map((child) => toMenuDataItem(child, whitelist, allowedMenus))
    .filter(Boolean) as MenuDataItem[];

  return {
    key: menu.id || route.key || route.path || menu.path,
    name: menu.name || route.name,
    path: route.path || menu.path,
    icon: resolveMenuIcon(menu.icon || route.icon),
    hideInMenu: false,
    children: children.length > 0 ? children : undefined,
  };
}

function filterMenusByModule(
  menus: API.CurrentUserMenu[],
  selectedModuleId?: string
) {
  if (!selectedModuleId) {
    return undefined;
  }
  const allowed = new Set<string>();
  const visit = (menu: API.CurrentUserMenu): boolean => {
    const children = menu.children || [];
    let hasAllowedChild = false;
    for (const child of children) {
      hasAllowedChild = visit(child) || hasAllowedChild;
    }
    const belongsToModule =
      (menu.moduleId || menu.module_id) === selectedModuleId;
    const allowedBySelf = belongsToModule;
    if ((allowedBySelf || hasAllowedChild) && menu.id) {
      allowed.add(menu.id);
    }
    return allowedBySelf || hasAllowedChild;
  };
  menus.forEach(visit);
  return allowed;
}

function resolveSelectedModuleId(
  modules?: API.CurrentUserModule[],
  candidate?: string
) {
  const activeModules = (modules || []).filter(
    (module) => module.status !== "DISABLED" && !module.hidden && module.id
  );
  if (candidate && activeModules.some((module) => module.id === candidate)) {
    return candidate;
  }
  return activeModules[0]?.id;
}

function getStoredSelectedModuleId() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage.getItem(selectedModuleStorageKey) || undefined;
}

function setStoredSelectedModuleId(moduleId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(selectedModuleStorageKey, moduleId);
}

function isAuthorizedPath(pathname: string, currentUser: API.CurrentUser) {
  if (
    pathname === "/" ||
    pathname === "/workspace" ||
    pathname === loginPath ||
    pathname.startsWith("/exception/") ||
    pathname.startsWith("/account/")
  ) {
    return true;
  }
  const menuPaths = flattenCurrentUserMenuPaths(currentUser.menus || []);
  if (menuPaths.length === 0) {
    return false;
  }
  if (pathname === '/quant/industry-flow-race') {
    return hasActiveMenuPermission(currentUser.menus || [], 'menu.quantitative-trading.industry-flow');
  }
  return menuPaths.some(({ path, type }) =>
    pathname === path || (type === 'page' && pathname.startsWith(`${path}/`))
  );
}

function flattenCurrentUserMenuPaths(menus: API.CurrentUserMenu[]) {
  const paths: { path: string; type?: API.CurrentUserMenu['type'] }[] = [];
  const visit = (menu: API.CurrentUserMenu) => {
    if (menu.status && menu.status !== "ACTIVE") return;
    if (menu.path) {
      paths.push({ path: menu.path, type: menu.type });
    }
    (menu.children || []).forEach(visit);
  };
  menus.forEach(visit);
  return paths;
}

function hasActiveMenuPermission(menus: API.CurrentUserMenu[], permissionCode: string): boolean {
  return menus.some((menu) => {
    if (menu.status && menu.status !== 'ACTIVE') return false;
    return (menu.permissionCode || menu.permission_code) === permissionCode ||
      hasActiveMenuPermission(menu.children || [], permissionCode);
  });
}

function findModuleIdForPath(menus: API.CurrentUserMenu[], pathname: string) {
  let best: { moduleId: string; pathLength: number } | undefined;
  const visit = (menu: API.CurrentUserMenu) => {
    const moduleId = menu.moduleId || menu.module_id;
    const path = menu.path || '';
    if (
      moduleId &&
      path &&
      (pathname === path || pathname.startsWith(`${path}/`)) &&
      (!best || path.length > best.pathLength)
    ) {
      best = { moduleId, pathLength: path.length };
    }
    (menu.children || []).forEach(visit);
  };
  menus.forEach(visit);
  return best?.moduleId;
}

export const request: RequestConfig = {
  baseURL: "",
  ...errorConfig,
};

export function rootContainer(container: React.ReactNode) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary><ConsoleUiProvider>{container}</ConsoleUiProvider></ErrorBoundary>
    </>
  );
}
