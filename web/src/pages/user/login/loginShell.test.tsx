import { App } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Login from './index';

const loginAccount = vi.hoisted(() => vi.fn());

vi.mock('@umijs/max', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectLang: () => <span>简体中文</span>,
  useIntl: () => ({ formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage }),
  useModel: () => ({ initialState: {}, setInitialState: vi.fn() }),
}));
vi.mock('@/services/admin/auth', () => ({ loginAccount }));
vi.mock('@ant-design/pro-components', () => {
  const ProFormText = Object.assign(
    ({ placeholder }: { placeholder: string }) => <input placeholder={placeholder} />,
    { Password: ({ placeholder }: { placeholder: string }) => <input placeholder={placeholder} type="password" /> },
  );
  return {
    LoginForm: ({ children }: { children: React.ReactNode }) => <form>{children}<button type="submit">立即登录</button></form>,
    ProFormText,
    ProFormCheckbox: ({ children }: { children: React.ReactNode }) => <label><input type="checkbox" />{children}</label>,
  };
});

describe('login page shell', () => {
  it('keeps account login available and marks other methods as unavailable', () => {
    render(<App><Login /></App>);
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '立即登录' })).toBeInTheDocument();
    expect(screen.getByText('扫码登录 · 暂未开放')).toBeInTheDocument();
    expect(screen.queryByText(/©/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '手机号登录' }));
    expect(screen.getByText('手机号登录暂未开放')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('用户名')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '通行密钥' }));
    expect(screen.getByText('通行密钥登录暂未开放')).toBeInTheDocument();
    expect(loginAccount).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('tab', { name: '账号密码' }));
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
  });
});
