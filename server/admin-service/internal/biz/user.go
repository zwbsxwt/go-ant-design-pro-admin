package biz

import (
	"context"
	"slices"
	"strings"
	"time"

	v1 "template-v6/server/admin-service/api/system/v1"

	"github.com/go-kratos/kratos/v3/errors"
)

const UserManagePermission = "menu.system.user"

var (
	ErrUserNotFound          = errors.NotFound(v1.ErrorReason_USER_NOT_FOUND.String(), "user not found")
	ErrUserDuplicateUsername = errors.BadRequest(v1.ErrorReason_USER_DUPLICATE_USERNAME.String(), "duplicate username")
	ErrUserInvalidArgument   = errors.BadRequest(v1.ErrorReason_USER_INVALID_ARGUMENT.String(), "invalid user argument")
	ErrUserCannotDeleteSelf  = errors.BadRequest(v1.ErrorReason_USER_CANNOT_DELETE_SELF.String(), "cannot delete current user")
)

// User is a managed admin account.
type User struct {
	ID          string
	Username    string
	DisplayName string
	Avatar      string
	Email       string
	Phone       string
	Status      string
	RoleIDs     []string
	RoleCodes   []string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// UserRepo persists users and user-role bindings.
type UserRepo interface {
	ListUsers(context.Context) ([]*User, error)
	GetUser(context.Context, string) (*User, error)
	CreateUser(context.Context, *User, string) (*User, error)
	UpdateUser(context.Context, *User) (*User, error)
	DeleteUser(context.Context, string) error
	ResetPassword(context.Context, string, string) error
	ReplaceUserRoles(context.Context, string, []string) error
	UsernameExists(context.Context, string, string) (bool, error)
	RoleIDsExist(context.Context, []string) (bool, error)
}

// UserUsecase handles user management rules.
type UserUsecase struct {
	repo UserRepo
	auth *AuthUsecase
}

// NewUserUsecase creates a UserUsecase.
func NewUserUsecase(repo UserRepo, auth *AuthUsecase) *UserUsecase {
	return &UserUsecase{repo: repo, auth: auth}
}

func (uc *UserUsecase) ListUsers(ctx context.Context, token string) ([]*User, error) {
	if _, err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.ListUsers(ctx)
}

func (uc *UserUsecase) GetUser(ctx context.Context, token string, id string) (*User, error) {
	if _, err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.GetUser(ctx, strings.TrimSpace(id))
}

func (uc *UserUsecase) CreateUser(ctx context.Context, token string, user *User, password string) (*User, error) {
	if _, err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	user = normalizeUser(user)
	if err := uc.validateUser(ctx, user, "", true); err != nil {
		return nil, err
	}
	if !validPassword(password) {
		return nil, ErrUserInvalidArgument
	}
	return uc.repo.CreateUser(ctx, user, password)
}

func (uc *UserUsecase) UpdateUser(ctx context.Context, token string, id string, user *User) (*User, error) {
	current, err := uc.requireManagePermission(ctx, token)
	if err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	existing, err := uc.repo.GetUser(ctx, id)
	if err != nil {
		return nil, err
	}
	user = normalizeUser(user)
	user.ID = id
	user.Username = existing.Username
	if existing.ID == current.ID && user.Status != MenuStatusEnabled {
		return nil, ErrUserInvalidArgument
	}
	if existing.ID == "user-admin" && user.Status != MenuStatusEnabled {
		return nil, ErrUserInvalidArgument
	}
	if err := uc.validateUser(ctx, user, id, false); err != nil {
		return nil, err
	}
	return uc.repo.UpdateUser(ctx, user)
}

func (uc *UserUsecase) DeleteUser(ctx context.Context, token string, id string) error {
	current, err := uc.requireManagePermission(ctx, token)
	if err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	user, err := uc.repo.GetUser(ctx, id)
	if err != nil {
		return err
	}
	if user.ID == current.ID {
		return ErrUserCannotDeleteSelf
	}
	if user.ID == "user-admin" {
		return ErrUserInvalidArgument
	}
	return uc.repo.DeleteUser(ctx, id)
}

func (uc *UserUsecase) ResetPassword(ctx context.Context, token string, id string, password string) error {
	if _, err := uc.requireManagePermission(ctx, token); err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetUser(ctx, id); err != nil {
		return err
	}
	if !validPassword(password) {
		return ErrUserInvalidArgument
	}
	return uc.repo.ResetPassword(ctx, id, password)
}

func (uc *UserUsecase) UpdateUserRoles(ctx context.Context, token string, id string, roleIDs []string) (*User, error) {
	if _, err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	user, err := uc.repo.GetUser(ctx, id)
	if err != nil {
		return nil, err
	}
	roleIDs = compactStrings(roleIDs)
	exist, err := uc.repo.RoleIDsExist(ctx, roleIDs)
	if err != nil {
		return nil, err
	}
	if !exist {
		return nil, ErrUserInvalidArgument
	}
	if user.ID == "user-admin" && len(roleIDs) == 0 {
		return nil, ErrUserInvalidArgument
	}
	if err := uc.repo.ReplaceUserRoles(ctx, id, roleIDs); err != nil {
		return nil, err
	}
	return uc.repo.GetUser(ctx, id)
}

func (uc *UserUsecase) requireManagePermission(ctx context.Context, token string) (*AuthUser, error) {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return nil, err
	}
	if user.Role == "admin" || slices.Contains(user.MenuPermissions, UserManagePermission) {
		return user, nil
	}
	return nil, ErrSystemUnauthorized
}

func (uc *UserUsecase) validateUser(ctx context.Context, user *User, currentID string, requireUsername bool) error {
	if user == nil || user.DisplayName == "" {
		return ErrUserInvalidArgument
	}
	if requireUsername && user.Username == "" {
		return ErrUserInvalidArgument
	}
	if user.Status != MenuStatusEnabled && user.Status != MenuStatusDisabled {
		return ErrUserInvalidArgument
	}
	if requireUsername {
		exists, err := uc.repo.UsernameExists(ctx, user.Username, currentID)
		if err != nil {
			return err
		}
		if exists {
			return ErrUserDuplicateUsername
		}
	}
	exist, err := uc.repo.RoleIDsExist(ctx, user.RoleIDs)
	if err != nil {
		return err
	}
	if !exist {
		return ErrUserInvalidArgument
	}
	return nil
}

func normalizeUser(user *User) *User {
	if user == nil {
		return nil
	}
	normalized := *user
	normalized.ID = strings.TrimSpace(normalized.ID)
	normalized.Username = strings.TrimSpace(normalized.Username)
	normalized.DisplayName = strings.TrimSpace(normalized.DisplayName)
	normalized.Avatar = strings.TrimSpace(normalized.Avatar)
	normalized.Email = strings.TrimSpace(normalized.Email)
	normalized.Phone = strings.TrimSpace(normalized.Phone)
	normalized.Status = strings.TrimSpace(normalized.Status)
	if normalized.Status == "" {
		normalized.Status = MenuStatusEnabled
	}
	normalized.RoleIDs = compactStrings(normalized.RoleIDs)
	normalized.RoleCodes = compactStrings(normalized.RoleCodes)
	return &normalized
}

func validPassword(password string) bool {
	return len(strings.TrimSpace(password)) >= 6
}
