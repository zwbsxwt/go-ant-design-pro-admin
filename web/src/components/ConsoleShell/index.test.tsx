import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConsoleUiProvider } from './context';
import { ConsoleFrame, ConsoleHeader } from './index';

vi.mock('@umijs/max', () => ({
  history: { push: vi.fn() },
  useLocation: () => ({ pathname: '/workspace' }),
}));

vi.mock('@/components/RightContent/LangDropdown', () => ({
  LangDropdown: () => <button type="button">语言切换</button>,
}));

vi.mock('@/components/RightContent/AvatarDropdown', () => ({
  AvatarDropdown: ({ children }: React.PropsWithChildren) => children,
}));

const user: API.CurrentUser = {
  userid: 'shell-test',
  modules: [{ id: 'system', name: '系统管理', status: 'ACTIVE' }],
  menus: [{ id: 'user', moduleId: 'system', type: 'page', name: '用户管理',
    path: '/system/user', component: './System/User', permissionCode: 'menu.system.user', status: 'ACTIVE' }],
};

describe('console shell', () => {
  it('keeps global actions in the requested order and shows the message status', async () => {
    render(<ConsoleUiProvider><ConsoleHeader user={user} /></ConsoleUiProvider>);
    const header = screen.getByRole('banner');
    const labels = [...header.querySelectorAll('button, a')].map((item) => item.getAttribute('aria-label') || item.textContent?.trim());
    expect(labels).toEqual([
      '打开产品目录', 'go-ant-design-pro-admin 首页', '工作台', '搜索产品与页面',
      '文档', '语言切换', '消息', '账号信息',
    ]);
    fireEvent.click(within(header).getByRole('button', { name: '消息' }));
    expect(await screen.findByText('消息中心尚未接入，暂无系统消息。')).toBeInTheDocument();
  });

  it('opens the catalog from global search and filters authorized pages', async () => {
    render(<ConsoleUiProvider><ConsoleHeader /><ConsoleFrame user={user}><div>工作台内容</div></ConsoleFrame></ConsoleUiProvider>);
    fireEvent.click(screen.getByRole('button', { name: '搜索产品与页面' }));
    const search = await screen.findByRole('textbox', { name: '搜索产品或页面' });
    await waitFor(() => expect(search).toHaveFocus());
    expect(screen.getByRole('button', { name: /用户管理/ })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '不存在' } });
    expect(screen.getByText('没有匹配的授权页面')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('textbox', { name: '搜索产品或页面' })).not.toBeInTheDocument());
  });

  it('replaces the menu icon with a close action and starts the catalog below the header', async () => {
    render(<ConsoleUiProvider><ConsoleHeader /><ConsoleFrame user={user}><div>工作台内容</div></ConsoleFrame></ConsoleUiProvider>);
    fireEvent.click(screen.getByRole('button', { name: '打开产品目录' }));
    expect(screen.getByRole('button', { name: '关闭产品目录' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.ant-drawer-header')).toBeNull();
    expect(screen.getByRole('navigation', { name: '产品分类' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭产品目录' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '打开产品目录' })).toHaveAttribute('aria-expanded', 'false'));
  });

  it('keeps the rail toggle available after collapse', () => {
    render(<ConsoleUiProvider><ConsoleFrame user={user}><div>工作台内容</div></ConsoleFrame></ConsoleUiProvider>);
    fireEvent.click(screen.getByRole('button', { name: '收起工具栏' }));
    expect(screen.getByRole('button', { name: '展开工具栏' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '展开工具栏' }));
    expect(screen.getByRole('button', { name: '收起工具栏' })).toBeInTheDocument();
  });
});
