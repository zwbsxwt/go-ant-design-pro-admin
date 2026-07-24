import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { useAccess } from "@umijs/max";
import { App, Button, Space, Tag } from "antd";
import React, { useMemo, useRef, useState } from "react";
import {
  createModule,
  listModules,
  migrateModuleMenus,
  updateModule,
} from "@/services/system/module";

const statusOptions = [
  { label: "启用", value: "ACTIVE" },
  { label: "禁用", value: "DISABLED" },
];

const ModuleManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { message } = App.useApp();
  const [modules, setModules] = useState<API.SystemModule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<API.SystemModule>();
  const [deletingModule, setDeletingModule] = useState<API.SystemModule>();

  const reload = () => actionRef.current?.reload();

  const targetModuleOptions = useMemo(
    () =>
      modules
        .filter(
          (module) =>
            module.id &&
            module.id !== deletingModule?.id &&
            module.status === "ACTIVE"
        )
        .map((module) => ({
          label: `${module.name || module.code} (${module.code})`,
          value: module.id || "",
        })),
    [deletingModule?.id, modules]
  );

  const openCreate = () => {
    setEditingModule(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: API.SystemModule) => {
    setEditingModule(record);
    setModalOpen(true);
  };

  const openDelete = (record: API.SystemModule) => {
    setDeletingModule(record);
    setMigrateOpen(true);
  };

  const columns: ProColumns<API.SystemModule>[] = [
    {
      title: "模块编码",
      dataIndex: "code",
      ellipsis: true,
    },
    {
      title: "名称",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "图标",
      dataIndex: "icon",
      ellipsis: true,
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
      sorter: (a, b) => (a.sort || 0) - (b.sort || 0),
    },
    {
      title: "展示",
      dataIndex: "hidden",
      width: 90,
      render: (_, record) => (
        <Tag color={record.hidden ? "default" : "processing"}>
          {record.hidden ? "隐藏" : "显示"}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (_, record) => (
        <Tag color={record.status === "ACTIVE" ? "success" : "default"}>
          {record.status === "ACTIVE" ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 280,
      render: (_, record) => (
        <Space size="small">
          {access.canUpdateModules && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {access.canUpdateModules && (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                await updateModule(record.id || "", {
                  ...record,
                  hidden: !record.hidden,
                });
                message.success(record.hidden ? "已显示" : "已隐藏");
                reload();
              }}
            >
              {record.hidden ? "显示" : "隐藏"}
            </Button>
          )}
          {access.canUpdateModules && (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                await updateModule(record.id || "", {
                  ...record,
                  status: record.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                });
                message.success(
                  record.status === "ACTIVE" ? "已禁用" : "已启用"
                );
                reload();
              }}
            >
              {record.status === "ACTIVE" ? "禁用" : "启用"}
            </Button>
          )}
          {access.canDeleteModules && (
            <Button
              danger
              type="link"
              size="small"
              onClick={() => openDelete(record)}
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
      <ProTable<API.SystemModule>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        options={{ density: true, fullScreen: true, reload: true }}
        request={async () => {
          const result = await listModules();
          const data = result.data || [];
          setModules(data);
          return {
            data,
            success: true,
          };
        }}
        toolBarRender={() =>
          access.canCreateModules
            ? [
                <Button key="create" type="primary" onClick={openCreate}>
                  创建模块
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<API.SystemModule>
        key={editingModule?.id || "create"}
        title={editingModule ? "编辑模块" : "新建模块"}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={{
          status: "ACTIVE",
          sort: 0,
          hidden: false,
          icon: "AppstoreOutlined",
          ...editingModule,
        }}
        onFinish={async (values) => {
          if (editingModule?.id) {
            await updateModule(editingModule.id, values);
            message.success("保存成功");
          } else {
            await createModule(values);
            message.success("创建成功");
          }
          setModalOpen(false);
          reload();
          return true;
        }}
      >
        <ProFormText
          name="code"
          label="模块编码"
          rules={[{ required: true, message: "请输入模块编码" }]}
        />
        <ProFormText
          name="name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }]}
        />
        <ProFormText name="icon" label="图标" />
        <ProFormDigit
          name="sort"
          label="排序"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSwitch name="hidden" label="隐藏" />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: "请选择状态" }]}
        />
      </ModalForm>

      <ModalForm<{ targetModuleId: string }>
        key={deletingModule?.id || "delete"}
        title="迁移并删除模块"
        open={migrateOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMigrateOpen(false),
          okButtonProps: { danger: true },
        }}
        onFinish={async ({ targetModuleId }) => {
          await migrateModuleMenus(deletingModule?.id || "", targetModuleId);
          message.success("模块已删除，菜单已迁移");
          setMigrateOpen(false);
          setDeletingModule(undefined);
          reload();
          return true;
        }}
      >
        <ProFormSelect
          name="targetModuleId"
          label="目标模块"
          options={targetModuleOptions}
          rules={[{ required: true, message: "请选择目标模块" }]}
        />
      </ModalForm>
    </>
  );
};

export default ModuleManagement;
