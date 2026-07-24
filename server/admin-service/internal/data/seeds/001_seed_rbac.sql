INSERT INTO system_users (id, username, display_name, password_hash, avatar, email, phone, status)
VALUES
  ('user-admin', 'admin', 'Template Admin', 'sha256$d5befed9a171abd78a7d9c3ad6e9c24fe2c27d42213cd0b7d25bb75b7f6788ed', 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg', 'admin@example.local', '', 'ACTIVE'),
  ('user-normal', 'user', 'Template User', 'sha256$d5befed9a171abd78a7d9c3ad6e9c24fe2c27d42213cd0b7d25bb75b7f6788ed', NULL, 'user@example.local', '', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  password_hash = VALUES(password_hash),
  avatar = VALUES(avatar),
  email = VALUES(email),
  phone = VALUES(phone),
  status = VALUES(status);

INSERT INTO system_roles (id, code, name, description, status)
VALUES
  ('role-admin', 'admin', 'Administrator', 'Full local template administrator', 'ACTIVE'),
  ('role-user', 'user', 'User', 'Basic local template user', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO system_modules (id, code, name, icon, sort, status, hidden)
VALUES
  ('module-system', 'system', '系统设置', 'SettingOutlined', 10, 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  name = VALUES(name),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  hidden = VALUES(hidden);

INSERT INTO system_menus (id, module_id, parent_id, type, name, path, component, permission_code, icon, sort, status, hidden)
VALUES
  ('menu-dashboard', 'module-system', NULL, 'page', '欢迎', '/welcome', './Welcome', 'menu.dashboard', 'HomeOutlined', 10, 'ACTIVE', FALSE),
  ('menu-admin', 'module-system', NULL, 'page', '管理页', '/admin', './Admin', 'menu.admin', 'CrownOutlined', 20, 'ACTIVE', FALSE),
  ('menu-system', 'module-system', NULL, 'directory', '系统管理', '/system', '', 'menu.system', 'SettingOutlined', 30, 'ACTIVE', FALSE),
  ('menu-system-menu', 'module-system', 'menu-system', 'page', '菜单管理', '/system/menu', './System/Menu', 'menu.system.menu', 'MenuOutlined', 10, 'ACTIVE', FALSE),
  ('menu-system-menu-create', 'module-system', 'menu-system-menu', 'button', '创建菜单', '', '', 'button.system.menu.create', '', 10, 'ACTIVE', FALSE),
  ('menu-system-menu-update', 'module-system', 'menu-system-menu', 'button', '编辑菜单', '', '', 'button.system.menu.update', '', 20, 'ACTIVE', FALSE),
  ('menu-system-menu-delete', 'module-system', 'menu-system-menu', 'button', '删除菜单', '', '', 'button.system.menu.delete', '', 30, 'ACTIVE', FALSE),
  ('menu-system-module', 'module-system', 'menu-system', 'page', '模块管理', '/system/module', './System/Module', 'menu.system.module', 'AppstoreOutlined', 15, 'ACTIVE', FALSE),
  ('menu-system-module-create', 'module-system', 'menu-system-module', 'button', '创建模块', '', '', 'button.system.module.create', '', 10, 'ACTIVE', FALSE),
  ('menu-system-module-update', 'module-system', 'menu-system-module', 'button', '编辑模块', '', '', 'button.system.module.update', '', 20, 'ACTIVE', FALSE),
  ('menu-system-module-delete', 'module-system', 'menu-system-module', 'button', '删除模块', '', '', 'button.system.module.delete', '', 30, 'ACTIVE', FALSE),
  ('menu-system-role', 'module-system', 'menu-system', 'page', '角色管理', '/system/role', './System/Role', 'menu.system.role', 'TeamOutlined', 20, 'ACTIVE', FALSE),
  ('menu-system-role-create', 'module-system', 'menu-system-role', 'button', '创建角色', '', '', 'button.system.role.create', '', 10, 'ACTIVE', FALSE),
  ('menu-system-role-update', 'module-system', 'menu-system-role', 'button', '编辑角色', '', '', 'button.system.role.update', '', 20, 'ACTIVE', FALSE),
  ('menu-system-role-delete', 'module-system', 'menu-system-role', 'button', '删除角色', '', '', 'button.system.role.delete', '', 30, 'ACTIVE', FALSE),
  ('menu-system-role-permissions', 'module-system', 'menu-system-role', 'button', '绑定角色权限', '', '', 'button.system.role.permissions', '', 40, 'ACTIVE', FALSE),
  ('menu-system-user', 'module-system', 'menu-system', 'page', '用户管理', '/system/user', './System/User', 'menu.system.user', 'UserOutlined', 30, 'ACTIVE', FALSE),
  ('menu-system-user-create', 'module-system', 'menu-system-user', 'button', '创建用户', '', '', 'button.system.user.create', '', 10, 'ACTIVE', FALSE),
  ('menu-system-user-update', 'module-system', 'menu-system-user', 'button', '编辑用户', '', '', 'button.system.user.update', '', 20, 'ACTIVE', FALSE),
  ('menu-system-user-delete', 'module-system', 'menu-system-user', 'button', '删除用户', '', '', 'button.system.user.delete', '', 30, 'ACTIVE', FALSE),
  ('menu-system-user-reset-password', 'module-system', 'menu-system-user', 'button', '重置用户密码', '', '', 'button.system.user.reset-password', '', 40, 'ACTIVE', FALSE),
  ('menu-system-user-roles', 'module-system', 'menu-system-user', 'button', '绑定用户角色', '', '', 'button.system.user.roles', '', 50, 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE
  module_id = VALUES(module_id),
  parent_id = VALUES(parent_id),
  type = VALUES(type),
  name = VALUES(name),
  path = VALUES(path),
  component = VALUES(component),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  hidden = VALUES(hidden);

INSERT IGNORE INTO system_user_roles (user_id, role_id)
VALUES
  ('user-admin', 'role-admin'),
  ('user-normal', 'role-user');

INSERT IGNORE INTO system_role_menus (role_id, menu_id)
VALUES
  ('role-admin', 'menu-dashboard'),
  ('role-admin', 'menu-admin'),
  ('role-admin', 'menu-system'),
  ('role-admin', 'menu-system-menu'),
  ('role-admin', 'menu-system-menu-create'),
  ('role-admin', 'menu-system-menu-update'),
  ('role-admin', 'menu-system-menu-delete'),
  ('role-admin', 'menu-system-module'),
  ('role-admin', 'menu-system-module-create'),
  ('role-admin', 'menu-system-module-update'),
  ('role-admin', 'menu-system-module-delete'),
  ('role-admin', 'menu-system-role'),
  ('role-admin', 'menu-system-role-create'),
  ('role-admin', 'menu-system-role-update'),
  ('role-admin', 'menu-system-role-delete'),
  ('role-admin', 'menu-system-role-permissions'),
  ('role-admin', 'menu-system-user'),
  ('role-admin', 'menu-system-user-create'),
  ('role-admin', 'menu-system-user-update'),
  ('role-admin', 'menu-system-user-delete'),
  ('role-admin', 'menu-system-user-reset-password'),
  ('role-admin', 'menu-system-user-roles'),
  ('role-user', 'menu-dashboard');
