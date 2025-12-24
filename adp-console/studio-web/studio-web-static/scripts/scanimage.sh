# 脚本只要发生错误，就终止执行
set -e

abspath=$(cd "$(dirname "$0")";pwd)
source "$abspath/tools.sh"

tag=""
branch=${BRANCH_NAME=defaultBranch}

# tag：release计算出版本号  其他为分支名小写
getTag $branch $tag

docker run --rm -v /root/.docker:/root/.docker -v /tmp:/tmp -v /var/run/docker.sock:/var/run/docker.sock acr.aishu.cn/public/trivy:latest image --server http://trivy.aishu.cn:8080 --exit-code 1 --severity CRITICAL,HIGH --ignore-unfixed "$registry/$repository:$tag-x86"