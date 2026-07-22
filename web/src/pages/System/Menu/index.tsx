import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { App, Button, Space, Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  createMenu,
  deleteMenu,
  listMenus,
  updateMenu,
} from '@/services/system/menu';

const menuTypeOptions = [
  { label: '目录', value: 'directory' },
  { label: '页面', value: 'page' },
  { label: '按钮', value: 'button' },
];

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
];

const typeColor: Record<string, string> = {
  directory: 'blue',
  page: 'green',
  button: 'gold',
};

const typeLabel: Record<string, string> = {
  directory: '目录',
  page: '页面',
  button: '按钮',
};

const flattenMenus = (menus: API.SystemMenu[] = []): API.SystemMenu[] =>
  menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);

const MenuManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { message, modal } = App.useApp();
  const [menus, setMenus] = useState<API.SystemMenu[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<API.SystemMenu>();

  const parentOptions = useMemo(
    () =>
      flattenMenus(menus)
        .filter((menu) => menu.type !== 'button' && menu.id !== editingMenu?.id)
        .map((menu) => ({
          label: `${menu.name} (${menu.permissionCode})`,
          value: menu.id || '',
        })),
    [editingMenu?.id, menus],
  );

  const openCreate = () => {
    setEditingMenu(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: API.SystemMenu) => {
    setEditingMenu(record);
    setModalOpen(true);
  };

  const reload = () => actionRef.current?.reload();

  const handleDelete = (record: API.SystemMenu) => {
    modal.confirm({
      title: '删除菜单',
      content: `确认删除 ${record.name}？存在子节点或角色绑定时后端会阻止删除。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteMenu(record.id || '');
        message.success('删除成功');
        reload();
      },
    });
  };

  const columns: ProColumns<API.SystemMenu>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (_, record) => (
        <Tag color={typeColor[record.type || '']}>
          {typeLabel[record.type || ''] || record.type}
        </Tag>
      ),
    },
    {
      title: '权限编码',
      dataIndex: 'permissionCode',
      ellipsis: true,
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      ellipsis: true,
    },
    {
      title: '组件',
      dataIndex: 'component',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      sorter: (a, b) => (a.sort || 0) - (b.sort || 0),
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
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={async () => {
              await updateMenu(record.id || '', {
                ...record,
                status: record.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
              });
              message.success(record.status === 'ACTIVE' ? '已禁用' : '已启用');
              reload();
            }}
          >
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
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
      <ProTable<API.SystemMenu>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={false}
        options={{ density: true, fullScreen: true, reload: true }}
        expandable={{
          expandedRowKeys: flattenMenus(menus)
            .map((menu) => menu.id)
            .filter(Boolean) as string[],
        }}
        request={async () => {
          const result = await listMenus();
          const data = result.data || [];
          setMenus(data);
          return {
            data,
            success: true,
          };
        }}
        toolBarRender={() =>
          access.canManageMenus
            ? [
                <Button key="create" type="primary" onClick={openCreate}>
                  创建菜单
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<API.SystemMenu>
        key={editingMenu?.id || 'create'}
        title={editingMenu ? '编辑菜单' : '新建菜单'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={{
          type: 'page',
          status: 'ACTIVE',
          sort: 0,
          ...editingMenu,
        }}
        onFinish={async (values) => {
          if (editingMenu?.id) {
            await updateMenu(editingMenu.id, values);
            message.success('保存成功');
          } else {
            await createMenu(values);
            message.success('创建成功');
          }
          setModalOpen(false);
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormSelect
          name="type"
          label="类型"
          options={menuTypeOptions}
          rules={[{ required: true, message: '请选择类型' }]}
        />
        <ProFormSelect
          name="parentId"
          label="父级"
          allowClear
          options={parentOptions}
        />
        <ProFormText name="path" label="路由路径" />
        <ProFormText name="component" label="组件标识" />
        <ProFormText
          name="permissionCode"
          label="权限编码"
          rules={[{ required: true, message: '请输入权限编码' }]}
        />
        <ProFormText name="icon" label="图标" />
        <ProFormDigit
          name="sort"
          label="排序"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>
    </>
  );
};

export default MenuManagement;
