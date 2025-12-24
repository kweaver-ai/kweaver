#!/bin/bash 

set -x 
set -o errexit
set -o nounset
set -o pipefail

libsPath=$(dirname $(dirname `readlink -f $0`))/libs

source ${libsPath}/version.sh

BuildBinary() {
    mkdir -p ${workDir}/output/chart_generator
    cd ${workDir}/src
    CGO_ENABLED=0 go build \
    -o ${workDir}/output/chart_generator/chart_generator \
    -ldflags "${LDFLAGS}" \
    crate/tools/chart_generator
}

BuildBinaryInContainer() {
    docker run --rm -v ${workDir}:${workDir} acr.aishu.cn/as/deploy/tools/golang:1.16-alpine3.13-build sh -c "${workDir}/build/scripts/build_tools/chart_generator.sh binary"
}

BuildImage() {
    mkdir -p ${workDir}/output/chart_generator
    /bin/cp -rf ${workDir}/build/images/chart-generator/* /${workDir}/output/chart_generator/
    cd ${workDir}/output/chart_generator 
    docker build -t ${DOCKER_REGISTRY}/${DOCKER_REPOSITORY}/chart-generator:${DOCKER_TAG} .
}

PushImage() {
    docker push ${DOCKER_REGISTRY}/${DOCKER_REPOSITORY}/chart-generator:${DOCKER_TAG}
    docker rmi ${DOCKER_REGISTRY}/${DOCKER_REPOSITORY}/chart-generator:${DOCKER_TAG}
}

#BuildBinary
#BuildImage

if [ "$1"x == "binaryInContainer"x ]
then 
  BuildBinaryInContainer
elif [ "$1"x == "binary"x ]
then
  BuildBinary
elif [ "$1"x == "image"x ]
then 
  BuildImage
  PushImage
else 
  BuildBinaryInContainer
  BuildImage
  PushImage
fi
  

