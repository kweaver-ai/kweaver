# 内置头像API文档

## 概述

内置头像API提供了获取系统预设头像的功能，支持获取头像列表和单个头像文件。所有头像都是SVG格式，具有统一的设计风格。

## API端点

### 基础信息
- **基础URL**: `http://localhost:13022/api/agent-factory/v3`
- **API版本**: v3
- **支持格式**: JSON (列表), SVG (图像)
- **认证**: 无需认证

## 接口列表

### 1. 获取头像列表

获取所有可用的内置头像列表。

**请求信息**
```
GET /agent/avatar/built-in
```

**请求头**
```
Accept: application/json
```

**响应示例**
```json
{
  "entries": [
    {
      "id": "1",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/1"
    },
    {
      "id": "2", 
      "url": "/api/agent-factory/v3/agent/avatar/built-in/2"
    },
    {
      "id": "3",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/3"
    },
    {
      "id": "4",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/4"
    },
    {
      "id": "5",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/5"
    },
    {
      "id": "6",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/6"
    },
    {
      "id": "7",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/7"
    },
    {
      "id": "8",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/8"
    },
    {
      "id": "9",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/9"
    },
    {
      "id": "10",
      "url": "/api/agent-factory/v3/agent/avatar/built-in/10"
    }
  ],
  "total": 10
}
```

**响应字段说明**
- `entries`: 头像列表数组
  - `id`: 头像唯一标识符 (字符串)
  - `url`: 头像访问URL
- `total`: 头像总数

**状态码**
- `200 OK`: 成功获取头像列表

### 2. 获取单个头像

根据头像ID获取具体的SVG头像文件。

**请求信息**
```
GET /agent/avatar/built-in/{avatar_id}
```

**路径参数**
- `avatar_id`: 头像ID，有效范围 1-10

**请求头**
```
Accept: image/svg+xml
```

**响应示例**
```xml
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="16" fill="#4F7EFF"/>
  <!-- 具体的SVG图形内容 -->
</svg>
```

**响应头**
```
Content-Type: image/svg+xml
Cache-Control: public, max-age=86400
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

**状态码**
- `200 OK`: 成功获取头像
- `404 Not Found`: 头像不存在

## 头像列表详情

| ID | 名称 | 描述 | 图标类型 |
|----|------|------|----------|
| 1  | 播放 | 播放按钮图标 | 媒体控制 |
| 2  | 星形 | 五角星图标 | 评级/收藏 |
| 3  | 数据库 | 数据库图标 | 数据存储 |
| 4  | 问号 | 问号图标 | 帮助/疑问 |
| 5  | 用户 | 用户头像图标 | 用户/人员 |
| 6  | 文档 | 文档图标 | 文件/文档 |
| 7  | 机器人 | 机器人图标 | AI/自动化 |
| 8  | 皇冠 | 皇冠图标 | 权限/等级 |
| 9  | 立方体 | 3D立方体图标 | 3D/空间 |
| 10 | 书签 | 书签图标 | 标记/收藏 |

## 设计规范

### SVG规格
- **尺寸**: 64x64 像素
- **格式**: SVG
- **viewBox**: "0 0 64 64"
- **背景色**: #4F7EFF (蓝色)
- **前景色**: #FFFFFF (白色)
- **圆角**: 16px

### 缓存策略
- **缓存时间**: 1天 (86400秒)
- **缓存类型**: public
- **Last-Modified**: 支持条件请求

## 错误处理

### 404 错误响应
当请求不存在的头像ID时，返回404错误：

```json
{
  "error_code": "AVATAR_NOT_FOUND",
  "description": "请求的头像不存在",
  "solution": "请使用有效的头像ID (1-10)",
  "error_link": "https://docs.example.com/avatar-api",
  "error_details": "头像不存在: ID 99 超出有效范围 (1-10)"
}
```

### 常见错误场景
1. **无效ID**: 超出1-10范围的数字
2. **非数字ID**: 使用字母或特殊字符
3. **空ID**: 未提供头像ID
4. **不支持的方法**: 使用POST/PUT等方法

## 使用示例

### curl命令示例

```bash
# 获取头像列表
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in" \
  -H "Accept: application/json"

# 获取指定头像
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/7" \
  -H "Accept: image/svg+xml" \
  -v

# 保存头像到文件
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/1" \
  -H "Accept: image/svg+xml" \
  -o robot_avatar.svg
```

### JavaScript示例

```javascript
// 获取头像列表
async function getAvatarList() {
  const response = await fetch('/api/agent-factory/v3/agent/avatar/built-in', {
    headers: {
      'Accept': 'application/json'
    }
  });
  const data = await response.json();
  return data.entries;
}

// 获取单个头像
async function getAvatar(avatarId) {
  const response = await fetch(`/api/agent-factory/v3/agent/avatar/built-in/${avatarId}`, {
    headers: {
      'Accept': 'image/svg+xml'
    }
  });
  return await response.text();
}

// 在页面中显示头像
function displayAvatar(avatarId, containerId) {
  getAvatar(avatarId).then(svgContent => {
    document.getElementById(containerId).innerHTML = svgContent;
  });
}
```

### HTML使用示例

```html
<!-- 直接在img标签中使用 -->
<img src="/api/agent-factory/v3/agent/avatar/built-in/7" 
     alt="机器人头像" 
     width="64" 
     height="64">

<!-- 在CSS中作为背景图 -->
<div class="avatar" style="background-image: url('/api/agent-factory/v3/agent/avatar/built-in/5')"></div>
```

## 性能特性

### 响应时间
- **头像列表**: < 100ms
- **单个头像**: < 50ms

### 文件大小
- **单个SVG**: 200-800 字节
- **列表响应**: < 1KB

### 并发支持
- 支持高并发访问
- 无状态设计
- 适合CDN缓存

## 版本历史

### v3.0.0 (当前版本)
- 初始版本发布
- 支持10个内置头像
- 统一SVG格式
- 缓存优化

## 注意事项

1. **ID范围**: 头像ID必须在1-10范围内
2. **格式固定**: 所有头像都是SVG格式，不支持其他格式
3. **缓存**: 头像内容很少变化，建议启用客户端缓存
4. **跨域**: 如需跨域访问，请配置相应的CORS策略
5. **大小**: SVG是矢量格式，可以任意缩放而不失真

## 联系支持

如有问题或建议，请联系：
- 技术支持: tech-support@example.com
- API文档: https://docs.example.com/avatar-api
- 问题反馈: https://github.com/example/agent-factory/issues 