#!/usr/bin/env bash

set -e
set -x

docker compose -f docker-compose.tidb.yaml down -v || true

if [[ $1 == "stop" ]]; then
    exit
fi

docker compose -f docker-compose.tidb.yaml up -d

mycli -u root -P 4000 -e "SET PASSWORD FOR 'root'@'%' = PASSWORD('123qweASD');"
mycli -u root -P 4000 -p 123qweASD -e "CREATE DATABASE deploy;"
