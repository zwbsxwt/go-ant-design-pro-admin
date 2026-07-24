export default [
  {
    path: "/user",
    layout: false,
    routes: [
      {
        name: "login",
        path: "/user/login",
        component: "./user/login",
      },
      {
        path: "/user",
        redirect: "/user/login",
      },
      {
        component: "./exception/404",
        path: "/user/*",
      },
    ],
  },
  {
    path: "/welcome",
    name: "welcome",
    icon: "smile",
    component: "./Welcome",
    permissionCode: "menu.dashboard",
  },
  {
    path: "/admin",
    name: "admin",
    icon: "crown",
    permissionCode: "menu.admin",
    routes: [
      {
        path: "/admin",
        redirect: "/admin/sub-page",
      },
      {
        path: "/admin/sub-page",
        name: "sub-page",
        component: "./Admin",
      },
    ],
  },
  {
    path: "/system",
    name: "system",
    icon: "setting",
    permissionCode: "menu.system",
    routes: [
      {
        path: "/system",
        redirect: "/system/menu",
      },
      {
        path: "/system/menu",
        name: "menu",
        icon: "menu",
        component: "./System/Menu",
        permissionCode: "menu.system.menu",
      },
      {
        path: "/system/module",
        name: "module",
        icon: "appstore",
        component: "./System/Module",
        permissionCode: "menu.system.module",
      },
      {
        path: "/system/role",
        name: "role",
        icon: "team",
        component: "./System/Role",
        permissionCode: "menu.system.role",
      },
      {
        path: "/system/user",
        name: "user",
        icon: "user",
        component: "./System/User",
        permissionCode: "menu.system.user",
      },
    ],
  },
  {
    path: "/account/profile",
    name: "profile",
    component: "./Account/Profile",
    hideInMenu: true,
  },
  {
    path: "/exception/403",
    component: "./exception/403",
    layout: false,
  },
  {
    path: "/",
    redirect: "/welcome",
  },
  {
    component: "./exception/404",
    layout: false,
    path: "/*",
  },
];
