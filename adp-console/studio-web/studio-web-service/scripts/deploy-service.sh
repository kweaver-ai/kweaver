set -e

absPath=$(cd "$(dirname "$0")";pwd)
apiAddr="ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/API"
publicAddr="ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/DeployWebPublic"
serviceAddr="ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/StudioWebService"
branch="MISSION"

# 检查 git 安装状态
echo "============ 检查 git 安装状态 ============="
set +e
isGit=$(git --version)
if [[ $isGit ]]; then
    echo "git 安装状态正确"
else
    echo "你的环境未安装 git"
    exit 1
fi

echo "============ 检查 git 权限配置 ============="
isGitPermission=$(git ls-remote $apiAddr)

if [[ $isGitPermission =~ "authentication" ]]; then
    echo "你的 sshkey 未正确配置"
    exit 1
else
    echo "git 权限正确配置"
fi

echo "============ 检查 node 14+ 安装状态 ============="
isNode=$(node --version)

if [[ $isNode =~ v1.* ]]; then
    echo "node 安装状态正确"
else
    echo "你的环境未安装 node 14+ 或者版本不正确"
    exit 1
fi

echo "============ 检查 npm 安装状态 ============="
isNpm=$(npm --version)

if [[ $isNpm ]]; then
    echo "npm 安装状态正确"
else
    echo "你的环境未安装 npm"
    exit 1
fi

echo "============ 设置 npm registry 地址 ============="
echo "设置npm仓库为 http://repository.aishu.cn:8081/repository/npm-all"
npm config set registry http://repository.aishu.cn:8081/repository/npm-all

echo "============ 安装 yarn ============="
isYarn=$(yarn --version)

if [[ $isYarn ]]; then
    echo "yarn 已安装"
else
    npm install -g yarn
fi
set -e

echo "============ 克隆 API和StudioWebService ============="
git clone $apiAddr -b $branch
git clone $serviceAddr -b $branch

echo "============ 安装 node_modules ============="
cd $absPath/StudioWebService
yarn install

echo "============ 链接 @anyshare/public ============="
set +e
isLinked=$(yarn add git+$publicAddr#$branch --latest --no-lockfile)
set -e

if [[ $isYarn ]]; then
    echo "============ 重新链接 @anyshare/public 中 ============="
    cd $absPath/StudioWebService/node_modules/@anyshare/public
    THRIFT_API_ROOT=$absPath/API/ThriftAPI node scripts/thrift-gen-node
    echo "============ 链接 @anyshare/public 成功 ============="
fi