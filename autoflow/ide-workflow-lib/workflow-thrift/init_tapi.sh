#!/bin/bash

#this file is used to generate thrift API

CWD=$(dirname "$0")
API_DIR=$1
if [[ ! -d $API_DIR ]]; then
    API_DIR=$(realpath "$CWD/API")
    echo "$API_DIR"
    test ! -d $API_DIR && echo "Error: Thrift api $API_DIR not found." && exit 1
fi
OUT="$CWD/src/main/java"
test -d $OUT || mkdir -p $OUT

API_DIR="$API_DIR/ThriftAPI"
GEN="$API_DIR/go-thrift"
test ! -f $GEN && echo "Error: $GEN not found." && exit 1
test ! -x $GEN && chmod +x $GEN

MODS=("EACPLog" "EVFS" "ShareMgnt" "EThriftException")
for mod in ${MODS[@]}; do
    lowercase=$(echo "$mod" | tr '[:upper:]' '[:lower:]')
    echo "namespace java com.aishu.wf.core.thrift.$lowercase" | cat - $API_DIR/$mod.thrift > $API_DIR/$mod_tmp.thrift
    $API_DIR/go-thrift -out $OUT \
    --gen java \
    $API_DIR/$mod_tmp.thrift
    # rm -rf tempfile
done
echo "finished"

