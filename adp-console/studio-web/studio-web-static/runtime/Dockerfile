FROM acr.aishu.cn/public/ubuntu:21.10.20210629

RUN apt-get update && apt-get install -y nginx=1.18.0-6ubuntu10 && rm -rf /var/lib/apt/lists/*

# 给nginx加权限
RUN chown root /usr/sbin/nginx && \
    chmod 757 -R /usr/sbin/nginx && \
    chmod u+s /usr/sbin/nginx && \
    chmod 777 -R /var/log/nginx/* && \
    sed -i "s@www-data@root@g" /etc/nginx/nginx.conf && \
    sed -i "s@# server_tokens.*@server_tokens off;@g" /etc/nginx/nginx.conf && \
    sed -i "s@error_log.*@error_log /dev/null;@g"  /etc/nginx/nginx.conf && \
    sed -i "s@access_log.*@access_log off;@g"  /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
