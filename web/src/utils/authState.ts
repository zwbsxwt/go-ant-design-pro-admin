const TOKEN_KEY = 'template_v6_token';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) || '';
};

export const setAuthToken = (token?: string) => {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
};

export const clearAuthState = () => {
  setAuthToken();
};
