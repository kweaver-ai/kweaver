# deploy-web-service

## 一、开发环境搭建

### 1.1 安装node

tips: `node版本请确保为16及以上版本`

`这里讲解本地安装的方法`

#### 1.1.1 上传node安装包

#### 1.1.2 解压安装包

1. tar.gz 解压方法

   ```bash
   > tar zxf node安装包
   ```

2. tar.xz 解压方法

   ```bash
   > xz -dk node安装包.tar.xz
   # 上一步会解压出tar文件
   > tar xvf node安装包.tar
   ```

#### 1.1.3 建立链接

```bash
# 进入1.1.2解压出来文件src目录
# 注意：/path/to是绝对路径，请勿使用相对路径
> ln -s /path/to/node /usr/bin/node
> ln -s /path/to/npm /usr/bin/npm
```

### 1.2 修改 mariadb Pod 配置

```bash
# 获取pod名称
> kubectl get svc -n resource # 获取mariadb-cluster名称

# 修改pod为本地
> kubectl edit svc proton-mariadb-proton-rds-mariadb-cluster -n resource

# 修改链接类型spec.type
ClusterIP -> NodePort
```

### 1.3 上传文件

#### 1.3.1 方法一 使用源文件

`此方法用于调试更方便`

1. 上传源文件并安装node_modules

2. 获取数据库配置

   ```bash
   # 获取secrt
   > kubectl get secret -nanyshare|grep rds # 获secret名称
   
   # 获取配置
   > kubectl get secret -nanyshare cms-release-config-rds -oyaml
   
   # 解析账号密码data.(default.yaml)
   > base64 -d data.(default.yaml)的值
   ```

3. 修改config/db.js 数据库配置

   将解析出来的值填入config/db.js

4. 启动服务

   ```bash
   > node index.js
   ```

#### 1.3.2 方法二 使用打包后的文件

`此方法用于模拟真实环境，和用户环境差异更小`

1. 确保node版本 >= 16

2. 打包源码

   ```bash
   # 开发模式
   > npm run dev
   # 构建模式
   > npm run build
   ```

3. 上传dist目录

   ```bash
   # 执行代码
   > node index.js
   ```
tips: `如果提示require is not defined in ES module scope,删除package.json文件的 type 属性即可`

#### 1.4 更新chart

1. 上传新chart

2. 更新chart

   ```bash
   # 执行代码
   > cd chart所在目录
   > helm upgrade  deploy-web ./deploy-web/ --reuse-values \
   --set depServices.rds.host='' \
   --set depServices.rds.port='' \
   --set depServices.rds.user='' \
   --set depServices.rds.password='' \
   --set depServices.rds.dbName=''
   ```

3. 获取cms信息
    
   ```bash
   > kubectl get secret -n anyshare cms-release-config-rds -o jsonpath='{.data.default\.yaml}' | base64 -d
   ```

#### 1.5 新增路由规则

   1. 编辑ingress

   ```bash
   > kubectl edit ing -nanyshare
   ```

   2. 新增规则

   ```
    - backend:
        serviceName: deploy-web-service
        servicePort: 18800
      path: /api/deploy-web-service/
      pathType: ImplementationSpecific
   ```

   3. 重启pod deploy-web
   ```bash
   > kubectl delete po deploy-web-xxx
   ```
#### 1.6 验证升级脚本

   1. 上传chart，更新镜像版本（不更新版本pod可能不会重启哦）
   
   ```bash
   # values.yaml
   image:
      registry: "acr.aishu.cn"
      static:
         repository: "as/deploywebstatic"
         tag: 7.0.1 # 修改
         pullPolicy: IfNotPresent
      service:
         repository: "as/deploywebservice"
         tag: 7.0.1 # 修改
         pullPolicy: IfNotPresent
      tproxy:
         repository: "as/deploywebtproxy"
         tag: 7.0.1 # 修改
         pullPolicy: IfNotPresent
   ```

   2. 拉取镜像

   ```bash
   > docker pull xxx
   ```

   3. 重启pod
 
   ```bash
   > helm upgrade  deploy-web ./deploy-web/ --reuse-values

   # tag版本没变化，强制重启pod
   > helm upgrade  deploy-web ./deploy-web/ --reuse-values --recreate-pods
   ```

   4. 查看数据库
   ```bash
   > kubectl exec -it proton-mariadb-proton-rds-mariadb-0 -nresource bash
   > mysql -uroot -peisoo.com123
   ```