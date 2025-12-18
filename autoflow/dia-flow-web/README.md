# ContentApplets

## 脚本

### `pnpm install`

安装依赖

```
 pnpm install && pnpm --filter @applet/icons g && pnpm --filter @applet/icons build && pnpm --filter @applet/api build && pnpm --filter @applet/common build && pnpm --filter @applet/util build && pnpm --filter @applet/core build
```

### `pnpm new YOUR_APP_NAME`

创建新应用

### `pnpm --filter YOUR_APP_NAME start`

启动本地调试服务

### `pnpm --filter YOUR_APP_NAME test`

在交互模式下运行测试

### `pnpm --filter YOUR_APP_NAME build`

在 `build` 目录生成用于发布的代码
