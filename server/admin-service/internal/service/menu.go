package service

import (
	"context"

	v1 "template-v6/server/admin-service/api/system/v1"
	"template-v6/server/admin-service/internal/biz"

	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// MenuService is the system menu management service.
type MenuService struct {
	v1.UnimplementedMenuServiceServer

	uc *biz.MenuUsecase
}

// NewMenuService creates a MenuService.
func NewMenuService(uc *biz.MenuUsecase) *MenuService {
	return &MenuService{uc: uc}
}

// ListMenus returns the menu permission tree.
func (s *MenuService) ListMenus(ctx context.Context, _ *v1.ListMenusRequest) (*v1.ListMenusReply, error) {
	menus, err := s.uc.ListMenus(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.ListMenusReply{Data: convertMenuReplies(menus)}, nil
}

// GetMenu returns a menu node.
func (s *MenuService) GetMenu(ctx context.Context, req *v1.GetMenuRequest) (*v1.Menu, error) {
	menu, err := s.uc.GetMenu(ctx, bearerToken(ctx), req.GetId())
	if err != nil {
		return nil, err
	}
	return convertMenuReply(menu), nil
}

// CreateMenu creates a menu node.
func (s *MenuService) CreateMenu(ctx context.Context, req *v1.CreateMenuRequest) (*v1.Menu, error) {
	menu, err := s.uc.CreateMenu(ctx, bearerToken(ctx), convertCreateMenuRequest(req))
	if err != nil {
		return nil, err
	}
	return convertMenuReply(menu), nil
}

// UpdateMenu updates a menu node.
func (s *MenuService) UpdateMenu(ctx context.Context, req *v1.UpdateMenuRequest) (*v1.Menu, error) {
	menu, err := s.uc.UpdateMenu(ctx, bearerToken(ctx), req.GetId(), convertUpdateMenuRequest(req))
	if err != nil {
		return nil, err
	}
	return convertMenuReply(menu), nil
}

// DeleteMenu deletes a menu node when safe.
func (s *MenuService) DeleteMenu(ctx context.Context, req *v1.DeleteMenuRequest) (*emptypb.Empty, error) {
	if err := s.uc.DeleteMenu(ctx, bearerToken(ctx), req.GetId()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func convertCreateMenuRequest(req *v1.CreateMenuRequest) *biz.Menu {
	if req == nil {
		return nil
	}
	return &biz.Menu{
		ParentID:       req.GetParentId(),
		Type:           req.GetType(),
		Name:           req.GetName(),
		Path:           req.GetPath(),
		Component:      req.GetComponent(),
		PermissionCode: req.GetPermissionCode(),
		Icon:           req.GetIcon(),
		Sort:           req.GetSort(),
		Status:         req.GetStatus(),
	}
}

func convertUpdateMenuRequest(req *v1.UpdateMenuRequest) *biz.Menu {
	if req == nil {
		return nil
	}
	return &biz.Menu{
		ID:             req.GetId(),
		ParentID:       req.GetParentId(),
		Type:           req.GetType(),
		Name:           req.GetName(),
		Path:           req.GetPath(),
		Component:      req.GetComponent(),
		PermissionCode: req.GetPermissionCode(),
		Icon:           req.GetIcon(),
		Sort:           req.GetSort(),
		Status:         req.GetStatus(),
	}
}

func convertMenu(menu *v1.Menu) *biz.Menu {
	if menu == nil {
		return nil
	}
	return &biz.Menu{
		ID:             menu.GetId(),
		ParentID:       menu.GetParentId(),
		Type:           menu.GetType(),
		Name:           menu.GetName(),
		Path:           menu.GetPath(),
		Component:      menu.GetComponent(),
		PermissionCode: menu.GetPermissionCode(),
		Icon:           menu.GetIcon(),
		Sort:           menu.GetSort(),
		Status:         menu.GetStatus(),
	}
}

func convertMenuReplies(menus []*biz.Menu) []*v1.Menu {
	result := make([]*v1.Menu, 0, len(menus))
	for _, menu := range menus {
		result = append(result, convertMenuReply(menu))
	}
	return result
}

func convertMenuReply(menu *biz.Menu) *v1.Menu {
	if menu == nil {
		return nil
	}
	return &v1.Menu{
		Id:             menu.ID,
		ParentId:       menu.ParentID,
		Type:           menu.Type,
		Name:           menu.Name,
		Path:           menu.Path,
		Component:      menu.Component,
		PermissionCode: menu.PermissionCode,
		Icon:           menu.Icon,
		Sort:           menu.Sort,
		Status:         menu.Status,
		Children:       convertMenuReplies(menu.Children),
		CreatedAt:      timestamppb.New(menu.CreatedAt),
		UpdatedAt:      timestamppb.New(menu.UpdatedAt),
	}
}
