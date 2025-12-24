set -e

shPath=$(cd "$(dirname "$0")";pwd)
curPath=$(pwd)
workspace=""
notStudioWebService=true

declare -a addrList=(
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/API"
    # "ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/DeployWebPublic"
)

declare -a repoList=(
    "DeployWebPublic"
)

declare -a linkList=(
    "@anyshare/public"
)

# 判断执行目录
if [[ $shPath =~ "StudioWebService/scripts" ]]; then
    cd $shPath
    cd ../../
    notStudioWebService=false
else
    cd $curPath
    notStudioWebService=true
fi

echo "============当前工作路径============="
pwd
workspace=$(pwd)

# 检查git安装状态
echo "============检查git安装状态============="
set +e
isGit=$(git --version)
set -e

if [[ $isGit ]]; then
    echo "git 安装状态正确"
else
    echo "你的环境未安装 git"
    exit 1
fi

echo "============检查 git 权限配置============="
set +e
isGitPermission=$(git ls-remote ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebService)
set -e

if [[ $isGitPermission =~ "authentication" ]]; then
    echo "你的 sshkey 未正确配置"
    exit 1
else
    echo "git 权限正确配置"
fi

echo "============检查node安装状态============="
set +e
isNode=$(node --version)
set -e

if [[ $isNode ]]; then
    echo "node 安装状态正确"
else
    echo "你的环境未安装 node"
    exit 1
fi

echo "============检查npm安装状态============="
set +e
isNpm=$(npm --version)
set -e

if [[ $isNpm ]]; then
    echo "npm 安装状态正确"
else
    echo "你的环境未安装 npm"
    exit 1
fi

echo "============设置npm仓库============="
echo "设置npm仓库为 http://repository.aishu.cn:8081/repository/npm-all"
npm config set registry http://repository.aishu.cn:8081/repository/npm-all

echo "============安装gulp============="
set +e
isGulp=$(gulp --version)
set -e

if [[ $isGulp ]]; then
    echo "gulp 已安装"
else
    npm install -g gulp
fi

echo "============安装yarn============="
set +e
isYarn=$(yarn --version)
set -e

if [[ $isYarn ]]; then
    echo "yarn 已安装"
else
    npm install -g yarn
fi

echo "============设置 yarn 仓库============="
echo "设置 yarn 仓库为 http://repository.aishu.cn:8081/repository/npm-all"
yarn config set registry http://repository.aishu.cn:8081/repository/npm-all

# 清理 yarn global
echo "============清理 yarn global============="
globalDir=$(yarn global dir)
set +e
cd ${globalDir/global/link}\\\@anyshare
rm -rf ./*
cd -
set -e

# 克隆依赖仓库
echo "============开始克隆依赖仓库============="
# 克隆 StudioWebService
if [[ "$notStudioWebService" == true ]]; then
    echo "正在克隆===>StudioWebService"
    git clone ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebService
fi

dirList=$(ls)
for i in "${!addrList[@]}"
do
    if [[ $i == 5 ]]; then
        set +e
        echo "正在克隆===>${addrList[$i]}"
        git clone ${addrList[$i]} -b MISSION
        set -e
    else
        dirName="${addrList[$i]:57}"
        echo $dirName
        if [[ $dirList =~ $dirName ]]; then
            echo "!!!!!!!!!!!!!!!!!!!!!!!!"
            echo "$dirName已存在，无需clone"
            echo "!!!!!!!!!!!!!!!!!!!!!!!!"
        else
            echo "正在克隆===>${addrList[$i]}"
            git clone ${addrList[$i]} -b MISSION
        fi
    fi
done

# 安装 StudioWebService node_modules
echo "============开始安装 StudioWebService node_modules============="
cd $workspace/StudioWebService
dirList=$(ls)
if [[ $dirList =~ "node_modules" ]]; then
    echo "node_modules 已存在，正在清理 node_modules"
    rm -rf node_modules
else
    echo "正在安装===>node_modules"
fi
set +e
yarn add git+ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/DeployWebPublic#MISSION --latest --no-lockfile
set -e

# 打 thrift
echo "============开始thrift更新操作============="
cd node_modules/@anyshare/public
# THRIFT_API_ROOT=$workspace/API/ThriftAPI node scripts/thrift-gen-js
THRIFT_API_ROOT=$workspace/API/ThriftAPI node scripts/thrift-gen-node
echo "thrift更新完成"
