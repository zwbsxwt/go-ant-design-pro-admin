package data

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"strings"
)

//go:embed migrations/*.sql seeds/*.sql
var dataScripts embed.FS

func initializeSchema(ctx context.Context, db *sql.DB) error {
	if err := executeSQLFile(ctx, db, "migrations/001_init_rbac.sql"); err != nil {
		return err
	}
	if err := ensureUserProfileColumns(ctx, db); err != nil {
		return err
	}
	if err := ensureModuleSchema(ctx, db); err != nil {
		return err
	}
	if err := executeSQLFile(ctx, db, "seeds/001_seed_rbac.sql"); err != nil {
		return err
	}
	return nil
}

func ensureModuleSchema(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS system_modules (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  icon VARCHAR(64) NULL,
  sort INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`); err != nil {
		return fmt.Errorf("ensure system_modules: %w", err)
	}
	if err := ensureColumn(ctx, db, "system_modules", "hidden", "hidden BOOLEAN NOT NULL DEFAULT FALSE"); err != nil {
		return err
	}
	if _, err := db.ExecContext(ctx, `
INSERT INTO system_modules (id, code, name, icon, sort, status, hidden)
VALUES ('module-system', 'system', '系统设置', 'SettingOutlined', 10, 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  name = VALUES(name),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  hidden = VALUES(hidden)`); err != nil {
		return fmt.Errorf("seed default module: %w", err)
	}

	exists, err := columnExists(ctx, db, "system_menus", "module_id")
	if err != nil {
		return err
	}
	if !exists {
		if _, err := db.ExecContext(ctx, "ALTER TABLE system_menus ADD COLUMN module_id VARCHAR(36) NOT NULL DEFAULT 'module-system' AFTER id"); err != nil {
			return fmt.Errorf("add system_menus.module_id: %w", err)
		}
	}
	if _, err := db.ExecContext(ctx, "UPDATE system_menus SET module_id = 'module-system' WHERE module_id = '' OR module_id IS NULL"); err != nil {
		return fmt.Errorf("backfill system_menus.module_id: %w", err)
	}
	if err := ensureColumn(ctx, db, "system_menus", "hidden", "hidden BOOLEAN NOT NULL DEFAULT FALSE"); err != nil {
		return err
	}
	return nil
}

func executeSQLFile(ctx context.Context, db *sql.DB, name string) error {
	content, err := dataScripts.ReadFile(name)
	if err != nil {
		return fmt.Errorf("read sql file %s: %w", name, err)
	}
	for _, statement := range strings.Split(string(content), ";") {
		statement = strings.TrimSpace(statement)
		if statement == "" {
			continue
		}
		if _, err := db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("execute sql file %s: %w", name, err)
		}
	}
	return nil
}

func ensureUserProfileColumns(ctx context.Context, db *sql.DB) error {
	for _, column := range []struct {
		name       string
		definition string
	}{
		{name: "email", definition: "email VARCHAR(255) NULL"},
		{name: "phone", definition: "phone VARCHAR(32) NULL"},
	} {
		if err := ensureColumn(ctx, db, "system_users", column.name, column.definition); err != nil {
			return err
		}
	}
	return nil
}

func ensureColumn(ctx context.Context, db *sql.DB, tableName string, columnName string, definition string) error {
	exists, err := columnExists(ctx, db, tableName, columnName)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if _, err := db.ExecContext(ctx, "ALTER TABLE "+tableName+" ADD COLUMN "+definition); err != nil {
		return fmt.Errorf("add %s.%s: %w", tableName, columnName, err)
	}
	return nil
}

func columnExists(ctx context.Context, db *sql.DB, tableName string, columnName string) (bool, error) {
	var count int
	if err := db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = ?
  AND column_name = ?`, tableName, columnName).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}
