# 拉取基础镜像
FROM acr.aishu.cn/as/env-node:22.04.20251021

# 创建服务目录
RUN mkdir /AnyShare/ \
&& mkdir /AnyShare/StudioWebService \
&& mkdir /AnyShare/tmp \
&& chmod 757 -R /AnyShare/tmp

# 导入前端服务d
COPY  build /AnyShare/StudioWebService/build/
COPY ./StudioWebService/handlers/views /AnyShare/StudioWebService/build/
COPY ./StudioWebService/handlers/tools /AnyShare/StudioWebService/build/

# node16忽略https证书
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 容器启动默认执行命令
CMD ["node", "/AnyShare/StudioWebService/build/bundle.js"]