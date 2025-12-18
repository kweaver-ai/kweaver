FROM acr.aishu.cn/public/ubuntu:22.04.20251014

RUN mkdir -p /opt \
    && groupadd -g 5000 -f content_automation \
    && useradd content_automation -u 5000 -g 5000 -m -s /bin/bash \
    && chown -R content_automation:content_automation /opt

WORKDIR /opt/

COPY ./automation automation
COPY ./schema schema
COPY ./resource resource

RUN chmod +x ./automation

USER content_automation

CMD ["/opt/automation"]
