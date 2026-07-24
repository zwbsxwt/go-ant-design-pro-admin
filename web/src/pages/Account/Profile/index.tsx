import { UploadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
  App,
  Avatar,
  Button,
  Descriptions,
  Divider,
  Flex,
  Space,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import { createStyles } from 'antd-style';
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

const useStyles = createStyles(({ css, token }) => ({
  content: css`
    display: flex;
    align-items: flex-start;
    gap: ${token.paddingLG}px;

    @media (max-width: ${token.screenLG}px) {
      flex-direction: column;
    }
  `,
  profileCard: css`
    width: 320px;
    flex: 0 0 320px;

    @media (max-width: ${token.screenLG}px) {
      width: 100%;
      flex-basis: auto;
    }
  `,
  profileHeader: css`
    width: 100%;
  `,
  avatarBlock: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${token.marginMD}px;
    text-align: center;
  `,
  avatarHelp: css`
    display: block;
    max-width: 240px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeightSM};
  `,
  profileName: css`
    margin: 0;
  `,
  roleList: css`
    min-height: ${token.controlHeight}px;
  `,
  mainCard: css`
    min-width: 0;
    flex: 1;

    .ant-pro-card-body {
      padding-top: ${token.paddingSM + token.paddingXXS}px;
    }
  `,
  formContent: css`
    max-width: 560px;
    padding-top: ${token.paddingSM}px;
  `,
}));

const ProfilePage: React.FC = () => {
  const { styles } = useStyles();
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
  const avatar = profile?.avatar || initialState?.currentUser?.avatar;
  const roleCodes = profile?.roleCodes || [];

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
    <PageContainer title="个人中心">
      <div className={styles.content}>
        <ProCard className={styles.profileCard} title="账号资料">
          <Space
            className={styles.profileHeader}
            direction="vertical"
            size={20}
          >
            <div className={styles.avatarBlock}>
              <Avatar size={72} src={avatar}>
                {displayName.slice(0, 1)}
              </Avatar>
              <div>
                <Typography.Title level={4} className={styles.profileName}>
                  {displayName}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {profile?.username || '-'}
                </Typography.Text>
              </div>

              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={avatarUploading}>
                  上传头像
                </Button>
              </Upload>

              <Typography.Text className={styles.avatarHelp}>
                支持 PNG、JPEG、WebP，大小不超过 2 MB。
              </Typography.Text>
            </div>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="账号状态">
                <Tag color={profile?.status === 'ACTIVE' ? 'success' : 'default'}>
                  {profile?.status === 'ACTIVE' ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Flex className={styles.roleList} gap={4} wrap>
                  {roleCodes.length > 0 ? (
                    roleCodes.map((role) => <Tag key={role}>{role}</Tag>)
                  ) : (
                    <Typography.Text type="secondary">暂无角色</Typography.Text>
                  )}
                </Flex>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </ProCard>

        <ProCard className={styles.mainCard}>
          <Tabs
            items={[
              {
                key: 'profile',
                label: '基本资料',
                children: (
                  <div className={styles.formContent}>
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
                        placeholder="请输入显示名称"
                        rules={[
                          { required: true, message: '请输入显示名称' },
                          { max: 64, message: '显示名称不能超过 64 个字符' },
                        ]}
                      />
                      <ProFormText
                        name="email"
                        label="邮箱"
                        placeholder="请输入邮箱"
                        rules={[
                          { type: 'email', message: '请输入正确的邮箱格式' },
                          { max: 128, message: '邮箱不能超过 128 个字符' },
                        ]}
                      />
                      <ProFormText
                        name="phone"
                        label="手机号"
                        placeholder="请输入手机号"
                        rules={[
                          { max: 32, message: '手机号不能超过 32 个字符' },
                          {
                            pattern: /^[0-9+\-\s()]*$/,
                            message: '手机号只能包含数字和常见分隔符',
                          },
                        ]}
                      />
                    </ProForm>
                  </div>
                ),
              },
              {
                key: 'password',
                label: '修改密码',
                children: (
                  <div className={styles.formContent}>
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
                        placeholder="请输入当前密码"
                        rules={[{ required: true, message: '请输入当前密码' }]}
                      />
                      <ProFormText.Password
                        name="newPassword"
                        label="新密码"
                        placeholder="请输入新密码"
                        rules={[
                          { required: true, message: '请输入新密码' },
                          { min: 6, message: '密码至少 6 位' },
                        ]}
                      />
                      <ProFormText.Password
                        name="confirmPassword"
                        label="确认新密码"
                        placeholder="请再次输入新密码"
                        dependencies={['newPassword']}
                        rules={[
                          { required: true, message: '请再次输入新密码' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue('newPassword') === value
                              ) {
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
                  </div>
                ),
              },
            ]}
          />
        </ProCard>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
