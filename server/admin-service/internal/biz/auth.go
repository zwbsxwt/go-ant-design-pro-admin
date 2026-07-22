package biz

import (
	"context"
	"strings"
	"time"

	v1 "template-v6/server/admin-service/api/auth/v1"

	"github.com/go-kratos/kratos/v3/errors"
)

var (
	// ErrAuthInvalidCredentials is returned when username or password is invalid.
	ErrAuthInvalidCredentials = errors.Unauthorized(v1.ErrorReason_AUTH_INVALID_CREDENTIALS.String(), "invalid credentials")
	// ErrAuthDisabledUser is returned when a disabled user attempts to authenticate.
	ErrAuthDisabledUser = errors.Unauthorized(v1.ErrorReason_AUTH_DISABLED_USER.String(), "user disabled")
	// ErrAuthMissingToken is returned when a protected request has no bearer token.
	ErrAuthMissingToken = errors.Unauthorized(v1.ErrorReason_AUTH_MISSING_TOKEN.String(), "missing token")
	// ErrAuthInvalidToken is returned when a bearer token cannot be resolved.
	ErrAuthInvalidToken = errors.Unauthorized(v1.ErrorReason_AUTH_INVALID_TOKEN.String(), "invalid token")
)

// AuthUser is the signed-in admin user model.
type AuthUser struct {
	ID              string
	Username        string
	DisplayName     string
	Role            string
	Status          string
	Avatar          string
	MenuPermissions []string
}

// LoginResult is the result of a successful login.
type LoginResult struct {
	User      *AuthUser
	Token     string
	ExpiresAt time.Time
}

// AuthRepo stores and resolves local auth users.
type AuthRepo interface {
	VerifyPassword(context.Context, string, string) (*AuthUser, error)
	CreateToken(context.Context, string) (string, time.Time, error)
	FindByToken(context.Context, string) (*AuthUser, error)
	RevokeToken(context.Context, string) error
}

// AuthUsecase handles admin authentication.
type AuthUsecase struct {
	repo AuthRepo
}

// NewAuthUsecase creates an AuthUsecase.
func NewAuthUsecase(repo AuthRepo) *AuthUsecase {
	return &AuthUsecase{repo: repo}
}

// Login authenticates a user and returns a bearer token.
func (uc *AuthUsecase) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	if strings.TrimSpace(username) == "" || password == "" {
		return nil, ErrAuthInvalidCredentials
	}
	user, err := uc.repo.VerifyPassword(ctx, username, password)
	if err != nil {
		return nil, err
	}
	if user.Status != "ACTIVE" {
		return nil, ErrAuthDisabledUser
	}
	token, expiresAt, err := uc.repo.CreateToken(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	return &LoginResult{User: user, Token: token, ExpiresAt: expiresAt}, nil
}

// CurrentUser resolves the current user from a bearer token.
func (uc *AuthUsecase) CurrentUser(ctx context.Context, token string) (*AuthUser, error) {
	if strings.TrimSpace(token) == "" {
		return nil, ErrAuthMissingToken
	}
	user, err := uc.repo.FindByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if user.Status != "ACTIVE" {
		return nil, ErrAuthDisabledUser
	}
	return user, nil
}

// Logout revokes a bearer token when present.
func (uc *AuthUsecase) Logout(ctx context.Context, token string) error {
	if strings.TrimSpace(token) == "" {
		return nil
	}
	return uc.repo.RevokeToken(ctx, token)
}
