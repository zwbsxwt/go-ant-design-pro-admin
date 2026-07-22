package data

import (
	"context"
	"database/sql"
	"time"

	"template-v6/server/admin-service/internal/biz"

	"github.com/google/uuid"
)

type menuRepo struct {
	data *Data
}

// NewMenuRepo creates a MenuRepo backed by MySQL.
func NewMenuRepo(data *Data) biz.MenuRepo {
	return &menuRepo{data: data}
}

func (r *menuRepo) ListMenus(ctx context.Context) ([]*biz.Menu, error) {
	rows, err := r.data.db.QueryContext(ctx, `
SELECT id, parent_id, type, name, path, component, permission_code, icon, sort, status, created_at, updated_at
FROM system_menus
ORDER BY COALESCE(parent_id, ''), sort, permission_code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	menus := make([]*biz.Menu, 0)
	for rows.Next() {
		menu, err := scanMenu(rows)
		if err != nil {
			return nil, err
		}
		menus = append(menus, menu)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return menus, nil
}

func (r *menuRepo) GetMenu(ctx context.Context, id string) (*biz.Menu, error) {
	row := r.data.db.QueryRowContext(ctx, `
SELECT id, parent_id, type, name, path, component, permission_code, icon, sort, status, created_at, updated_at
FROM system_menus
WHERE id = ?`, id)
	menu, err := scanMenu(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, biz.ErrMenuNotFound
		}
		return nil, err
	}
	return menu, nil
}

func (r *menuRepo) CreateMenu(ctx context.Context, menu *biz.Menu) (*biz.Menu, error) {
	menu.ID = uuid.NewString()
	now := time.Now()
	if _, err := r.data.db.ExecContext(ctx, `
INSERT INTO system_menus (id, parent_id, type, name, path, component, permission_code, icon, sort, status, created_at, updated_at)
VALUES (?, NULLIF(?, ''), ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, NULLIF(?, ''), ?, ?, ?, ?)`,
		menu.ID,
		menu.ParentID,
		menu.Type,
		menu.Name,
		menu.Path,
		menu.Component,
		menu.PermissionCode,
		menu.Icon,
		menu.Sort,
		menu.Status,
		now,
		now,
	); err != nil {
		return nil, err
	}
	return r.GetMenu(ctx, menu.ID)
}

func (r *menuRepo) UpdateMenu(ctx context.Context, menu *biz.Menu) (*biz.Menu, error) {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_menus
SET parent_id = NULLIF(?, ''),
    type = ?,
    name = ?,
    path = NULLIF(?, ''),
    component = NULLIF(?, ''),
    permission_code = ?,
    icon = NULLIF(?, ''),
    sort = ?,
    status = ?
WHERE id = ?`,
		menu.ParentID,
		menu.Type,
		menu.Name,
		menu.Path,
		menu.Component,
		menu.PermissionCode,
		menu.Icon,
		menu.Sort,
		menu.Status,
		menu.ID,
	)
	if err != nil {
		return nil, err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, biz.ErrMenuNotFound
	}
	return r.GetMenu(ctx, menu.ID)
}

func (r *menuRepo) DeleteMenu(ctx context.Context, id string) error {
	result, err := r.data.db.ExecContext(ctx, `DELETE FROM system_menus WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrMenuNotFound
	}
	return nil
}

func (r *menuRepo) PermissionCodeExists(ctx context.Context, code string, excludeID string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_menus
WHERE permission_code = ? AND (? = '' OR id <> ?)`, code, excludeID, excludeID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *menuRepo) HasChildren(ctx context.Context, id string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_menus
WHERE parent_id = ?`, id).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *menuRepo) HasRoleBindings(ctx context.Context, id string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_role_menus
WHERE menu_id = ?`, id).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

type menuScanner interface {
	Scan(dest ...any) error
}

func scanMenu(scanner menuScanner) (*biz.Menu, error) {
	var menu biz.Menu
	var parentID sql.NullString
	var path sql.NullString
	var component sql.NullString
	var icon sql.NullString
	if err := scanner.Scan(
		&menu.ID,
		&parentID,
		&menu.Type,
		&menu.Name,
		&path,
		&component,
		&menu.PermissionCode,
		&icon,
		&menu.Sort,
		&menu.Status,
		&menu.CreatedAt,
		&menu.UpdatedAt,
	); err != nil {
		return nil, err
	}
	menu.ParentID = nullableString(parentID)
	menu.Path = nullableString(path)
	menu.Component = nullableString(component)
	menu.Icon = nullableString(icon)
	return &menu, nil
}

func nullableString(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return value.String
}
