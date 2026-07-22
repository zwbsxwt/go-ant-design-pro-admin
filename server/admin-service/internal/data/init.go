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
	if err := executeSQLFile(ctx, db, "seeds/001_seed_rbac.sql"); err != nil {
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
		exists, err := columnExists(ctx, db, "system_users", column.name)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := db.ExecContext(ctx, "ALTER TABLE system_users ADD COLUMN "+column.definition); err != nil {
			return fmt.Errorf("add system_users.%s: %w", column.name, err)
		}
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
