import { request } from '@umijs/max';

export async function listRoles(options?: { [key: string]: any }) {
  const result = await request<API.SystemRoleList>('/api/system/roles', {
    method: 'GET',
    ...(options || {}),
  });
  return {
    ...result,
    data: normalizeRoles(result.data),
  };
}

export async function createRole(role: API.SystemRole) {
  return request<API.SystemRole>('/api/system/roles', {
    method: 'POST',
    data: normalizeRoleForRequest(role),
  });
}

export async function updateRole(id: string, role: API.SystemRole) {
  return request<API.SystemRole>(`/api/system/roles/${id}`, {
    method: 'PUT',
    data: normalizeRoleForRequest(role),
  });
}

export async function deleteRole(id: string) {
  return request<Record<string, never>>(`/api/system/roles/${id}`, {
    method: 'DELETE',
  });
}

export async function updateRolePermissions(
  id: string,
  permissionIds: string[],
) {
  return request<API.SystemRole>(`/api/system/roles/${id}/permissions`, {
    method: 'PUT',
    data: {
      permission_ids: permissionIds,
    },
  });
}

function normalizeRoles(roles?: API.SystemRole[]): API.SystemRole[] {
  return (roles || []).map(normalizeRole);
}

function normalizeRole(role: API.SystemRole): API.SystemRole {
  return {
    ...role,
    permissionIds: role.permissionIds ?? role.permission_ids,
    createdAt: role.createdAt ?? role.created_at,
    updatedAt: role.updatedAt ?? role.updated_at,
  };
}

function normalizeRoleForRequest(role: API.SystemRole) {
  return {
    code: role.code,
    name: role.name,
    description: role.description || '',
    status: role.status || 'ACTIVE',
  };
}
