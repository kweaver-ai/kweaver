FROM acr.aishu.cn/public/openjdk-temurin:8u422-b05-jdk
ENV TZ "Asia/Shanghai"

#RUN apt-get update && apt-get install ttf-dejavu fontconfig -y
COPY ./target/workflow-rest-0.0.1.jar /home/workflow/
RUN groupadd --gid 5000 workflow \
    && useradd --home-dir /home/workflow --create-home --uid 5000 \
    --gid 5000 --shell /bin/sh --skel /dev/null workflow
USER workflow
WORKDIR /home/workflow
EXPOSE 8080 9800
ENTRYPOINT ["java","-jar","workflow-rest-0.0.1.jar"]