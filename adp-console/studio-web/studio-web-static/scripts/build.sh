# 脚本只要发生错误，就终止执行
set -e
abspath=$(cd "$(dirname "$0")";pwd)
source "$abspath/tools.sh"

# 变量定义
tag=""
branch=${BRANCH_NAME=defaultBranch}
arch=${BUILD_ARCH=defaultArch}
# 去除refs/*/
formatBranch=$(echo $branch | sed 's/refs\/[a-z]*\///')

# 拷贝ssh密钥
mkdir -p /root/.ssh/
rm -rf /root/.ssh/*
cp $SSH_KEY /root/.ssh/id_rsa
cp $abspath/config /root/.ssh/
chmod 0600 /root/.ssh/id_rsa
chmod 0600 /root/.ssh/config
# 避免输入 yes
ssh-keyscan devops.aishu.cn >> ~/.ssh/known_hosts

# 依赖列表
declare -a branchList
declare -a addrList=(
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/API"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/SweetUI"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebUI"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebUtil"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebPublic"
    "ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/ShareWebStudio"
    "ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebStatic"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/WebLoginTemplate"
)

echo "============分割线============="
# 如果存在，则为构建同名分支，否则为MISSION
# 无法直接从远端获取git log，可自行通过 hash sha值 查找对应日志
for i in "${!addrList[@]}"
do
    ret=$(git ls-remote ${addrList[$i]} $formatBranch)
    if [[ $ret ]]; then
        branchList[$i]=$formatBranch
    else
        branchList[$i]=$defaultBranch
    fi
    echo "依赖仓库地址 ${addrList[$i]}"
    echo "依赖仓库分支 ${branchList[$i]}"
    echo "仓库最新一次提交的 hash 值"
    git ls-remote ${addrList[$i]} ${branchList[$i]}
    echo "============分割线============="
done

# 切换 API仓库分支
echo "检出 API 仓库分支"
cd ./API && git switch ${branchList[0]} && cd ../
echo "============分割线============="

# 切换 ShareWebStudio 仓库分支
echo "检出 ShareWebStudio 仓库分支"
cd ./ShareWebStudio && git switch ${branchList[5]} && git log -1 && cd ../
echo "============分割线============="

# tag：release计算出版本号  其他为分支名小写
getTag $branch $tag

# 拷贝sshkey
mkdir .ssh
cp /root/.ssh/* ./.ssh/

# 清理打包容器
docker image prune -f --filter label=stage=mediatorBuilder
docker image prune -f --filter label=stage=staticBuilder

# 构建打包镜像
docker build \
--build-arg uiAddr=${addrList[2]} \
--build-arg uiBranch=${branchList[2]} \
--build-arg utilAddr=${addrList[3]} \
--build-arg utilBranch=${branchList[3]} \
--build-arg publicAddr=${addrList[4]} \
--build-arg publicBranch=${branchList[4]} \
--build-arg studioAddr=${addrList[5]} \
--build-arg studioBranch=${branchList[5]} \
--build-arg sweetuiAddr=${addrList[1]} \
--build-arg sweetuiBranch=${branchList[1]} \
--build-arg templateAddr=${addrList[7]} \
--build-arg templateBranch=${branchList[7]} \
--rm \
--pull \
-t "$registry/$repository:$tag-$arch" \
-f ./StudioWebStatic/Dockerfile .

# 清理操作
docker push "$registry/$repository:$tag-$arch"
docker rmi -f "$registry/$repository:$tag-$arch"
docker image prune -f --filter label=stage=mediatorBuilder
docker image prune -f --filter label=stage=staticBuilder