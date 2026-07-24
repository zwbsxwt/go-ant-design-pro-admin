package data

import (
	"context"
	"database/sql"
	"time"

	"template-v6/server/admin-service/internal/biz"

	"github.com/google/uuid"
)

type moduleRepo struct {
	data *Data
}

// NewModuleRepo creates a ModuleRepo backed by MySQL.
func NewModuleRepo(data *Data) biz.ModuleRepo {
	return &moduleRepo{data: data}
}

func (r *moduleRepo) ListModules(ctx context.Context) ([]*biz.Module, error) {
	rows, err := r.data.db.QueryContext(ctx, `
SELECT id, code, name, icon, sort, status, hidden, created_at, updated_at
FROM system_modules
ORDER BY sort, code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	modules := make([]*biz.Module, 0)
	for rows.Next() {
		module, err := scanModule(rows)
		if err != nil {
			return nil, err
		}
		modules = append(modules, module)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return modules, nil
}

func (r *moduleRepo) GetModule(ctx context.Context, id string) (*biz.Module, error) {
	row := r.data.db.QueryRowContext(ctx, `
SELECT id, code, name, icon, sort, status, hidden, created_at, updated_at
FROM system_modules
WHERE id = ?`, id)
	module, err := scanModule(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, biz.ErrModuleNotFound
		}
		return nil, err
	}
	return module, nil
}

func (r *moduleRepo) CreateModule(ctx context.Context, module *biz.Module) (*biz.Module, error) {
	module.ID = uuid.NewString()
	now := time.Now()
	if _, err := r.data.db.ExecContext(ctx, `
INSERT INTO system_modules (id, code, name, icon, sort, status, hidden, created_at, updated_at)
VALUES (?, ?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?)`,
		module.ID,
		module.Code,
		module.Name,
		module.Icon,
		module.Sort,
		module.Status,
		module.Hidden,
		now,
		now,
	); err != nil {
		return nil, err
	}
	return r.GetModule(ctx, module.ID)
}

func (r *moduleRepo) UpdateModule(ctx context.Context, module *biz.Module) (*biz.Module, error) {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_modules
SET code = ?,
    name = ?,
    icon = NULLIF(?, ''),
    sort = ?,
    status = ?,
    hidden = ?
WHERE id = ?`,
		module.Code,
		module.Name,
		module.Icon,
		module.Sort,
		module.Status,
		module.Hidden,
		module.ID,
	)
	if err != nil {
		return nil, err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, biz.ErrModuleNotFound
	}
	return r.GetModule(ctx, module.ID)
}

func (r *moduleRepo) DeleteModule(ctx context.Context, id string) error {
	result, err := r.data.db.ExecContext(ctx, `DELETE FROM system_modules WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrModuleNotFound
	}
	return nil
}

func (r *moduleRepo) ModuleCodeExists(ctx context.Context, code string, excludeID string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_modules
WHERE code = ? AND (? = '' OR id <> ?)`, code, excludeID, excludeID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *moduleRepo) HasMenus(ctx context.Context, id string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_menus
WHERE module_id = ?`, id).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *moduleRepo) CountActiveVisibleModules(ctx context.Context, excludeID string) (int, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_modules
WHERE status = 'ACTIVE'
  AND hidden = FALSE
  AND (? = '' OR id <> ?)`, excludeID, excludeID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (r *moduleRepo) MigrateMenusAndDeleteModule(ctx context.Context, sourceID string, targetID string) error {
	tx, err := r.data.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
UPDATE system_menus
SET module_id = ?
WHERE module_id = ?`, targetID, sourceID); err != nil {
		return err
	}
	result, err := tx.ExecContext(ctx, `DELETE FROM system_modules WHERE id = ?`, sourceID)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrModuleNotFound
	}
	return tx.Commit()
}

type moduleScanner interface {
	Scan(dest ...any) error
}

func scanModule(scanner moduleScanner) (*biz.Module, error) {
	var module biz.Module
	var icon sql.NullString
	if err := scanner.Scan(
		&module.ID,
		&module.Code,
		&module.Name,
		&icon,
		&module.Sort,
		&module.Status,
		&module.Hidden,
		&module.CreatedAt,
		&module.UpdatedAt,
	); err != nil {
		return nil, err
	}
	module.Icon = nullableString(icon)
	return &module, nil
}
