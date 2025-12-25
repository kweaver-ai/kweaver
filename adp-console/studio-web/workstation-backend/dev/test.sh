#!/usr/bin/env bash

# 进入当前脚本所在目录
script_path=$(realpath "${BASH_SOURCE[0]}")
# 切换到项目根目录
cd $(dirname $(dirname "${script_path}")) || exit

# docker build --target test-result --output type=local,dest=./ut-result .
rm -rf ./ut-result
if [[ $1 == "docker" ]]; then
  DOCKER_BUILDKIT=1 docker build --target test-result --output type=local,dest=./ut-result .
else
  set -x
    go tool golangci-lint run --output.junit-xml.path ./ut-result/lint-results.xml
    go tool gotestsum --packages="./..."  --junitfile ./ut-result/junit-results.xml  -- -gcflags="all=-N -l" --coverprofile=./ut-result/coverage.txt
    go tool gocov convert ./ut-result/coverage.txt > ./ut-result/coverage.json
    go tool gocov-xml < ./ut-result/coverage.json > ./ut-result/coverage.xml
  set +x
fi

