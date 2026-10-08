import { LockOutlined, QrcodeOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import appConfig from '@root/config/appConfig';
import { Helmet, SelectLang, useIntl, useModel } from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import React, { startTransition, useState } from 'react';
import { loginAccount } from '@/services/admin/auth';
import Settings from '../../../../config/defaultSettings';

const getSafeRedirectUrl = (redirect: string | null): string => {
  if (!redirect?.startsWith('/')) return '/';
  if (redirect.startsWith('//')) return '/';

  try {
    const parsed = new URL(redirect, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
};

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: `radial-gradient(ellipse at 15% 90%, ${token.colorPrimaryBg} 0, transparent 38%), radial-gradient(ellipse at 95% 75%, #eaf2ff 0, transparent 34%), #f7f8fd`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 76,
    paddingInline: 'clamp(20px, 3vw, 40px)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: token.colorText,
    fontSize: 19,
    fontWeight: 650,
    letterSpacing: '-.02em',
    '& img': { width: 42, height: 42, objectFit: 'contain' },
  },
  lang: {
    minWidth: 42,
    minHeight: 42,
    borderRadius: token.borderRadius,
    '&:hover': { backgroundColor: token.colorBgTextHover },
  },
  loginContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: 'min(100% - 48px, 1040px)',
    marginInline: 'auto',
    flex: 1,
    paddingBlock: '44px 72px',
    '@media (max-width: 760px)': { paddingBlock: '24px 48px' },
    '@media (max-width: 420px)': { width: 'min(100% - 32px, 1040px)' },
  },
  introduction: {
    marginBottom: 40,
    textAlign: 'center',
    '& h1': { margin: 0, color: token.colorText, fontSize: 'clamp(32px, 4.2vw, 56px)', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-.04em' },
    '& h1 span': { color: token.colorPrimary },
    '& p': { margin: '14px 0 0', color: token.colorTextSecondary, fontSize: 17 },
    '@media (max-width: 760px)': { marginBottom: 28, '& p': { fontSize: 14 } },
  },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(250px, .8fr) minmax(0, 1.4fr)',
    gap: 0,
    minHeight: 520,
    padding: '64px clamp(32px, 5vw, 70px)',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 12,
    background: token.colorBgContainer,
    boxShadow: '0 20px 60px rgba(28, 48, 99, .07)',
    '@media (max-width: 760px)': { gridTemplateColumns: 'minmax(0, 1fr)', padding: '28px 24px', minHeight: 0 },
    '@media (max-width: 420px)': { paddingInline: 18 },
  },
  scanPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingRight: 'clamp(24px, 4vw, 64px)',
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    '& h2': { margin: '0 0 12px', fontSize: 30, lineHeight: 1.3 },
    '& p': { margin: 0, color: token.colorTextSecondary, lineHeight: 1.7 },
    '@media (max-width: 760px)': { padding: '0 0 24px', borderRight: 0, borderBottom: `1px solid ${token.colorBorderSecondary}` },
  },
  scanPreview: {
    display: 'grid',
    placeItems: 'center',
    width: 190,
    height: 190,
    marginTop: 28,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: 12,
    background: token.colorFillQuaternary,
    color: token.colorTextTertiary,
    '& .anticon': { fontSize: 56 },
    '& span': { fontSize: 13 },
    '@media (max-width: 760px)': { display: 'none' },
  },
  scanNote: { marginTop: 18, color: token.colorTextTertiary, fontSize: 13, '@media (max-width: 760px)': { marginTop: 8 } },
  formPanel: {
    minWidth: 0,
    paddingLeft: 'clamp(28px, 5vw, 76px)',
    '@media (max-width: 760px)': { padding: '28px 0 0' },
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(14px, 2.4vw, 32px)',
    marginBottom: 44,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    whiteSpace: 'nowrap',
    overflowX: 'auto',
    '& button': { position: 'relative', flex: 'none', padding: '0 0 16px', border: 0, background: 'none', color: token.colorTextSecondary, font: 'inherit', fontWeight: 600, cursor: 'pointer' },
    '& button[aria-selected="true"]': { color: token.colorPrimary },
    '& button[aria-selected="true"]::after': { position: 'absolute', right: 0, bottom: 0, left: 0, height: 3, borderRadius: 3, background: token.colorPrimary, content: '""' },
    '@media (max-width: 760px)': { marginBottom: 28 },
  },
  form: {
    '& .ant-pro-form-login-container': { width: '100%', padding: 0 },
    '& .ant-pro-form-login-top': {
      display: 'none',
    },
    '& .ant-pro-form-login-main': { width: '100% !important', maxWidth: 'none' },
    '& .ant-input-affix-wrapper': { minHeight: 52, borderRadius: 6 },
    '& .ant-form-item': { marginBottom: 20 },
    '& .ant-pro-form-login-main .ant-btn-primary': { height: 52, marginTop: 10, borderRadius: 6, fontWeight: 600 },
  },
  helper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pendingHint: { color: token.colorTextTertiary, fontSize: 12 },
  unavailable: {
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'center',
    minHeight: 290,
    padding: 24,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: 8,
    background: token.colorFillQuaternary,
    textAlign: 'center',
    '& .anticon': { marginBottom: 14, color: token.colorPrimary, fontSize: 32 },
    '& strong': { fontSize: 18 },
    '& p': { margin: '8px 0 0', color: token.colorTextSecondary },
  },
}));

const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    title={content}
    type="error"
    showIcon
  />
);

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [loginMethod, setLoginMethod] = useState<'account' | 'phone' | 'passkey'>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      startTransition(() => {
        setInitialState((state) => ({
          ...state,
          currentUser: userInfo,
        }));
      });
    }
    return userInfo;
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const msg = await loginAccount({ ...values, type: 'account' });
      if (msg.status !== 'ok') {
        setUserLoginState(msg);
        return;
      }

      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        message.error('登录成功，但获取当前用户失败，请刷新后重试');
        return;
      }

      message.success(
        intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功',
        }),
      );
      const urlParams = new URL(window.location.href).searchParams;
      window.location.href = getSafeRedirectUrl(urlParams.get('redirect'));
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败，请重试',
        }),
      );
      console.error('login failed', error);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <header className={styles.header}>
        <div className={styles.brand}><img alt="" src="/icons/icon-128x128.png" />{appConfig.name}</div>
        <div className={styles.lang} data-lang>{SelectLang && <SelectLang />}</div>
      </header>
      <main className={styles.loginContent}>
        <div className={styles.introduction}>
          <h1><span>Admin Console</span> · 高效管理你的工作台</h1>
          <p>安全连接你的后台管理与工作流</p>
        </div>
        <div className={styles.card}>
          <section className={styles.scanPanel} aria-label="扫码登录">
            <h2>欢迎回来</h2>
            <p>登录后继续你的市场研究与工作流。</p>
            <div className={styles.scanPreview} aria-hidden="true"><QrcodeOutlined /><span>扫码登录即将开放</span></div>
            <div className={styles.scanNote}>扫码登录 · 暂未开放</div>
          </section>
          <section className={styles.formPanel} aria-label="登录方式">
            <div className={styles.tabs} role="tablist" aria-label="选择登录方式">
              {([['account', '账号密码'], ['phone', '手机号登录'], ['passkey', '通行密钥']] as const).map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={loginMethod === key} onClick={() => setLoginMethod(key)}>{label}</button>
              ))}
            </div>
            {loginMethod === 'account' ? <div className={styles.form}>
              <LoginForm
                containerStyle={{ width: '100%' }}
                contentStyle={{ width: '100%', minWidth: 0, maxWidth: 'none' }}
                logo={false}
                title={false}
                subTitle={false}
                submitter={{ searchConfig: { submitText: '立即登录' } }}
                initialValues={{ autoLogin: true }}
                onFinish={async (values) => { await handleSubmit(values as API.LoginParams); }}
              >
                {userLoginState.status === 'error' && <LoginMessage content="用户名或密码错误" />}
                <ProFormText name="username" fieldProps={{ size: 'large', prefix: <UserOutlined /> }} placeholder="用户名" rules={[{ required: true, message: '请输入用户名' }]} />
                <ProFormText.Password name="password" fieldProps={{ size: 'large', prefix: <LockOutlined /> }} placeholder="密码" rules={[{ required: true, message: '请输入密码' }]} />
                <div className={styles.helper}><ProFormCheckbox noStyle name="autoLogin">自动登录</ProFormCheckbox><span className={styles.pendingHint}>忘记密码 · 暂未开放</span></div>
              </LoginForm>
            </div> : <div className={styles.unavailable} role="tabpanel">
              <SafetyCertificateOutlined />
              <strong>{loginMethod === 'phone' ? '手机号登录' : '通行密钥登录'}暂未开放</strong>
              <p>请切换到账号密码登录。</p>
            </div>}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Login;
