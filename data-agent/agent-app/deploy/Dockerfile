ARG baseImage=acr.aishu.cn/public/ubuntu:22.04.20241202

FROM ${baseImage} AS prod 

ARG UID=1000
ARG GID=1000

# 创建非root用户
RUN groupadd -r -g $GID aishu && \
    useradd -r -u $UID -g $GID aishu && \
    mkdir -p /app/agent-app/locale && \
    mkdir -p /app/agent-app/dict


COPY --chown=$UID:$GID ./agent-app /app/agent-app
COPY --chown=$UID:$GID locale/*.toml /app/agent-app/locale/

COPY --chown=$UID:$GID dict/* /app/agent-app/dict/

RUN chown -R $UID:$GID /app/agent-app

WORKDIR /app/agent-app

# 切换到非root用户
USER $UID

ENTRYPOINT ["./agent-app"]
