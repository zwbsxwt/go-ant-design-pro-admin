declare namespace API {
  type CurrentUser = {
    userid?: string;
    name?: string;
    username?: string;
    avatar?: string;
    access?: string;
    role?: string;
    roleCodes?: string[];
    status?: string;
    menuPermissions?: string[];
    buttonPermissions?: string[];
    menus?: CurrentUserMenu[];
    menu_tree?: CurrentUserMenu[];
  };

  type CurrentUserMenu = {
    id?: string;
    parentId?: string;
    parent_id?: string;
    type?: 'directory' | 'page';
    name?: string;
    path?: string;
    component?: string;
    permissionCode?: string;
    permission_code?: string;
    icon?: string;
    sort?: number;
    status?: 'ACTIVE' | 'DISABLED';
    children?: CurrentUserMenu[];
  };

  type SystemMenu = {
    id?: string;
    parentId?: string;
    parent_id?: string;
    type?: 'directory' | 'page' | 'button';
    name?: string;
    path?: string;
    component?: string;
    permissionCode?: string;
    permission_code?: string;
    icon?: string;
    sort?: number;
    status?: 'ACTIVE' | 'DISABLED';
    children?: SystemMenu[];
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
  };

  type SystemMenuList = {
    data?: SystemMenu[];
  };

  type SystemRole = {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'DISABLED';
    permissionIds?: string[];
    permission_ids?: string[];
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
  };

  type SystemRoleList = {
    data?: SystemRole[];
  };

  type SystemUser = {
    id?: string;
    username?: string;
    displayName?: string;
    display_name?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    status?: 'ACTIVE' | 'DISABLED';
    roleIds?: string[];
    role_ids?: string[];
    roleCodes?: string[];
    role_codes?: string[];
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    password?: string;
  };

  type SystemUserList = {
    data?: SystemUser[];
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
