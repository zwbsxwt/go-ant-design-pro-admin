import { request } from '@umijs/max';

export async function listUsers(options?: { [key: string]: any }) {
  const result = await request<API.SystemUserList>('/api/system/users', {
    method: 'GET',
    ...(options || {}),
  });
  return {
    ...result,
    data: normalizeUsers(result.data),
  };
}

export async function getUser(id: string) {
  const result = await request<API.SystemUser>(`/api/system/users/${id}`, {
    method: 'GET',
  });
  return normalizeUser(result);
}

export async function createUser(user: API.SystemUser) {
  return request<API.SystemUser>('/api/system/users', {
    method: 'POST',
    data: normalizeUserForCreate(user),
  });
}

export async function updateUser(id: string, user: API.SystemUser) {
  return request<API.SystemUser>(`/api/system/users/${id}`, {
    method: 'PUT',
    data: normalizeUserForUpdate(user),
  });
}

export async function deleteUser(id: string) {
  return request<Record<string, never>>(`/api/system/users/${id}`, {
    method: 'DELETE',
  });
}

export async function resetUserPassword(id: string, password: string) {
  return request<Record<string, never>>(`/api/system/users/${id}/password`, {
    method: 'PUT',
    data: { password },
  });
}

export async function updateUserRoles(id: string, roleIds: string[]) {
  return request<API.SystemUser>(`/api/system/users/${id}/roles`, {
    method: 'PUT',
    data: { role_ids: roleIds },
  });
}

function normalizeUsers(users?: API.SystemUser[]): API.SystemUser[] {
  return (users || []).map(normalizeUser);
}

function normalizeUser(user: API.SystemUser): API.SystemUser {
  return {
    ...user,
    displayName: user.displayName ?? user.display_name,
    roleIds: user.roleIds ?? user.role_ids,
    roleCodes: user.roleCodes ?? user.role_codes,
    createdAt: user.createdAt ?? user.created_at,
    updatedAt: user.updatedAt ?? user.updated_at,
  };
}

function normalizeUserForCreate(user: API.SystemUser) {
  return {
    username: user.username,
    display_name: user.displayName || user.display_name || '',
    password: user.password || '',
    avatar: user.avatar || '',
    email: user.email || '',
    phone: user.phone || '',
    status: user.status || 'ACTIVE',
    role_ids: user.roleIds || user.role_ids || [],
  };
}

function normalizeUserForUpdate(user: API.SystemUser) {
  return {
    display_name: user.displayName || user.display_name || '',
    avatar: user.avatar || '',
    email: user.email || '',
    phone: user.phone || '',
    status: user.status || 'ACTIVE',
  };
}
