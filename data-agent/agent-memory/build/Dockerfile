ARG buildImage=acr.aishu.cn/dip/py.build:3.9.9-20250621
ARG baseImage=acr.aishu.cn/public/ubuntu:22.04.20241202


FROM ${buildImage} AS builder 

WORKDIR /build

COPY ./agent-memory.spec /build/agent-memory.spec
COPY ./requirements.txt /build/requirements.txt
COPY ./mem0 /build/mem0 
COPY ./src /build/src

RUN set -ex; \
    cd /build; \
    export PATH=/export/servers/python3.9/bin:$PATH; \
    python3 -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade --no-cache-dir -r requirements.txt; \
    pyinstaller agent-memory.spec;


FROM ${baseImage} AS prod

WORKDIR /app/agent-memory

COPY --from=builder /build/dist/agent-memory /app/agent-memory/agent-memory

ENV MEM0_DIR=/app/agent-memory

ARG UID=1000
ARG GID=1000

# 创建非root用户
RUN groupadd -r -g $GID aishu && \
    useradd -r -u $UID -g $GID aishu 

RUN chown -R $UID:$GID /app/agent-memory


# 切换到非root用户
USER $UID

CMD ["./agent-memory/agent-memory"]
