# 脚本只要发生错误，就终止执行
set -e

abspath=$(pwd)
source "$abspath/runtime/tools.sh"
imageamd64="$imagename-$amd64.$timedate"
imagearm64="$imagename-$arm64.$timedate"

# 创建manifest
docker manifest create "$imagename-$timedate" $imageamd64 $imagearm64

# 推送manifest
docker manifest push --purge "$imagename-$timedate"