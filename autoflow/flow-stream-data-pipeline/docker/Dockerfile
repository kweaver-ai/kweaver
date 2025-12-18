########################### Stage 0 ########################
ARG BUILD_IMAGE=acr.aishu.cn/ar/go.build:1.23.7-20250311
ARG BASE_IMAGE=acr.aishu.cn/public/ubuntu:22.04.20251014

# # 创建一个中间镜像，用于提取base image中的库文件
# FROM ${BASE_IMAGE} AS lib-extractor

# # 从base image中复制库文件到临时目录
# RUN mkdir -p /temp-libs && \
#     cp -r /usr/lib/libbesmq* /temp-libs/ && \
#     cp -r /usr/lib/libtlq* /temp-libs/


FROM ${BUILD_IMAGE} AS builder

# # 从中间镜像复制库文件到构建镜像
# COPY --from=lib-extractor /temp-libs/ /usr/lib/

# # 设置库文件路径
# ENV LD_LIBRARY_PATH=/usr/lib:$LD_LIBRARY_PATH

COPY ./server /go/src

COPY .netrc /root/.netrc
COPY id_rsa /root/.ssh/id_rsa

ARG SERVER_VERSION=6.0.0
ARG GOPROXY_URL="http://goproxy.aishu.cn"

ENV GOPROXY=${GOPROXY_URL}

RUN set -ex; \
    export flags="-X 'flow-stream-data-pipeline/version.ServerVersion=${SERVER_VERSION}'"; \
    cd /go/src/pipeline-mgmt; \
    go mod download -x; \
    CGO_ENABLED=1 go build -ldflags "-s -w $flags" -o ./bin/pipeline-mgmt-server; \
    \
    cd /go/src/pipeline-worker; \
    go mod download -x; \
    CGO_ENABLED=1 go build -ldflags "-s -w" -o ./bin/pipeline-worker-server;

########################### Stage 1 ########################
# Copy working directory to the actual release docker images
FROM ${BASE_IMAGE} AS prod

ARG UID=1000
ARG GID=1000

RUN groupadd -r -g $GID aishu && \
    useradd -r -u $UID -g $GID aishu

COPY --from=builder --chown=$UID:$GID /go/src/pipeline-mgmt/bin/pipeline-mgmt-server /opt/pipeline/pipeline-mgmt-server
COPY --from=builder --chown=$UID:$GID /go/src/pipeline-worker/bin/pipeline-worker-server /opt/pipeline/pipeline-worker-server

ADD server/config/pipeline-config.yaml /opt/pipeline/config/
ADD server/locale/*toml /opt/pipeline/locale/


# 指定工作目录
WORKDIR /opt/pipeline/

# Change user
USER $UID

# Expose port
EXPOSE 13012

# 指定启动命令
ENTRYPOINT [ "./pipeline-mgmt-server"]
