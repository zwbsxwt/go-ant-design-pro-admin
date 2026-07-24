import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagement from './index';

const mockListUsers = vi.fn();

vi.mock('@umijs/max', () => ({
  useAccess: () => ({
    canCreateUsers: true,
    canUpdateUsers: true,
    canBindUserRoles: true,
    canResetUserPasswords: true,
    canDeleteUsers: true,
  }),
}));

vi.mock('@/services/system/role', () => ({
  listRoles: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/services/system/user', () => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: (...args: unknown[]) => mockListUsers(...args),
  resetUserPassword: vi.fn(),
  updateUser: vi.fn(),
  updateUserRoles: vi.fn(),
}));

vi.mock('antd', () => ({
  App: {
    useApp: () => ({
      message: { success: vi.fn() },
      modal: { confirm: vi.fn() },
    }),
  },
  Avatar: ({ children, src }: { children?: React.ReactNode; src?: string }) => (
    <span data-src={src}>{children}</span>
  ),
  Button: ({ children }: { children?: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  Modal: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Space: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Tag: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock('@ant-design/pro-components', () => {
  const ProFormText = ({ label }: { label?: React.ReactNode }) => (
    <span>{label}</span>
  );
  ProFormText.Password = ({ label }: { label?: React.ReactNode }) => (
    <span>{label}</span>
  );

  return {
    ModalForm: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ProFormSelect: ({ label }: { label?: React.ReactNode }) => (
      <span>{label}</span>
    ),
    ProFormText,
    ProTable: ({ columns, request }: any) => {
      const [rows, setRows] = React.useState<any[]>([]);
      React.useEffect(() => {
        request().then((result: any) => setRows(result.data || []));
      }, [request]);
      return (
        <div>
          {columns.map((column: any) => (
            <div key={String(column.title)}>{column.title}</div>
          ))}
          {rows.map((row) => (
            <div key={row.id}>
              {columns.map((column: any) => (
                <span key={String(column.title)}>
                  {column.render
                    ? column.render(undefined, row)
                    : row[column.dataIndex]}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    },
  };
});

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue({
      data: [
        {
          id: 'user-admin',
          username: 'admin',
          displayName: '系统管理员',
          avatar: 'http://storage/avatar.png',
          roleCodes: ['admin'],
          status: 'ACTIVE',
        },
      ],
    });
  });

  it('renders avatar column and avatar fallback content', async () => {
    render(<UserManagement />);

    expect(screen.getByText('头像')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('系统管理员')).toBeInTheDocument();
    });
  });

  it('does not render manual avatar URL fields in user forms', () => {
    render(<UserManagement />);

    expect(screen.queryByText('头像 URL')).not.toBeInTheDocument();
  });
});
