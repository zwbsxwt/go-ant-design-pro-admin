package service

import (
	"context"

	v1 "template-v6/server/admin-service/api/system/v1"
	"template-v6/server/admin-service/internal/biz"

	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// RoleService is the system role management service.
type RoleService struct {
	v1.UnimplementedRoleServiceServer

	uc *biz.RoleUsecase
}

// NewRoleService creates a RoleService.
func NewRoleService(uc *biz.RoleUsecase) *RoleService {
	return &RoleService{uc: uc}
}

func (s *RoleService) ListRoles(ctx context.Context, _ *v1.ListRolesRequest) (*v1.ListRolesReply, error) {
	roles, err := s.uc.ListRoles(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.ListRolesReply{Data: convertRoleReplies(roles)}, nil
}

func (s *RoleService) GetRole(ctx context.Context, req *v1.GetRoleRequest) (*v1.Role, error) {
	role, err := s.uc.GetRole(ctx, bearerToken(ctx), req.GetId())
	if err != nil {
		return nil, err
	}
	return convertRoleReply(role), nil
}

func (s *RoleService) CreateRole(ctx context.Context, req *v1.CreateRoleRequest) (*v1.Role, error) {
	role, err := s.uc.CreateRole(ctx, bearerToken(ctx), &biz.Role{
		Code:        req.GetCode(),
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Status:      req.GetStatus(),
	})
	if err != nil {
		return nil, err
	}
	return convertRoleReply(role), nil
}

func (s *RoleService) UpdateRole(ctx context.Context, req *v1.UpdateRoleRequest) (*v1.Role, error) {
	role, err := s.uc.UpdateRole(ctx, bearerToken(ctx), req.GetId(), &biz.Role{
		Code:        req.GetCode(),
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Status:      req.GetStatus(),
	})
	if err != nil {
		return nil, err
	}
	return convertRoleReply(role), nil
}

func (s *RoleService) DeleteRole(ctx context.Context, req *v1.DeleteRoleRequest) (*emptypb.Empty, error) {
	if err := s.uc.DeleteRole(ctx, bearerToken(ctx), req.GetId()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (s *RoleService) UpdateRolePermissions(ctx context.Context, req *v1.UpdateRolePermissionsRequest) (*v1.Role, error) {
	role, err := s.uc.UpdateRolePermissions(ctx, bearerToken(ctx), req.GetId(), req.GetPermissionIds())
	if err != nil {
		return nil, err
	}
	return convertRoleReply(role), nil
}

func convertRoleReplies(roles []*biz.Role) []*v1.Role {
	result := make([]*v1.Role, 0, len(roles))
	for _, role := range roles {
		result = append(result, convertRoleReply(role))
	}
	return result
}

func convertRoleReply(role *biz.Role) *v1.Role {
	if role == nil {
		return nil
	}
	return &v1.Role{
		Id:            role.ID,
		Code:          role.Code,
		Name:          role.Name,
		Description:   role.Description,
		Status:        role.Status,
		PermissionIds: append([]string(nil), role.PermissionIDs...),
		CreatedAt:     timestamppb.New(role.CreatedAt),
		UpdatedAt:     timestamppb.New(role.UpdatedAt),
	}
}
