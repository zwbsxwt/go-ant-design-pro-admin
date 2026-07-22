package server

import (
	"github.com/go-kratos/kratos/v3/middleware/recovery"
	"github.com/go-kratos/kratos/v3/middleware/validate"
	"github.com/go-kratos/kratos/v3/transport/http"
	authv1 "template-v6/server/admin-service/api/auth/v1"
	systemv1 "template-v6/server/admin-service/api/system/v1"
	v1 "template-v6/server/admin-service/api/todo/v1"
	"template-v6/server/admin-service/internal/conf"
	"template-v6/server/admin-service/internal/service"

	"go.einride.tech/aip/fieldbehavior"
	"google.golang.org/protobuf/proto"
)

// NewHTTPServer new an HTTP server.
func NewHTTPServer(c *conf.Server, todo *service.TodoService, auth *service.AuthService, menu *service.MenuService, role *service.RoleService, user *service.UserService) *http.Server {
	var opts = []http.ServerOption{
		http.Middleware(
			recovery.Recovery(),
			validate.Validator(func(req any) error {
				if msg, ok := req.(proto.Message); ok {
					if err := fieldbehavior.ValidateRequiredFields(msg); err != nil {
						return err
					}
				}
				return nil
			}),
		),
	}
	if c.Http.Network != "" {
		opts = append(opts, http.Network(c.Http.Network))
	}
	if c.Http.Addr != "" {
		opts = append(opts, http.Address(c.Http.Addr))
	}
	if c.Http.Timeout != nil {
		opts = append(opts, http.Timeout(c.Http.Timeout.AsDuration()))
	}
	srv := http.NewServer(opts...)
	v1.RegisterTodoServiceHTTPServer(srv, todo)
	authv1.RegisterAuthServiceHTTPServer(srv, auth)
	systemv1.RegisterMenuServiceHTTPServer(srv, menu)
	systemv1.RegisterRoleServiceHTTPServer(srv, role)
	systemv1.RegisterUserServiceHTTPServer(srv, user)
	return srv
}
