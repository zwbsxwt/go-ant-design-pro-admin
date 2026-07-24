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
    modules?: CurrentUserModule[];
    menus?: CurrentUserMenu[];
    menu_tree?: CurrentUserMenu[];
  };

  type CurrentUserModule = {
    id?: string;
    code?: string;
    name?: string;
    icon?: string;
    sort?: number;
    status?: "ACTIVE" | "DISABLED";
    hidden?: boolean;
  };

  type CurrentUserMenu = {
    id?: string;
    moduleId?: string;
    module_id?: string;
    parentId?: string;
    parent_id?: string;
    type?: "directory" | "page";
    name?: string;
    path?: string;
    component?: string;
    permissionCode?: string;
    permission_code?: string;
    icon?: string;
    sort?: number;
    status?: "ACTIVE" | "DISABLED";
    hidden?: boolean;
    children?: CurrentUserMenu[];
  };

  type SystemMenu = {
    id?: string;
    moduleId?: string;
    module_id?: string;
    parentId?: string;
    parent_id?: string;
    type?: "directory" | "page" | "button";
    name?: string;
    path?: string;
    component?: string;
    permissionCode?: string;
    permission_code?: string;
    icon?: string;
    sort?: number;
    status?: "ACTIVE" | "DISABLED";
    hidden?: boolean;
    children?: SystemMenu[];
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
  };

  type SystemMenuList = {
    data?: SystemMenu[];
  };

  type SystemModule = {
    id?: string;
    code?: string;
    name?: string;
    icon?: string;
    sort?: number;
    status?: "ACTIVE" | "DISABLED";
    hidden?: boolean;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
  };

  type SystemModuleList = {
    data?: SystemModule[];
  };

  type SystemRole = {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    status?: "ACTIVE" | "DISABLED";
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
    status?: "ACTIVE" | "DISABLED";
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

  type Profile = {
    id?: string;
    username?: string;
    displayName?: string;
    display_name?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    status?: "ACTIVE" | "DISABLED";
    roleCodes?: string[];
    role_codes?: string[];
  };

  type UpdateProfileParams = {
    displayName?: string;
    display_name?: string;
    email?: string;
    phone?: string;
  };

  type ChangePasswordParams = {
    currentPassword?: string;
    current_password?: string;
    newPassword?: string;
    new_password?: string;
    confirmPassword?: string;
    confirm_password?: string;
  };

  type UploadAvatarResult = {
    avatar?: string;
    profile?: Profile;
    data?: {
      avatar?: string;
      profile?: Profile;
    };
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
