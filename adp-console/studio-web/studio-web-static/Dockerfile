# 拉取基础镜像
FROM acr.aishu.cn/public/nginx:1.28.0-alpine-latest

# 设置主目录
WORKDIR /DIP/StudioWebStatic/

# 拷贝静态文件
COPY dist /DIP/StudioWebStatic/

# 拷贝nginx配置文件
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 18800

RUN chmod 777 /var/cache/nginx && \
    chmod 777 /var/log/nginx && \
    chmod 777 /var/run/

# 容器启动默认执行命令
CMD ["nginx", "-g", "daemon off;"]
