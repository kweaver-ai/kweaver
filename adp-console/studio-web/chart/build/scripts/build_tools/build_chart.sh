#!/bin/bash

set -x

libsPath=$(dirname $(dirname `readlink -f $0`))/libs
source ${libsPath}/tools.sh

tag=""
branch=${BRANCH_NAME=defaultBranch}

# 设置 tag
getTag $branch $tag

set -o errexit
set -o nounset
set -o pipefail

source ${libsPath}/version.sh

BuildChart() {
    output="${workDir}/output/charts"
    mkdir -p ${output}

    chartPath="${output}/studio-web"
    cp -rf ${workDir}/studio-web ${output}
    
    yq="docker run --user root --rm -v ${workDir}:${workDir} acr.aishu.cn/as/yq:universal"
    
    staticTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/studio-web-static/tags/list)"
    serviceTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/studio-web-service/tags/list)"
    tproxyTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/deploy-web-tproxy/tags/list)"
    
    echo "============替换 chart Tag============="
    # sed -i "7s/version: .*/version: $tag/" $src
    # sed -i "11s/repository: .*/repository: $registry/" $src
    # $yq e -i '.spec.image.repository="'$registry'"' ${src}
    
    # 获取当前版本(区分release和其他分支)
    currentVersion=${tag%%-*}

    # 判断 chart分支 同名的 镜像 是否存在
    if [[ $staticTagList =~ "$currentVersion-$StudioWebStatic" ]]; then
        staticTag=$currentVersion-$StudioWebStatic
    else
        staticTag=${currentVersion}-${defaultTag}
    fi
    if [[ $serviceTagList =~ "$currentVersion-$StudioWebService" ]]; then
        serviceTag=$currentVersion-$StudioWebService
    else
        serviceTag=${currentVersion}-${defaultTag}
    fi
    if [[ $tproxyTagList =~ "$currentVersion-$DeployWebTProxy" ]]; then
        tproxyTag=$currentVersion-$DeployWebTProxy
    else
        tproxyTag=${currentVersion}-${defaultTag}
    fi

    backendTag="$StudioWebBackend"
    
    echo "===========replace image tag ============="
    $yq e -i '.image.studio_web_service.tag="'${serviceTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.studio_web_static.tag="'${staticTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.deploy_web_tproxy.tag="'${tproxyTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.studio_web_backend.tag="'${backendTag}'"' ${chartPath}/values.yaml

    
    helm="docker run --user root --rm -v $workDir:${workDir}  acr.aishu.cn/public/alpine-helm-2.16.6:universal"
    ## helm package and upload should use tool image, but i want to be lazy. so i do in host
    cd ${output}
    mkdir -p ../packages
    for chart in `ls`
    do
        $helm package ${output}/${chart} -d ${output}/../packages --save=false --version ${tag}
    done
    
    ## upload package
    cd ../packages
    for chart in `ls`
    do
        curl -s -u "${REGISTRY_USERNAME}:${REGISTRY_PASSWORD}" \
        -H "Content-Type: multipart/form-data" \
        -F "chart=@${chart};type=application/x-compressed-tar" \
        -X POST "https://${registry}/api/chartrepo/ict/charts"
    done
}

BuildChart
