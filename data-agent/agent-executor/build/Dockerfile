ARG buildImage=acr.aishu.cn/dip/py.build:3.10.18-20251020
ARG baseImage=acr.aishu.cn/public/ubuntu:22.04.20241202
# 构建阶段
FROM ${buildImage} AS builder

# 设置工作目录
WORKDIR /build


COPY .netrc /root/.netrc
COPY id_rsa /root/.ssh/id_rsa
# 复制源代码
COPY ./agent-executor.spec /build/agent-executor.spec
COPY ./pyproject.toml /build/pyproject.toml
COPY ./app /build/app
COPY ./last_commit_info.txt /build/last_commit_info.txt
COPY ./last_commit_info.txt /build/app/last_commit_info.txt
COPY ./data_migrations /build/data_migrations
COPY ./main.py /build/main.py
COPY ./mq-sdk-lib /build/mq-sdk-lib

# 安装依赖

RUN set -ex; \
    ssh-keyscan -t rsa devops.aishu.cn >> /root/.ssh/known_hosts; \
    cd /build; \
    uv sync; \
    uv run pyinstaller agent-executor.spec;


# 生产阶段
FROM ${baseImage} AS prod

ARG ARCH_TYPE=amd64

ARG UID=1000
ARG GID=1000

# 设置工作目录
WORKDIR /app

# 从构建阶段复制已构建的二进制
COPY --from=builder /build/dist/agent-executor /app/agent-executor

# 从构建阶段复制mq-sdk-lib 依赖的 so 文件
COPY --from=builder /build/mq-sdk-lib /app/mq-sdk-lib

RUN cd /app; \
    if [ "$ARCH_TYPE" = "amd64" ]; then \
        mv /app/mq-sdk-lib/x86/* /usr/lib/; \
    elif [ "$ARCH_TYPE" = "arm64" ]; then \
        mv /app/mq-sdk-lib/arm/* /usr/lib/; \
    else \
        echo "Unsupported architecture: $ARCH_TYPE"; exit 1; \
    fi; \
    rm -rf /app/mq-sdk-lib; \
    chown -R $UID:$GID /usr/lib/; \
    useradd -m -r -s /bin/bash aishu; \
    chown -R aishu:aishu /app;

    

# 切换到非root用户
USER aishu

# 暴露端口
EXPOSE 6483

# 启动命令
CMD ["./agent-executor"]
