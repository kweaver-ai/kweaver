# 拉取基础镜像
FROM acr.aishu.cn/public/ubuntu:22.04.20251014

# 设置工作目录
WORKDIR /package/

# 变量
ARG arch
ARG nodeversion

# 拷贝 node
ADD ./node-v${nodeversion}-linux-${arch}.tar.gz /package/

# 安装 node
RUN ln -s /package/node-v${nodeversion}-linux-${arch}/bin/node /usr/bin/node && \
    ln -s /package/node-v${nodeversion}-linux-${arch}/bin/npm /usr/bin/npm && \
    ln -s /package/node-v${nodeversion}-linux-${arch}/bin/npx /usr/bin/npx

# 安装 依赖
RUN npm config set registry http://repository.aishu.cn:8081/repository/npm-all && \
    npm install yarn && \
    ln -s /package/node_modules/yarn/bin/yarn.js /usr/bin/yarn

# 安装 git
RUN apt-get update && \
    apt-get install -y git

# 切换工作目录
WORKDIR /store/

# 预装 StudioWebStatic 需要的 node_modules
# 节省时间：43min|25min|21min => 5min
COPY ./package-lock.json ./
COPY ./package.json ./

# 安装 node_modules
RUN npm install