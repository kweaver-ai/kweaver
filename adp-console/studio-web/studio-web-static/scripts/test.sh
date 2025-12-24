# 脚本只要发生错误，就终止执行
set -e

abspath=$(pwd)
source "$abspath/StudioWebStatic/scripts/tools.sh"

tag=""
branch=${BRANCH_NAME=defaultBranch}
arch=${BUILD_ARCH=defaultArch}
# 去除refs/*/
formatBranch=$(echo $branch | sed 's/refs\/[a-z]*\///')

# 拷贝ssh密钥
mkdir -p /root/.ssh/
rm -rf /root/.ssh/*
cp $SSH_KEY /root/.ssh/id_rsa
chmod 0600 /root/.ssh/id_rsa
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
set +e
cd ./API && git switch ${branchList[0]} && cd ../
set -e
echo "============分割线============="

# tag：release计算出版本号  其他为分支名小写
getTag $branch $tag

# 拷贝sshkey
mkdir .ssh
cp /root/.ssh/* ./.ssh/

# 清理打包容器
docker run \
-e publicAddr=${addrList[1]} \
-e publicBranch=${branchList[1]} \
-v /root/.ssh/:/root/.ssh/ \
-v $abspath/:/test/ \
acr.aishu.cn/public/studio-web-static-builder-node:18.7.0-20250422 \
/bin/bash /test/StudioWebStatic/scripts/ut.sh
