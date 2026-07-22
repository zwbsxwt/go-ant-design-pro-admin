package data

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"sync"
	"time"

	"template-v6/server/admin-service/internal/biz"
)

type seededUser struct {
	user     *biz.AuthUser
	password string
}

type tokenRecord struct {
	userID    string
	expiresAt time.Time
}

type authRepo struct {
	data *Data

	mu       sync.RWMutex
	users    map[string]seededUser
	tokens   map[string]tokenRecord
	tokenTTL time.Duration
}

// NewAuthRepo creates an AuthRepo with local seeded users.
func NewAuthRepo(data *Data) biz.AuthRepo {
	admin := &biz.AuthUser{
		ID:              "1",
		Username:        "admin",
		DisplayName:     "Template Admin",
		Role:            "admin",
		Status:          "ACTIVE",
		Avatar:          "https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg",
		MenuPermissions: []string{"menu.dashboard", "menu.admin"},
	}
	user := &biz.AuthUser{
		ID:              "2",
		Username:        "user",
		DisplayName:     "Template User",
		Role:            "user",
		Status:          "ACTIVE",
		MenuPermissions: []string{"menu.dashboard"},
	}
	return &authRepo{
		data: data,
		users: map[string]seededUser{
			admin.Username: {user: admin, password: "ant.design"},
			user.Username:  {user: user, password: "ant.design"},
		},
		tokens:   make(map[string]tokenRecord),
		tokenTTL: 24 * time.Hour,
	}
}

func (r *authRepo) VerifyPassword(_ context.Context, username, password string) (*biz.AuthUser, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	record, ok := r.users[strings.TrimSpace(username)]
	if !ok || record.password != password {
		return nil, biz.ErrAuthInvalidCredentials
	}
	return cloneAuthUser(record.user), nil
}

func (r *authRepo) CreateToken(_ context.Context, userID string) (string, time.Time, error) {
	token, err := randomToken()
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt := time.Now().Add(r.tokenTTL)

	r.mu.Lock()
	defer r.mu.Unlock()
	r.tokens[token] = tokenRecord{userID: userID, expiresAt: expiresAt}
	return token, expiresAt, nil
}

func (r *authRepo) FindByToken(_ context.Context, token string) (*biz.AuthUser, error) {
	r.mu.RLock()
	record, ok := r.tokens[token]
	if !ok || time.Now().After(record.expiresAt) {
		r.mu.RUnlock()
		return nil, biz.ErrAuthInvalidToken
	}
	for _, seeded := range r.users {
		if seeded.user.ID == record.userID {
			user := cloneAuthUser(seeded.user)
			r.mu.RUnlock()
			return user, nil
		}
	}
	r.mu.RUnlock()
	return nil, biz.ErrAuthInvalidToken
}

func (r *authRepo) RevokeToken(_ context.Context, token string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.tokens, token)
	return nil
}

func randomToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return "tmpl_" + hex.EncodeToString(b[:]), nil
}

func cloneAuthUser(user *biz.AuthUser) *biz.AuthUser {
	if user == nil {
		return nil
	}
	permissions := append([]string(nil), user.MenuPermissions...)
	return &biz.AuthUser{
		ID:              user.ID,
		Username:        user.Username,
		DisplayName:     user.DisplayName,
		Role:            user.Role,
		Status:          user.Status,
		Avatar:          user.Avatar,
		MenuPermissions: permissions,
	}
}
