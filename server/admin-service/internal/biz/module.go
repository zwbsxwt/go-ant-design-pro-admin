package biz

import (
	"context"
	"slices"
	"strings"
	"time"

	v1 "template-v6/server/admin-service/api/system/v1"

	"github.com/go-kratos/kratos/v3/errors"
)

const (
	DefaultModuleID        = "module-system"
	ModuleManagePermission = "menu.system.module"
)

var (
	ErrModuleNotFound        = errors.NotFound(v1.ErrorReason_MODULE_NOT_FOUND.String(), "module not found")
	ErrModuleDuplicateCode   = errors.BadRequest(v1.ErrorReason_MODULE_DUPLICATE_CODE.String(), "duplicate module code")
	ErrModuleHasMenus        = errors.BadRequest(v1.ErrorReason_MODULE_HAS_MENUS.String(), "module has menus")
	ErrModuleInvalidArgument = errors.BadRequest(v1.ErrorReason_MODULE_INVALID_ARGUMENT.String(), "invalid module argument")
)

// Module is a top-level business area that groups menu resources.
type Module struct {
	ID        string
	Code      string
	Name      string
	Icon      string
	Sort      int32
	Status    string
	Hidden    bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ModuleRepo persists top-level modules.
type ModuleRepo interface {
	ListModules(context.Context) ([]*Module, error)
	GetModule(context.Context, string) (*Module, error)
	CreateModule(context.Context, *Module) (*Module, error)
	UpdateModule(context.Context, *Module) (*Module, error)
	DeleteModule(context.Context, string) error
	ModuleCodeExists(context.Context, string, string) (bool, error)
	HasMenus(context.Context, string) (bool, error)
	CountActiveVisibleModules(context.Context, string) (int, error)
	MigrateMenusAndDeleteModule(context.Context, string, string) error
}

// ModuleUsecase handles module management rules.
type ModuleUsecase struct {
	repo ModuleRepo
	auth *AuthUsecase
}

// NewModuleUsecase creates a ModuleUsecase.
func NewModuleUsecase(repo ModuleRepo, auth *AuthUsecase) *ModuleUsecase {
	return &ModuleUsecase{repo: repo, auth: auth}
}

func (uc *ModuleUsecase) ListModules(ctx context.Context, token string) ([]*Module, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.ListModules(ctx)
}

func (uc *ModuleUsecase) GetModule(ctx context.Context, token string, id string) (*Module, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.GetModule(ctx, strings.TrimSpace(id))
}

func (uc *ModuleUsecase) CreateModule(ctx context.Context, token string, module *Module) (*Module, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	module = normalizeModule(module)
	if err := uc.validateModule(ctx, module, ""); err != nil {
		return nil, err
	}
	return uc.repo.CreateModule(ctx, module)
}

func (uc *ModuleUsecase) UpdateModule(ctx context.Context, token string, id string, module *Module) (*Module, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetModule(ctx, id); err != nil {
		return nil, err
	}
	module = normalizeModule(module)
	module.ID = id
	if err := uc.validateModule(ctx, module, id); err != nil {
		return nil, err
	}
	return uc.repo.UpdateModule(ctx, module)
}

func (uc *ModuleUsecase) DeleteModule(ctx context.Context, token string, id string) error {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	module, err := uc.repo.GetModule(ctx, id)
	if err != nil {
		return err
	}
	hasMenus, err := uc.repo.HasMenus(ctx, id)
	if err != nil {
		return err
	}
	if hasMenus {
		return ErrModuleHasMenus
	}
	if err := uc.ensureNotLastActiveVisibleModule(ctx, module); err != nil {
		return err
	}
	return uc.repo.DeleteModule(ctx, id)
}

func (uc *ModuleUsecase) MigrateModuleMenus(ctx context.Context, token string, id string, targetModuleID string) error {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	targetModuleID = strings.TrimSpace(targetModuleID)
	if id == "" || targetModuleID == "" || id == targetModuleID {
		return ErrModuleInvalidArgument
	}
	source, err := uc.repo.GetModule(ctx, id)
	if err != nil {
		return err
	}
	target, err := uc.repo.GetModule(ctx, targetModuleID)
	if err != nil {
		return err
	}
	if target.Status != MenuStatusEnabled {
		return ErrModuleInvalidArgument
	}
	if err := uc.ensureNotLastActiveVisibleModule(ctx, source); err != nil {
		return err
	}
	return uc.repo.MigrateMenusAndDeleteModule(ctx, id, targetModuleID)
}

func (uc *ModuleUsecase) requireManagePermission(ctx context.Context, token string) error {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return err
	}
	if user.Role == "admin" || slices.Contains(user.MenuPermissions, ModuleManagePermission) {
		return nil
	}
	return ErrSystemUnauthorized
}

func (uc *ModuleUsecase) validateModule(ctx context.Context, module *Module, currentID string) error {
	if module == nil || module.Code == "" || module.Name == "" {
		return ErrModuleInvalidArgument
	}
	exists, err := uc.repo.ModuleCodeExists(ctx, module.Code, currentID)
	if err != nil {
		return err
	}
	if exists {
		return ErrModuleDuplicateCode
	}
	return nil
}

func (uc *ModuleUsecase) ensureNotLastActiveVisibleModule(ctx context.Context, module *Module) error {
	if module == nil || module.Status != MenuStatusEnabled || module.Hidden {
		return nil
	}
	count, err := uc.repo.CountActiveVisibleModules(ctx, module.ID)
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrModuleInvalidArgument
	}
	return nil
}

func normalizeModule(module *Module) *Module {
	if module == nil {
		return nil
	}
	normalized := *module
	normalized.ID = strings.TrimSpace(normalized.ID)
	normalized.Code = strings.TrimSpace(normalized.Code)
	normalized.Name = strings.TrimSpace(normalized.Name)
	normalized.Icon = strings.TrimSpace(normalized.Icon)
	normalized.Status = strings.TrimSpace(normalized.Status)
	if normalized.Status == "" {
		normalized.Status = MenuStatusEnabled
	}
	return &normalized
}
