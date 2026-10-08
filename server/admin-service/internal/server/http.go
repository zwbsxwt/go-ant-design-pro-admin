package server

import (
	"github.com/go-kratos/kratos/v3/middleware/recovery"
	"github.com/go-kratos/kratos/v3/middleware/validate"
	"github.com/go-kratos/kratos/v3/transport/http"
	authv1 "template-v6/server/admin-service/api/auth/v1"
	profilev1 "template-v6/server/admin-service/api/profile/v1"
	systemv1 "template-v6/server/admin-service/api/system/v1"
	v1 "template-v6/server/admin-service/api/todo/v1"
	"template-v6/server/admin-service/internal/conf"
	"template-v6/server/admin-service/internal/service"

	"go.einride.tech/aip/fieldbehavior"
	"google.golang.org/protobuf/proto"
)

// NewHTTPServer new an HTTP server.
func NewHTTPServer(c *conf.Server, todo *service.TodoService, auth *service.AuthService, menu *service.MenuService, role *service.RoleService, user *service.UserService, profile *service.ProfileService, module *service.ModuleService, harness *service.HarnessService) *http.Server {
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
	systemv1.RegisterModuleServiceHTTPServer(srv, module)
	profilev1.RegisterProfileServiceHTTPServer(srv, profile)
	srv.Route("/api/profile").POST("/avatar", profile.UploadAvatarHTTP)
	h := srv.Route("/api/harness")
	h.GET("/capabilities", harness.Capabilities)
	h.GET("/workspaces", harness.ListWorkspaces)
	h.POST("/workspaces", harness.CreateWorkspace)
	h.DELETE("/workspaces/{workspaceId}", harness.DeleteWorkspace)
	h.GET("/sessions", harness.ListSessions)
	h.POST("/sessions", harness.CreateSession)
	h.GET("/sessions/{sessionId}", harness.GetSession)
	h.DELETE("/sessions/{sessionId}", harness.DeleteSession)
	h.PATCH("/sessions/{sessionId}/title", harness.RenameSession)
	h.POST("/sessions/{sessionId}/messages", harness.SendMessage)
	h.POST("/sessions/{sessionId}/cancel", harness.Cancel)
	h.PATCH("/sessions/{sessionId}/workspace", harness.AssignWorkspace)
	h.PATCH("/sessions/{sessionId}/preferences", harness.Preferences)
	h.GET("/sessions/{sessionId}/events", harness.Events)
	return srv
}
