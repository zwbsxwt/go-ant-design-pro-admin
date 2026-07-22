//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"log/slog"

	"template-v6/server/admin-service/internal/biz"
	"template-v6/server/admin-service/internal/conf"
	"template-v6/server/admin-service/internal/data"
	"template-v6/server/admin-service/internal/server"
	"template-v6/server/admin-service/internal/service"

	"github.com/go-kratos/kratos/v3"
	"github.com/google/wire"
)

// wireApp init kratos application.
func wireApp(*conf.Server, *conf.Data, *slog.Logger) (*kratos.App, func(), error) {
	panic(wire.Build(server.ProviderSet, data.ProviderSet, biz.ProviderSet, service.ProviderSet, newApp))
}
