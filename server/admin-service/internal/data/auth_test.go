package data

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"

	_ "github.com/go-sql-driver/mysql"
)

func TestVerifyPasswordHash(t *testing.T) {
	t.Parallel()

	const encoded = "sha256$d5befed9a171abd78a7d9c3ad6e9c24fe2c27d42213cd0b7d25bb75b7f6788ed"
	if !verifyPasswordHash(encoded, "ant.design") {
		t.Fatal("expected seeded password to verify")
	}
	if verifyPasswordHash(encoded, "wrong") {
		t.Fatal("expected wrong password to fail")
	}
}

func TestSplitCSV(t *testing.T) {
	t.Parallel()

	got := splitCSV("menu.dashboard, menu.admin,,")
	if len(got) != 2 || got[0] != "menu.dashboard" || got[1] != "menu.admin" {
		t.Fatalf("unexpected permissions: %#v", got)
	}
}

func TestAuthRepoSeededLoginIntegration(t *testing.T) {
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
	if err := db.PingContext(ctx); err != nil {
		t.Fatal(err)
	}
	if err := initializeSchema(ctx, db); err != nil {
		t.Fatal(err)
	}
	if err := initializeSchema(ctx, db); err != nil {
		t.Fatal(err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Fatal(err)
	}

	repo := NewAuthRepo(&Data{db: db, redis: rdb})
	user, err := repo.VerifyPassword(ctx, "admin", "ant.design")
	if err != nil {
		t.Fatal(err)
	}
	if user.Role != "admin" {
		t.Fatalf("expected admin role, got %q", user.Role)
	}
	token, _, err := repo.CreateToken(ctx, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	current, err := repo.FindByToken(ctx, token)
	if err != nil {
		t.Fatal(err)
	}
	if current.Username != "admin" {
		t.Fatalf("expected admin current user, got %q", current.Username)
	}
}
