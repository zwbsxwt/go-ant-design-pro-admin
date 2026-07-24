import { request } from "@umijs/max";

export async function listMenus(options?: { [key: string]: any }) {
  const result = await request<API.SystemMenuList>("/api/system/menus", {
    method: "GET",
    ...(options || {}),
  });
  return {
    ...result,
    data: normalizeMenus(result.data),
  };
}

export async function createMenu(menu: API.SystemMenu) {
  return request<API.SystemMenu>("/api/system/menus", {
    method: "POST",
    data: normalizeMenuForRequest(menu),
  });
}

export async function updateMenu(id: string, menu: API.SystemMenu) {
  return request<API.SystemMenu>(`/api/system/menus/${id}`, {
    method: "PUT",
    data: normalizeMenuForRequest(menu),
  });
}

export async function deleteMenu(id: string) {
  return request<Record<string, never>>(`/api/system/menus/${id}`, {
    method: "DELETE",
  });
}

export async function batchMigrateMenuModule(
  menuIds: string[],
  targetModuleId: string
) {
  return request<{ success?: boolean }>(
    "/api/system/menus/batch-migrate-module",
    {
      method: "POST",
      data: {
        menu_ids: menuIds,
        target_module_id: targetModuleId,
      },
    }
  );
}

function normalizeMenus(menus?: API.SystemMenu[]): API.SystemMenu[] {
  return (menus || []).map(normalizeMenu);
}

function normalizeMenu(menu: API.SystemMenu): API.SystemMenu {
  const normalized = {
    ...menu,
    moduleId: menu.moduleId ?? menu.module_id,
    parentId: menu.parentId ?? menu.parent_id,
    permissionCode: menu.permissionCode ?? menu.permission_code,
    createdAt: menu.createdAt ?? menu.created_at,
    updatedAt: menu.updatedAt ?? menu.updated_at,
  };
  normalized.children = normalizeMenus(menu.children);
  return normalized;
}

function normalizeMenuForRequest(menu: API.SystemMenu) {
  return {
    id: menu.id || "",
    module_id: menu.moduleId || menu.module_id || "module-system",
    parent_id: menu.parentId || menu.parent_id || "",
    type: menu.type,
    name: menu.name,
    path: menu.path || "",
    component: menu.component || "",
    permission_code: menu.permissionCode || menu.permission_code || "",
    icon: menu.icon || "",
    sort: menu.sort || 0,
    status: menu.status || "ACTIVE",
    hidden: menu.hidden || false,
  };
}
