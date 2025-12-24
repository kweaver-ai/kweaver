#!/bin/bash

export defaultBranch=${DEFAULT_BRANCH}
export releaseVersion=${RELEASE_VERSION}
export defaultVersion=${SERVICE_VERSION}
export defaultArch="x86"
export buildNumber=${BUILD_NUMBER}
export registry="acr.aishu.cn"
export repository="ict/studio-web-service"

function getTag() {
    local branch=$1
    tag=$2
    branch=$(echo $branch | sed 's/refs\/[a-z]*\///')
    branch=${branch//\//-}
    if [[ $branch =~ ^v[0-9]+\.[0-9]+\.[0-9]*\-alpha.* ]]; then
        # 用tag管理的分支：main/master/MISSION
        arr=(${branch//-/ })
        tag="$defaultVersion-${arr[1]}"
    elif [[ $branch =~ ^v[0-9]+\.[0-9]+\.[0-9]*$ ]]; then
        # 用tag管理的分支：release 稳定版（最终发行版）
        tag="$releaseVersion"
    elif [[ $branch =~ ^v[0-9]+\.[0-9]+\.[0-9]*\-.* ]]; then
        # 用tag管理的分支：release 候选版|公测版
        arr=(${branch//-/ })
        tag="$releaseVersion-${arr[1]}"
    else
        # 用分支管理的分支：feature/bug等
        tag="$defaultVersion-$branch"
    fi
    return 0
}

export -f getTag