package data

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"

	"template-v6/server/admin-service/internal/biz"

	_ "github.com/go-sql-driver/mysql"
)

func TestProfileRepoIntegration(t *testing.T) {
	dsn := os.Getenv("ADMIN_SERVICE_TEST_MYSQL_DSN")
	redisAddr := os.Getenv("ADMIN_SERVICE_TEST_REDIS_ADDR")
	if dsn == "" || redisAddr == "" {
		t.Skip("set ADMIN_SERVICE_TEST_MYSQL_DSN and ADMIN_SERVICE_TEST_REDIS_ADDR to run integration test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if err := initializeSchema(ctx, db); err != nil {
		t.Fatal(err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Fatal(err)
	}

	authRepo := NewAuthRepo(&Data{db: db, redis: rdb})
	authUser, err := authRepo.VerifyPassword(ctx, "admin", "ant.design")
	if err != nil {
		t.Fatal(err)
	}
	token, _, err := authRepo.CreateToken(ctx, authUser.ID)
	if err != nil {
		t.Fatal(err)
	}

	repo := NewProfileRepo(&Data{db: db, redis: rdb})
	profile, err := repo.GetProfile(ctx, authUser.ID)
	if err != nil {
		t.Fatal(err)
	}
	if profile.Username != "admin" {
		t.Fatalf("expected admin profile, got %q", profile.Username)
	}

	updated, err := repo.UpdateProfile(ctx, authUser.ID, &biz.Profile{
		DisplayName: "Template Admin",
		Email:       "admin@example.local",
		Phone:       "13800138000",
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Phone != "13800138000" {
		t.Fatalf("expected updated phone, got %q", updated.Phone)
	}

	if err := repo.ChangePassword(ctx, authUser.ID, token, "bad-password", "new-password"); err == nil {
		t.Fatal("expected wrong current password to fail")
	}
}
