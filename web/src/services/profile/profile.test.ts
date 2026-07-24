import { request } from '@umijs/max';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePassword, getProfile, updateProfile, uploadAvatar } from './profile';

vi.mock('@umijs/max', () => ({
  request: vi.fn(),
}));

const mockRequest = vi.mocked(request);

describe('profile service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes profile response fields', async () => {
    mockRequest.mockResolvedValue({
      data: {
        id: 'user-admin',
        username: 'admin',
        display_name: 'Template Admin',
        role_codes: ['admin'],
      },
    });

    const result = await getProfile();

    expect(mockRequest).toHaveBeenCalledWith('/api/profile', {
      method: 'GET',
    });
    expect(result.data?.displayName).toBe('Template Admin');
    expect(result.data?.roleCodes).toEqual(['admin']);
  });

  it('sends editable profile fields as backend contract fields', async () => {
    mockRequest.mockResolvedValue({ data: {} });

    await updateProfile({
      displayName: 'New Name',
      email: 'admin@example.local',
      phone: '13800138000',
    });

    expect(mockRequest).toHaveBeenCalledWith('/api/profile', {
      method: 'PUT',
      data: {
        display_name: 'New Name',
        email: 'admin@example.local',
        phone: '13800138000',
      },
    });
  });

  it('sends password change fields as backend contract fields', async () => {
    mockRequest.mockResolvedValue({});

    await changePassword({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });

    expect(mockRequest).toHaveBeenCalledWith('/api/profile/password', {
      method: 'PUT',
      data: {
        current_password: 'old-password',
        new_password: 'new-password',
        confirm_password: 'new-password',
      },
    });
  });

  it('uploads avatar with multipart form data', async () => {
    mockRequest.mockResolvedValue({
      avatar: 'http://storage/avatar.png',
      profile: {
        id: 'user-admin',
        display_name: 'Template Admin',
        avatar: 'http://storage/avatar.png',
      },
    });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const result = await uploadAvatar(file);

    expect(mockRequest).toHaveBeenCalledWith('/api/profile/avatar', {
      method: 'POST',
      data: expect.any(FormData),
    });
    expect(result.avatar).toBe('http://storage/avatar.png');
    expect(result.profile?.displayName).toBe('Template Admin');
  });
});
