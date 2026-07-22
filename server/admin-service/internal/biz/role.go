package biz

import (
	"context"
	"slices"
	"strings"
	"time"

	v1 "template-v6/server/admin-service/api/system/v1"

	"github.com/go-kratos/kratos/v3/errors"
)

const RoleManagePermission = "menu.system.role"

var (
	ErrRoleNotFound        = errors.NotFound(v1.ErrorReason_ROLE_NOT_FOUND.String(), "role not found")
	ErrRoleDuplicateCode   = errors.BadRequest(v1.ErrorReason_ROLE_DUPLICATE_CODE.String(), "duplicate role code")
	ErrRoleHasUsers        = errors.BadRequest(v1.ErrorReason_ROLE_HAS_USERS.String(), "role has users")
	ErrRoleInvalidArgument = errors.BadRequest(v1.ErrorReason_ROLE_INVALID_ARGUMENT.String(), "invalid role argument")
)

// Role is a system permission role.
type Role struct {
	ID            string
	Code          string
	Name          string
	Description   string
	Status        string
	PermissionIDs []string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// RoleRepo persists roles and role permission bindings.
type RoleRepo interface {
	ListRoles(context.Context) ([]*Role, error)
	GetRole(context.Context, string) (*Role, error)
	CreateRole(context.Context, *Role) (*Role, error)
	UpdateRole(context.Context, *Role) (*Role, error)
	DeleteRole(context.Context, string) error
	RoleCodeExists(context.Context, string, string) (bool, error)
	HasUserBindings(context.Context, string) (bool, error)
	ReplaceRolePermissions(context.Context, string, []string) error
	MenuIDsExist(context.Context, []string) (bool, error)
}

// RoleUsecase handles role management rules.
type RoleUsecase struct {
	repo RoleRepo
	auth *AuthUsecase
}

// NewRoleUsecase creates a RoleUsecase.
func NewRoleUsecase(repo RoleRepo, auth *AuthUsecase) *RoleUsecase {
	return &RoleUsecase{repo: repo, auth: auth}
}

func (uc *RoleUsecase) ListRoles(ctx context.Context, token string) ([]*Role, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.ListRoles(ctx)
}

func (uc *RoleUsecase) GetRole(ctx context.Context, token string, id string) (*Role, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.GetRole(ctx, strings.TrimSpace(id))
}

func (uc *RoleUsecase) CreateRole(ctx context.Context, token string, role *Role) (*Role, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	role = normalizeRole(role)
	if err := uc.validateRole(ctx, role, ""); err != nil {
		return nil, err
	}
	return uc.repo.CreateRole(ctx, role)
}

func (uc *RoleUsecase) UpdateRole(ctx context.Context, token string, id string, role *Role) (*Role, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetRole(ctx, id); err != nil {
		return nil, err
	}
	role = normalizeRole(role)
	role.ID = id
	if err := uc.validateRole(ctx, role, id); err != nil {
		return nil, err
	}
	return uc.repo.UpdateRole(ctx, role)
}

func (uc *RoleUsecase) DeleteRole(ctx context.Context, token string, id string) error {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetRole(ctx, id); err != nil {
		return err
	}
	hasUsers, err := uc.repo.HasUserBindings(ctx, id)
	if err != nil {
		return err
	}
	if hasUsers {
		return ErrRoleHasUsers
	}
	return uc.repo.DeleteRole(ctx, id)
}

func (uc *RoleUsecase) UpdateRolePermissions(ctx context.Context, token string, id string, permissionIDs []string) (*Role, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetRole(ctx, id); err != nil {
		return nil, err
	}
	permissionIDs = compactStrings(permissionIDs)
	exist, err := uc.repo.MenuIDsExist(ctx, permissionIDs)
	if err != nil {
		return nil, err
	}
	if !exist {
		return nil, ErrRoleInvalidArgument
	}
	if err := uc.repo.ReplaceRolePermissions(ctx, id, permissionIDs); err != nil {
		return nil, err
	}
	return uc.repo.GetRole(ctx, id)
}

func (uc *RoleUsecase) requireManagePermission(ctx context.Context, token string) error {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return err
	}
	if user.Role == "admin" || slices.Contains(user.MenuPermissions, RoleManagePermission) {
		return nil
	}
	return ErrSystemUnauthorized
}

func (uc *RoleUsecase) validateRole(ctx context.Context, role *Role, currentID string) error {
	if role == nil || role.Code == "" || role.Name == "" {
		return ErrRoleInvalidArgument
	}
	exists, err := uc.repo.RoleCodeExists(ctx, role.Code, currentID)
	if err != nil {
		return err
	}
	if exists {
		return ErrRoleDuplicateCode
	}
	return nil
}

func normalizeRole(role *Role) *Role {
	if role == nil {
		return nil
	}
	normalized := *role
	normalized.ID = strings.TrimSpace(normalized.ID)
	normalized.Code = strings.TrimSpace(normalized.Code)
	normalized.Name = strings.TrimSpace(normalized.Name)
	normalized.Description = strings.TrimSpace(normalized.Description)
	normalized.Status = strings.TrimSpace(normalized.Status)
	if normalized.Status == "" {
		normalized.Status = MenuStatusEnabled
	}
	normalized.PermissionIDs = compactStrings(normalized.PermissionIDs)
	return &normalized
}

func compactStrings(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
