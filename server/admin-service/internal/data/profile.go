package data

import (
	"context"
	"database/sql"

	"template-v6/server/admin-service/internal/biz"
)

type profileRepo struct {
	data *Data
}

// NewProfileRepo creates a ProfileRepo backed by MySQL and Redis.
func NewProfileRepo(data *Data) biz.ProfileRepo {
	return &profileRepo{data: data}
}

func (r *profileRepo) GetProfile(ctx context.Context, userID string) (*biz.Profile, error) {
	row := r.data.db.QueryRowContext(ctx, profileSelectSQL()+`
WHERE u.id = ?
GROUP BY u.id, u.username, u.display_name, u.avatar, u.email, u.phone, u.status`, userID)
	profile, err := scanProfile(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, biz.ErrAuthInvalidToken
		}
		return nil, err
	}
	return profile, nil
}

func (r *profileRepo) UpdateProfile(ctx context.Context, userID string, profile *biz.Profile) (*biz.Profile, error) {
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_users
SET display_name = ?,
    email = NULLIF(?, ''),
    phone = NULLIF(?, '')
WHERE id = ? AND status = 'ACTIVE'`,
		profile.DisplayName,
		profile.Email,
		profile.Phone,
		userID,
	)
	if err != nil {
		return nil, err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, biz.ErrAuthInvalidToken
	}
	return r.GetProfile(ctx, userID)
}

func (r *profileRepo) ChangePassword(ctx context.Context, userID string, token string, currentPassword string, newPassword string) error {
	var passwordHash string
	if err := r.data.db.QueryRowContext(ctx, `
SELECT password_hash
FROM system_users
WHERE id = ? AND status = 'ACTIVE'`, userID).Scan(&passwordHash); err != nil {
		if err == sql.ErrNoRows {
			return biz.ErrAuthInvalidToken
		}
		return err
	}
	if !verifyPasswordHash(passwordHash, currentPassword) {
		return biz.ErrProfileInvalidPassword
	}
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_users
SET password_hash = ?
WHERE id = ? AND status = 'ACTIVE'`, hashPassword(newPassword), userID)
	if err != nil {
		return err
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return biz.ErrAuthInvalidToken
	}
	return r.data.redis.Del(ctx, tokenKey(token)).Err()
}

func (r *profileRepo) UploadAvatar(ctx context.Context, userID string, upload *biz.AvatarUpload) (*biz.Profile, string, error) {
	avatarURL, err := r.data.avatarStorage.Upload(ctx, userID, upload)
	if err != nil {
		return nil, "", err
	}
	result, err := r.data.db.ExecContext(ctx, `
UPDATE system_users
SET avatar = ?
WHERE id = ? AND status = 'ACTIVE'`, avatarURL, userID)
	if err != nil {
		return nil, "", biz.ErrProfileSaveFailed
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, "", biz.ErrAuthInvalidToken
	}
	profile, err := r.GetProfile(ctx, userID)
	if err != nil {
		return nil, "", err
	}
	return profile, avatarURL, nil
}

type profileScanner interface {
	Scan(dest ...any) error
}

func profileSelectSQL() string {
	return `
SELECT
  u.id,
  u.username,
  u.display_name,
  COALESCE(u.avatar, ''),
  COALESCE(u.email, ''),
  COALESCE(u.phone, ''),
  u.status,
  COALESCE(GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ','), '')
FROM system_users u
LEFT JOIN system_user_roles ur ON ur.user_id = u.id
LEFT JOIN system_roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
`
}

func scanProfile(scanner profileScanner) (*biz.Profile, error) {
	var profile biz.Profile
	var roleCodesCSV string
	if err := scanner.Scan(
		&profile.ID,
		&profile.Username,
		&profile.DisplayName,
		&profile.Avatar,
		&profile.Email,
		&profile.Phone,
		&profile.Status,
		&roleCodesCSV,
	); err != nil {
		return nil, err
	}
	profile.RoleCodes = splitCSV(roleCodesCSV)
	return &profile, nil
}
