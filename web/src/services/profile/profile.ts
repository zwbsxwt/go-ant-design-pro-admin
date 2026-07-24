import { request } from '@umijs/max';

export async function getProfile(options?: { [key: string]: any }) {
  const result = await request<{ data?: API.Profile }>('/api/profile', {
    method: 'GET',
    ...(options || {}),
  });
  return {
    ...result,
    data: normalizeProfile(result.data),
  };
}

export async function updateProfile(data: API.UpdateProfileParams) {
  const result = await request<{ data?: API.Profile }>('/api/profile', {
    method: 'PUT',
    data: {
      display_name: data.displayName ?? data.display_name,
      email: data.email,
      phone: data.phone,
    },
  });
  return {
    ...result,
    data: normalizeProfile(result.data),
  };
}

export async function changePassword(data: API.ChangePasswordParams) {
  return request<Record<string, never>>('/api/profile/password', {
    method: 'PUT',
    data: {
      current_password: data.currentPassword ?? data.current_password,
      new_password: data.newPassword ?? data.new_password,
      confirm_password: data.confirmPassword ?? data.confirm_password,
    },
  });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const result = await request<API.UploadAvatarResult>('/api/profile/avatar', {
    method: 'POST',
    data: formData,
  });
  const profile = normalizeProfile(result.profile ?? result.data?.profile);
  return {
    ...result,
    avatar: result.avatar ?? result.data?.avatar,
    profile,
  };
}

function normalizeProfile(profile?: API.Profile) {
  if (!profile) {
    return profile;
  }
  const raw = profile as API.Profile & {
    display_name?: string;
    role_codes?: string[];
  };
  return {
    ...profile,
    displayName: profile.displayName ?? raw.display_name,
    roleCodes: profile.roleCodes ?? raw.role_codes,
  };
}
