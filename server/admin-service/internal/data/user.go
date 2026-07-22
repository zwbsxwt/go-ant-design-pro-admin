package data

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"strings"
	"time"

	"template-v6/server/admin-service/internal/biz"

	"github.com/google/uuid"
)

type userRepo struct {
	data *Data
}

// NewUserRepo creates a UserRepo backed by MySQL.
func NewUserRepo(data *Data) biz.UserRepo {
	return &userRepo{data: data}
}

func (r *userRepo) ListUsers(ctx context.Context) ([]*biz.User, error) {
	rows, err := r.data.db.QueryContext(ctx, userSelectSQL()+`
GROUP BY u.id, u.username, u.display_name, u.avatar, u.email, u.phone, u.status, u.created_at, u.updated_at
ORDER BY u.username`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*biz.User, 0)
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepo) GetUser(ctx context.Context, id string) (*biz.User, error) {
	row := r.data.db.QueryRowContext(ctx, userSelectSQL()+`
WHERE u.id = ?
GROUP BY u.id, u.username, u.display_name, u.avatar, u.email, u.phone, u.status, u.created_at, u.updated_at`, id)
	user, err := scanUser(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, biz.ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepo) CreateUser(ctx context.Context, user *biz.User, password string) (*biz.User, error) {
	tx, err := r.data.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	user.ID = uuid.NewString()
	now := time.Now()
	if _, err := tx.ExecContext(ctx, `
INSERT INTO system_users (id, username, display_name, password_hash, avatar, email, phone, status, created_at, updated_at)
VALUES (?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), ?, ?, ?)`,
		user.ID,
		user.Username,
		user.DisplayName,
		hashPassword(password),
		user.Avatar,
		user.Email,
		user.Phone,
		user.Status,
		now,
		now,
	); err != nil {
		return nil, err
	}
	if err := replaceUserRoles(ctx, tx, user.ID, user.RoleIDs); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.GetUser(ctx, user.ID)
}

func (r *userRepo) UpdateUser(ctx context.Context, user *biz.User) (*biz.User, error) {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_users
SET display_name = ?,
    avatar = NULLIF(?, ''),
    email = NULLIF(?, ''),
    phone = NULLIF(?, ''),
    status = ?
WHERE id = ?`,
		user.DisplayName,
		user.Avatar,
		user.Email,
		user.Phone,
		user.Status,
		user.ID,
	)
	if err != nil {
		return nil, err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, biz.ErrUserNotFound
	}
	return r.GetUser(ctx, user.ID)
}

func (r *userRepo) DeleteUser(ctx context.Context, id string) error {
	result, err := r.data.db.ExecContext(ctx, `DELETE FROM system_users WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrUserNotFound
	}
	return nil
}

func (r *userRepo) ResetPassword(ctx context.Context, id string, password string) error {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_users
SET password_hash = ?
WHERE id = ?`, hashPassword(password), id)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrUserNotFound
	}
	return nil
}

func (r *userRepo) ReplaceUserRoles(ctx context.Context, userID string, roleIDs []string) error {
	tx, err := r.data.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := replaceUserRoles(ctx, tx, userID, roleIDs); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *userRepo) UsernameExists(ctx context.Context, username string, excludeID string) (bool, error) {
	var count int
	if err := r.data.db.QueryRowContext(ctx, `
SELECT COUNT(1)
FROM system_users
WHERE username = ? AND (? = '' OR id <> ?)`, username, excludeID, excludeID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *userRepo) RoleIDsExist(ctx context.Context, ids []string) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(ids)), ",")
	args := make([]any, 0, len(ids))
	for _, id := range ids {
		args = append(args, id)
	}
	query := `SELECT COUNT(1) FROM system_roles WHERE id IN (` + placeholders + `)`
	var count int
	if err := r.data.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return false, err
	}
	return count == len(ids), nil
}

type userScanner interface {
	Scan(dest ...any) error
}

func userSelectSQL() string {
	return `
SELECT
  u.id,
  u.username,
  u.display_name,
  COALESCE(u.avatar, ''),
  COALESCE(u.email, ''),
  COALESCE(u.phone, ''),
  u.status,
  COALESCE(GROUP_CONCAT(DISTINCT r.id ORDER BY r.code SEPARATOR ','), ''),
  COALESCE(GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ','), ''),
  u.created_at,
  u.updated_at
FROM system_users u
LEFT JOIN system_user_roles ur ON ur.user_id = u.id
LEFT JOIN system_roles r ON r.id = ur.role_id
`
}

func scanUser(scanner userScanner) (*biz.User, error) {
	var user biz.User
	var roleIDsCSV string
	var roleCodesCSV string
	if err := scanner.Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&user.Avatar,
		&user.Email,
		&user.Phone,
		&user.Status,
		&roleIDsCSV,
		&roleCodesCSV,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, err
	}
	user.RoleIDs = splitCSV(roleIDsCSV)
	user.RoleCodes = splitCSV(roleCodesCSV)
	return &user, nil
}

func replaceUserRoles(ctx context.Context, tx *sql.Tx, userID string, roleIDs []string) error {
	if _, err := tx.ExecContext(ctx, `DELETE FROM system_user_roles WHERE user_id = ?`, userID); err != nil {
		return err
	}
	for _, roleID := range roleIDs {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO system_user_roles (user_id, role_id)
VALUES (?, ?)`, userID, roleID); err != nil {
			return err
		}
	}
	return nil
}

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte(password))
	return "sha256$" + hex.EncodeToString(sum[:])
}
