package service

import (
	"context"

	v1 "template-v6/server/admin-service/api/system/v1"
	"template-v6/server/admin-service/internal/biz"

	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ModuleService is the system module management service.
type ModuleService struct {
	v1.UnimplementedModuleServiceServer

	uc *biz.ModuleUsecase
}

// NewModuleService creates a ModuleService.
func NewModuleService(uc *biz.ModuleUsecase) *ModuleService {
	return &ModuleService{uc: uc}
}

func (s *ModuleService) ListModules(ctx context.Context, _ *v1.ListModulesRequest) (*v1.ListModulesReply, error) {
	modules, err := s.uc.ListModules(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.ListModulesReply{Data: convertModuleReplies(modules)}, nil
}

func (s *ModuleService) GetModule(ctx context.Context, req *v1.GetModuleRequest) (*v1.Module, error) {
	module, err := s.uc.GetModule(ctx, bearerToken(ctx), req.GetId())
	if err != nil {
		return nil, err
	}
	return convertModuleReply(module), nil
}

func (s *ModuleService) CreateModule(ctx context.Context, req *v1.CreateModuleRequest) (*v1.Module, error) {
	module, err := s.uc.CreateModule(ctx, bearerToken(ctx), &biz.Module{
		Code:   req.GetCode(),
		Name:   req.GetName(),
		Icon:   req.GetIcon(),
		Sort:   req.GetSort(),
		Status: req.GetStatus(),
		Hidden: req.GetHidden(),
	})
	if err != nil {
		return nil, err
	}
	return convertModuleReply(module), nil
}

func (s *ModuleService) UpdateModule(ctx context.Context, req *v1.UpdateModuleRequest) (*v1.Module, error) {
	module, err := s.uc.UpdateModule(ctx, bearerToken(ctx), req.GetId(), &biz.Module{
		Code:   req.GetCode(),
		Name:   req.GetName(),
		Icon:   req.GetIcon(),
		Sort:   req.GetSort(),
		Status: req.GetStatus(),
		Hidden: req.GetHidden(),
	})
	if err != nil {
		return nil, err
	}
	return convertModuleReply(module), nil
}

func (s *ModuleService) DeleteModule(ctx context.Context, req *v1.DeleteModuleRequest) (*emptypb.Empty, error) {
	if err := s.uc.DeleteModule(ctx, bearerToken(ctx), req.GetId()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (s *ModuleService) MigrateModuleMenus(ctx context.Context, req *v1.MigrateModuleMenusRequest) (*v1.MigrateModuleMenusReply, error) {
	if err := s.uc.MigrateModuleMenus(ctx, bearerToken(ctx), req.GetId(), req.GetTargetModuleId()); err != nil {
		return nil, err
	}
	return &v1.MigrateModuleMenusReply{Success: true}, nil
}

func convertModuleReplies(modules []*biz.Module) []*v1.Module {
	result := make([]*v1.Module, 0, len(modules))
	for _, module := range modules {
		result = append(result, convertModuleReply(module))
	}
	return result
}

func convertModuleReply(module *biz.Module) *v1.Module {
	if module == nil {
		return nil
	}
	return &v1.Module{
		Id:        module.ID,
		Code:      module.Code,
		Name:      module.Name,
		Icon:      module.Icon,
		Sort:      module.Sort,
		Status:    module.Status,
		Hidden:    module.Hidden,
		CreatedAt: timestamppb.New(module.CreatedAt),
		UpdatedAt: timestamppb.New(module.UpdatedAt),
	}
}
