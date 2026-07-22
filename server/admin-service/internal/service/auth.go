package service

import (
	"context"
	"strings"

	v1 "template-v6/server/admin-service/api/auth/v1"
	"template-v6/server/admin-service/internal/biz"

	"github.com/go-kratos/kratos/v3/metadata"
	"github.com/go-kratos/kratos/v3/transport"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// AuthService is the auth service.
type AuthService struct {
	v1.UnimplementedAuthServiceServer

	uc *biz.AuthUsecase
}

// NewAuthService creates an AuthService.
func NewAuthService(uc *biz.AuthUsecase) *AuthService {
	return &AuthService{uc: uc}
}

// Login authenticates a user and returns Ant Design Pro-compatible login state.
func (s *AuthService) Login(ctx context.Context, req *v1.LoginRequest) (*v1.LoginReply, error) {
	result, err := s.uc.Login(ctx, req.GetUsername(), req.GetPassword())
	if err != nil {
		return nil, err
	}
	return &v1.LoginReply{
		Status:           "ok",
		Type:             loginType(req.GetType()),
		CurrentAuthority: result.User.Role,
		Token:            result.Token,
		ExpiresAt:        timestamppb.New(result.ExpiresAt),
	}, nil
}

// CurrentUser returns the signed-in user for the bearer token.
func (s *AuthService) CurrentUser(ctx context.Context, _ *v1.CurrentUserRequest) (*v1.CurrentUserReply, error) {
	user, err := s.uc.CurrentUser(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.CurrentUserReply{Data: convertCurrentUser(user)}, nil
}

// OutLogin revokes the bearer token when present.
func (s *AuthService) OutLogin(ctx context.Context, _ *v1.OutLoginRequest) (*v1.OutLoginReply, error) {
	if err := s.uc.Logout(ctx, bearerToken(ctx)); err != nil {
		return nil, err
	}
	return &v1.OutLoginReply{Success: true}, nil
}

func loginType(value string) string {
	if strings.TrimSpace(value) == "" {
		return "account"
	}
	return value
}

func bearerToken(ctx context.Context) string {
	if tr, ok := transport.FromServerContext(ctx); ok {
		if token := trimBearerToken(tr.RequestHeader().Get("Authorization")); token != "" {
			return token
		}
	}

	md, ok := metadata.FromServerContext(ctx)
	if !ok {
		return ""
	}
	return trimBearerToken(md.Get("Authorization"))
}

func trimBearerToken(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if token, ok := strings.CutPrefix(value, "Bearer "); ok {
		return strings.TrimSpace(token)
	}
	if token, ok := strings.CutPrefix(value, "bearer "); ok {
		return strings.TrimSpace(token)
	}
	return value
}

func convertCurrentUser(user *biz.AuthUser) *v1.CurrentUser {
	if user == nil {
		return nil
	}
	return &v1.CurrentUser{
		Userid:            user.ID,
		Name:              user.DisplayName,
		Username:          user.Username,
		Avatar:            user.Avatar,
		Access:            user.Role,
		Role:              user.Role,
		Status:            user.Status,
		MenuPermissions:   append([]string(nil), user.MenuPermissions...),
		ButtonPermissions: append([]string(nil), user.ButtonPermissions...),
		RoleCodes:         append([]string(nil), user.RoleCodes...),
	}
}
