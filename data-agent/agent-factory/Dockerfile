ARG baseImage=acr.aishu.cn/public/ubuntu:22.04.20241202

FROM ${baseImage} AS prod 

ARG UID=1000
ARG GID=1000

# 创建非root用户
RUN groupadd -r -g $GID aishu && \
    useradd -r -u $UID -g $GID aishu && \
    mkdir -p /app/agent-factory/locale


COPY --chown=$UID:$GID ./agent-factory /app/agent-factory
COPY --chown=$UID:$GID locale/*.toml /app/agent-factory/locale/


RUN chown -R $UID:$GID /app/agent-factory

WORKDIR /app/agent-factory

# 切换到非root用户
USER $UID

ENTRYPOINT ["./agent-factory"]
