declare namespace API {
  type CurrentUser = {
    userid?: string;
    name?: string;
    username?: string;
    avatar?: string;
    access?: string;
    role?: string;
    status?: string;
    menuPermissions?: string[];
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
    token?: string;
    expiresAt?: string;
    errorMessage?: string;
  };
}
