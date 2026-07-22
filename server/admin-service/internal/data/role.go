package data

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"template-v6/server/admin-service/internal/biz"

	"github.com/google/uuid"
)

type roleRepo struct {
	data *Data
}

// NewRoleRepo creates a RoleRepo backed by MySQL.
func NewRoleRepo(data *Data) biz.RoleRepo {
	return &roleRepo{data: data}
}

func (r *roleRepo) ListRoles(ctx context.Context) ([]*biz.Role, error) {
	rows, err := r.data.db.QueryContext(ctx, `
SELECT
  r.id,
  r.code,
  r.name,
  COALESCE(r.description, ''),
  r.status,
  COALESCE(GROUP_CONCAT(rm.menu_id ORDER BY m.sort, m.permission_code SEPARATOR ','), ''),
  r.created_at,
  r.updated_at
FROM system_roles r
LEFT JOIN system_role_menus rm ON rm.role_id = r.id
LEFT JOIN system_menus m ON m.id = rm.menu_id
GROUP BY r.id, r.code, r.name, r.description, r.status, r.created_at, r.updated_at
ORDER BY r.code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]*biz.Role, 0)
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *roleRepo) GetRole(ctx context.Context, id string) (*biz.Role, error) {
	row := r.data.db.QueryRowContext(ctx, `
SELECT
  r.id,
  r.code,
  r.name,
  COALESCE(r.description, ''),
  r.status,
  COALESCE(GROUP_CONCAT(rm.menu_id ORDER BY m.sort, m.permission_code SEPARATOR ','), ''),
  r.created_at,
  r.updated_at
FROM system_roles r
LEFT JOIN system_role_menus rm ON rm.role_id = r.id
LEFT JOIN system_menus m ON m.id = rm.menu_id
WHERE r.id = ?
GROUP BY r.id, r.code, r.name, r.description, r.status, r.created_at, r.updated_at`, id)
	role, err := scanRole(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, biz.ErrRoleNotFound
		}
		return nil, err
	}
	return role, nil
}

func (r *roleRepo) CreateRole(ctx context.Context, role *biz.Role) (*biz.Role, error) {
	role.ID = uuid.NewString()
	now := time.Now()
	if _, err := r.data.db.ExecContext(ctx, `
INSERT INTO system_roles (id, code, name, description, status, created_at, updated_at)
VALUES (?, ?, ?, NULLIF(?, ''), ?, ?, ?)`,
		role.ID,
		role.Code,
		role.Name,
		role.Description,
		role.Status,
		now,
		now,
	); err != nil {
		return nil, err
	}
	return r.GetRole(ctx, role.ID)
}

func (r *roleRepo) UpdateRole(ctx context.Context, role *biz.Role) (*biz.Role, error) {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_roles
SET code = ?,
    name = ?,
    description = NULLIF(?, ''),
    status = ?
WHERE id = ?`,
		role.Code,
		role.Name,
		role.Description,
		role.Status,
		role.ID,
	)
	if err != nil {
		return nil, err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, biz.ErrRoleNotFound
	}
	return r.GetRole(ctx, role.ID)
}

func (r *roleRepo) DeleteRole(ctx context.Context, id string) error {
	result, err := r.data.db.ExecContext(ctx, `DELETE FROM system_roles WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrRoleNotFound
	}
	return nil
}

func (r *roleRepo) RoleCodeExists(ctx context.Context, code string, excludeID string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_roles
WHERE code = ? AND (? = '' OR id <> ?)`, code, excludeID, excludeID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *roleRepo) HasUserBindings(ctx context.Context, id string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_user_roles
WHERE role_id = ?`, id).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *roleRepo) ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	tx, err := r.data.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM system_role_menus WHERE role_id = ?`, roleID); err != nil {
		return err
	}
	for _, permissionID := range permissionIDs {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO system_role_menus (role_id, menu_id)
VALUES (?, ?)`, roleID, permissionID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *roleRepo) MenuIDsExist(ctx context.Context, ids []string) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(ids)), ",")
	args := make([]any, 0, len(ids))
	for _, id := range ids {
		args = append(args, id)
	}
	query := `SELECT COUNT(1) FROM system_menus WHERE id IN (` + placeholders + `)`
	var count int
	if err := r.data.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return false, err
	}
	return count == len(ids), nil
}

type roleScanner interface {
	Scan(dest ...any) error
}

func scanRole(scanner roleScanner) (*biz.Role, error) {
	var role biz.Role
	var permissionIDsCSV string
	if err := scanner.Scan(
		&role.ID,
		&role.Code,
		&role.Name,
		&role.Description,
		&role.Status,
		&permissionIDsCSV,
		&role.CreatedAt,
		&role.UpdatedAt,
	); err != nil {
		return nil, err
	}
	role.PermissionIDs = splitCSV(permissionIDsCSV)
	return &role, nil
}
