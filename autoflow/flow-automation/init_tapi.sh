#!/bin/bash

#this file is used to generate thrift API

CWD=$(dirname "$0")
API_DIR=$1
if [[ ! -d $API_DIR ]]; then
    API_DIR=$(realpath "$CWD/API")
    echo "$API_DIR"
    test ! -d $API_DIR && echo "Error: Thrift api $API_DIR not found." && exit 1
fi
OUT="$CWD/tapi"
test -d $OUT || mkdir -p $OUT

API_DIR="$API_DIR/ThriftAPI"
GEN="$API_DIR/thrift"
test ! -f $GEN && echo "Error: $GEN not found." && exit 1
test ! -x $GEN && chmod +x $GEN

MODS=("EACPLog" "EVFS" "ShareMgnt")
for mod in ${MODS[@]}; do
    $API_DIR/thrift -r -out $OUT \
    --gen go:thrift_import=devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/go-lib/thrift,package_prefix=devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/tapi/ \
    "$API_DIR/$mod.thrift"
done
echo "finished"

