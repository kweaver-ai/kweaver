ARG BASE_IMAGE=acr.aishu.cn/public/nginx:1.22.1-alpine

FROM acr.aishu.cn/public/node:22.18.0 AS builder

COPY ./ /vega/
COPY ./.[^.]* /vega/
COPY ./docker/nginx.conf /vega/nginx.conf

RUN set -ex; \
    cd /vega/; \
    npm install -g pnpm; \
    pnpm install; \
    pnpm run build;


FROM ${BASE_IMAGE} AS prod

COPY --from=builder /vega/nginx.conf /vega/nginx/nginx.conf
COPY --from=builder /vega/dist /vega/

# 启动静态文件
CMD ["nginx", "-c", "/vega/nginx/nginx.conf"]

EXPOSE 3010

