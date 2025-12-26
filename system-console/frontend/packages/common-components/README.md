# 依赖安装

```js
// 如果需要宿主环境提供依赖，如：react、antd，请使用 --save-peer 指令，将依赖同时声明到到 devDependencies 和 peerDependencies
pnpm -F mf-common add antd@5.24.4 -E --save-peer

// mf-common只作为公共components、hooks、utils使用，不需要过多的库，如要添加，请谨慎
```

需要宿主环境具备的包列表（如有变更请及时更新）
| 包名 |
| :------- |
| antd |
| classnames |
| cross-env |
| react |
| react-dom |
| react-intl-universal |

# CSS Modules (强烈建议使用)

```js
// rslib.config.ts 中配置了 css 前缀，如果未使用 CSS Modules, 前缀将不生效
import { prefixClsCommon } from '../mf-style/variable'; // mf-common
export default defineConfig({
	output: {
		cssModules: {
			localIdentName: `${prefixClsCommon}-[local]`,
		},
	},
});
```

# 国际化

```js
// 在子项目中的 locales 文件夹中，添加公共组件的国际化文件
// eg: mf-manager/locales/index.ts
import Common from 'mf-common';
import ModelManagement_us from './ModelManagement/en-us.json';
import ModelManagement_cn from './ModelManagement/zh-cn.json';

const en_us = {
	...Common.locales['en-us'],
	...ModelManagement_us,
};
const zh_cn = {
	...Common.locales['zh-cn'],
	...ModelManagement_cn,
};

const locales = {
	'en-us': en_us,
	'zh-cn': zh_cn,
};

export default locales;
```

# components

### 组件设计思路，基础组件使用Antd，原则上不改变Antd的组件用法，不改变Antd组件的参数，只对Antd组件做拓展

```js
// common
import { Button as AntdButton } from 'antd';

const Button = AntdButton;
Button.Create = (props) => (
	<Button type="primary" icon={<IconFont type="icon-Add" {...props} />}>
		{props.children || '创建'}
	</Button>
);
Button.Delete = (props) => (
	<Button icon={<IconFont type="icon-lajitong" {...props} />}>{props.children || '删除'}</Button>
);
Button.Icon = (props) => <Button color="default" variant="text" {...props} />;

// mf-manager
import { Button } from 'mf-common/components';

const Page = () => {
	return (
		<div>
			<Button onClick={() => {}}>正常的 Antd Button</Button>
			<Button.Create onClick={() => {}} />
			<Button.Create onClick={() => {}} icon={null}>
				拓展的 Create Button 去掉 “+” 图标
			</Button.Create>
		</div>
	);
};
```

| 组件名称 | 说明       | 推荐使用   |
| :------- | :--------- | :--------- |
| Button   | 按钮       | ⭐⭐⭐⭐⭐ |
| IconFont | 图标组件   | ⭐⭐⭐⭐⭐ |
| Input    | 输入框     | ⭐⭐⭐⭐⭐ |
| Select   | 选择框组件 | ⭐⭐⭐⭐⭐ |
| Table    | Table组件  | ⭐⭐⭐⭐⭐ |
| Text     | 格式化文本 | ⭐⭐⭐⭐⭐ |
| Title    | 格式化标题 | ⭐⭐⭐⭐⭐ |

# hooks

| 名称 | 说明 | 推荐使用 |
| :--- | :--- | :------- |

# utils

| 工具名称       | 说明                          | 推荐使用   |
| :------------- | :---------------------------- | :--------- |
| Cookie         | cookies 操作，统一加上mf.前缀 | ⭐⭐⭐⭐⭐ |
| SessionStorage | session storage 操作          | ⭐⭐⭐⭐   |

# request

| 名称    | 说明     | 推荐使用 |
| :------ | :------- | :------- |
| Request | 请求组件 | ⭐⭐⭐   |
