# 拉取基础镜像
FROM acr.aishu.cn/as/env-node:22.04.20251021

# 创建服务目录并安装curl
RUN mkdir /AnyShare/ \
&& mkdir /AnyShare/DeployWebService \
&& mkdir /AnyShare/tmp \
&& chmod 757 -R /AnyShare/tmp \
&& apt-get update \
&& apt-get install -y curl \
&& apt-get clean

# 导入前端服务d
COPY build /AnyShare/DeployWebService/build/
COPY handlers/views /AnyShare/DeployWebService/build/
COPY handlers/tools /AnyShare/DeployWebService/build/

# node16忽略https证书
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 添加启动脚本到容器
COPY scripts/start.sh /AnyShare/DeployWebService/

# 给启动脚本添加执行权限
RUN chmod +x /AnyShare/DeployWebService/start.sh

# 容器启动默认执行命令
CMD ["/AnyShare/DeployWebService/start.sh"]