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
	MenuTypeDirectory    = "directory"
	MenuTypePage         = "page"
	MenuTypeButton       = "button"
	MenuStatusEnabled    = "ACTIVE"
	MenuStatusDisabled   = "DISABLED"
	MenuManagePermission = "menu.system.menu"
)

var (
	ErrSystemUnauthorized          = errors.Forbidden(v1.ErrorReason_SYSTEM_UNAUTHORIZED.String(), "unauthorized")
	ErrMenuNotFound                = errors.NotFound(v1.ErrorReason_MENU_NOT_FOUND.String(), "menu not found")
	ErrMenuDuplicatePermissionCode = errors.BadRequest(v1.ErrorReason_MENU_DUPLICATE_PERMISSION_CODE.String(), "duplicate permission code")
	ErrMenuInvalidParent           = errors.BadRequest(v1.ErrorReason_MENU_INVALID_PARENT.String(), "invalid parent")
	ErrMenuHasChildren             = errors.BadRequest(v1.ErrorReason_MENU_HAS_CHILDREN.String(), "menu has children")
	ErrMenuHasRoleBindings         = errors.BadRequest(v1.ErrorReason_MENU_HAS_ROLE_BINDINGS.String(), "menu has role bindings")
	ErrMenuInvalidType             = errors.BadRequest(v1.ErrorReason_MENU_INVALID_TYPE.String(), "invalid menu type")
)

// Menu is a directory, page, or button permission node.
type Menu struct {
	ID             string
	ParentID       string
	Type           string
	Name           string
	Path           string
	Component      string
	PermissionCode string
	Icon           string
	Sort           int32
	Status         string
	Children       []*Menu
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// MenuRepo persists menu permission nodes.
type MenuRepo interface {
	ListMenus(context.Context) ([]*Menu, error)
	GetMenu(context.Context, string) (*Menu, error)
	CreateMenu(context.Context, *Menu) (*Menu, error)
	UpdateMenu(context.Context, *Menu) (*Menu, error)
	DeleteMenu(context.Context, string) error
	PermissionCodeExists(context.Context, string, string) (bool, error)
	HasChildren(context.Context, string) (bool, error)
	HasRoleBindings(context.Context, string) (bool, error)
}

// MenuUsecase handles menu management rules.
type MenuUsecase struct {
	repo *MenuRepoHolder
	auth *AuthUsecase
}

type MenuRepoHolder struct {
	MenuRepo
}

// NewMenuUsecase creates a MenuUsecase.
func NewMenuUsecase(repo MenuRepo, auth *AuthUsecase) *MenuUsecase {
	return &MenuUsecase{repo: &MenuRepoHolder{MenuRepo: repo}, auth: auth}
}

// ListMenus returns a sorted menu tree for authorized users.
func (uc *MenuUsecase) ListMenus(ctx context.Context, token string) ([]*Menu, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	menus, err := uc.repo.ListMenus(ctx)
	if err != nil {
		return nil, err
	}
	return BuildMenuTree(menus), nil
}

// GetMenu returns one menu node.
func (uc *MenuUsecase) GetMenu(ctx context.Context, token string, id string) (*Menu, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	return uc.repo.GetMenu(ctx, strings.TrimSpace(id))
}

// CreateMenu creates a menu node after validation.
func (uc *MenuUsecase) CreateMenu(ctx context.Context, token string, menu *Menu) (*Menu, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	if err := uc.validateMenu(ctx, menu, ""); err != nil {
		return nil, err
	}
	return uc.repo.CreateMenu(ctx, normalizeMenu(menu))
}

// UpdateMenu updates a menu node after validation.
func (uc *MenuUsecase) UpdateMenu(ctx context.Context, token string, id string, menu *Menu) (*Menu, error) {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrMenuNotFound
	}
	if _, err := uc.repo.GetMenu(ctx, id); err != nil {
		return nil, err
	}
	menu = normalizeMenu(menu)
	menu.ID = id
	if err := uc.validateMenu(ctx, menu, id); err != nil {
		return nil, err
	}
	return uc.repo.UpdateMenu(ctx, menu)
}

// DeleteMenu deletes a menu node when safe.
func (uc *MenuUsecase) DeleteMenu(ctx context.Context, token string, id string) error {
	if err := uc.requireManagePermission(ctx, token); err != nil {
		return err
	}
	id = strings.TrimSpace(id)
	if _, err := uc.repo.GetMenu(ctx, id); err != nil {
		return err
	}
	hasChildren, err := uc.repo.HasChildren(ctx, id)
	if err != nil {
		return err
	}
	if hasChildren {
		return ErrMenuHasChildren
	}
	hasBindings, err := uc.repo.HasRoleBindings(ctx, id)
	if err != nil {
		return err
	}
	if hasBindings {
		return ErrMenuHasRoleBindings
	}
	return uc.repo.DeleteMenu(ctx, id)
}

func (uc *MenuUsecase) requireManagePermission(ctx context.Context, token string) error {
	user, err := uc.auth.CurrentUser(ctx, token)
	if err != nil {
		return err
	}
	if user.Role == "admin" || slices.Contains(user.MenuPermissions, MenuManagePermission) {
		return nil
	}
	return ErrSystemUnauthorized
}

func (uc *MenuUsecase) validateMenu(ctx context.Context, menu *Menu, currentID string) error {
	menu = normalizeMenu(menu)
	if menu == nil || menu.Name == "" || menu.PermissionCode == "" {
		return ErrMenuInvalidType
	}
	if !validMenuType(menu.Type) {
		return ErrMenuInvalidType
	}
	if menu.Type == MenuTypePage && (menu.Path == "" || menu.Component == "") {
		return ErrMenuInvalidType
	}
	if menu.ParentID != "" {
		if currentID != "" && menu.ParentID == currentID {
			return ErrMenuInvalidParent
		}
		if _, err := uc.repo.GetMenu(ctx, menu.ParentID); err != nil {
			return ErrMenuInvalidParent
		}
		if currentID != "" {
			allMenus, err := uc.repo.ListMenus(ctx)
			if err != nil {
				return err
			}
			if wouldCreateCycle(allMenus, currentID, menu.ParentID) {
				return ErrMenuInvalidParent
			}
		}
	}
	exists, err := uc.repo.PermissionCodeExists(ctx, menu.PermissionCode, currentID)
	if err != nil {
		return err
	}
	if exists {
		return ErrMenuDuplicatePermissionCode
	}
	return nil
}

func normalizeMenu(menu *Menu) *Menu {
	if menu == nil {
		return nil
	}
	normalized := *menu
	normalized.ID = strings.TrimSpace(normalized.ID)
	normalized.ParentID = strings.TrimSpace(normalized.ParentID)
	normalized.Type = strings.TrimSpace(normalized.Type)
	normalized.Name = strings.TrimSpace(normalized.Name)
	normalized.Path = strings.TrimSpace(normalized.Path)
	normalized.Component = strings.TrimSpace(normalized.Component)
	normalized.PermissionCode = strings.TrimSpace(normalized.PermissionCode)
	normalized.Icon = strings.TrimSpace(normalized.Icon)
	normalized.Status = strings.TrimSpace(normalized.Status)
	if normalized.Status == "" {
		normalized.Status = MenuStatusEnabled
	}
	return &normalized
}

func validMenuType(value string) bool {
	return value == MenuTypeDirectory || value == MenuTypePage || value == MenuTypeButton
}

func wouldCreateCycle(menus []*Menu, currentID string, newParentID string) bool {
	parentByID := make(map[string]string, len(menus))
	for _, menu := range menus {
		parentByID[menu.ID] = menu.ParentID
	}
	for id := newParentID; id != ""; id = parentByID[id] {
		if id == currentID {
			return true
		}
	}
	return false
}

// BuildMenuTree turns flat menu rows into deterministic tree roots.
func BuildMenuTree(menus []*Menu) []*Menu {
	byID := make(map[string]*Menu, len(menus))
	roots := make([]*Menu, 0)
	for _, menu := range menus {
		clone := *menu
		clone.Children = nil
		byID[clone.ID] = &clone
	}
	for _, menu := range byID {
		if menu.ParentID == "" {
			roots = append(roots, menu)
			continue
		}
		parent, ok := byID[menu.ParentID]
		if !ok {
			roots = append(roots, menu)
			continue
		}
		parent.Children = append(parent.Children, menu)
	}
	sortMenus(roots)
	return roots
}

func sortMenus(menus []*Menu) {
	slices.SortFunc(menus, func(a, b *Menu) int {
		if a.Sort != b.Sort {
			return int(a.Sort - b.Sort)
		}
		return strings.Compare(a.PermissionCode, b.PermissionCode)
	})
	for _, menu := range menus {
		sortMenus(menu.Children)
	}
}
