import { UploadOutlined } from '@ant-design/icons';
import { ProCard, ProForm, ProFormText } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
  App,
  Avatar,
  Button,
  Col,
  Descriptions,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import React, { useEffect, useState } from 'react';
import { queryCurrentUser } from '@/services/admin/auth';
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} from '@/services/profile/profile';
import { clearAuthState } from '@/utils/authState';

type ProfileFormValues = {
  displayName?: string;
  email?: string;
  phone?: string;
};

type PasswordFormValues = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const avatarMaxSize = 2 * 1024 * 1024;
const avatarTypes = ['image/png', 'image/jpeg', 'image/webp'];

const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [profile, setProfile] = useState<API.Profile>();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileForm] = ProForm.useForm<ProfileFormValues>();
  const [passwordForm] = ProForm.useForm<PasswordFormValues>();

  const refreshProfile = async () => {
    const result = await getProfile();
    setProfile(result.data);
    profileForm.setFieldsValue({
      displayName: result.data?.displayName,
      email: result.data?.email,
      phone: result.data?.phone,
    });
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const syncCurrentUser = async () => {
    const result = await queryCurrentUser({ skipErrorHandler: true });
    setInitialState((state) => ({
      ...state,
      currentUser: result.data,
    }));
  };

  const displayName =
    profile?.displayName || initialState?.currentUser?.name || '用户';

  const uploadProps: UploadProps = {
    accept: avatarTypes.join(','),
    maxCount: 1,
    showUploadList: false,
    beforeUpload: (file) => {
      if (!avatarTypes.includes(file.type)) {
        message.error('头像仅支持 PNG、JPEG、WebP');
        return Upload.LIST_IGNORE;
      }
      if (file.size > avatarMaxSize) {
        message.error('头像大小不能超过 2 MB');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onError, onSuccess }) => {
      try {
        setAvatarUploading(true);
        const result = await uploadAvatar(file as File);
        if (result.profile) {
          setProfile(result.profile);
        }
        await syncCurrentUser();
        message.success('头像已更新');
        onSuccess?.(result);
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setAvatarUploading(false);
      }
    },
  };

  return (
    <ProCard split="vertical" gutter={16}>
      <ProCard colSpan={{ xs: 24, md: 8 }} title="个人信息">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space size={16}>
            <Avatar size={64} src={profile?.avatar}>
              {displayName.slice(0, 1)}
            </Avatar>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {displayName}
              </Typography.Title>
              <Typography.Text type="secondary">
                {profile?.username}
              </Typography.Text>
            </div>
          </Space>

          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} loading={avatarUploading}>
              上传头像
            </Button>
          </Upload>

          <Typography.Text type="secondary">
            支持 PNG、JPEG、WebP，大小不超过 2 MB。
          </Typography.Text>

          <Descriptions column={1} size="small">
            <Descriptions.Item label="账号状态">
              <Tag color={profile?.status === 'ACTIVE' ? 'success' : 'default'}>
                {profile?.status === 'ACTIVE' ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Space size={[0, 4]} wrap>
                {(profile?.roleCodes || []).map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </ProCard>

      <ProCard title="个人中心">
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <ProCard title="基本资料">
              <ProForm<ProfileFormValues>
                form={profileForm}
                layout="vertical"
                submitter={{
                  searchConfig: {
                    submitText: '保存资料',
                  },
                  resetButtonProps: false,
                }}
                onFinish={async (values) => {
                  const result = await updateProfile(values);
                  setProfile(result.data);
                  await syncCurrentUser();
                  message.success('个人资料已保存');
                  return true;
                }}
              >
                <ProFormText
                  name="displayName"
                  label="显示名称"
                  rules={[
                    { required: true, message: '请输入显示名称' },
                    { max: 64, message: '显示名称不能超过 64 个字符' },
                  ]}
                />
                <ProFormText
                  name="email"
                  label="邮箱"
                  rules={[
                    { type: 'email', message: '请输入正确的邮箱格式' },
                    { max: 128, message: '邮箱不能超过 128 个字符' },
                  ]}
                />
                <ProFormText
                  name="phone"
                  label="手机号"
                  rules={[
                    { max: 32, message: '手机号不能超过 32 个字符' },
                    {
                      pattern: /^[0-9+\-\s()]*$/,
                      message: '手机号只能包含数字和常见分隔符',
                    },
                  ]}
                />
              </ProForm>
            </ProCard>
          </Col>

          <Col xs={24} lg={12}>
            <ProCard title="修改密码">
              <ProForm<PasswordFormValues>
                form={passwordForm}
                layout="vertical"
                submitter={{
                  searchConfig: {
                    submitText: '修改密码',
                  },
                  resetButtonProps: false,
                }}
                onFinish={async (values) => {
                  await changePassword(values);
                  clearAuthState();
                  setInitialState((state) => ({
                    ...state,
                    currentUser: undefined,
                  }));
                  message.success('密码已修改，请重新登录');
                  history.replace('/user/login');
                  return true;
                }}
              >
                <ProFormText.Password
                  name="currentPassword"
                  label="当前密码"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                />
                <ProFormText.Password
                  name="newPassword"
                  label="新密码"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]}
                />
                <ProFormText.Password
                  name="confirmPassword"
                  label="确认新密码"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: '请再次输入新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error('两次输入的新密码不一致'),
                        );
                      },
                    }),
                  ]}
                />
              </ProForm>
            </ProCard>
          </Col>
        </Row>
      </ProCard>
    </ProCard>
  );
};

export default ProfilePage;
