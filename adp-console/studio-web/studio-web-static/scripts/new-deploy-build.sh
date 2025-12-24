set -e

shPath=$(cd "$(dirname "$0")";pwd)
curPath=$(pwd)
workspace=""
notStudioWebStatic=true

declare -a addrList=(
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/API"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/SweetUI"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebUI"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebUtil"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/ShareWebPublic"
    "ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/ShareWebStudio"
    "ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/WebLoginTemplate"
)

declare -a repoList=(
    "SweetUI"
    "ShareWebUI"
    "ShareWebUtil"
    "ShareWebPublic"
    "ShareWebStudio"
    "WebLoginTemplate"
)

declare -a linkList=(
    "@anyshare/ui"
    "@anyshare/util"
    "@anyshare/public"
    "@anyshare/template"
    "@anyshare/sweet-ui"
)

# 判断执行目录
if [[ $shPath =~ "StudioWebStatic/scripts" ]]; then
    cd $shPath
    cd ../../
    notStudioWebStatic=false
else
    cd $curPath
    notStudioWebStatic=true
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
isGitPermission=$(git ls-remote ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebStatic)
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

echo "============安装webpack3============="
set +e
isWebpack=$(webpack --version)
set -e

if [[ $isWebpack ]]; then
    echo "webpack 已安装"
else
    npm install -g webpack@3
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
# 克隆 StudioWebStatic
if [[ "$notStudioWebStatic" == true ]]; then
    echo "正在克隆===>StudioWebStatic"
    git clone ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebStatic
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

# 替换 jsencrypt
echo "============替换 jsencrypt============="
cp -f $workspace/StudioWebStatic/scripts/jsencrypt.min.js $workspace/ShareWebPublic/src/
echo "替换 jsencrypt完成"

# 安装
echo "============开始安装 ShareWebStudio node_modules============="
dirList=$(ls)
if [[ $dirList =~ "node_modules" ]]; then
    echo "node_modules 已存在，正在清理 node_modules"
    rm -rf node_modules
else
    echo "正在安装===>node_modules"
fi
cp -f ShareWebStudio/package.json ./
cp -f ShareWebStudio/yarn.lock ./
yarn install

echo "============开始执行gulp操作============="
for i in "${!repoList[@]}"
do
    echo "正在链接===>${repoList[$i]}"
    cd ${repoList[$i]}
    if [[ ${repoList[$i]} != "WebLoginTemplate" && ${repoList[$i]} != "ShareWebStudio" ]]; then
        gulp
    fi
    if [[ ${repoList[$i]} != "ShareWebStudio" ]]; then
        yarn link
    fi
    cd ../
done

echo "============开始执行link操作============="
for i in "${!linkList[@]}"
do
    echo "正在link===>${linkList[$i]}"
    yarn link ${linkList[$i]}
done

# 打 thrift
echo "============开始thrift更新操作============="
cd node_modules/@anyshare/public
THRIFT_API_ROOT=$workspace/API/ThriftAPI node scripts/thrift-gen-js
# THRIFT_API_ROOT=$workspace/API/ThriftAPI node scripts/thrift-gen-node
echo "thrift更新完成"

# 安装 StudioWebStatic node_modules
echo "============开始安装 StudioWebStatic node_modules============="
cd $workspace/StudioWebStatic
dirList=$(ls)
if [[ $dirList =~ "node_modules" ]]; then
    echo "node_modules 已存在，正在清理 node_modules"
    rm -rf node_modules
else
    echo "正在安装===>node_modules"
fi
npm install