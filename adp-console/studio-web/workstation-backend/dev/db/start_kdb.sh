#!/usr/bin/env bash

set -e
set -x

docker compose -f docker-compose.kdb.yaml down -v || true

if [[ $1 == "stop" ]]; then
    exit
fi

docker compose -f docker-compose.kdb.yaml up -d && sleep 30
docker compose -f docker-compose.kdb.yaml exec kingbase8 ksql -Usystem -dtest -c "create database proton"
docker compose -f docker-compose.kdb.yaml exec kingbase8 ksql -Usystem -dproton -c "create schema deploy"
docker compose -f docker-compose.kdb.yaml exec kingbase9 ksql -Usystem -dtest -c "create database proton"
docker compose -f docker-compose.kdb.yaml exec kingbase9 ksql -Usystem -dproton -c "create schema deploy"