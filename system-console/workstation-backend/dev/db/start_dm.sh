#!/usr/bin/env bash

set -e
set -x

docker compose -f docker-compose.dm8.yaml down -v || true

if [[ $1 == "stop" ]]; then
    exit
fi

docker compose -f docker-compose.dm8.yaml up -d && sleep 30
docker compose -f docker-compose.dm8.yaml exec dm8 /opt/dmdbms/bin/disql SYSDBA/SYSDBA001 -e 'CREATE SCHEMA deploy;'
