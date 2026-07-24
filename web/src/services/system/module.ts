import { request } from "@umijs/max";

export async function listModules(options?: { [key: string]: any }) {
  const result = await request<API.SystemModuleList>("/api/system/modules", {
    method: "GET",
    ...(options || {}),
  });
  return {
    ...result,
    data: normalizeModules(result.data),
  };
}

export async function createModule(module: API.SystemModule) {
  return request<API.SystemModule>("/api/system/modules", {
    method: "POST",
    data: normalizeModuleForRequest(module),
  });
}

export async function updateModule(id: string, module: API.SystemModule) {
  return request<API.SystemModule>(`/api/system/modules/${id}`, {
    method: "PUT",
    data: normalizeModuleForRequest(module),
  });
}

export async function deleteModule(id: string) {
  return request<Record<string, never>>(`/api/system/modules/${id}`, {
    method: "DELETE",
  });
}

export async function migrateModuleMenus(id: string, targetModuleId: string) {
  return request<{ success?: boolean }>(
    `/api/system/modules/${id}/migrate-menus`,
    {
      method: "POST",
      data: {
        target_module_id: targetModuleId,
      },
    }
  );
}

function normalizeModules(modules?: API.SystemModule[]): API.SystemModule[] {
  return (modules || []).map((module) => ({
    ...module,
    createdAt: module.createdAt ?? module.created_at,
    updatedAt: module.updatedAt ?? module.updated_at,
  }));
}

function normalizeModuleForRequest(module: API.SystemModule) {
  return {
    id: module.id || "",
    code: module.code || "",
    name: module.name || "",
    icon: module.icon || "",
    sort: module.sort || 0,
    status: module.status || "ACTIVE",
    hidden: module.hidden || false,
  };
}
