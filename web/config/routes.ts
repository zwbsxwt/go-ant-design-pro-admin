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
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',
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
    routes: [
      {
        path: '/system',
        redirect: '/system/menu',
      },
      {
        path: '/system/menu',
        name: 'menu',
        component: './System/Menu',
        access: 'canManageMenus',
      },
      {
        path: '/system/role',
        name: 'role',
        component: './System/Role',
        access: 'canManageRoles',
      },
      {
        path: '/system/user',
        name: 'user',
        component: './System/User',
        access: 'canManageUsers',
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
