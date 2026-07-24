package server

import (
	authv1 "template-v6/server/admin-service/api/auth/v1"
	profilev1 "template-v6/server/admin-service/api/profile/v1"
	systemv1 "template-v6/server/admin-service/api/system/v1"
	v1 "template-v6/server/admin-service/api/todo/v1"
	"template-v6/server/admin-service/internal/conf"
	"template-v6/server/admin-service/internal/service"

	"github.com/go-kratos/kratos/v3/middleware/recovery"
	"github.com/go-kratos/kratos/v3/transport/grpc"
)

// NewGRPCServer new a gRPC server.
func NewGRPCServer(c *conf.Server, todo *service.TodoService, auth *service.AuthService, menu *service.MenuService, role *service.RoleService, user *service.UserService, profile *service.ProfileService, module *service.ModuleService) *grpc.Server {
	var opts = []grpc.ServerOption{
		grpc.Middleware(
			recovery.Recovery(),
		),
	}
	if c.Grpc.Network != "" {
		opts = append(opts, grpc.Network(c.Grpc.Network))
	}
	if c.Grpc.Addr != "" {
		opts = append(opts, grpc.Address(c.Grpc.Addr))
	}
	if c.Grpc.Timeout != nil {
		opts = append(opts, grpc.Timeout(c.Grpc.Timeout.AsDuration()))
	}
	srv := grpc.NewServer(opts...)
	v1.RegisterTodoServiceServer(srv, todo)
	authv1.RegisterAuthServiceServer(srv, auth)
	systemv1.RegisterMenuServiceServer(srv, menu)
	systemv1.RegisterRoleServiceServer(srv, role)
	systemv1.RegisterUserServiceServer(srv, user)
	systemv1.RegisterModuleServiceServer(srv, module)
	profilev1.RegisterProfileServiceServer(srv, profile)
	return srv
}
