import type {
  Settings as LayoutSettings,
  MenuDataItem,
} from "@ant-design/pro-components";
import { SettingDrawer } from "@ant-design/pro-components";
import type { RequestConfig, RunTimeLayoutConfig } from "@umijs/max";
import { history, Link } from "@umijs/max";
import { Tabs } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import {
  AvatarDropdown,
  ErrorBoundary,
  Footer,
  OfflineBanner,
} from "@/components";
import { queryCurrentUser } from "@/services/admin/auth";
import { clearAuthState } from "@/utils/authState";
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
  settingDrawerOpen?: boolean;
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
        getStoredSelectedModuleId()
      ),
      settings: defaultSettings as Partial<LayoutSettings>,
      settingDrawerOpen: false,
    };
  }

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
    settingDrawerOpen: false,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => ({
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
    buildDatabaseBackedMenuData(
      menuData as WhitelistMenuDataItem[],
      initialState?.currentUser?.menus,
      initialState?.selectedModuleId
    ),
  headerContentRender: () =>
    renderModuleTabs({
      modules: initialState?.currentUser?.modules,
      value: resolveSelectedModuleId(
        initialState?.currentUser?.modules,
        initialState?.selectedModuleId
      ),
      onChange: (moduleId) => {
        setStoredSelectedModuleId(moduleId);
        setInitialState((state) => ({
          ...state,
          selectedModuleId: moduleId,
        }));
        const firstMenuPath = findFirstMenuPathForModule(
          initialState?.currentUser?.menus || [],
          moduleId
        );
        if (firstMenuPath) {
          history.push(firstMenuPath);
        }
      },
    }),
  actionsRender: () => [],
  avatarProps: {
    src: initialState?.currentUser?.avatar,
    title:
      initialState?.currentUser?.name ||
      initialState?.currentUser?.username ||
      "用户",
    render: (_, avatarChildren) => (
      <AvatarDropdown>{avatarChildren}</AvatarDropdown>
    ),
  },
  footerRender: () => <Footer />,
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
    if (
      initialState?.currentUser &&
      !isAuthorizedPath(location.pathname, initialState.currentUser)
    ) {
      history.replace("/exception/403");
    }
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
  menuHeaderRender: undefined,
  childrenRender: (children) => (
    <>
      {children}
      <SettingDrawer
        disableUrlParams
        enableDarkTheme
        collapse={initialState?.settingDrawerOpen}
        onCollapseChange={(open) => {
          setInitialState((state) => ({
            ...state,
            settingDrawerOpen: open,
          }));
        }}
        settings={initialState?.settings}
        onSettingChange={(settings) => {
          setInitialState((state) => ({
            ...state,
            settings,
          }));
        }}
      />
    </>
  ),
  ...initialState?.settings,
});

function buildDatabaseBackedMenuData(
  staticMenus: WhitelistMenuDataItem[],
  currentUserMenus?: API.CurrentUserMenu[],
  selectedModuleId?: string
): MenuDataItem[] {
  if (!currentUserMenus || currentUserMenus.length === 0) {
    return staticMenus;
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
    icon: route.icon,
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

function renderModuleTabs({
  modules = [],
  value,
  onChange,
}: {
  modules?: API.CurrentUserModule[];
  value?: string;
  onChange: (moduleId: string) => void;
}) {
  const visibleModules = modules
    .filter((module) => module.status !== "DISABLED" && !module.hidden)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const options = visibleModules
    .filter((module) => module.id)
    .map((module) => ({
      label: module.name || module.code || module.id || "",
      value: module.id || "",
    }));

  if (options.length === 0) {
    return null;
  }

  const selectedValue = value || options[0]?.value;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        marginInlineStart: 24,
        minWidth: 0,
      }}
    >
      <Tabs
        activeKey={selectedValue}
        items={options.map((option) => ({
          key: option.value,
          label: option.label,
        }))}
        onChange={onChange}
        size="small"
        tabBarGutter={24}
        tabBarStyle={{
          margin: 0,
          height: 56,
        }}
      />
    </div>
  );
}

function findFirstMenuPathForModule(
  menus: API.CurrentUserMenu[],
  moduleId: string
) {
  const visit = (items: API.CurrentUserMenu[]): string | undefined => {
    const sortedItems = [...items].sort((a, b) => (a.sort || 0) - (b.sort || 0));
    for (const menu of sortedItems) {
      if (menu.status && menu.status !== "ACTIVE") {
        continue;
      }
      if (menu.hidden) {
        continue;
      }
      const belongsToModule = (menu.moduleId || menu.module_id) === moduleId;
      if (belongsToModule && menu.path && menu.type === "page") {
        return menu.path;
      }
      const childPath = visit(menu.children || []);
      if (childPath) {
        return childPath;
      }
    }
    return undefined;
  };

  return visit(menus);
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
    pathname === loginPath ||
    pathname.startsWith("/exception/") ||
    pathname.startsWith("/account/")
  ) {
    return true;
  }
  const menuPaths = flattenCurrentUserMenuPaths(currentUser.menus || []);
  if (menuPaths.length === 0) {
    return true;
  }
  return menuPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function flattenCurrentUserMenuPaths(menus: API.CurrentUserMenu[]) {
  const paths: string[] = [];
  const visit = (menu: API.CurrentUserMenu) => {
    if (menu.status === "ACTIVE" && menu.path) {
      paths.push(menu.path);
    }
    (menu.children || []).forEach(visit);
  };
  menus.forEach(visit);
  return paths;
}

export const request: RequestConfig = {
  baseURL: "",
  ...errorConfig,
};

export function rootContainer(container: React.ReactNode) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{container}</ErrorBoundary>
    </>
  );
}
