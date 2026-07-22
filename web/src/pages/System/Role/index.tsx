import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Modal, Space, Tag, Tree } from 'antd';
import type { TreeDataNode } from 'antd';
import type { Key } from 'react';
import React, { useMemo, useRef, useState } from 'react';
import { listMenus } from '@/services/system/menu';
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
  updateRolePermissions,
} from '@/services/system/role';

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
];

const flattenMenus = (menus: API.SystemMenu[] = []): API.SystemMenu[] =>
  menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);

const toTreeData = (menus: API.SystemMenu[] = []): TreeDataNode[] =>
  menus.map((menu) => ({
    title: `${menu.name} (${menu.permissionCode})`,
    key: menu.id || '',
    children: toTreeData(menu.children),
  }));

const RoleManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.SystemRole>();
  const [permissionRole, setPermissionRole] = useState<API.SystemRole>();
  const [menus, setMenus] = useState<API.SystemMenu[]>([]);
  const [checkedPermissionKeys, setCheckedPermissionKeys] = useState<Key[]>([]);

  const treeData = useMemo(() => toTreeData(menus), [menus]);
  const expandedKeys = useMemo(
    () =>
      flattenMenus(menus)
        .map((menu) => menu.id)
        .filter(Boolean) as string[],
    [menus],
  );

  const reload = () => actionRef.current?.reload();

  const openCreate = () => {
    setEditingRole(undefined);
    setRoleModalOpen(true);
  };

  const openEdit = (record: API.SystemRole) => {
    setEditingRole(record);
    setRoleModalOpen(true);
  };

  const openPermissions = async (record: API.SystemRole) => {
    setPermissionRole(record);
    setCheckedPermissionKeys(record.permissionIds || []);
    if (menus.length === 0) {
      const result = await listMenus();
      setMenus(result.data || []);
    }
    setPermissionModalOpen(true);
  };

  const handleDelete = (record: API.SystemRole) => {
    modal.confirm({
      title: '删除角色',
      content: `确认删除 ${record.name}？存在用户绑定时后端会阻止删除。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteRole(record.id || '');
        message.success('删除成功');
        reload();
      },
    });
  };

  const columns: ProColumns<API.SystemRole>[] = [
    {
      title: '角色编码',
      dataIndex: 'code',
      ellipsis: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '权限数',
      dataIndex: 'permissionIds',
      width: 90,
      render: (_, record) => record.permissionIds?.length || 0,
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
      width: 260,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={async () => {
              await updateRole(record.id || '', {
                ...record,
                status: record.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
              });
              message.success(record.status === 'ACTIVE' ? '已禁用' : '已启用');
              reload();
            }}
          >
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Button type="link" size="small" onClick={() => openPermissions(record)}>
            权限
          </Button>
          <Button
            danger
            type="link"
            size="small"
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<API.SystemRole>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        options={{ density: true, fullScreen: true, reload: true }}
        request={async () => {
          const result = await listRoles();
          return {
            data: result.data || [],
            success: true,
          };
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={openCreate}>
            创建角色
          </Button>,
        ]}
      />

      <ModalForm<API.SystemRole>
        key={editingRole?.id || 'create'}
        title={editingRole ? '编辑角色' : '创建角色'}
        open={roleModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setRoleModalOpen(false),
        }}
        initialValues={{
          status: 'ACTIVE',
          ...editingRole,
        }}
        onFinish={async (values) => {
          if (editingRole?.id) {
            await updateRole(editingRole.id, values);
            message.success('保存成功');
          } else {
            await createRole(values);
            message.success('创建成功');
          }
          setRoleModalOpen(false);
          reload();
          return true;
        }}
      >
        <ProFormText
          name="code"
          label="角色编码"
          rules={[{ required: true, message: '请输入角色编码' }]}
        />
        <ProFormText
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormText name="description" label="描述" />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>

      <Modal
        title={`绑定权限${permissionRole?.name ? `：${permissionRole.name}` : ''}`}
        open={permissionModalOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => setPermissionModalOpen(false)}
        onOk={async () => {
          if (!permissionRole?.id) {
            return;
          }
          await updateRolePermissions(
            permissionRole.id,
            checkedPermissionKeys.map(String),
          );
          message.success('权限已保存');
          setPermissionModalOpen(false);
          reload();
        }}
      >
        <Tree
          checkable
          defaultExpandAll
          treeData={treeData}
          checkedKeys={checkedPermissionKeys}
          expandedKeys={expandedKeys}
          onCheck={(keys) => {
            setCheckedPermissionKeys(Array.isArray(keys) ? keys : keys.checked);
          }}
        />
      </Modal>
    </>
  );
};

export default RoleManagement;
