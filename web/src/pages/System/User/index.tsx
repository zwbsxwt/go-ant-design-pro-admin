import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { App, Avatar, Button, Modal, Space, Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { listRoles } from '@/services/system/role';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserRoles,
} from '@/services/system/user';

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
];

type UserFormValues = API.SystemUser & {
  password?: string;
};

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { message, modal } = App.useApp();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.SystemUser>();
  const [roleUser, setRoleUser] = useState<API.SystemUser>();
  const [passwordUser, setPasswordUser] = useState<API.SystemUser>();
  const [roles, setRoles] = useState<API.SystemRole[]>([]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: `${role.name} (${role.code})`,
        value: role.id || '',
      })),
    [roles],
  );

  const reload = () => actionRef.current?.reload();

  const ensureRoles = async () => {
    if (roles.length > 0) {
      return;
    }
    const result = await listRoles();
    setRoles(result.data || []);
  };

  const openCreate = async () => {
    setEditingUser(undefined);
    await ensureRoles();
    setUserModalOpen(true);
  };

  const openEdit = (record: API.SystemUser) => {
    setEditingUser(record);
    setUserModalOpen(true);
  };

  const openRoles = async (record: API.SystemUser) => {
    setRoleUser(record);
    await ensureRoles();
    setRoleModalOpen(true);
  };

  const openPassword = (record: API.SystemUser) => {
    setPasswordUser(record);
    setPasswordModalOpen(true);
  };

  const handleDelete = (record: API.SystemUser) => {
    modal.confirm({
      title: '删除用户',
      content: `确认删除 ${record.displayName || record.username}？当前登录用户和内置管理员会被后端保护。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteUser(record.id || '');
        message.success('删除成功');
        reload();
      },
    });
  };

  const columns: ProColumns<API.SystemUser>[] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 72,
      search: false,
      render: (_, record) => (
        <Avatar size={32} src={record.avatar}>
          {(record.displayName || record.username || '用').slice(0, 1)}
        </Avatar>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      ellipsis: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      ellipsis: true,
    },
    {
      title: '角色',
      dataIndex: 'roleCodes',
      ellipsis: true,
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {(record.roleCodes || []).map((code) => (
            <Tag key={code}>{code}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, record) => (
        <Tag color={record.status === 'ACTIVE' ? 'success' : 'default'}>
          {record.status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          {access.canUpdateUsers && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {access.canUpdateUsers && (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                await updateUser(record.id || '', {
                  ...record,
                  status: record.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                });
                message.success(
                  record.status === 'ACTIVE' ? '已禁用' : '已启用',
                );
                reload();
              }}
            >
              {record.status === 'ACTIVE' ? '禁用' : '启用'}
            </Button>
          )}
          {access.canBindUserRoles && (
            <Button type="link" size="small" onClick={() => openRoles(record)}>
              角色
            </Button>
          )}
          {access.canResetUserPasswords && (
            <Button
              type="link"
              size="small"
              onClick={() => openPassword(record)}
            >
              重置密码
            </Button>
          )}
          {access.canDeleteUsers && (
            <Button
              danger
              type="link"
              size="small"
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<API.SystemUser>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        options={{ density: true, fullScreen: true, reload: true }}
        request={async () => {
          const result = await listUsers();
          return {
            data: result.data || [],
            success: true,
          };
        }}
        toolBarRender={() =>
          access.canCreateUsers
            ? [
                <Button key="create" type="primary" onClick={openCreate}>
                  创建用户
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<UserFormValues>
        key={editingUser?.id || 'create'}
        title={editingUser ? '编辑用户' : '创建用户'}
        open={userModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setUserModalOpen(false),
        }}
        initialValues={{
          status: 'ACTIVE',
          ...editingUser,
        }}
        onFinish={async (values) => {
          if (editingUser?.id) {
            await updateUser(editingUser.id, {
              ...editingUser,
              ...values,
              avatar: editingUser.avatar,
            });
            message.success('保存成功');
          } else {
            await createUser(values);
            message.success('创建成功');
          }
          setUserModalOpen(false);
          reload();
          return true;
        }}
      >
        {!editingUser && (
          <ProFormText
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
        )}
        <ProFormText
          name="displayName"
          label="显示名称"
          rules={[{ required: true, message: '请输入显示名称' }]}
        />
        {!editingUser && (
          <ProFormText.Password
            name="password"
            label="初始密码"
            rules={[
              { required: true, message: '请输入初始密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          />
        )}
        <ProFormText name="email" label="邮箱" />
        <ProFormText name="phone" label="手机号" />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
        {!editingUser && (
          <ProFormSelect
            name="roleIds"
            label="角色"
            mode="multiple"
            options={roleOptions}
          />
        )}
      </ModalForm>

      <ModalForm<{ password: string }>
        key={passwordUser?.id || 'password'}
        title={`重置密码${passwordUser?.username ? `：${passwordUser.username}` : ''}`}
        open={passwordModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setPasswordModalOpen(false),
        }}
        onFinish={async (values) => {
          if (!passwordUser?.id) {
            return false;
          }
          await resetUserPassword(passwordUser.id, values.password);
          message.success('密码已重置');
          setPasswordModalOpen(false);
          return true;
        }}
      >
        <ProFormText.Password
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少 6 位' },
          ]}
        />
      </ModalForm>

      <Modal
        title={`绑定角色${roleUser?.username ? `：${roleUser.username}` : ''}`}
        open={roleModalOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => setRoleModalOpen(false)}
        onOk={async () => {
          if (!roleUser?.id) {
            return;
          }
          await updateUserRoles(roleUser.id, roleUser.roleIds || []);
          message.success('角色已保存');
          setRoleModalOpen(false);
          reload();
        }}
      >
        <ProFormSelect
          fieldProps={{
            value: roleUser?.roleIds || [],
            onChange: (value) => {
              setRoleUser((current) => ({
                ...current,
                roleIds: Array.isArray(value) ? value : [],
              }));
            },
          }}
          mode="multiple"
          options={roleOptions}
        />
      </Modal>
    </>
  );
};

export default UserManagement;
