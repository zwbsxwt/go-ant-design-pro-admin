package data

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"template-v6/server/admin-service/internal/biz"
)

type authRepo struct {
	data     *Data
	tokenTTL time.Duration
}

// NewAuthRepo creates a storage-backed AuthRepo.
func NewAuthRepo(data *Data) biz.AuthRepo {
	return &authRepo{
		data:     data,
		tokenTTL: 24 * time.Hour,
	}
}

func (r *authRepo) VerifyPassword(ctx context.Context, username, password string) (*biz.AuthUser, error) {
	user, passwordHash, err := r.findUserByUsername(ctx, strings.TrimSpace(username))
	if err != nil {
		return nil, biz.ErrAuthInvalidCredentials
	}
	if !verifyPasswordHash(passwordHash, password) {
		return nil, biz.ErrAuthInvalidCredentials
	}
	return user, nil
}

func (r *authRepo) CreateToken(ctx context.Context, userID string) (string, time.Time, error) {
	token, err := randomToken()
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt := time.Now().Add(r.tokenTTL)

	if err := r.data.redis.Set(ctx, tokenKey(token), userID, r.tokenTTL).Err(); err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}

func (r *authRepo) FindByToken(ctx context.Context, token string) (*biz.AuthUser, error) {
	userID, err := r.data.redis.Get(ctx, tokenKey(token)).Result()
	if err != nil {
		return nil, biz.ErrAuthInvalidToken
	}
	user, _, err := r.findUserByID(ctx, userID)
	if err != nil {
		return nil, biz.ErrAuthInvalidToken
	}
	return user, nil
}

func (r *authRepo) RevokeToken(ctx context.Context, token string) error {
	return r.data.redis.Del(ctx, tokenKey(token)).Err()
}

func (r *authRepo) findUserByUsername(ctx context.Context, username string) (*biz.AuthUser, string, error) {
	return r.findUser(ctx, "u.username = ?", username)
}

func (r *authRepo) findUserByID(ctx context.Context, id string) (*biz.AuthUser, string, error) {
	return r.findUser(ctx, "u.id = ?", id)
}

func (r *authRepo) findUser(ctx context.Context, where string, arg string) (*biz.AuthUser, string, error) {
	query := fmt.Sprintf(`
SELECT
  u.id,
  u.username,
  u.display_name,
  u.password_hash,
  COALESCE(u.avatar, ''),
  u.status,
  COALESCE(GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ','), ''),
  COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN m.type <> 'button' THEN m.permission_code END ORDER BY m.sort, m.permission_code SEPARATOR ','), ''),
  COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN m.type = 'button' THEN m.permission_code END ORDER BY m.sort, m.permission_code SEPARATOR ','), '')
FROM system_users u
LEFT JOIN system_user_roles ur ON ur.user_id = u.id
LEFT JOIN system_roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
LEFT JOIN system_role_menus rm ON rm.role_id = r.id
LEFT JOIN system_menus m ON m.id = rm.menu_id AND m.status = 'ACTIVE'
WHERE %s
GROUP BY u.id, u.username, u.display_name, u.password_hash, u.avatar, u.status`, where)

	var user biz.AuthUser
	var passwordHash string
	var rolesCSV string
	var permissionsCSV string
	var buttonPermissionsCSV string
	if err := r.data.db.QueryRowContext(ctx, query, arg).Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&passwordHash,
		&user.Avatar,
		&user.Status,
		&rolesCSV,
		&permissionsCSV,
		&buttonPermissionsCSV,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, "", biz.ErrAuthInvalidCredentials
		}
		return nil, "", err
	}
	user.Role = primaryRole(splitCSV(rolesCSV))
	user.RoleCodes = splitCSV(rolesCSV)
	user.MenuPermissions = splitCSV(permissionsCSV)
	user.ButtonPermissions = splitCSV(buttonPermissionsCSV)
	menus, err := r.findUserMenus(ctx, user.ID)
	if err != nil {
		return nil, "", err
	}
	user.Menus = biz.BuildMenuTree(menus)
	return &user, passwordHash, nil
}

func (r *authRepo) findUserMenus(ctx context.Context, userID string) ([]*biz.Menu, error) {
	rows, err := r.data.db.QueryContext(ctx, `
SELECT DISTINCT
  m.id,
  COALESCE(m.parent_id, ''),
  m.type,
  m.name,
  COALESCE(m.path, ''),
  COALESCE(m.component, ''),
  m.permission_code,
  COALESCE(m.icon, ''),
  m.sort,
  m.status,
  m.created_at,
  m.updated_at
FROM system_users u
JOIN system_user_roles ur ON ur.user_id = u.id
JOIN system_roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
JOIN system_role_menus rm ON rm.role_id = r.id
JOIN system_menus m ON m.id = rm.menu_id AND m.status = 'ACTIVE'
WHERE u.id = ?
  AND u.status = 'ACTIVE'
  AND m.type <> 'button'
ORDER BY m.sort, m.permission_code`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	menus := make([]*biz.Menu, 0)
	for rows.Next() {
		var menu biz.Menu
		if err := rows.Scan(
			&menu.ID,
			&menu.ParentID,
			&menu.Type,
			&menu.Name,
			&menu.Path,
			&menu.Component,
			&menu.PermissionCode,
			&menu.Icon,
			&menu.Sort,
			&menu.Status,
			&menu.CreatedAt,
			&menu.UpdatedAt,
		); err != nil {
			return nil, err
		}
		menus = append(menus, &menu)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return menus, nil
}

func randomToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return "tmpl_" + hex.EncodeToString(b[:]), nil
}

func tokenKey(token string) string {
	return "auth:token:" + strings.TrimSpace(token)
}

func splitCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

func primaryRole(roles []string) string {
	for _, role := range roles {
		if role == "admin" {
			return role
		}
	}
	if len(roles) == 0 {
		return ""
	}
	return roles[0]
}

func verifyPasswordHash(encoded string, password string) bool {
	hash, ok := strings.CutPrefix(encoded, "sha256$")
	if !ok {
		return false
	}
	sum := sha256.Sum256([]byte(password))
	actual := hex.EncodeToString(sum[:])
	return subtle.ConstantTimeCompare([]byte(hash), []byte(actual)) == 1
}
