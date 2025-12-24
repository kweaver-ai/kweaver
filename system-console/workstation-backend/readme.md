### 构建方式

```bash
export DOCKER_BUILDKIT=1
docker build --target build-result -t $imageName .
```

### 接口描述

#### 1. /health/ready

检查服务是否可用，会检查数据库连接是否正常

#### 2. /health/alive
#### 3. /api/workstation/v1/webapp/:name

注册、注销、查询微前端应用列表

> compute 参数将自动组织目录树结构

### 二进制制品

#### /app/check

检查校验微前端应用配置是否存在问题
```bash
cat cmd/check/testdata/test.json | docker run --rm -i acr.aishu.cn/ict/workstation-backend:main.latest /app/check
```

#### /app/server

API应用程序