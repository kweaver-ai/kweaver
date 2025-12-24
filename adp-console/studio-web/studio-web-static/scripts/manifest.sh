# 脚本只要发生错误，就终止执行
set -e

abspath=$(cd "$(dirname "$0")";pwd)
source "$abspath/tools.sh"

tag=""
branch=${BRANCH_NAME=defaultBranch}

# tag：release计算出版本号  其他为分支名小写
getTag $branch $tag

docker manifest create --amend "$registry/$repository:$tag" "$registry/$repository:$tag-x86" "$registry/$repository:$tag-arm"
docker manifest push --purge "$registry/$repository:$tag"
