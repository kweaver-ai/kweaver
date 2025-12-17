# Use Python 3.10 as base image
FROM acr.aishu.cn/as/sailor-python:3.11-base

# 设置工作目录
WORKDIR /app

# 将当前目录内容复制到容器中
COPY ./ /af-agent

# 设置工作目录
WORKDIR /af-agent

# 安装Python依赖
RUN pip install sandbox-env==0.1.0 --no-cache-dir -i http://repohub.aishu.cn/repository/pip-hub/simple/  --trusted-host repohub.aishu.cn
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
# RUN pip install --no-cache-dir ./tmp/sandbox_env-0.1.0-py3-none-any.whl -i https://pypi.tuna.tsinghua.edu.cn/simple

# 设置子目录为工作目录
WORKDIR /af-agent/src/af_agent/tools

# 使端口可用
EXPOSE 9100

# 在容器启动时运行应用
ENTRYPOINT ["uvicorn"]
CMD ["tool_api_router:DEFAULT_APP", "--host", "0.0.0.0", "--port", "9100"]
