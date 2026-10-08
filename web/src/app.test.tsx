import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all heavy dependencies before importing app
const mockReplace = vi.fn();
const mockHistory = {
  location: {
    pathname: '/welcome',
    search: '',
    hash: '',
  },
  replace: mockReplace,
};

const mockQueryCurrentUser = vi.fn();

vi.mock('@umijs/max', () => ({
  history: mockHistory,
  Link: ({ children }: any) => children,
}));

vi.mock('@/services/admin/auth', () => ({
  queryCurrentUser: mockQueryCurrentUser,
}));

vi.mock('@/components', () => ({
  AvatarDropdown: () => null,
  DocLink: () => null,
  ErrorBoundary: ({ children }: any) => children,
  Footer: () => null,
  LangDropdown: () => null,
  OfflineBanner: () => null,
  VersionDropdown: () => null,
}));

vi.mock('@/components/ConsoleShell', () => ({
  ConsoleHeader: () => null,
  ConsoleFrame: ({ children }: any) => children,
}));

vi.mock('@/components/ConsoleShell/context', () => ({
  ConsoleUiProvider: ({ children }: any) => children,
}));

vi.mock('@ant-design/icons', () => ({
  ApartmentOutlined: () => null,
  AppstoreOutlined: () => null,
  BookOutlined: () => null,
  CalendarOutlined: () => null,
  CrownOutlined: () => null,
  DatabaseOutlined: () => null,
  FundOutlined: () => null,
  LineChartOutlined: () => null,
  MenuOutlined: () => null,
  MessageOutlined: () => null,
  SettingOutlined: () => null,
  StockOutlined: () => null,
  TeamOutlined: () => null,
  UserOutlined: () => null,
}));

vi.mock('./requestErrorConfig', () => ({
  errorConfig: {},
}));

vi.mock('../config/defaultSettings', () => ({
  default: { navTheme: 'light' },
}));

describe('app getInitialState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistory.location = {
      pathname: '/welcome',
      search: '',
      hash: '',
    };
  });

  it('should fetch currentUser when not on login page', async () => {
    const { getInitialState } = await import('./app');
    mockQueryCurrentUser.mockResolvedValue({
      data: {
        name: 'Test User',
        access: 'admin',
      },
    });

    const state = await getInitialState();

    expect(mockQueryCurrentUser).toHaveBeenCalled();
    expect(state.currentUser).toEqual({
      name: 'Test User',
      access: 'admin',
    });
    expect(state.fetchUserInfo).toBeDefined();
  });

  it('should redirect to login when currentUser fetch fails (401)', async () => {
    const { getInitialState } = await import('./app');
    mockQueryCurrentUser.mockRejectedValue(new Error('401 Unauthorized'));

    const state = await getInitialState();

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('/user/login?redirect='),
    );
    expect(state.currentUser).toBeUndefined();
  });

  it('should not fetch currentUser on login page', async () => {
    const { getInitialState } = await import('./app');
    mockHistory.location = {
      pathname: '/user/login',
      search: '',
      hash: '',
    };

    const state = await getInitialState();

    expect(mockQueryCurrentUser).not.toHaveBeenCalled();
    expect(state.currentUser).toBeUndefined();
    expect(state.fetchUserInfo).toBeDefined();
  });

  it('should encode redirect path correctly on 401', async () => {
    const { getInitialState } = await import('./app');
    mockHistory.location = {
      pathname: '/admin/users',
      search: '?page=2',
      hash: '#section',
    };
    mockQueryCurrentUser.mockRejectedValue(new Error('401'));

    await getInitialState();

    expect(mockReplace).toHaveBeenCalledWith(
      `/user/login?redirect=${encodeURIComponent('/admin/users?page=2#section')}`,
    );
  });

  it('should include default settings in initial state', async () => {
    const { getInitialState } = await import('./app');
    mockQueryCurrentUser.mockResolvedValue({
      data: { name: 'User' },
    });

    const state = await getInitialState();

    expect(state.settings).toEqual({ navTheme: 'light' });
  });

  it('fetchUserInfo should return user data on success', async () => {
    const { getInitialState } = await import('./app');
    mockQueryCurrentUser.mockResolvedValue({
      data: { name: 'Fetched User', access: 'user' },
    });

    const state = await getInitialState();

    const user = await state.fetchUserInfo?.();
    expect(user).toEqual({ name: 'Fetched User', access: 'user' });
  });
});

describe('menu icon compatibility', () => {
  it('maps kebab-case and Ant Design component names to React icons', async () => {
    const React = await import('react');
    const { resolveMenuIcon } = await import('./utils/menuIcon');

    expect(React.isValidElement(resolveMenuIcon('line-chart'))).toBe(true);
    expect(React.isValidElement(resolveMenuIcon('LineChartOutlined'))).toBe(
      true,
    );
    expect(React.isValidElement(resolveMenuIcon('database'))).toBe(true);
    expect(React.isValidElement(resolveMenuIcon('DatabaseOutlined'))).toBe(
      true,
    );
  });

  it('does not render an unknown icon identifier as text', async () => {
    const { resolveMenuIcon } = await import('./utils/menuIcon');

    expect(resolveMenuIcon('not-a-real-icon')).toBeUndefined();
  });
});

describe('route-specific layout', () => {
  it('allows the public workspace and rejects a disabled page even under an authorized directory', async () => {
    const { layout } = await import('./app');
    const initialState = { settings: {}, currentUser: { menus: [{
      id: 'system', moduleId: 'system', type: 'directory', path: '/system', status: 'ACTIVE',
      children: [{ id: 'user', moduleId: 'system', type: 'page', path: '/system/user', status: 'DISABLED' }],
    }] } } as any;
    mockHistory.location.pathname = '/workspace';
    layout({ initialState, setInitialState: vi.fn() } as any).onPageChange?.(mockHistory.location as any);
    expect(mockReplace).not.toHaveBeenCalled();
    mockHistory.location.pathname = '/system/user';
    layout({ initialState, setInitialState: vi.fn() } as any).onPageChange?.(mockHistory.location as any);
    expect(mockReplace).toHaveBeenCalledWith('/exception/403');

    mockReplace.mockClear();
    const emptyUser = { settings: {}, currentUser: { menus: [] } } as any;
    layout({ initialState: emptyUser, setInitialState: vi.fn() } as any).onPageChange?.(mockHistory.location as any);
    expect(mockReplace).toHaveBeenCalledWith('/exception/403');
  });

  it('hides the global sider for Harness and Knowledge workbenches only', async () => {
    const { layout } = await import('./app');
    const initialState = { settings: {}, currentUser: { menus: [] } } as any;
    const setInitialState = vi.fn();

    mockHistory.location.pathname = '/knowledge';
    expect(layout({ initialState, setInitialState } as any).menuRender).toBe(false);

    mockHistory.location.pathname = '/harness';
    expect(layout({ initialState, setInitialState } as any).menuRender).toBe(false);

    mockHistory.location.pathname = '/workspace';
    expect(layout({ initialState, setInitialState } as any).menuRender).toBe(false);

    mockHistory.location.pathname = '/account/profile';
    expect(layout({ initialState, setInitialState } as any).menuRender).toBe(false);

    mockHistory.location.pathname = '/admin/users';
    expect(layout({ initialState, setInitialState } as any).menuRender).toBeUndefined();
  });

  it('does not render the floating settings drawer on any page', async () => {
    const React = await import('react');
    const { layout } = await import('./app');
    const initialState = { settings: {}, currentUser: { menus: [] } } as any;
    const setInitialState = vi.fn();

    mockHistory.location.pathname = '/knowledge';
    const knowledgeLayout = layout({ initialState, setInitialState } as any);
    render(knowledgeLayout.childrenRender?.(React.createElement('div', null, 'knowledge'), {} as any) as React.ReactElement);
    expect(screen.queryByText('setting-drawer')).not.toBeInTheDocument();

    mockHistory.location.pathname = '/admin/users';
    const adminLayout = layout({ initialState, setInitialState } as any);
    render(adminLayout.childrenRender?.(React.createElement('div', null, 'admin'), {} as any) as React.ReactElement);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.queryByText('setting-drawer')).not.toBeInTheDocument();
  });
});
