# web-library

web-library 是一个基于 Ant Design 的组件库，提供了一系列增强型组件、Hooks 和工具函数，用于构建现代化的管理系统界面。

## 目录结构

```
web-library/
├── common/              # 基础组件
│   ├── Button/          # 按钮组件（增强版）
│   ├── Drawer/          # 抽屉组件（增强版）
│   ├── IconFont/        # 图标字体组件
│   ├── Input/           # 输入框组件（增强版）
│   ├── Modal/           # 模态框组件（增强版）
│   ├── Select/          # 选择框组件（增强版）
│   ├── Steps/           # 步骤条组件（增强版）
│   ├── Table/           # 表格组件（增强版）
│   └── Text/            # 文本组件（增强版）
├── components/          # 业务组件
│   ├── DataFilter/      # 多级过滤器组件
│   ├── ExportFile/      # 文件导出组件
│   └── ImportFile/      # 文件导入组件
├── hooks/               # 自定义 Hooks
├── utils/               # 工具函数
└── README.md            # 组件库说明文档
```

## 组件说明

### common 目录 - 基础组件

#### Button

对 Ant Design 的 Button 组件进行拓展，增加了 4 个预制按钮：

- `Button.Create`：预设创建按钮，默认使用 primary 类型和添加图标
- `Button.Delete`：预设删除按钮，默认使用删除图标
- `Button.Icon`：预设图标按钮，默认使用 text 变体
- `Button.Link`：预设链接按钮，默认使用 link 类型

#### Drawer

对 Ant Design 的 Drawer 组件进行拓展，添加了自定义关闭按钮和样式。

#### IconFont

基于 IconFont 的图标组件，支持多种图标字体文件：

- iconfont.js
- iconfont-dip.js
- iconfont-dip-color.js

#### Input

对 Ant Design 的 Input 组件进行拓展，增加了 2 个预制输入框：

- `Input.Spell`：适配中文输入法的输入框，输入时不触发 onChange
- `Input.Search`：预设搜索输入框，默认带有搜索图标

#### Modal

对 Ant Design 的 Modal 组件进行拓展，添加了自定义关闭按钮、统一的国际化文案和样式。

- `Modal.Prompt`：预设提示模态框，带有确认和取消按钮

#### Select

对 Ant Design 的 Select 组件进行拓展，增加了 LabelSelect 组件：

- `Select.LabelSelect`：组合显示 label 和 Select 的组件，支持水平和垂直布局

#### Steps

对 Ant Design 的 Steps 组件进行拓展，增加了 GapIcon 组件：

- `Steps.GapIcon`：步骤条中间的间隙图标组件

#### Table

对 Ant Design 的 Table 组件进行拓展，提供了丰富的表格功能：

- `Table.PageCard`：带卡片样式的表格容器
- `Table.PageTable`：支持列拖拽、列显示控制、自动高度调整的表格组件
- `Table.Operation`：表格操作栏组件，支持筛选、排序、刷新等功能

#### Text

文本组件，格式化文本(Text)和标题(Title)，统一样式。

### components 目录 - 业务组件

#### DataFilter

多级过滤器组件，支持复杂的条件筛选：

- 支持多级别嵌套条件
- 支持逻辑运算符（and/or）
- 支持多种字段类型和操作符
- 支持国际化

#### ExportFile

文件导出组件，用于导出数据为 JSON 文件：

- 支持自定义请求
- 支持成功提示
- 支持国际化

#### ImportFile

文件导入组件，用于导入 JSON 文件数据：

- 支持文件类型校验
- 支持自定义请求
- 支持成功提示和错误处理
- 支持国际化

## Hooks 说明

### useForceUpdate

强制更新组件的 Hook，用于触发组件重新渲染。

### useSize

获取元素尺寸的 Hook，用于动态获取元素的宽高。

### usePageState

页面状态管理 Hook，用于管理页面的状态，如筛选条件、分页等。

## 工具函数说明

### get-locale-value

国际化工具函数，用于获取不同语言的文本。

### down-file

文件下载工具函数，用于将数据导出为文件。

### cookie

Cookie 操作工具函数，用于设置、获取和删除 Cookie。

### formatType

数据类型格式化工具函数，用于格式化不同类型的数据。

### getTargetElement

获取目标元素的工具函数，用于获取 DOM 元素或 React 组件实例。

### sessionStorage

SessionStorage 操作工具函数，用于设置、获取和删除 SessionStorage。

## 使用示例

### 基础组件使用

```tsx
import { Button, Input, Table } from './common';

// 使用 Button.Create
<Button.Create onClick={handleCreate}>创建</Button.Create>

// 使用 Input.Search
<Input.Search placeholder="搜索" onChange={handleSearch} />

// 使用 Table.PageTable
<Table.PageTable
  name="user-table"
  columns={columns}
  dataSource={dataSource}
  pagination={pagination}
/>
```

### 业务组件使用

```tsx
import DataFilter from './components/DataFilter';
import ExportFile from './components/ExportFile';

// 使用 DataFilter
<DataFilter
  value={filterValue}
  onChange={handleFilterChange}
  fieldList={fieldList}
  typeOption={typeOption}
/>

// 使用 ExportFile
<ExportFile
  name="user-data"
  customRequest={exportData}
>导出用户数据</ExportFile>
```

### Hooks 使用

```tsx
import HOOKS from './hooks';

// 使用 useSize
const { width, height } = HOOKS.useSize(elementRef);

// 使用 usePageState
const { page, size, setPage, setSize } = HOOKS.usePageState();
```

## 贡献指南

1. 遵循现有的代码风格和命名规范
2. 确保所有组件都有完整的类型定义
3. 为新组件添加使用示例
4. 确保代码通过所有测试

## 许可证

MIT
