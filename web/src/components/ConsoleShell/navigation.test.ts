import { beforeEach, describe, expect, it } from 'vitest';
import { getConsoleModules, readRecentPages, recordRecentPage } from './navigation';

const user: API.CurrentUser = {
  userid: 'alice',
  modules: [
    { id: 'system', name: '系统管理', status: 'ACTIVE' },
    { id: 'harness', name: '智能工作台', status: 'ACTIVE' },
    { id: 'disabled', name: '停用模块', status: 'DISABLED' },
  ],
  menus: [
    {
      id: 'system-root', moduleId: 'system', type: 'directory', name: '系统管理',
      path: '/system', permissionCode: 'menu.system', status: 'ACTIVE',
      children: [
        { id: 'system-user', moduleId: 'system', type: 'page', name: '用户管理',
          path: '/system/user', component: './System/User', permissionCode: 'menu.system.user', status: 'ACTIVE' },
        { id: 'system-role', moduleId: 'system', type: 'page', name: '角色管理',
          path: '/system/role', component: './System/Role', permissionCode: 'menu.system.role', status: 'DISABLED' },
      ],
    },
    { id: 'harness-root', moduleId: 'harness', type: 'directory', name: '智能工作台',
      children: [{ id: 'harness-page', moduleId: 'harness', type: 'page', name: 'Agent 会话',
        path: '/harness', component: './Harness',
        permissionCode: 'menu.harness', status: 'ACTIVE' }] },
  ],
};

describe('console navigation', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows only active authorized pages backed by a static route', () => {
    const modules = getConsoleModules(user);
    expect(modules.map((item) => item.name)).toEqual(['系统管理', '智能工作台']);
    expect(modules.flatMap((item) => item.pages.map((page) => page.path))).toEqual([
      '/system/user', '/harness',
    ]);
  });

  it('stores route history per user and drops revoked entries', () => {
    const modules = getConsoleModules(user);
    recordRecentPage(user, modules, '/system/user');
    recordRecentPage(user, modules, '/harness');
    recordRecentPage(user, modules, '/system/user');
    expect(readRecentPages(user, modules).map((page) => page.path)).toEqual([
      '/system/user', '/harness',
    ]);
    expect(readRecentPages({ ...user, userid: 'bob' }, modules)).toEqual([]);
    const revoked = { ...user, menus: user.menus?.slice(1) };
    expect(readRecentPages(revoked, getConsoleModules(revoked)).map((page) => page.path))
      .toEqual(['/harness']);
  });
});
