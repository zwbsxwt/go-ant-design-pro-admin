-- Harness workspace module: console shell entry + agent session permissions.
-- Idempotent: safe to run on every startup (ON DUPLICATE KEY / INSERT IGNORE).

INSERT INTO system_modules (id, code, name, icon, sort, status, hidden)
VALUES
  ('module-harness', 'harness', '智能工作台', 'MessageOutlined', 5, 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  name = VALUES(name),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  hidden = VALUES(hidden);

INSERT INTO system_menus (id, module_id, parent_id, type, name, path, component, permission_code, icon, sort, status, hidden)
VALUES
  ('menu-harness', 'module-harness', NULL, 'page', 'Agent 会话', '/harness', './Harness', 'menu.harness', 'MessageOutlined', 10, 'ACTIVE', FALSE),
  ('button-harness-session-create', 'module-harness', 'menu-harness', 'button', '新建/重命名会话', '', '', 'button.harness.session.create', '', 10, 'ACTIVE', FALSE),
  ('button-harness-session-delete', 'module-harness', 'menu-harness', 'button', '删除会话与工作区', '', '', 'button.harness.session.delete', '', 20, 'ACTIVE', FALSE),
  ('button-harness-message-send', 'module-harness', 'menu-harness', 'button', '发送消息', '', '', 'button.harness.message.send', '', 30, 'ACTIVE', FALSE),
  ('button-harness-message-cancel', 'module-harness', 'menu-harness', 'button', '取消运行', '', '', 'button.harness.message.cancel', '', 40, 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE
  module_id = VALUES(module_id),
  parent_id = VALUES(parent_id),
  type = VALUES(type),
  name = VALUES(name),
  path = VALUES(path),
  component = VALUES(component),
  permission_code = VALUES(permission_code),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  hidden = VALUES(hidden);

INSERT IGNORE INTO system_role_menus (role_id, menu_id)
SELECT 'role-admin', id FROM system_menus
WHERE id IN ('menu-harness', 'button-harness-session-create', 'button-harness-session-delete', 'button-harness-message-send', 'button-harness-message-cancel');

-- The old demo pages were removed with the console shell rework.
DELETE FROM system_role_menus WHERE menu_id IN ('menu-dashboard', 'menu-admin');
DELETE FROM system_menus WHERE id IN ('menu-dashboard', 'menu-admin');
