import { request } from '@umijs/max';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUser, updateUser } from './user';

vi.mock('@umijs/max', () => ({
  request: vi.fn(),
}));

const mockRequest = vi.mocked(request);

describe('system user service', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('creates users without requiring avatar URL input', async () => {
    mockRequest.mockResolvedValue({ id: 'user-demo' });

    await createUser({
      username: 'demo',
      displayName: 'Demo',
      password: 'ant.design',
      status: 'ACTIVE',
      roleIds: ['role-user'],
    });

    expect(mockRequest).toHaveBeenCalledWith('/api/system/users', {
      method: 'POST',
      data: {
        username: 'demo',
        display_name: 'Demo',
        password: 'ant.design',
        avatar: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        role_ids: ['role-user'],
      },
    });
  });

  it('keeps avatar when updating an existing user', async () => {
    mockRequest.mockResolvedValue({ id: 'user-admin' });

    await updateUser('user-admin', {
      displayName: 'Admin',
      avatar: 'http://storage/avatar.png',
      email: 'admin@example.local',
      phone: '',
      status: 'ACTIVE',
    });

    expect(mockRequest).toHaveBeenCalledWith('/api/system/users/user-admin', {
      method: 'PUT',
      data: {
        display_name: 'Admin',
        avatar: 'http://storage/avatar.png',
        email: 'admin@example.local',
        phone: '',
        status: 'ACTIVE',
      },
    });
  });
});
