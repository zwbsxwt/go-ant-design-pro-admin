export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        component: './exception/404',
        path: '/user/*',
      },
    ],
  },
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
    permissionCode: 'menu.dashboard',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',
    permissionCode: 'menu.admin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/sub-page',
      },
      {
        path: '/admin/sub-page',
        name: 'sub-page',
        component: './Admin',
      },
    ],
  },
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    access: 'canManageSystem',
    permissionCode: 'menu.system',
    routes: [
      {
        path: '/system',
        redirect: '/system/menu',
      },
      {
        path: '/system/menu',
        name: 'menu',
        icon: 'menu',
        component: './System/Menu',
        access: 'canManageMenus',
        permissionCode: 'menu.system.menu',
      },
      {
        path: '/system/role',
        name: 'role',
        icon: 'team',
        component: './System/Role',
        access: 'canManageRoles',
        permissionCode: 'menu.system.role',
      },
      {
        path: '/system/user',
        name: 'user',
        icon: 'user',
        component: './System/User',
        access: 'canManageUsers',
        permissionCode: 'menu.system.user',
      },
    ],
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './exception/404',
    layout: false,
    path: '/*',
  },
];
