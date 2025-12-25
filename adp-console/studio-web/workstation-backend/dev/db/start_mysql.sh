#!/usr/bin/env bash

set -e
set -x

docker compose -f docker-compose.yaml down -v || true

if [[ $1 == "stop" ]]; then
    exit
fi

docker compose -f docker-compose.yaml up -d
