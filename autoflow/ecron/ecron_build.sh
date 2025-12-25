#! /bin/bash

# 编译可执行程序，空=默认编译；im=构建镜像；其他=退出
branch=`sh -c 'git branch --no-color 2> /dev/null' | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/' -e 's/\//\_/g'`
repository="acr.aishu.cn"
projectName="as"
managementService="ecron-management"
analysisService="ecron-analysis"
branchTag="$(echo "$branch"|tr '[:upper:]' '[:lower:]')"
tag="7.0.0-$branchTag"
if [ "$branchTag" = "mission" ]; then
    tag="7.0.0"
fi
managementTag="${repository}/${projectName}/${managementService}:${tag}"
managementImage="${managementTag}.$[$(date +%s%N)/1000000]"
analysisTag="${repository}/${projectName}/${analysisService}:${tag}"
analysisImage="${analysisTag}.$[$(date +%s%N)/1000000]"

runtime="acr.aishu.cn/public/ubuntu:22.04.20231012"
user="proton"
password="3ntIKegyn8"
if [ ! $1 ]; then
    rm -rf ./bin
    echo 'go generate ./...'
    go generate ./...
    echo 'golangci-lint run ./...'
    golangci-lint run ./...
    echo 'go test -cover ./...'
    go test -cover ./...
    echo 'go build -o ./bin/ecron-management ./management'
    go build -o ./bin/ecron-management ./management
    echo 'go build -o ./bin/ecron-analysis ./analysis'
    go build -o ./bin/ecron-analysis ./analysis
    echo 'strip -g ./bin/*'
    strip -g ./bin/*
    mkdir -p ./bin/management
    mkdir -p ./bin/analysis
    cp ./management/Dockerfile ./bin/management/
    cp ./analysis/Dockerfile ./bin/analysis/
elif [ $1 == "im" ]; then
    chmod 757 -R ./bin
    # 修改依赖镜像
    sed -i '1s#.*#FROM acr.aishu.cn/public/ubuntu:22.04.20231012#' ./bin/management/Dockerfile
    sed -i '1s#.*#FROM acr.aishu.cn/public/ubuntu:22.04.20231012#' ./bin/analysis/Dockerfile

    # 生成镜像
    docker login $repository --username $user --password $password
    docker build -t "${managementImage}" -f ./bin/management/Dockerfile .
    docker build -t "${analysisImage}" -f ./bin/analysis/Dockerfile .
    docker tag ${managementImage} ${managementTag}
    docker tag ${analysisImage} ${analysisTag}
    docker save ${managementImage} > ${managementTag}-${tag}.tar
    docker save ${analysisImage} > ${analysisTag}-${tag}.tar
    docker push ${managementImage}
    docker push ${analysisImage}
    docker push ${managementTag}
    docker push ${analysisTag}
    docker rmi -f ${managementImage}
    docker rmi -f ${analysisImage}
    docker rmi -f ${managementTag}
    docker rmi -f ${analysisTag}
    docker rmi -f ${runtime}

    #清空本机版本号为none的镜像
    docker images | grep none | awk '{print $3 }' | xargs docker rmi -f
else
    exit 0
fi
