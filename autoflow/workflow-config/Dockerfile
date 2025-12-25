FROM acr.aishu.cn/public/ubuntu:22.04.20241202

ADD config /workflowconfig

ENTRYPOINT ["/bin/bash", "-ce", "cp -r /workflowconfig /conf/workflowconfig"]