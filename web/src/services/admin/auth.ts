import { currentUser, login, outLogin } from '@/services/ant-design-pro/api';
import { clearAuthState, setAuthToken } from '@/utils/authState';

export async function loginAccount(params: API.LoginParams) {
  const rawResult = await login({ ...params, type: params.type || 'account' });
  const result = normalizeLoginResult(rawResult);
  if (result.status === 'ok' && result.token) {
    setAuthToken(result.token);
  }
  return result;
}

export async function queryCurrentUser(options?: { [key: string]: any }) {
  const result = await currentUser(options);
  return {
    ...result,
    data: normalizeCurrentUser(result.data),
  };
}

export async function logoutAccount(options?: { [key: string]: any }) {
  try {
    return await outLogin(options);
  } finally {
    clearAuthState();
  }
}

function normalizeLoginResult(result: API.LoginResult) {
  const raw = result as API.LoginResult & {
    current_authority?: string;
    expires_at?: API.LoginResult['expiresAt'];
    error_message?: string;
  };
  return {
    ...result,
    currentAuthority: result.currentAuthority ?? raw.current_authority,
    expiresAt: result.expiresAt ?? raw.expires_at,
    errorMessage: result.errorMessage ?? raw.error_message,
  };
}

function normalizeCurrentUser(user?: API.CurrentUser) {
  if (!user) {
    return user;
  }
  const raw = user as API.CurrentUser & {
    userid?: string;
    menu_permissions?: string[];
  };
  const normalized = { ...user };
  if (normalized.userid === undefined && raw.userid !== undefined) {
    normalized.userid = raw.userid;
  }
  if (
    normalized.menuPermissions === undefined &&
    raw.menu_permissions !== undefined
  ) {
    normalized.menuPermissions = raw.menu_permissions;
  }
  return normalized;
}
