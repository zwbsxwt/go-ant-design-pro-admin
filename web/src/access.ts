/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const menuPermissions = currentUser?.menuPermissions || [];
  const buttonPermissions = currentUser?.buttonPermissions || [];
  const isAdmin = currentUser?.access === 'admin';
  const hasMenuPermission = (code: string) =>
    isAdmin || menuPermissions.includes(code) || false;
  const hasButtonPermission = (code: string) =>
    isAdmin || buttonPermissions.includes(code) || false;

  return {
    hasButtonPermission,
    canAdmin: hasMenuPermission('menu.admin'),
    canManageSystem:
      hasMenuPermission('menu.system.menu') ||
      hasMenuPermission('menu.system.role') ||
      hasMenuPermission('menu.system.user'),
    canManageMenus: hasMenuPermission('menu.system.menu'),
    canManageRoles: hasMenuPermission('menu.system.role'),
    canManageUsers: hasMenuPermission('menu.system.user'),
    canCreateUsers: hasButtonPermission('button.system.user.create'),
    canUpdateUsers: hasButtonPermission('button.system.user.update'),
    canDeleteUsers: hasButtonPermission('button.system.user.delete'),
    canResetUserPasswords: hasButtonPermission(
      'button.system.user.reset-password',
    ),
    canBindUserRoles: hasButtonPermission('button.system.user.roles'),
  };
}
