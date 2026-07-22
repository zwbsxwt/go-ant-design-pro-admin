package data

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"template-v6/server/admin-service/internal/conf"

	"github.com/go-kratos/kratos/v3/log"
	"github.com/google/wire"
	"github.com/redis/go-redis/v9"

	_ "github.com/go-sql-driver/mysql"
)

// ProviderSet is data providers.
var ProviderSet = wire.NewSet(NewData, NewTodoRepo, NewAuthRepo, NewMenuRepo, NewRoleRepo, NewUserRepo)

// Data .
type Data struct {
	db    *sql.DB
	redis *redis.Client
}

// NewData .
func NewData(c *conf.Data) (*Data, func(), error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := newSQLDB(ctx, c.GetDatabase())
	if err != nil {
		return nil, nil, err
	}

	rdb, err := newRedisClient(ctx, c.GetRedis())
	if err != nil {
		_ = db.Close()
		return nil, nil, err
	}

	if err := initializeSchema(ctx, db); err != nil {
		_ = rdb.Close()
		_ = db.Close()
		return nil, nil, err
	}

	cleanup := func() {
		log.Info("closing the data resources")
		_ = rdb.Close()
		_ = db.Close()
	}
	return &Data{db: db, redis: rdb}, cleanup, nil
}

func newSQLDB(ctx context.Context, c *conf.Data_Database) (*sql.DB, error) {
	if c == nil {
		return nil, fmt.Errorf("database config is required")
	}
	db, err := sql.Open(c.GetDriver(), c.GetSource())
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return db, nil
}

func newRedisClient(ctx context.Context, c *conf.Data_Redis) (*redis.Client, error) {
	if c == nil {
		return nil, fmt.Errorf("redis config is required")
	}
	network := c.GetNetwork()
	if network == "" {
		network = "tcp"
	}
	rdb := redis.NewClient(&redis.Options{
		Network:      network,
		Addr:         c.GetAddr(),
		ReadTimeout:  c.GetReadTimeout().AsDuration(),
		WriteTimeout: c.GetWriteTimeout().AsDuration(),
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		_ = rdb.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return rdb, nil
}
