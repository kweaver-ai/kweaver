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

    chartPath="${output}/deploy-web-core"
    cp -rf ${workDir}/deploy-web-core ${output}
    
    yq="docker run --user root --rm -v ${workDir}:${workDir} acr.aishu.cn/as/yq:universal"
    
    staticTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/deploy-web-static/tags/list)"
    serviceTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/deploy-web-service/tags/list)"
    protonTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/proton-application/tags/list)"
    staticResourceTagList="$(curl -s -u $REGISTRY_USERNAME:$REGISTRY_PASSWORD -X GET https://$registry/v2/ict/staticresourcemanagement/tags/list)"
    
    echo "============替换 chart Tag============="
    # sed -i "7s/version: .*/version: $tag/" $src
    # sed -i "11s/repository: .*/repository: $registry/" $src
    # $yq e -i '.spec.image.repository="'$registry'"' ${src}
    
    # 获取当前版本(区分release和其他分支)
    currentVersion=${tag%%-*}

    # 判断 chart分支 同名的 镜像 是否存在
    if [[ $staticTagList =~ "$currentVersion-$DeployWebStatic" ]]; then
        staticTag=$currentVersion-$DeployWebStatic
    else
        staticTag=${currentVersion}-${defaultTag}
    fi
    if [[ $serviceTagList =~ "$currentVersion-$DeployWebService" ]]; then
        serviceTag=$currentVersion-$DeployWebService
    else
        serviceTag=${currentVersion}-${defaultTag}
    fi
    if [[ $protonTagList =~ "$currentVersion-$ProtonApplication" ]]; then
        protonTag=$currentVersion-$ProtonApplication
    else
        protonTag=${currentVersion}-${defaultTag}
    fi
    # 添加 staticresourcemanagement 镜像标签处理
    if [[ $staticResourceTagList =~ "$currentVersion-$StaticResourceManagement" ]]; then
        staticResourceTag=$currentVersion-$StaticResourceManagement
    else
        staticResourceTag=${currentVersion}-${defaultTag}
    fi
    
    echo "===========replace image tag ============="
    $yq e -i '.image.deploy_web_service.tag="'${serviceTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.deploy_web_static.tag="'${staticTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.proton_application.tag="'${protonTag}'"' ${chartPath}/values.yaml
    $yq e -i '.image.staticresourcemanagement.tag="'${staticResourceTag}'"' ${chartPath}/values.yaml
    
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
