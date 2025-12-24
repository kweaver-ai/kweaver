#!/usr/bin/env bash

# 进入当前脚本所在目录
script_path=$(realpath "${BASH_SOURCE[0]}")
# 切换到项目根目录
cd $(dirname $(dirname "${script_path}")) || exit

# exec go run ./cmd/server/main.go
git_rev=$(git rev-parse --short=8 HEAD 2>/dev/null || echo "unknown")
if [[ -n $(git status --porcelain) ]]; then
    git_dirty="dirty"
else
    git_dirty="clean"
fi
local_tag="git.${git_rev}-${git_dirty}"
local_img="localhost/ict/workstation-backend:${local_tag}"
echo "开始构建镜像... ${local_img}"
DOCKER_BUILDKIT=1 docker build --target build-result --pull -t ${local_img} -f Dockerfile .
    echo "镜像构建完成... ${local_img}"


if [[ $1 == "apply" ]]; then
    echo "开始应用镜像... ${local_img}"
    kubectl -n anyshare set image deployment/studio-web studio-web-backend=${local_img}
    kubectl -n anyshare rollout restart deployment/studio-web
fi