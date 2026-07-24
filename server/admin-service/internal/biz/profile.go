package biz

import (
	"context"
	"io"
	"net/mail"
	"path/filepath"
	"regexp"
	"strings"

	v1 "template-v6/server/admin-service/api/profile/v1"

	"github.com/go-kratos/kratos/v3/errors"
)

var (
	ErrProfileInvalidArgument    = errors.BadRequest(v1.ErrorReason_PROFILE_INVALID_ARGUMENT.String(), "invalid profile argument")
	ErrProfileInvalidPassword    = errors.BadRequest(v1.ErrorReason_PROFILE_INVALID_PASSWORD.String(), "invalid current password")
	ErrProfileStorageUnavailable = errors.ServiceUnavailable(v1.ErrorReason_PROFILE_STORAGE_UNAVAILABLE.String(), "profile storage unavailable")
	ErrProfileSaveFailed         = errors.InternalServer(v1.ErrorReason_PROFILE_SAVE_FAILED.String(), "profile save failed")
)

var phonePattern = regexp.MustCompile(`^[0-9+\-\s()]*$`)

const MaxAvatarSizeBytes = 2 * 1024 * 1024

// Profile is the current signed-in user's self-service profile.
type Profile struct {
	ID          string
	Username    string
	DisplayName string
	Avatar      string
	Email       string
	Phone       string
	Status      string
	RoleCodes   []string
}

// AvatarUpload is a current-user avatar upload request.
type AvatarUpload struct {
	Filename    string
	ContentType string
	Size        int64
	Reader      io.Reader
}

// ProfileRepo persists and verifies the current user's self-service profile.
type ProfileRepo interface {
	GetProfile(context.Context, string) (*Profile, error)
	UpdateProfile(context.Context, string, *Profile) (*Profile, error)
	ChangePassword(context.Context, string, string, string, string) error
	UploadAvatar(context.Context, string, *AvatarUpload) (*Profile, string, error)
}

// ProfileUsecase handles profile self-service rules.
type ProfileUsecase struct {
	repo ProfileRepo
	auth *AuthUsecase
}

// NewProfileUsecase creates a ProfileUsecase.
func NewProfileUsecase(repo ProfileRepo, auth *AuthUsecase) *ProfileUsecase {
	return &ProfileUsecase{repo: repo, auth: auth}
}

func (uc *ProfileUsecase) GetProfile(ctx context.Context, token string) (*Profile, error) {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return nil, err
	}
	return uc.repo.GetProfile(ctx, user.ID)
}

func (uc *ProfileUsecase) UpdateProfile(ctx context.Context, token string, profile *Profile) (*Profile, error) {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return nil, err
	}
	profile = normalizeProfile(profile)
	if err := validateProfile(profile); err != nil {
		return nil, err
	}
	return uc.repo.UpdateProfile(ctx, user.ID, profile)
}

func (uc *ProfileUsecase) ChangePassword(ctx context.Context, token string, currentPassword string, newPassword string, confirmPassword string) error {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return err
	}
	currentPassword = strings.TrimSpace(currentPassword)
	newPassword = strings.TrimSpace(newPassword)
	confirmPassword = strings.TrimSpace(confirmPassword)
	if currentPassword == "" || newPassword != confirmPassword || !validPassword(newPassword) {
		return ErrProfileInvalidArgument
	}
	return uc.repo.ChangePassword(ctx, user.ID, token, currentPassword, newPassword)
}

func (uc *ProfileUsecase) UploadAvatar(ctx context.Context, token string, upload *AvatarUpload) (*Profile, string, error) {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return nil, "", err
	}
	if err := validateAvatarUpload(upload); err != nil {
		return nil, "", err
	}
	return uc.repo.UploadAvatar(ctx, user.ID, upload)
}

func normalizeProfile(profile *Profile) *Profile {
	if profile == nil {
		return nil
	}
	normalized := *profile
	normalized.DisplayName = strings.TrimSpace(normalized.DisplayName)
	normalized.Email = strings.TrimSpace(normalized.Email)
	normalized.Phone = strings.TrimSpace(normalized.Phone)
	return &normalized
}

func validateProfile(profile *Profile) error {
	if profile == nil {
		return ErrProfileInvalidArgument
	}
	if profile.DisplayName == "" || len([]rune(profile.DisplayName)) > 64 {
		return ErrProfileInvalidArgument
	}
	if profile.Email != "" {
		if len(profile.Email) > 128 {
			return ErrProfileInvalidArgument
		}
		if _, err := mail.ParseAddress(profile.Email); err != nil {
			return ErrProfileInvalidArgument
		}
	}
	if profile.Phone != "" {
		if len(profile.Phone) > 32 || !phonePattern.MatchString(profile.Phone) {
			return ErrProfileInvalidArgument
		}
	}
	return nil
}

func validateAvatarUpload(upload *AvatarUpload) error {
	if upload == nil || upload.Reader == nil {
		return ErrProfileInvalidArgument
	}
	if upload.Size <= 0 || upload.Size > MaxAvatarSizeBytes {
		return ErrProfileInvalidArgument
	}
	contentType := strings.ToLower(strings.TrimSpace(upload.ContentType))
	switch contentType {
	case "image/png", "image/jpeg", "image/webp":
		if !validAvatarExtension(upload.Filename, contentType) {
			return ErrProfileInvalidArgument
		}
		return nil
	default:
		return ErrProfileInvalidArgument
	}
}

func validAvatarExtension(filename string, contentType string) bool {
	ext := strings.ToLower(filepath.Ext(strings.TrimSpace(filename)))
	switch contentType {
	case "image/png":
		return ext == ".png"
	case "image/jpeg":
		return ext == ".jpg" || ext == ".jpeg"
	case "image/webp":
		return ext == ".webp"
	default:
		return false
	}
}
