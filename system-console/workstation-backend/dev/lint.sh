#!/usr/bin/env bash

# 进入当前脚本所在目录
script_path=$(realpath "${BASH_SOURCE[0]}")
# 切换到项目根目录
cd $(dirname $(dirname "${script_path}")) || exit

# genrate
go mod tidy
go tool swag init -g ./cmd/server/main.go

# format
go tool swag fmt -g ./cmd/server/main.go
go tool gofumpt -w .

# lint
go tool golangci-lint run
