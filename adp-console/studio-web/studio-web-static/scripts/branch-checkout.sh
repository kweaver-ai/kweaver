set -e

# 其他目标分支
targetbranch1="release/2.15"
# proton-cli-web目标分支
targetbranch2="release/2.15"
# 其他目标tag标记
targetbranchtag1="v2.15.0-beta.1"
# 默认分支
defaultbranch1="MISSION"
# proton-cli默认分支
defaultbranch2="master"

targetbranch=$targetbranch1
targetbranchtag=$targetbranchtag1
defaultbranch=$defaultbranch1
workspace=$(pwd)
# 工作目录
dirpath="$workspace/tmp/"
# as仓库ssh地址
asrepo="ssh://devops.aishu.cn:22/AISHUDevOps/AnyShareFamily/_git/"
# ict仓库ssh地址
ictrepo="ssh://devops.aishu.cn:22/AISHUDevOps/ICT/_git/"
# 当前仓库ssh地址
tmprepo=""

declare -a asmodules=(
    "API"
    "SweetUI"
    "ShareWebUI"
    "ShareWebUtil"
    "ShareWebPublic"
    "WebLoginTemplate"
)

declare -a ictmodules=(
    "ShareWebStudio"
    "DeployWebPublic"
)

declare -a ictservices=(
    "StudioWebStatic"
    "DeployWebService"
    "DeployWebTProxy"
    "ProtonApplication"
    "StaticResourceManagement"
)

declare -a ictcharts=(
    "StudioWebChart"
    "StaticResourceManagementChart"
)

declare -a protoncli=(
    "proton-cli-web"
)

# 输出空格
function echospace() {
    local final=$1
    for ((i=1; i<final; i++))
    do
        echo
    done
}

# 检出仓库分支
function checkout() {
    local repos=($(echo "$@"))
    for i in "${!repos[@]}"
    do
        echo "============${repos[$i]}============="
        # 重置工作目录
        
        set +e
        remotebranchs=$(git ls-remote $tmprepo${repos[$i]})
        if [[ $remotebranchs =~ "refs/heads/$targetbranch" ]]; then
            echo "已存在分支$targetbranch"
        else
            cd $dirpath
            echo "======正在克隆仓库：${repos[$i]}======"
            git clone $tmprepo${repos[$i]} -b $defaultbranch
            cd $dirpath/${repos[$i]}
            echospace 2
            echo "======从基础分支：$defaultbranch 创建分支：$targetbranch======"
            git checkout -b $targetbranch
            echospace 2
            echo "======正在推送分支：$targetbranch======"
            git push origin $targetbranch
            echospace 2
        fi
        set -e
    done
    return 0
}

# 检出仓库tag标记
function checkoutTag() {
    local repos=($(echo "$@"))
    for i in "${!repos[@]}"
    do
        echo "============${repos[$i]}============="
        # 重置工作目录
        
        set +e
        remotebranchs=$(git ls-remote $tmprepo${repos[$i]})
        if [[ $remotebranchs =~ "refs/tags/$targetbranchtag" ]]; then
            echo "已存在tag标记$targetbranchtag"
        else
            cd $dirpath/${repos[$i]}
            echospace 2
            echo "======从基础分支：$defaultbranch 创建tag标记：$targetbranchtag======"
            git checkout $defaultbranch
            git tag $targetbranchtag
            echospace 2
            echo "======正在推送tag标记：$targetbranchtag======"
            git push origin $targetbranchtag
            echospace 2
        fi
        set -e
    done
    return 0
}

echospace 5
echo "============当前工作路径============="
echo $dirpath

echospace 5
echo "============检查git安装状态============="
set +e
isgit=$(git --version)
set -e

if [[ $isgit ]]; then
    echo "git 安装状态正确"
else
    echo "你的环境未安装 git"
    exit 1
fi

echospace 5
echo "============检查 git 权限配置============="
set +e
isgitpermission=$(git ls-remote $ictrepo${ictservices[0]})
set -e
if [[ $isgitpermission =~ "authentication" ]]; then
    echo "你的 sshkey 未正确配置"
    exit 1
else
    echo "git 权限正确配置"
fi

rm -rf $dirpath

mkdir $dirpath

# 重置全局项目地址
tmprepo=$asrepo
# 重置全局目标检出分支
targetbranch=$targetbranch1
# 重置全局目标检出tag标记
targetbranchtag=$targetbranchtag1
# 重置全局默认基础分支
defaultbranch=$defaultbranch1

echospace 5
echo "开始处理AnyShare依赖项目..."
checkout ${asmodules[*]}

# 重置全局项目地址
tmprepo=$ictrepo

echospace 5
echo "开始处理ICT依赖项目..."
checkout ${ictmodules[*]}

echospace 5
echo "开始处理ICT各个微服务..."
checkout ${ictservices[*]}
checkoutTag ${ictservices[*]}

echospace 5
echo "开始处理ICT各个chart..."
checkout ${ictcharts[*]}
checkoutTag ${ictcharts[*]}

# 重置全局目标检出分支
targetbranch=$targetbranch2
# 重置全局目标检出tag标记
targetbranchtag=$targetbranchtag1
# 重置全局默认基础分支
defaultbranch=$defaultbranch1

echospace 5
echo "开始处理proton-cli-web..."
checkout ${protoncli[*]}
checkoutTag ${protoncli[*]}

rm -rf $dirpath