# 算子操作工具

## 工具简介
该工具用于对算子进行注册、更新、查询、删除、发布、下线等操作。


## 工具编译
```bash
# Python 3.10.12

# 安装依赖
python3 -m pip install requests==2.31.0 pyyaml==6.0.1 argparse==1.4.0 pyinstaller==6.2.0
# 编译脚本
pyinstaller --onefile --name operator-cli operator_client.py
```

## 工具使用

**注意**

> 1. 工具需要配置文件，配置文件格式为yaml，配置文件示例见[config.yaml](./config.yaml)
> 2. 工具需要在配置文件中配置token，token为用户登录的token，用于认证
> 3. 工具需要在配置文件中配置base_url，base_url为平台的地址，用于请求
> 4. 其他请求必填参数详情见配置信息
> 5. 请求详情见API文档[DIP算子服务公有接口协议](../../../docs/apis/api_public/operator.html)


### 工具路径
查看工具：[operator-cli](./dist/operator-cli)

### 查看使用命令
```bash
./operator-cli -h
```

### 通用命令格式
```bash
./operator-cli --config=<配置文件路径> <命令>
```

### 命令列表
```bash
# 注册算子
./operator-cli --config=config.yaml register
 # 更新算子
./operator-cli --config=config.yaml update
 # 查询列表
./operator-cli --config=config.yaml list
# 查询详情
./operator-cli --config=config.yaml detail
# 删除算子
./operator-cli --config=config.yaml delete
 # 发布算子
./operator-cli --config=config.yaml publish
# 下线算子
./operator-cli --config=config.yaml offline
```
