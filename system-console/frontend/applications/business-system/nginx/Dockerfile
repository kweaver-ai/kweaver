FROM --platform=$TARGETPLATFORM acr.aishu.cn/dip/nginx:1.25
ADD ./conf/nginx.conf /etc/nginx/nginx.conf

ADD ./dist /var/apphome/web
COPY ./ssl/* /etc/nginx/ssl/

EXPOSE 80
EXPOSE 443
EXPOSE 6475